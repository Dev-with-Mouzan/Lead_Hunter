import os
import time
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

from .odify import (
    HEADERS as _WEB_HEADERS,
    extract_emails as _extract_emails,
    extract_phones as _extract_phones,
)

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
PLACES_API = "https://maps.googleapis.com/maps/api/place"

# True when an API key exists. Without one we fall back to the keyless
# Google Maps scraper (which does not require a browser download when a
# system Chrome/Edge is installed — see google_maps_scrape_search).
HAS_API_KEY = bool(GOOGLE_API_KEY)


def is_configured() -> bool:
    # Places mode is always available now (keyless scraper), an API key is
    # only required to use the official Google Places API path.
    return True


def search_places(niche: str, location: str, max_results: int = 30) -> list[dict]:
    """Find businesses in a niche + location on Google Maps.

    Every result is returned regardless of whether the business has a website;
    each row carries a ``has_website`` flag. Uses the official Google Places
    API when GOOGLE_PLACES_API_KEY is set, otherwise falls back to scraping
    google.com/maps directly (keyless).
    """
    if not GOOGLE_API_KEY:
        return google_maps_scrape_search(niche, location, max_results)
    return _search_places_api(niche, location, max_results)


def _enrich_website(website: str) -> tuple[str, str]:
    """Lightweight scrape of a business's own website for a contact email/phone."""
    try:
        resp = requests.get(website, headers=_WEB_HEADERS, timeout=6)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        text = soup.get_text(separator=" ", strip=True)
        emails = _extract_emails(text)
        phones = _extract_phones(text)
        email = emails[0] if emails else ""
        phone = phones[0] if phones else ""
        # Prefer a dedicated mailto: link when present.
        mail = soup.select_one("a[href^='mailto:']")
        if mail:
            href = (mail.get("href") or "")[7:].split("?", 1)[0].strip()
            if href:
                email = href
        return email, phone
    except Exception:  # noqa: BLE001
        return "", ""


def _search_places_api(niche: str, location: str, max_results: int = 30) -> list[dict]:
    if not GOOGLE_API_KEY:
        raise RuntimeError("GOOGLE_PLACES_API_KEY not set in .env")

    query = f"{niche} in {location}"
    places_by_id: dict[str, dict] = {}
    next_token: str | None = None

    # Collect place_ids from textSearch (up to 3 pages = ~60 results), deduped.
    for _ in range(3):
        params: dict = {"query": query, "key": GOOGLE_API_KEY}
        if next_token:
            params["pagetoken"] = next_token

        data: dict = {}
        for attempt in range(3):  # retry — page tokens need a moment to activate
            if next_token:
                time.sleep(1.2 + attempt * 0.8)
            try:
                resp = requests.get(f"{PLACES_API}/textsearch/json", params=params)
                resp.raise_for_status()
                data = resp.json()
            except requests.RequestException:
                if attempt == 2:
                    raise
                continue

            status = data.get("status")
            if status in ("OK", "ZERO_RESULTS"):
                break
            if status == "INVALID_REQUEST" and next_token:
                continue
            break

        status = data.get("status")
        if status not in ("OK", "ZERO_RESULTS"):
            raise RuntimeError(
                f"Places API error: {status} — {data.get('error_message', '')}"
            )

        for place in data.get("results", []):
            pid = place.get("place_id")
            if pid:
                places_by_id.setdefault(pid, place)
        next_token = data.get("next_page_token")

        if not next_token or len(places_by_id) >= max_results * 2:
            break

    # For each place, pull details and tag whether it has a website.
    results: list[dict] = []
    for place in places_by_id.values():
        if len(results) >= max_results:
            break

        place_id = place.get("place_id")
        if not place_id:
            continue

        try:
            detail_resp = requests.get(
                f"{PLACES_API}/details/json",
                params={
                    "place_id": place_id,
                    "fields": (
                        "name,formatted_phone_number,international_phone_number,"
                        "formatted_address,website,url,business_status"
                    ),
                    "key": GOOGLE_API_KEY,
                },
            )
            detail_resp.raise_for_status()
            detail = detail_resp.json().get("result", {})
        except Exception:  # noqa: BLE001
            continue

        if detail.get("business_status") in ("PERMANENTLY_CLOSED", "CLOSED_PERMANENTLY"):
            continue

        website = detail.get("website") or ""
        email = ""
        if website:
            email, _phone = _enrich_website(website)

        results.append({
            "name": detail.get("name", place.get("name", "")),
            "phone": detail.get("formatted_phone_number", ""),
            "address": detail.get("formatted_address", place.get("formatted_address", "")),
            "email": email,
            "website": website,
            "has_website": bool(website),
        })

    return results


# ─────────────────────────────────────────────────────────────────────────────
# Keyless Google Maps scraper
# ─────────────────────────────────────────────────────────────────────────────

_MAPS_URL = "https://www.google.com/maps"

