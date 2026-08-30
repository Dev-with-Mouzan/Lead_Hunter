import csv
import io
import uuid
from urllib.parse import urlparse

from .odify import search_and_scrape
from .google_places import (
    search_places as _search_places,
    is_configured as _places_configured,
)
from .database import (
    get_session as _db_get_session,
    get_results as _db_get_results,
    list_sessions as _db_list_sessions,
    get_stats as _db_get_stats,
    save_session as _db_save_session,
    db_file_path,
)


def get_config():
    return {
        "app": "LeadHunter API",
        "version": "1.0.0",
        "places": {
            "enabled": _places_configured(),
            "provider": "Google Maps (keyless scrape)" if not _has_api_key() else "Google Places API",
            "api_key": _has_api_key(),
        },
        "web": {
            "enabled": True,
            "provider": "DuckDuckGo + scraper",
        },
        "database": {
            "enabled": True,
            "engine": "SQLite",
            "path": str(db_file_path()),
        },
        "endpoints": [
            "/search",
            "/search-places",
            "/download/csv/{session_id}",
            "/download/vcard/{session_id}/{idx}",
            "/download/all-vcards/{session_id}",
            "/download/db",
            "/download/all-history.csv",
            "/stats",
            "/sessions/{session_id}",
            "/config",
        ],
    }


def _has_api_key():
    import os
    return bool(os.getenv("GOOGLE_PLACES_API_KEY"))


def _phone_count(data):
    if not data:
        return 0
    if "name" in data[0]:
        return sum(1 for r in data if r.get("phone"))
    return sum(len(r.get("phones", [])) for r in data)


def _register_session(mode: str, query: str, location: str, max_results: int, data):
    session_id = uuid.uuid4().hex
    _db_save_session(
        session_id=session_id,
        mode=mode,
        query=query,
        location=location,
        max_results=max_results,
        phone_count=_phone_count(data),
        data=data,
    )
    return session_id


def run_search(query: str, max_results: int):
    data = search_and_scrape(query, max_results)
    session_id = _register_session("web", query, query, max_results, data)
    return session_id, data


def run_search_places(niche: str, location: str, max_results: int = 30):
    data = _search_places(niche, location, max_results)
    session_id = _register_session("places", niche, location, max_results, data)
    return session_id, data


def get_results(session_id: str):
    return _db_get_results(session_id)


def get_session(session_id: str):
    session = _db_get_session(session_id)
    if not session:
        return None
    meta = {k: v for k, v in session.items() if k != "data"}
    return {**meta, "results": session["data"]}


def get_sessions(limit: int = 25):
    return _db_list_sessions(limit)


def delete_session(session_id: str):
    from .database import delete_session as _db_delete_session
    _db_delete_session(session_id)


def clear_sessions():
    from .database import clear_sessions as _db_clear_sessions
    _db_clear_sessions()


def get_stats():
    return _db_get_stats()


def generate_csv(session_id: str):
    results = get_results(session_id)
    buf = io.StringIO()
    writer = csv.writer(buf)

    if results and "name" in results[0]:
        writer.writerow(["Business Name", "Phone", "Address", "Email", "Website"])
        for r in results:
            writer.writerow([
                r.get("name", ""),
                r.get("phone", ""),
                r.get("address", ""),
                r.get("email", ""),
                r.get("website", ""),
            ])
    else:
        writer.writerow(["URL", "Emails", "Phones"])
        for r in results:
            writer.writerow([
                r["url"],
                ", ".join(r["emails"]),
                ", ".join(r["phones"]),
            ])
    return buf.getvalue()


def generate_vcard(name: str, emails: list, phones: list):
    lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        f"FN:{name}",
    ]
    for e in emails:
        lines.append(f"EMAIL:{e}")
    for p in phones:
        lines.append(f"TEL:{p}")
    lines.append("END:VCARD")
    return "\n".join(lines)


def generate_vcard_for_result(result: dict):
    if "name" in result:
        name = result.get("name", "Unknown")
        phones = [result["phone"]] if result.get("phone") else []
        emails = [result["email"]] if result.get("email") else []
        return generate_vcard(name, emails, phones)
    url = result.get("url", "")
    parsed = urlparse(url)
    name = parsed.netloc.replace("www.", "")
    return generate_vcard(name, result.get("emails", []), result.get("phones", []))


def generate_all_vcards(session_id: str):
    results = get_results(session_id)
    vcards = []
    for r in results:
        vcards.append(generate_vcard_for_result(r))
    return "\n".join(vcards)


def generate_all_history_csv():
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Session ID", "Mode", "Query", "Location", "Timestamp",
                     "Business Name", "URL", "Email", "Phone", "Address", "Website"])
    for session in _db_list_sessions(all_sessions=True):
        results = _db_get_results(session["id"])
        session_id = session["id"]
        mode = session["mode"]
        query = session["query"]
        location = session["location"]
        ts = session["timestamp"]
        if not results:
            writer.writerow([session_id, mode, query, location, ts, "", "", "", "", "", ""])
            continue
        for r in results:
            if "name" in r:
                writer.writerow([
                    session_id, mode, query, location, ts,
                    r.get("name", ""),
                    "",
                    (r.get("email") or ""),
                    (r.get("phone") or ""),
                    (r.get("address") or ""),
                    (r.get("website") or ""),
                ])
            else:
                writer.writerow([
                    session_id, mode, query, location, ts,
                    "",
                    r.get("url", ""),
                    ", ".join(r.get("emails", [])),
                    ", ".join(r.get("phones", [])),
                    "",
                    "",
                ])
    return buf.getvalue()
