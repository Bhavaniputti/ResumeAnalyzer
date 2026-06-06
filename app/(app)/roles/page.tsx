'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';

interface Resume {
  id: string;
  title: string;
  raw_text: string;
}

interface RoleRecommendation {
  title: string;
  match: number;
  reason: string;
}

interface InterviewQuestion {
  question: string;
  category: 'Technical' | 'Behavioral' | 'Situational';
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const DEMO_ROLES: RoleRecommendation[] = [
  { title: 'Data Analyst', match: 88, reason: 'Strong SQL and data analysis skills' },
  { title: 'ML Engineer', match: 75, reason: 'Good ML foundations, needs cloud experience' },
  { title: 'BI Developer', match: 82, reason: 'SQL expertise is a strong fit' },
  { title: 'Data Engineer', match: 68, reason: 'Python skills present, needs pipeline experience' },
  { title: 'Research Scientist', match: 72, reason: 'Academic background is valuable' },
  { title: 'Product Analyst', match: 79, reason: 'Data skills with business understanding' },
];

const DEMO_QUESTIONS: InterviewQuestion[] = [
  { question: 'Explain supervised vs unsupervised learning', category: 'Technical', difficulty: 'Medium' },
  { question: 'How would you handle missing data?', category: 'Technical', difficulty: 'Medium' },
  { question: 'Describe explaining complex insights to non-technical stakeholders', category: 'Behavioral', difficulty: 'Easy' },
  { question: 'What metrics evaluate a classification model?', category: 'Technical', difficulty: 'Hard' },
  { question: 'How do you prioritize analysis requests?', category: 'Situational', difficulty: 'Medium' },
];

const getMatchColor = (match: number): string => {
  if (match >= 80) return 'bg-green-100 text-green-800';
  if (match >= 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-orange-100 text-orange-800';
};

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Technical':
      return 'bg-[#2563EB] text-white';
    case 'Behavioral':
      return 'bg-[#14B8A6] text-white';
    case 'Situational':
      return 'bg-amber-500 text-white';
    default:
      return 'bg-gray-200 text-gray-800';
  }
};

const CircleProgress = ({ percentage }: { percentage: number }) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg width="120" height="120" className="transform -rotate-90">
      <circle
        cx="60"
        cy="60"
        r="45"
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="4"
      />
      <circle
        cx="60"
        cy="60"
        r="45"
        fill="none"
        stroke="#2563EB"
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        className="transition-all duration-300"
      />
      <text
        x="60"
        y="70"
        textAnchor="middle"
        fontSize="24"
        fontWeight="bold"
        fill="#2563EB"
      >
        {percentage}%
      </text>
    </svg>
  );
};

export default function RolesPage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [roles, setRoles] = useState<RoleRecommendation[]>([]);
  const [showRoles, setShowRoles] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [roleInput, setRoleInput] = useState('');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [showQuestions, setShowQuestions] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchResumes = async () => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('id, title, raw_text')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResumes(data || []);
      if (data && data.length > 0) {
        setSelectedResumeId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  };

  const handleGetRecommendations = async () => {
    if (!selectedResumeId) return;

    setIsLoadingRoles(true);
    try {
      setRoles(DEMO_ROLES);
      setShowRoles(true);

      const { error } = await supabase
        .from('resume_analyses')
        .insert({
          resume_id: selectedResumeId,
          analysis_type: 'roles',
          analysis_data: {
            roles: DEMO_ROLES,
            target_industry: targetIndustry,
          },
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving analysis:', error);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!roleInput.trim()) return;

    setIsLoadingQuestions(true);
    try {
      setQuestions(DEMO_QUESTIONS);
      setShowQuestions(true);
      setExpandedQuestions(new Set());
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const toggleQuestionExpand = (question: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(question)) {
      newExpanded.delete(question);
    } else {
      newExpanded.add(question);
    }
    setExpandedQuestions(newExpanded);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Role Recommendations</h1>
          <p className="text-gray-600 mt-2">Discover the best roles suited for your skills and experience</p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Resume Selector Dropdown */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Resume</label>
              <button
                onClick={() => {
                  if (resumes.length === 0) fetchResumes();
                  setDropdownOpen(!dropdownOpen);
                }}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-2xl text-left flex items-center justify-between hover:border-gray-400"
              >
                <span className="text-gray-900">
                  {resumes.find((r) => r.id === selectedResumeId)?.title || 'Select a resume'}
                </span>
                <ChevronDown size={20} className="text-gray-500" />
              </button>

              {dropdownOpen && resumes.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-2xl shadow-lg z-10">
                  {resumes.map((resume) => (
                    <button
                      key={resume.id}
                      onClick={() => {
                        setSelectedResumeId(resume.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-2xl last:rounded-b-2xl ${
                        selectedResumeId === resume.id ? 'bg-[#F8FAFC] text-[#2563EB]' : 'text-gray-900'
                      }`}
                    >
                      {resume.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Target Industry Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Industry (Optional)</label>
              <Input
                type="text"
                placeholder="e.g., Tech, Finance, Healthcare"
                value={targetIndustry}
                onChange={(e) => setTargetIndustry(e.target.value)}
                className="rounded-2xl"
              />
            </div>

            {/* Get Recommendations Button */}
            <div className="flex items-end">
              <Button
                onClick={handleGetRecommendations}
                disabled={isLoadingRoles || !selectedResumeId}
                className="w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-2xl"
              >
                {isLoadingRoles ? 'Loading...' : 'Get Recommendations'}
              </Button>
            </div>
          </div>
        </div>

        {/* Role Recommendations */}
        {showRoles && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended Roles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{role.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getMatchColor(role.match)}`}>
                      {role.match}% Match
                    </span>
                  </div>

                  <div className="flex justify-center mb-4">
                    <CircleProgress percentage={role.match} />
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{role.reason}</p>

                  <Button className="w-full bg-[#14B8A6] hover:bg-[#0d9488] text-white rounded-2xl">
                    Explore
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interview Questions Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Interview Questions</h2>

          <div className="mb-6 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
              <Input
                type="text"
                placeholder="e.g., Data Analyst"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                className="rounded-2xl"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerateQuestions}
                disabled={isLoadingQuestions || !roleInput.trim()}
                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-2xl"
              >
                {isLoadingQuestions ? 'Generating...' : 'Generate Questions'}
              </Button>
            </div>
          </div>

          {showQuestions && (
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleQuestionExpand(q.question)}
                    className="w-full p-4 flex items-start justify-between bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1 text-left">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{q.question}</p>
                        <div className="flex gap-2 mt-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(q.category)}`}>
                            {q.category}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              q.difficulty === 'Easy'
                                ? 'bg-green-100 text-green-800'
                                : q.difficulty === 'Medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        </div>
                      </div>
                      <ChevronDown
                        size={20}
                        className={`text-gray-500 transition-transform ${
                          expandedQuestions.has(q.question) ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {expandedQuestions.has(q.question) && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-700">
                        This is a {q.difficulty.toLowerCase()} {q.category.toLowerCase()} question. Consider discussing relevant
                        experiences and examples from your background.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