_DESKTOP_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
)


def _dbg(msg: str) -> None:
    """Print only when ODIFY_DEBUG is set, so failures aren't silently swallowed."""
    if os.getenv("ODIFY_DEBUG"):
        print(f"[odify] {msg}", flush=True)


def _candidate_browsers():
    """Yield (channel, executable_path) tuples for launching a real browser."""
    import glob

    candidates = []
    program = os.environ.get("ProgramFiles", r"C:\Program Files")
    program_x86 = os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")
    local = os.environ.get("LOCALAPPDATA", "")

    roots = [
        os.path.join(program, "Google", "Chrome", "Application"),
        os.path.join(program_x86, "Google", "Chrome", "Application"),
        os.path.join(local, "Google", "Chrome", "Application"),
        os.path.join(program, "Microsoft", "Edge", "Application"),
        os.path.join(program_x86, "Microsoft", "Edge", "Application"),
    ]
    for root in dict.fromkeys(roots):
        for exe in glob.glob(os.path.join(root, "*.exe")):
            base = os.path.basename(exe).lower()
            if base.startswith(("chrome", "msedge")):
                candidates.append((None, exe))
    return candidates


def _launch_browser():
    from playwright.sync_api import sync_playwright

    pw = sync_playwright().start()
    browser = None
    err = None

    # Prefer the installed / downloaded chromium headless shell first.
    try:
        browser = pw.chromium.launch(headless=True, args=["--disable-blink-features=AutomationControlled"])
        return pw, browser
    except Exception as e:  # noqa: BLE001
        err = e

    # Fall back to a system Chrome/Edge executable.
    for _channel, exe in _candidate_browsers():
        try:
            browser = pw.chromium.launch(
                headless=True,
                executable_path=exe,
                args=["--disable-blink-features=AutomationControlled"],
            )
            return pw, browser
        except Exception:  # noqa: BLE001
            continue

    pw.stop()
    raise RuntimeError(
        "Playwright cannot launch a browser. Run `playwright install chromium` or "
        "install Google Chrome, then retry. " + (str(err) if err else "")
    )


def _collect_place_urls(page, target: int) -> list[str]:
    """Scroll the results feed and accumulate unique place URLs.

    Google Maps result cards are <a href="/maps/place/…"> anchors (they carry an
    aria-label but no explicit role). The sidebar is virtualized, so cards scroll
    out of the DOM — we therefore harvest URLs *during* scrolling rather than
    reading them all at the end (which would miss earlier, now-detached cards).
    """
    urls: list[str] = []
    seen: set[str] = set()

    def harvest():
        for loc in page.locator("a[href*='/maps/place/']").all():
            try:
                href = loc.get_attribute("href") or ""
            except Exception:  # noqa: BLE001
                continue
            if not href:
                continue
            url = href if href.startswith("http") else f"https://www.google.com{href}"
            if url in seen:
                continue
            seen.add(url)
            urls.append(url)

    harvest()
    feed = page.locator("div[role='feed']").first
    has_feed = feed.count() > 0

    def scroll():
        try:
            if has_feed:
                feed.evaluate("(el) => el.scrollBy(0, 1200)")
            else:
                page.evaluate("window.scrollBy(0, 1200)")
        except Exception:  # noqa: BLE001
            pass

    stagnant = 0
    for _ in range(40):
        if len(urls) >= target:
            break
        before = len(urls)
        scroll()
        page.wait_for_timeout(450)
        harvest()
        if len(urls) == before:
            stagnant += 1
            if stagnant >= 3:  # feed has stopped growing — stop scrolling
                break
        else:
            stagnant = 0
    return urls


def _extract_place(page) -> dict:
    """Read {name, phone, address, website, email} from a loaded place page.

    Uses Google Maps' stable data-item-id attributes rather than dynamic CSS
    class hashes.
    """
    data = {"name": "", "phone": "", "address": "", "website": "", "email": ""}

    # Name: the panel heading — skip the feed's "Results" label.
    try:
        for h in page.locator("h1").all():
            try:
                t = (h.inner_text() or "").strip()
            except Exception:  # noqa: BLE001
                continue
            if t and t.lower() != "results":
                data["name"] = t
                break
    except Exception:  # noqa: BLE001
        pass

    # Phone: data-item-id is 'phone:tel:+92 304 1114588' (locale-independent).
    try:
        btn = page.locator("button[data-item-id^='phone:tel:']").first
        if btn.count():
            item = btn.get_attribute("data-item-id") or ""
            prefix = "phone:tel:"
            if item.startswith(prefix):
                data["phone"] = item[len(prefix):].strip()
            else:
                data["phone"] = (btn.get_attribute("aria-label") or "").replace("Phone:", "").strip()
    except Exception:  # noqa: BLE001
        pass

    # Address: aria-label reads 'Address: …' (locale is forced to en-US).
    try:
        btn = page.locator("button[data-item-id='address']").first
        if btn.count():
            data["address"] = (btn.get_attribute("aria-label") or "").replace("Address:", "").strip()
    except Exception:  # noqa: BLE001
        pass

    # Website: the 'authority' link in the panel points to the business site.
    try:
        link = page.locator("a[data-item-id='authority']").first
        if link.count():
            data["website"] = link.get_attribute("href") or ""
    except Exception:  # noqa: BLE001
        pass

    # Website fallback: some panels expose the site under a different item id.
    if not data["website"]:
        try:
            for a in page.locator("a[data-item-id='www'], a[data-item-id='website']").all():
                href = a.get_attribute("href") or ""
                if href.startswith("http"):
                    data["website"] = href
                    break
        except Exception:  # noqa: BLE001
            pass

    # Email: rarely shown on the panel, but grab it when the profile exposes it.
    try:
        mail = page.locator("a[href^='mailto:']").first
        if mail.count():
            data["email"] = (mail.get_attribute("href") or "")[7:].split("?", 1)[0].strip()
    except Exception:  # noqa: BLE001
        pass

    return data


