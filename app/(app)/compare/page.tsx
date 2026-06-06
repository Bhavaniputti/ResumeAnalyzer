'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Trophy, TrendingUp } from 'lucide-react';

interface Resume {
  id: string;
  title: string;
  raw_text: string;
}

interface ComparisonResult {
  match_score: number;
  ats_score: number;
  matched_skills: string[];
  missing_skills: string[];
}

interface ComparisonData {
  resume_a: ComparisonResult;
  resume_b: ComparisonResult;
  comparison_notes: string[];
}

export default function ComparePage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedA, setSelectedA] = useState<string>('');
  const [selectedB, setSelectedB] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);

  // Load resumes on mount
  const loadResumes = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('resumes')
      .select('id, title, raw_text')
      .eq('user_id', user.id);

    if (!error && data) {
      setResumes(data);
    }
  };

  useEffect(() => {
    loadResumes();
  }, [user]);

  const handleCompare = async () => {
    if (!selectedA || !selectedB) {
      return;
    }

    setLoading(true);

    try {
      const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;
      const useDemo = false;
      let result: ComparisonData;

      if (useDemo) {
        // Demo data
        result = {
          resume_a: {
            match_score: 78,
            ats_score: 82,
            matched_skills: ['Python', 'React', 'AWS'],
            missing_skills: ['Kubernetes', 'GraphQL'],
          },
          resume_b: {
            match_score: 85,
            ats_score: 76,
            matched_skills: ['Python', 'React', 'Node.js', 'AWS', 'GraphQL'],
            missing_skills: ['Kubernetes'],
          },
          comparison_notes: [
            'Resume B has better overall match score',
            'Resume A has higher ATS compatibility',
            'Resume B demonstrates more diverse tech stack',
          ],
        };
      } else {
        // Call actual backend
        const response = await fetch(`${backendUrl}/compare`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resume_a_text: resumes.find(r => r.id === selectedA)?.raw_text,
            resume_b_text: resumes.find(r => r.id === selectedB)?.raw_text,
            job_description: jobDescription,
          }),
        });

        if (!response.ok) throw new Error('Comparison failed');
        result = await response.json();
      }

      setComparison(result);
    } catch (error) {
      console.error('Comparison error:', error);
    } finally {
      setLoading(false);
    }
  };

  const winner = comparison
    ? comparison.resume_a.match_score > comparison.resume_b.match_score
      ? 'A'
      : 'B'
    : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Compare Resumes</h1>
          <p className="text-gray-600 mt-2">
            Compare two resumes side-by-side against a job description
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Resume A Selector */}
          <Card className="bg-white rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#2563EB]">Resume A</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedA} onValueChange={setSelectedA}>
                <SelectTrigger className="bg-[#F8FAFC] border-gray-200">
                  <SelectValue placeholder="Select Resume A" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Resume B Selector */}
          <Card className="bg-white rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#14B8A6]">Resume B</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedB} onValueChange={setSelectedB}>
                <SelectTrigger className="bg-[#F8FAFC] border-gray-200">
                  <SelectValue placeholder="Select Resume B" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Job Description */}
        <Card className="bg-white rounded-2xl border-0 shadow-sm mb-8">
          <CardHeader>
            <CardTitle>Job Description (Optional)</CardTitle>
            <CardDescription>
              Paste the job description to compare against
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description here..."
              className="bg-[#F8FAFC] border-gray-200 rounded-xl min-h-[200px]"
            />
          </CardContent>
        </Card>

        {/* Compare Button */}
        <div className="flex justify-center mb-12">
          <Button
            onClick={handleCompare}
            disabled={!selectedA || !selectedB || loading}
            className="bg-[#2563EB] hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold"
          >
            {loading ? 'Comparing...' : 'Compare'}
          </Button>
        </div>

        {comparison && (
          <>
            {/* Winner Announcement */}
            {winner && (
              <Card className={`bg-gradient-to-r mb-8 rounded-2xl border-0 shadow-sm ${
                winner === 'A'
                  ? 'from-blue-50 to-blue-100'
                  : 'from-teal-50 to-teal-100'
              }`}>
                <CardContent className="pt-8">
                  <div className="flex items-center gap-4">
                    <Trophy className={`w-12 h-12 ${
                      winner === 'A' ? 'text-[#2563EB]' : 'text-[#14B8A6]'
                    }`} />
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        Resume {winner} Wins!
                      </h3>
                      <p className="text-gray-600">
                        Based on overall match score of {
                          winner === 'A'
                            ? comparison.resume_a.match_score
                            : comparison.resume_b.match_score
                        }/100
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Score Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Resume A Results */}
              <Card className="bg-white rounded-2xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#2563EB]">Resume A Scores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Match Score Bar */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-700">Match Score</span>
                      <span className="text-[#2563EB] font-bold">
                        {comparison.resume_a.match_score}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-[#2563EB] h-3 rounded-full transition-all"
                        style={{ width: `${comparison.resume_a.match_score}%` }}
                      />
                    </div>
                  </div>

                  {/* ATS Score Bar */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-700">ATS Score</span>
                      <span className="text-blue-600 font-bold">
                        {comparison.resume_a.ats_score}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all"
                        style={{ width: `${comparison.resume_a.ats_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Matched Skills</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {comparison.resume_a.matched_skills.map((skill) => (
                        <Badge
                          key={skill}
                          className="bg-green-100 text-green-800 rounded-full"
                        >
                          ✓ {skill}
                        </Badge>
                      ))}
                    </div>

                    <h4 className="font-semibold text-gray-700 mb-3">Missing Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {comparison.resume_a.missing_skills.map((skill) => (
                        <Badge
                          key={skill}
                          className="bg-red-100 text-red-800 rounded-full"
                        >
                          ✗ {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resume B Results */}
              <Card className="bg-white rounded-2xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#14B8A6]">Resume B Scores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Match Score Bar */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-700">Match Score</span>
                      <span className="text-[#14B8A6] font-bold">
                        {comparison.resume_b.match_score}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-[#14B8A6] h-3 rounded-full transition-all"
                        style={{ width: `${comparison.resume_b.match_score}%` }}
                      />
                    </div>
                  </div>

                  {/* ATS Score Bar */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-700">ATS Score</span>
                      <span className="text-teal-600 font-bold">
                        {comparison.resume_b.ats_score}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-teal-500 h-3 rounded-full transition-all"
                        style={{ width: `${comparison.resume_b.ats_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Matched Skills</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {comparison.resume_b.matched_skills.map((skill) => (
                        <Badge
                          key={skill}
                          className="bg-green-100 text-green-800 rounded-full"
                        >
                          ✓ {skill}
                        </Badge>
                      ))}
                    </div>

                    <h4 className="font-semibold text-gray-700 mb-3">Missing Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {comparison.resume_b.missing_skills.map((skill) => (
                        <Badge
                          key={skill}
                          className="bg-red-100 text-red-800 rounded-full"
                        >
                          ✗ {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Notes */}
            <Card className="bg-white rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#2563EB]" />
                  Comparison Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {(comparison?.comparison_notes ?? []).map((note: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-[#2563EB] font-bold mt-0.5">•</span>
                      <span className="text-gray-700">{note}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
