import concurrent.futures
import json
import re
import threading
import time
from collections import defaultdict
from urllib.parse import parse_qs, urljoin, urlparse

import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# ── Tuning ────────────────────────────────────────────────────────────────────

MAX_WORKERS = 4              # concurrent page scrapes
HOST_POLITENESS = 0.15       # seconds to wait between hits on the same host
FETCH_TIMEOUT = 8
PROBE_ATTEMPTS = 2           # contact-page probes per empty homepage

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
# International-friendly phone pattern: optional +CC / area group, then
# 2-4 digit groups, optional extension. Unseparated digits are handled by
# NANP validation in _valid_phone.
PHONE_REGEX = re.compile(
    r"(?<!\d)"
    r"(?:\+?\d{1,3}[\s.-])?"
    r"\(?\d{2,5}\)?"
    r"(?:[\s.-]?\d{2,4}){2,4}"
    r"(?:[\s.-]?(?:ext\.?|x)\s*\d{1,5})?"
    r"(?!\d)",
    re.IGNORECASE,
)
# "user (at) example.com / user [at] example [dot] com" obfuscations
_OBF_AT = re.compile(
    r"([a-z0-9._%+-]+)\s*[\[\(]?at[\]\)]?\s*([a-z0-9.-]+\.[a-z]{2,})", re.I
)
_OBF_DOT = re.compile(
    r"([a-z0-9._%+-]+)\s*[\[\(]?at[\]\)]?\s*([a-z0-9.-]+)\s+[\[\(]?dot[\]\)]?\s*([a-z]{2,})",
    re.I,
)

# Contact pages to probe when the homepage yields nothing.
CONTACT_PATHS = (
    "contact", "contact-us", "contactus", "about", "about-us",
    "get-in-touch", "reach-us", "support",
)

# File/server payloads that never contain scrapable leads.
SKIPPED_SUFFIXES = (
    ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico",
    ".zip", ".gz", ".tar", ".mp4", ".mp3", ".doc", ".docx", ".xls",
    ".xlsx", ".ppt", ".pptx", ".xml",
)

# Domains that never expose contact info (social profiles, aggregators…).
EXCLUDED_DOMAINS = {
    "facebook.com", "www.facebook.com", "m.facebook.com", "instagram.com",
    "linkedin.com", "www.linkedin.com", "x.com", "twitter.com", "t.co",
    "youtube.com", "you.be", "tiktok.com", "pinterest.com", "reddit.com",
    "wikipedia.org", "imdb.com", "spotify.com", "apple.com", "apps.apple.com",
    "play.google.com", "amazon.com", "amazon.in", "amazon.ca", "yelp.com",
    "maps.google.com", "google.com", "duckduckgo.com",
}

_PLACEHOLDER_DOMAINS = {
    "example.com", "example.org", "example.net", "domain.com", "domain.org",
    "yourdomain.com", "yourwebsite.com", "website.com", "mysite.com",
    "site.com", "sampledomain.com", "mydomain.com", "email.com",
    "email.org", "mail.com", "localdomain", "localhost",
}
_PLACEHOLDER_LOCAL = {
    "example", "sample", "test", "yourname", "your.email", "name",
    "username", "user", "email", "mail", "someone", "somebody",
}


def _noise_domain(url: str) -> bool:
    host = (urlparse(url).netloc or "").lower()
    return any(host == d or host.endswith("." + d) for d in EXCLUDED_DOMAINS)


def _valid_email(email: str) -> bool:
    e = email.strip().lower()
    if "@" not in e or len(e) > 254:
        return False
    local, _, domain = e.partition("@")
    if not local or not domain:
        return False
    if "." not in domain:
        return False
    tld = domain.rsplit(".", 1)[-1]
    if tld in {"png", "jpg", "jpeg", "gif", "webp", "svg", "css", "js", "woff", "woff2", "ico", "mp4", "mpeg", "mp3", "pdf", "example", "test", "invalid", "localhost"}:
        return False
    if domain in _PLACEHOLDER_DOMAINS or local in _PLACEHOLDER_LOCAL:
        return False
    if any(domain == d or domain.endswith("." + d) for d in EXCLUDED_DOMAINS):
        return False
    if not re.fullmatch(r"[a-z0-9][a-z0-9._%+-]*", local):
        return False
    return True


