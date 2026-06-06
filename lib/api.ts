const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface AnalysisResult {
  match_score: number;
  ats_score: number;
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  final_recommendation: string;
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...opts.headers }, ...opts });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ detail: 'Failed' }))).detail);
  return res.json();
}

export const api = {
  parseResume: (fd: FormData) => fetch(`${BACKEND_URL}/api/parse-resume`, { method: 'POST', body: fd }).then(async r => { if (!r.ok) throw new Error('Parse failed'); return r.json(); }),
  analyzeText: (resume_text: string, job_description: string) => request<AnalysisResult>('/api/analyze-text', { method: 'POST', body: JSON.stringify({ resume_text, job_description }) }),
  atsScore: (resume_text: string, job_description?: string) => request<{ ats_score: number; keywords: string[]; missing_sections: string[]; missing_keywords: string[]; formatting_issues: string[]; suggestions: string[] }>('/api/ats-score', { method: 'POST', body: JSON.stringify({ resume_text, job_description }) }),
  roleRecommendations: (resume_text: string) => request<{ roles: { title: string; match: number; reason: string }[] }>('/api/role-recommendations', { method: 'POST', body: JSON.stringify({ resume_text }) }),
  interviewQuestions: (resume_text: string, role: string) => request<{ questions: { question: string; category: string; difficulty: string }[] }>('/api/interview-questions', { method: 'POST', body: JSON.stringify({ resume_text, role }) }),
  chat: (resume_text: string, message: string, history: { role: string; content: string }[]) => request<{ answer: string }>('/api/chat', { method: 'POST', body: JSON.stringify({ resume_text, message, history }) }),
  compare: (resume_a_text: string, resume_b_text: string, job_description?: string) => request<{ resume_a: AnalysisResult; resume_b: AnalysisResult; winner: 'A' | 'B'; comparison_notes: string[] }>('/api/compare', { method: 'POST', body: JSON.stringify({ resume_a_text, resume_b_text, job_description }) }),
  health: () => request<{ status: string }>('/health'),
};
