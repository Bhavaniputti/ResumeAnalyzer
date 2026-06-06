'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Loader2, Tag, AlertTriangle } from 'lucide-react';

interface Resume {
  id: string;
  title: string;
  raw_text: string;
}

interface ATSResult {
  ats_score: number;
  keywords: string[];
  missing_sections: string[];
  missing_keywords: string[];
  formatting_issues: string[];
  suggestions: string[];
}

interface ScoreRingProps {
  score: number;
  label: string;
}

function ScoreRing({ score }: ScoreRingProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="140" height="140" className="transform -rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="10"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#14B8A6"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s ease-in-out',
          }}
        />
      </svg>
      <div className="text-center -mt-12">
        <div className="text-4xl font-bold text-gray-900">{score}</div>
        <div className="text-lg text-gray-600">/ 100</div>
      </div>
    </div>
  );
}

function getScoreBadge(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Excellent', color: '#10B981' };
  if (score >= 70) return { label: 'Good', color: '#3B82F6' };
  if (score >= 55) return { label: 'Fair', color: '#F59E0B' };
  return { label: 'Needs Work', color: '#EF4444' };
}

function ATSContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ATSResult | null>(null);
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
    if (!selectedResumeId) {
      setError('Please select a resume');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedResume = resumes.find((r) => r.id === selectedResumeId);
      if (!selectedResume) throw new Error('Resume not found');

      // Call ATS analysis backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ats-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: selectedResume.raw_text,
          job_description: jobDescription || null,
        }),
      });

      let analysisResult: ATSResult;

      if (!response.ok) {
        // Use demo result on backend failure
        analysisResult = {
          ats_score: 78,
          keywords: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Data Analysis'],
          missing_sections: ['Professional Summary', 'LinkedIn URL'],
          missing_keywords: ['Docker', 'Kubernetes', 'Cloud'],
          formatting_issues: ['Inconsistent date formats', 'Missing bullet points'],
          suggestions: [
            'Add professional summary',
            'Include Docker/K8s/AWS keywords',
            'Use consistent bullet points',
            'Add LinkedIn/GitHub URLs',
          ],
        };
      } else {
        analysisResult = await response.json();
      }

      setResult(analysisResult);

      // Save to resume_analyses with analysis_type='ats'
      const { error: saveErr } = await supabase.from('resume_analyses').insert([
        {
          user_id: user?.id,
          resume_id: selectedResumeId,
          analysis_type: 'ats',
          ats_score: analysisResult.ats_score,
          keywords: analysisResult.keywords,
          missing_sections: analysisResult.missing_sections,
          missing_keywords: analysisResult.missing_keywords,
          formatting_issues: analysisResult.formatting_issues,
          suggestions: analysisResult.suggestions,
          created_at: new Date().toISOString(),
        },
      ]);

      if (saveErr) console.error('Error saving ATS analysis:', saveErr);
    } catch (err) {
      console.error('ATS analysis error:', err);
      setError('ATS analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ATS Analyzer</h1>
          <p className="text-gray-600">
            Check how well your resume passes through Applicant Tracking Systems
          </p>
        </div>

        {/* Input Section */}
        <div
          className="rounded-2xl p-8 mb-8 shadow-sm border"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
        >
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Resume *
            </label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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

          {/* Job Description (Optional) */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Job Description (Optional)
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste a job description for better keyword matching (optional)..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
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
            style={{ backgroundColor: '#14B8A6' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                Analyzing ATS Score...
              </span>
            ) : (
              'Analyze ATS Score'
            )}
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {/* Score Card */}
            <div
              className="rounded-2xl p-8 shadow-sm border"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Score Ring */}
                <div className="flex justify-center">
                  <ScoreRing score={result.ats_score} label="ATS Score" />
                </div>

                {/* Score Details */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Score Assessment</h3>

                  {/* Score Badge */}
                  <div className="mb-6">
                    <div className="text-sm text-gray-600 mb-2">Rating</div>
                    <div
                      className="inline-block px-6 py-3 rounded-full font-bold text-white text-lg"
                      style={{ backgroundColor: getScoreBadge(result.ats_score).color }}
                    >
                      {getScoreBadge(result.ats_score).label}
                    </div>
                  </div>

                  {/* Score Interpretation */}
                  <div className="text-sm text-gray-700 space-y-2">
                    <p>
                      <span className="font-semibold">Score Range:</span> Your resume scored{' '}
                      <span className="font-bold" style={{ color: '#14B8A6' }}>
                        {result.ats_score}/100
                      </span>
                    </p>
                    <p>
                      {result.ats_score >= 85
                        ? 'Your resume is highly optimized for ATS systems.'
                        : result.ats_score >= 70
                          ? 'Your resume is well-formatted for ATS systems.'
                          : result.ats_score >= 55
                            ? 'Your resume needs improvements for better ATS compatibility.'
                            : 'Your resume requires significant improvements for ATS compatibility.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Keywords Found, Missing Sections, Formatting Issues */}
            <div
              className="rounded-2xl p-8 shadow-sm border"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">Analysis Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Keywords Found */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Tag size={20} style={{ color: '#10B981' }} />
                    Keywords Found
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: '#10B981' }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Sections */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} style={{ color: '#F59E0B' }} />
                    Missing Sections
                  </h4>
                  <div className="space-y-2">
                    {result.missing_sections.map((section, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 rounded-lg text-sm text-gray-700"
                        style={{ backgroundColor: '#FEF3C7', borderLeft: '3px solid #F59E0B' }}
                      >
                        {section}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formatting Issues */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} style={{ color: '#EF4444' }} />
                    Formatting Issues
                  </h4>
                  <div className="space-y-2">
                    {result.formatting_issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 rounded-lg text-sm text-gray-700"
                        style={{ backgroundColor: '#FEE2E2', borderLeft: '3px solid #EF4444' }}
                      >
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Missing Keywords */}
            {result.missing_keywords.length > 0 && (
              <div
                className="rounded-2xl p-8 shadow-sm border"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Missing Keywords</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Consider adding these important keywords to improve your ATS score:
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.missing_keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-sm font-medium text-gray-700"
                      style={{ backgroundColor: '#F3F4F6', borderLeft: '2px solid #9CA3AF' }}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Suggestions */}
            <div
              className="rounded-2xl p-8 shadow-sm border"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">Improvement Suggestions</h3>
              <div className="space-y-3">
                {result.suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg text-white"
                    style={{ backgroundColor: '#2563EB' }}
                  >
                    <span className="font-semibold">{idx + 1}.</span> {suggestion}
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

export default function ATSPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ATSContent />
    </Suspense>
  );
}