def _valid_phone(raw: str) -> bool:
    s = raw.strip().lower()
    if not s:
        return False
    if re.search(r"[a-z]", s) and not re.search(r"(ext\.?|x)", s):
        return False
    digits = re.sub(r"\D", "", s)
    if not (7 <= len(digits) <= 15):
        return False
    if len(set(digits)) <= 2:  # "111-111-1111" style
        return False
    if re.fullmatch(r"\d{10}", s):  # only accept NANP-looking unseparated numbers
        return re.fullmatch(r"[2-9]\d{2}[2-9]\d{2}\d{4}", s) is not None
    if len(digits) < 9:
        return False  # refuse short "zip + office#" style matches
    if re.fullmatch(r"\d{4}", s) or re.fullmatch(r"\d{4}[\s.-]\d{4}", s):
        return False  # years / year ranges
    if re.fullmatch(r"\d{1,2}([/.-]\d{1,2}){1,2}", s):
        return False  # dates
    return True


def extract_emails(text):
    found = set(EMAIL_REGEX.findall(text))
    found |= {f"{m[0]}@{m[1]}" for m in _OBF_AT.findall(text)}
    found |= {f"{m[0]}@{m[1]}.{m[2]}" for m in _OBF_DOT.findall(text)}
    return sorted({e for e in found if _valid_email(e)}, key=str.lower)


def extract_phones(text):
    valid = [p for p in PHONE_REGEX.findall(text) if _valid_phone(p)]
    return _dedupe_phones(valid)


def _phone_key(p):
    digits = re.sub(r"\D", "", p)
    keys = {digits}
    if len(digits) == 11 and digits.startswith("1"):
        keys.add(digits[1:])  # +1 718-… is the same number as 718-…
    return keys


def _phone_weight(p):
    s = p.strip()
    if s.startswith("+") or s.startswith("00"):
        return 0
    if "(" in s:
        return 1
    return 2


def _dedupe_phones(phones):
    seen = set()
    out = []
    for p in sorted(phones, key=_phone_weight):
        keys = _phone_key(p)
        if keys & seen:
            continue
        seen.update(keys)
        out.append(p.strip())
    return out


def _json_ld_values(soup, keys):
    """Pull contact-ish values out of JSON-LD structured data."""
    values = []
    for script in soup.select("script[type='application/ld+json']"):
        raw = script.string or script.get_text() or ""
        try:
            data = json.loads(raw)
        except Exception:
            continue

        def walk(node):
            if isinstance(node, dict):
                for k, v in node.items():
                    if k.lower() in keys and isinstance(v, str) and v.strip():
                        values.append(v.strip())
                    else:
                        walk(v)
            elif isinstance(node, list):
                for item in node:
                    walk(item)

        walk(data)
    return values


_JSONLD_EMAIL_KEYS = {"email"}
_JSONLD_PHONE_KEYS = {"telephone", "phone", "phonenumber", "contactpoint"}


def _extract_page(url: str):
    """Fetch one page and return (emails, phones) found anywhere on it."""
    resp = _fetch(url)
    if resp is None:
        return [], []
    soup = BeautifulSoup(resp.text, "html.parser")

    emails: set[str] = set()
    phones: set[str] = set()

    # Meta tags that explicitly carry the business email.
    for tag in soup.select(
        "meta[name='email'], meta[itemprop='email'], meta[property='og:email'], "
        "meta[name='contact_email'], meta[name='publisher_email']"
    ):
        emails.update(extract_emails(tag.get("content") or ""))

    # mailto: links — highest signal.
    for a in soup.select("a[href^='mailto:']"):
        href = (a.get("href") or "")[7:].split("?", 1)[0].strip()
        if _valid_email(href):
            emails.add(href.lower())
        text = (a.get_text() or "").strip()
        if _valid_email(text):
            emails.add(text.lower())

    # tel: links — highest signal.
    for a in soup.select("a[href^='tel:']"):
        href = (a.get("href") or "")[4:].split("/", 1)[0].split("?", 1)[0].strip()
        if _valid_phone(href):
            phones.add(href)

    # JSON-LD structured data.
    for v in _json_ld_values(soup, _JSONLD_EMAIL_KEYS):
        emails.update(extract_emails(v))
    for v in _json_ld_values(soup, _JSONLD_PHONE_KEYS):
        phones.update(p for p in PHONE_REGEX.findall(v) if _valid_phone(p))

    # Full visible text as the catch-all.
    text = soup.get_text(separator=" ", strip=True)
    emails.update(e for e in EMAIL_REGEX.findall(text) if _valid_email(e))
    for m in _OBF_AT.findall(text):
        e = f"{m[0]}@{m[1]}"
        if _valid_email(e):
            emails.add(e.lower())
    phones.update(p for p in PHONE_REGEX.findall(text) if _valid_phone(p))

    return sorted(emails, key=str.lower), _dedupe_phones(phones)


