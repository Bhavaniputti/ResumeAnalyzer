"""
RAG Pipeline: LangChain + ChromaDB + Sentence Transformers + Groq Llama 3.
7-step process: Load → Chunk → Embed → Store → Retrieve → Prompt → Generate.
"""
import hashlib
import json
from typing import Optional

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage

from app.config import get_settings

try:
    from langchain_huggingface import HuggingFaceEmbeddings
    EMBED_OK = True
except ImportError:
    EMBED_OK = False

settings = get_settings()

def _embeddings():
    if not EMBED_OK: raise RuntimeError("langchain_huggingface not installed")
    return HuggingFaceEmbeddings(model_name=settings.embedding_model, model_kwargs={"device": "cpu"}, encode_kwargs={"normalize_embeddings": True})

def _llm() -> ChatGroq:
    return ChatGroq(groq_api_key=settings.groq_api_key, model_name=settings.llm_model, temperature=0.3, max_tokens=4096)

def _collection_name(text: str) -> str:
    return f"resume_{hashlib.md5(text[:500].encode()).hexdigest()[:12]}"

def _chunk(text: str) -> list:
    splitter = RecursiveCharacterTextSplitter(chunk_size=settings.chunk_size, chunk_overlap=settings.chunk_overlap, separators=["\n\n", "\n", ". ", " ", ""])
    return splitter.create_documents([text])

def _build_vs(text: str) -> Chroma:
    chunks = _chunk(text)
    return Chroma.from_documents(documents=chunks, embedding=_embeddings(), collection_name=_collection_name(text), persist_directory=settings.chroma_persist_dir)

def _retrieve(text: str, query: str, k: int = 4) -> str:
    vs = Chroma(collection_name=_collection_name(text), embedding_function=_embeddings(), persist_directory=settings.chroma_persist_dir)
    docs = vs.similarity_search(query, k=k)
    return "\n\n".join(d.page_content for d in docs)

def _parse_json(text: str) -> dict:
    try:
        text = text.strip()

        if text.startswith("```json"):
            text = text.replace("```json", "").replace("```", "").strip()

        elif text.startswith("```"):
            text = text.split("```")[1].strip()

        return json.loads(text)

    except Exception:
        print("RAW MODEL OUTPUT:", text)

        return {
            "resume_a": {
                "match_score": 80,
                "ats_score": 80,
                "matched_skills": [],
                "missing_skills": [],
                "strengths": [],
                "weaknesses": [],
                "recommendations": [],
                "final_recommendation": "Moderately Suitable"
            },
            "resume_b": {
                "match_score": 80,
                "ats_score": 80,
                "matched_skills": [],
                "missing_skills": [],
                "strengths": [],
                "weaknesses": [],
                "recommendations": [],
                "final_recommendation": "Moderately Suitable"
            },
            "winner": "A",
            "comparison_notes": [
                "AI response was not valid JSON"
            ]
        }
def analyze_resume_job_match(resume_text: str, job_description: str) -> dict:
    llm = _llm()
    try:
        _build_vs(resume_text)
        ctx = _retrieve(resume_text, f"skills experience {job_description[:200]}")
    except Exception:
        ctx = resume_text[:2000]

    sys = "You are an expert ATS and career coach AI. Analyze the resume against the job description and return ONLY valid JSON. No markdown."
    usr = f"""Resume Context:\n{ctx}\n\nFull Resume:\n{resume_text[:3000]}\n\nJob Description:\n{job_description[:2000]}\n\nReturn JSON:\n{{"match_score":<0-100>,"ats_score":<0-100>,"matched_skills":[],"missing_skills":[],"strengths":[],"weaknesses":[],"recommendations":[],"final_recommendation":"<Highly/Moderately/Not Suitable>"}}"""
    return _parse_json(llm.invoke([SystemMessage(content=sys), HumanMessage(content=usr)]).content)

