'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface Resume {
  id: string;
  title: string;
  raw_text: string;
}

interface AnalysisResult {
  match_score: number;
  ats_score: number;
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  final_recommendation: string;
}

interface ScoreRingProps {
  score: number;
  label: string;
  color: string;
}

function ScoreRing({ score, label, color }: ScoreRingProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" className="transform -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s ease-in-out',
          }}
        />
      </svg>
      <div className="text-center mt-2">
        <div className="text-3xl font-bold" style={{ color }}>
          {score}%
        </div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
    </div>
  );
}

function AnalysisContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [resumesLoaded, setResumesLoaded] = useState(false);

  // Load resumes on mount
  useEffect(() => {
    if (!resumesLoaded && user?.id) {
      loadResumes();
    }
  }, [user, resumesLoaded]);

  async function loadResumes() {
    try {
      const { data, error: err } = await supabase
        .from('resumes')
        .select('id, title, raw_text')
        .eq('user_id', user?.id);

      if (err) throw err;
      setResumes(data || []);
      setResumesLoaded(true);
    } catch (err) {
      console.error('Error loading resumes:', err);
      setError('Failed to load resumes');
    }
  }

  async function handleAnalyze() {
    if (!selectedResumeId || !jobDescription.trim()) {
      setError('Please select a resume and provide a job description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedResume = resumes.find((r) => r.id === selectedResumeId);
      if (!selectedResume) throw new Error('Resume not found');

      // Save job description
      const { data: jobData, error: jobErr } = await supabase
        .from('job_descriptions')
        .insert([
          {
            user_id: user?.id,
            title: jobTitle || 'Untitled Job',
            description: jobDescription,
            created_at: new Date().toISOString(),
          },
        ])
        .select('id')
        .single();

      if (jobErr) throw jobErr;

      // Call analysis backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/analyze-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: selectedResume.raw_text,
          job_description: jobDescription,
          job_title: jobTitle,
        }),
      });

      let analysisResult: AnalysisResult;

      if (!response.ok) {
const error =
await response.text();

throw new Error(
`Backend Error: ${error}`
);
}

analysisResult =
await response.json();

console.log(
analysisResult
);
      setResult(analysisResult);

      // Save to resume_analyses
      // Save to resume_analyses
const { error: saveErr } = await supabase
.from('resume_analyses')
.insert([
{
user_id: user?.id,

resume_id: selectedResumeId,

job_id: jobData?.id,

analysis_type: 'full',

match_score:
analysisResult.match_score,

ats_score:
analysisResult.ats_score,

matched_skills:
analysisResult.matched_skills,

missing_skills:
analysisResult.missing_skills,

strengths:
analysisResult.strengths,

weaknesses:
analysisResult.weaknesses,

recommendations:
analysisResult.recommendations,

final_recommendation:
analysisResult.final_recommendation,

role_recommendations: [],

interview_questions: [],

created_at:
new Date().toISOString(),
}
]);

if (saveErr) {
console.error(saveErr)
}
      if (saveErr) console.error('Error saving analysis:', saveErr);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Resume & Job Match Analysis</h1>
          <p className="text-gray-600">Analyze how well your resume matches a job description</p>
        </div>

        {/* Input Section */}
        <div
          className="rounded-2xl p-8 mb-8 shadow-sm border"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Resume Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Resume *
              </label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#E2E8F0' }}
              >
                <option value="">Choose a resume...</option>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job Title (Optional)
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Data Engineer"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#E2E8F0' }}
              />
            </div>
          </div>

          {/* Job Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Job Description *
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{ borderColor: '#E2E8F0' }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#2563EB' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                Analyzing...
              </span>
            ) : (
              'Analyze Match'
            )}
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {/* Score Rings & Recommendation */}
            <div
              className="rounded-2xl p-8 shadow-sm border"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <ScoreRing score={result.match_score} label="Match Score" color="#2563EB" />
                <ScoreRing score={result.ats_score} label="ATS Score" color="#14B8A6" />

                {/* Final Recommendation */}
                <div className="flex flex-col justify-center items-center">
                  <div
                    className="px-6 py-4 rounded-xl text-center"
                    style={{ backgroundColor: '#F0F9FF', borderLeft: '4px solid #2563EB' }}
                  >
                    <div className="text-sm text-gray-600 mb-2">Final Recommendation</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {result.final_recommendation}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div
              className="rounded-2xl p-8 shadow-sm border"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">Skills Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Matched Skills */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <CheckCircle2 size={20} style={{ color: '#10B981' }} />
                    Matched Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.matched_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: '#10B981' }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <XCircle size={20} style={{ color: '#EF4444' }} />
                    Missing Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.missing_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: '#EF4444' }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div
              className="rounded-2xl p-8 shadow-sm border"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">Strengths & Weaknesses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Strengths */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-4">Strengths</h4>
                  <ul className="space-y-2">
                    {result.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-4">Weaknesses</h4>
                  <ul className="space-y-2">
                    {result.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-red-600 font-bold">✕</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div
              className="rounded-2xl p-8 shadow-sm border"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">Recommendations</h3>
              <div className="space-y-3">
                {result.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg text-white"
                    style={{ backgroundColor: '#2563EB' }}
                  >
                    <span className="font-semibold">{idx + 1}.</span> {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <AnalysisContent />
    </Suspense>
  );
}