def _probe_contacts(url: str, attempts: int = PROBE_ATTEMPTS):
    """Try common contact/about pages when the homepage has no leads."""
    parsed = urlparse(url)
    root = f"{parsed.scheme}://{parsed.netloc}"
    emails: set[str] = set()
    phones: set[str] = set()
    tried = 0
    for path in CONTACT_PATHS:
        if tried >= attempts:
            break
        passed_url = urljoin(root + "/", path)
        e, p = _extract_page(passed_url)
        if not e and not p:
            continue
        tried += 1
        emails.update(e)
        phones.update(p)
        if emails or phones:
            break
    return sorted(emails, key=str.lower), _dedupe_phones(phones)


# ── HTTP with per-host politeness (thread-safe) ───────────────────────────────

_host_gates = defaultdict(threading.Lock)
_gates_guard = threading.Lock()


def _fetch(url: str, timeout: int = FETCH_TIMEOUT):
    host = urlparse(url).netloc
    with _gates_guard:
        gate = _host_gates[host]
    with gate:
        time.sleep(HOST_POLITENESS)
        try:
            resp = requests.get(url, headers=HEADERS, timeout=timeout)
            resp.raise_for_status()
            return resp
        except Exception:
            return None


# ── DuckDuckGo search ─────────────────────────────────────────────────────────

def _resolve_ddg_href(href: str) -> str | None:
    """Decode DuckDuckGo's /l/?uddg= redirect links."""
    href = href.strip()
    if "uddg=" in href:
        q = parse_qs(urlparse(href).query)
        if q.get("uddg") and q["uddg"][0].startswith("http"):
            return q["uddg"][0]
    if href.startswith("//"):
        href = "https:" + href
    return href


def _clean_urls(urls) -> list[str]:
    cleaned = []
    for raw in urls:
        if not raw:
            continue
        try:
            href = _resolve_ddg_href(raw)
            parsed = urlparse(href)
        except Exception:
            continue
        if parsed.scheme not in ("http", "https"):
            continue
        path = (parsed.path or "").lower()
        if path.endswith(SKIPPED_SUFFIXES):
            continue
        if _noise_domain(href):
            continue
        if href not in cleaned:
            cleaned.append(href)
    return cleaned


def search_duckduckgo(query, max_results=10):
    urls = []
    try:
        from ddgs import DDGS
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                href = r.get("href") if isinstance(r, dict) else getattr(r, "href", None)
                if href:
                    urls.append(href)
    except Exception:
        pass
    return _clean_urls(urls)


def search_duckduckgo_fallback(query, max_results=10):
    urls = []
    try:
        resp = requests.get(
            "https://html.duckduckgo.com/html/",
            params={"q": query},
            headers=HEADERS,
            timeout=12,
        )
        soup = BeautifulSoup(resp.text, "html.parser")
        for a in soup.select("a.result__a"):
            href = a.get("href", "")
            if href:
                urls.append(_resolve_ddg_href(href))
                if len(urls) >= max_results * 2:
                    break
    except Exception:
        pass
    return _clean_urls(urls)


def _dedupe_domains(urls):
    seen = set()
    out = []
    for u in urls:
        host = urlparse(u).netloc
        if host in seen:
            continue
        seen.add(host)
        out.append(u)
    return out


# ── Orchestration ─────────────────────────────────────────────────────────────

def scrape_page(url):
    """Single-page scrape (kept for backwards compatibility)."""
    emails, phones = _extract_page(url)
    if not emails and not phones:
        emails, phones = _probe_contacts(url)
    return emails, phones


def _scrape_task(url):
    emails, phones = _extract_page(url)
    if not emails and not phones:
        emails, phones = _probe_contacts(url)
    if not emails and not phones:
        return None
    return (url, emails, phones)


def search_and_scrape(query, max_results=10):
    want = min(max(max_results * 3, 10), 30)
    urls = search_duckduckgo(query, want)
    if not urls:
        urls = search_duckduckgo_fallback(query, want)
    urls = _dedupe_domains(urls)
    if not urls:
        return []

    candidates = urls[:want]
    collected = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(_scrape_task, u): i for i, u in enumerate(candidates)}
        for done in concurrent.futures.as_completed(futures):
            idx = futures[done]
            try:
                result = done.result()
            except Exception:
                result = None
            if result:
                collected[idx] = result

    results = []
    for idx in sorted(collected):
        if len(results) >= max_results:
            break
        url, emails, phones = collected[idx]
        results.append({"url": url, "emails": list(emails), "phones": list(phones)})
    return results