def get_ats_score(resume_text: str, job_description: Optional[str] = None) -> dict:
    llm = _llm()
    jd = f"\nJob Description:\n{job_description[:1500]}" if job_description else ""
    usr = f"""Analyze this resume for ATS compatibility.\nResume:\n{resume_text[:3000]}{jd}\n\nReturn JSON:\n{{"ats_score":<0-100>,"keywords":[],"missing_keywords":[],"missing_sections":[],"formatting_issues":[],"suggestions":[]}}"""
    return _parse_json(llm.invoke([HumanMessage(content=usr)]).content)

def get_role_recommendations(resume_text: str) -> dict:
    llm = _llm()
    usr = f"""Based on this resume, recommend suitable job roles.\nResume:\n{resume_text[:3000]}\n\nReturn JSON:\n{{"roles":[{{"title":"","match":<0-100>,"reason":""}}]}}\nInclude 6-8 roles ordered by match."""
    return _parse_json(llm.invoke([HumanMessage(content=usr)]).content)

def get_interview_questions(resume_text: str, role: str) -> dict:
    llm = _llm()
    usr = f"""Generate interview questions for {role}.\nResume:\n{resume_text[:2000]}\n\nReturn JSON:\n{{"questions":[{{"question":"","category":"<Technical|Behavioral|Situational>","difficulty":"<Easy|Medium|Hard>"}}]}}\nInclude 8-10 questions."""
    return _parse_json(llm.invoke([HumanMessage(content=usr)]).content)

def chat_with_resume(resume_text: str, message: str, history: list) -> dict:
    llm = _llm()
    try:
        _build_vs(resume_text)
        ctx = _retrieve(resume_text, message)
    except Exception:
        ctx = resume_text[:2000]
    hist = "".join(f"\n{m['role'].capitalize()}: {m['content']}" for m in history[-6:])
    sys = "You are an AI career assistant. Answer based on the resume context. Be concise and helpful."
    usr = f"""Resume Context:\n{ctx}\n\nConversation:{hist}\n\nQuestion: {message}"""
    return {"answer": llm.invoke([SystemMessage(content=sys), HumanMessage(content=usr)]).content}

def compare_resumes(resume_a: str, resume_b: str, job_description: Optional[str] = None) -> dict:

    # Normalize text
    clean_a = " ".join(resume_a.lower().split())
    clean_b = " ".join(resume_b.lower().split())

    # Same resume detection
    if clean_a == clean_b:
        return {
            "resume_a": {
                "match_score": 90,
                "ats_score": 90,
                "matched_skills": [],
                "missing_skills": []
            },

            "resume_b": {
                "match_score": 90,
                "ats_score": 90,
                "matched_skills": [],
                "missing_skills": []
            },

            "winner": "Tie",

            "comparison_notes": [
                "Both resumes are identical",
                "Scores are effectively equal"
            ]
        }

    llm = _llm()

    jd = f"\nJob Description:\n{job_description}" if job_description else ""

    prompt = f"""
Compare Resume A and Resume B.

Return ONLY JSON.

Resume A:
{resume_a[:3000]}

Resume B:
{resume_b[:3000]}

{jd}

Return:

{{
"resume_a": {{
"match_score":0,
"ats_score":0,
"matched_skills":[],
"missing_skills":[]
}},
"resume_b": {{
"match_score":0,
"ats_score":0,
"matched_skills":[],
"missing_skills":[]
}},
"winner":"A",
"comparison_notes":[]
}}
"""

    try:
        response = llm.invoke([
            SystemMessage(content="Return JSON only."),
            HumanMessage(content=prompt)
        ])

        return _parse_json(response.content)

    except Exception:
        return {
            "resume_a": {
                "match_score": 75,
                "ats_score": 75,
                "matched_skills": [],
                "missing_skills": []
            },

            "resume_b": {
                "match_score": 75,
                "ats_score": 75,
                "matched_skills": [],
                "missing_skills": []
            },

            "winner": "Tie",

            "comparison_notes": [
                "Comparison unavailable"
            ]
        }