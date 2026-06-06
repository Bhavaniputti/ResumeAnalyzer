"""PDF text extraction using PyPDF2 and pdfplumber."""
import io
import re

try:
    import pdfplumber
    HAS_PLUMBER = True
except ImportError:
    HAS_PLUMBER = False

try:
    import PyPDF2
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    if HAS_PLUMBER:
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    t = page.extract_text()
                    if t: text += t + "\n"
            if text.strip(): return text
        except Exception: pass
    if HAS_PYPDF2:
        try:
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                t = page.extract_text()
                if t: text += t + "\n"
        except Exception: pass
    return text


def parse_resume_sections(text: str) -> dict:
    result = {"name": "", "email": "", "phone": "", "skills": [], "education": [], "experience": [], "projects": [], "certifications": []}
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    email_re = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
    emails = email_re.findall(text)
    if emails: result["email"] = emails[0]

    phone_re = re.compile(r'(\+?1?\s?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})')
    phones = phone_re.findall(text)
    if phones: result["phone"] = "".join(phones[0]).strip()

    for line in lines[:5]:
        if not email_re.search(line) and not phone_re.search(line) and len(line.split()) <= 5:
            result["name"] = line; break

    sections = {
        "skills": re.compile(r'^(skills|technical skills|core competencies|technologies)', re.I),
        "education": re.compile(r'^(education|academic|qualification)', re.I),
        "experience": re.compile(r'^(experience|work experience|employment|professional)', re.I),
        "projects": re.compile(r'^(projects|personal projects|key projects)', re.I),
        "certifications": re.compile(r'^(certifications|certificates|credentials)', re.I),
    }
    current = None
    content = {k: [] for k in sections}
    for line in lines:
        matched = False
        for sec, pat in sections.items():
            if pat.match(line): current = sec; matched = True; break
        if not matched and current: content[current].append(line)

    skill_text = " ".join(content["skills"])
    result["skills"] = [s.strip() for s in re.split(r'[,•|/\n]', skill_text) if 1 < len(s.strip()) < 50][:30]
    result["education"] = content["education"][:5]
    result["experience"] = content["experience"][:8]
    result["projects"] = content["projects"][:5]
    result["certifications"] = content["certifications"][:5]
    return result