def google_maps_scrape_search(niche: str, location: str, max_results: int = 30) -> list[dict]:
    """Scrape google.com/maps for businesses in a niche, keyless.

    Navigates to the search results, collects place URLs from the sidebar feed,
    then visits each place page and reads its details. Returns a list of dicts
    shaped like {name, phone, address, email, website, has_website}; every
    business is kept and tagged by whether it has a website.
    """
    from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
    from urllib.parse import quote

    query = f"{niche} in {location}".strip()
    pw, browser = None, None

    try:
        pw, browser = _launch_browser()
        context = browser.new_context(
            user_agent=_DESKTOP_UA,
            viewport={"width": 1280, "height": 900},
            locale="en-US",
        )
        # Abort image/tile/media/font/analytics requests — Google Maps' map tiles
        # and telemetry are the dominant costs and we only read DOM text and
        # attributes, not visuals. This cuts each place page-load from many
        # seconds to roughly one.
        def _route(route):
            try:
                req = route.request
                if req.resource_type in ("image", "media", "font"):
                    route.abort()
                elif any(
                    marker in req.url
                    for marker in ("/gen_204", "/analytics", "/collect", "/logging", "/log?", "/pt")
                ):
                    route.abort()
                else:
                    route.continue_()
            except Exception:  # noqa: BLE001
                try:
                    route.continue_()
                except Exception:  # noqa: BLE001
                    pass

        context.route("**/*", _route)

        page = context.new_page()
        page.set_default_timeout(15000)

        # Go straight to the search results URL — more reliable than typing into
        # the search box (which is flaky/absent in headless mode).
        page.goto(
            f"{_MAPS_URL}/search/{quote(query)}",
            wait_until="domcontentloaded",
            timeout=30000,
        )

        try:
            page.wait_for_selector("a[href*='/maps/place/']", timeout=25000)
        except PlaywrightTimeoutError:
            _dbg(f"no result cards for {query!r} (feed selector timed out)")
            return []
        page.wait_for_timeout(1000)

        # Gather more URLs than requested — many places have a website and get
        # filtered out below.
        target = min(max(max_results * 2, 10), 50)
        urls = _collect_place_urls(page, target)
        _dbg(f"collected {len(urls)} place URLs for {query!r}")

        results: list[dict] = []
        handled: set[str] = set()
        failed = 0
        for url in urls:
            if len(results) >= max_results:
                break
            if url in handled:
                continue
            handled.add(url)
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=25000)
                page.wait_for_selector("button[data-item-id='address'], h1", timeout=8000)
                page.wait_for_timeout(250)
            except Exception as e:  # noqa: BLE001
                failed += 1
                _dbg(f"skip place (nav failed): {type(e).__name__}")
                continue

            data = _extract_place(page)
            if not data.get("name"):
                failed += 1
                continue

            website = data.get("website") or ""
            email = data.get("email") or ""
            if website and not email:
                site_email, site_phone = _enrich_website(website)
                email = site_email
                if not data.get("phone"):
                    data["phone"] = site_phone

            results.append({
                "name": data["name"],
                "phone": data["phone"],
                "address": data["address"],
                "email": email,
                "website": website,
                "has_website": bool(website),
            })

        _dbg(
            f"kept {len(results)} businesses for {query!r} "
            f"({failed} failed to load)"
        )
        return results

    except PlaywrightTimeoutError as e:  # noqa: BLE001
        _dbg(f"timeout: {e}")
        return []
    except Exception as e:  # noqa: BLE001
        _dbg(f"error: {type(e).__name__}: {e}")
        return []
    finally:
        if browser:
            try:
                browser.close()
            except Exception:  # noqa: BLE001
                pass
        if pw:
            try:
                pw.stop()
            except Exception:  # noqa: BLE001
                pass
