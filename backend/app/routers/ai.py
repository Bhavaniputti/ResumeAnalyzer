"""FastAPI routers for AI endpoints."""
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from app.services.pdf_service import extract_text_from_pdf, parse_resume_sections
from app.services.rag_service import (
    analyze_resume_job_match, get_ats_score, get_role_recommendations,
    get_interview_questions, chat_with_resume, compare_resumes,
)

router = APIRouter(prefix="/api", tags=["AI"])

class AnalyzeTextReq(BaseModel):
    resume_text: str; job_description: str
class ATSReq(BaseModel):
    resume_text: str; job_description: Optional[str] = None
class RoleReq(BaseModel):
    resume_text: str
class InterviewReq(BaseModel):
    resume_text: str; role: str
class ChatMsg(BaseModel):
    role: str; content: str
class ChatReq(BaseModel):
    resume_text: str; message: str; history: list[ChatMsg] = []
class CompareReq(BaseModel):
    resume_a_text: str; resume_b_text: str; job_description: Optional[str] = None

@router.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    if not file.filename or not file.filename.endswith(".pdf"): raise HTTPException(400, "Only PDF files accepted")
    content = await file.read()
    if len(content) > 10*1024*1024: raise HTTPException(400, "File too large (max 10MB)")
    raw_text = extract_text_from_pdf(content)
    if not raw_text.strip(): raise HTTPException(422, "Could not extract text from PDF")
    return {"raw_text": raw_text, "parsed_data": parse_resume_sections(raw_text)}

@router.post("/analyze-text")
async def analyze_text(req: AnalyzeTextReq):
    try: return analyze_resume_job_match(req.resume_text, req.job_description)
    except Exception as e: raise HTTPException(500, f"Analysis failed: {e}")

@router.post("/ats-score")
async def ats_score(req: ATSReq):
    try: return get_ats_score(req.resume_text, req.job_description)
    except Exception as e: raise HTTPException(500, f"ATS analysis failed: {e}")

@router.post("/role-recommendations")
async def role_recommendations(req: RoleReq):
    try: return get_role_recommendations(req.resume_text)
    except Exception as e: raise HTTPException(500, f"Recommendation failed: {e}")

@router.post("/interview-questions")
async def interview_questions(req: InterviewReq):
    try: return get_interview_questions(req.resume_text, req.role)
    except Exception as e: raise HTTPException(500, f"Question generation failed: {e}")

@router.post("/chat")
async def chat(req: ChatReq):
    try:
        history = [{"role": m.role, "content": m.content} for m in req.history]
        return chat_with_resume(req.resume_text, req.message, history)
    except Exception as e: raise HTTPException(500, f"Chat failed: {e}")

@router.post("/compare")
async def compare(req: CompareReq):
    try: return compare_resumes(req.resume_a_text, req.resume_b_text, req.job_description)
    except Exception as e: raise HTTPException(500, f"Comparison failed: {e}")
