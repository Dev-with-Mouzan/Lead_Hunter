from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, FileResponse, JSONResponse

from src.modules.ody.services import (
    run_search,
    run_search_places,
    generate_csv,
    generate_vcard_for_result,
    generate_all_vcards,
    generate_all_history_csv,
    get_results,
    get_session,
    get_stats,
    get_sessions,
    get_config,
)
from src.modules.ody.database import db_file_path, checkpoint

buildApp = FastAPI(title="LeadHunter API")

buildApp.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@buildApp.get("/")
def health():
    return {"ok": True, "app": "LeadHunter API"}


@buildApp.get("/health")
def health_check():
    return {
        "ok": True,
        "app": "LeadHunter API",
        "database": db_file_path().exists(),
    }


@buildApp.get("/stats")
def stats():
    return {"stats": get_stats(), "sessions": get_sessions()}


@buildApp.get("/config")
def config():
    return get_config()


@buildApp.get("/sessions/{session_id}")
def session_detail(session_id: str):
    session = get_session(session_id)
    if session is None:
        return JSONResponse({"error": "Session not found"}, status_code=404)
    return session


@buildApp.post("/search")
def search(
    niche: str = Form(...),
    country: str = Form(...),
    max_results: int = Form(10),
):
    query = f"{niche} in {country}"
    session_id, data = run_search(query, max_results)
    return {
        "session_id": session_id,
        "results": [
            {
                "url": r["url"],
                "emails": r["emails"],
                "phones": r["phones"],
                "emails_str": ", ".join(r["emails"]),
                "phones_str": ", ".join(r["phones"]),
            }
            for r in data
        ],
    }


@buildApp.post("/search-places")
def search_places(
    niche: str = Form(...),
    location: str = Form(...),
    max_results: int = Form(30),
):
    session_id, data = run_search_places(niche, location, max_results)
    return {
        "session_id": session_id,
        "results": data,
    }


@buildApp.get("/download/csv/{session_id}")
def download_csv(session_id: str):
    if get_session(session_id) is None:
        return PlainTextResponse("Session not found", status_code=404)
    csv_data = generate_csv(session_id)
    return PlainTextResponse(
        csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"},
    )


@buildApp.get("/download/vcard/{session_id}/{idx}")
def download_vcard(session_id: str, idx: int):
    results = get_results(session_id)
    if idx < 0 or idx >= len(results):
        return PlainTextResponse("Not found", status_code=404)
    vcard = generate_vcard_for_result(results[idx])
    return PlainTextResponse(
        vcard,
        media_type="text/vcard",
        headers={"Content-Disposition": f"attachment; filename=lead_{idx}.vcf"},
    )


@buildApp.get("/download/all-vcards/{session_id}")
def download_all_vcards(session_id: str):
    if get_session(session_id) is None:
        return PlainTextResponse("Session not found", status_code=404)
    vcards = generate_all_vcards(session_id)
    return PlainTextResponse(
        vcards,
        media_type="text/vcard",
        headers={"Content-Disposition": "attachment; filename=all_leads.vcf"},
    )


@buildApp.get("/download/db")
def download_db():
    checkpoint()
    return FileResponse(
        db_file_path(),
        media_type="application/octet-stream",
        headers={"Content-Disposition": "attachment; filename=odify_history.db"},
    )


@buildApp.get("/download/all-history.csv")
def download_all_history():
    csv_data = generate_all_history_csv()
    return PlainTextResponse(
        csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=all_history.csv"},
    )


@buildApp.get("/delete-session/{session_id}")
def delete_session(session_id: str):
    from src.modules.ody.services import delete_session
    delete_session(session_id)
    return {"ok": True, "deleted": session_id}


@buildApp.get("/clear-sessions")
def clear_sessions():
    from src.modules.ody.services import clear_sessions
    clear_sessions()
    return {"ok": True, "cleared": True}
