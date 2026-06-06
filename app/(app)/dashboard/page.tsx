'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  FileText,
  Target,
  BarChart3,
  TrendingUp,
  Upload,
  MessageSquare,
  Zap,
  GitCompare,
  History,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

interface Analysis {
  id: string;
  resume_id: string;
  resume_title: string;
  match_score: number;
  ats_score: number;
  created_at: string;
  final_recommendation: string;
}
interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [resumeCount, setResumeCount] = useState<number>(0);
  const [analysisCount, setAnalysisCount] = useState<number>(0);
  const [avgMatchScore, setAvgMatchScore] = useState<number>(0);
  const [avgAtsScore, setAvgAtsScore] = useState<number>(0);
  const [recentAnalyses, setRecentAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch resume count
        const { count: resCount } = await supabase
          .from('resumes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setResumeCount(resCount || 0);

        // Fetch analyses with resume titles
        const { data: analyses, error: analysesError } = await supabase
          .from('resume_analyses')
          .select('id, resume_id, match_score, ats_score, created_at, final_recommendation')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (analysesError) {
          console.error('Error fetching analyses:', analysesError);
          toast.error('Failed to load analyses');
          return;
        }

        if (analyses && analyses.length > 0) {
          setAnalysisCount(analyses.length);

          // Calculate averages
          const totalMatch = analyses.reduce((sum, a) => sum + (a.match_score || 0), 0);
          const totalAts = analyses.reduce((sum, a) => sum + (a.ats_score || 0), 0);

          setAvgMatchScore(
            analyses.length > 0 ? Math.round((totalMatch / analyses.length) * 10) / 10 : 0
          );
          setAvgAtsScore(analyses.length > 0 ? Math.round((totalAts / analyses.length) * 10) / 10 : 0);

          // Fetch resume titles for recent analyses
          const enrichedAnalyses = await Promise.all(
            analyses.slice(0, 5).map(async (analysis) => {
              const { data: resume } = await supabase
                .from('resumes')
                .select('title')
                .eq('id', analysis.resume_id)
                .single();

              return {
                ...analysis,
                resume_title: resume?.title || 'Untitled Resume',
              };
            })
          );

          setRecentAnalyses(enrichedAnalyses);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards: StatCard[] = [
    {
      label: 'Resumes Uploaded',
      value: resumeCount,
      icon: <FileText className="w-6 h-6 text-blue-600" />,
    },
    {
      label: 'Analyses Run',
      value: analysisCount,
      icon: <BarChart3 className="w-6 h-6 text-teal-600" />,
    },
    {
      label: 'Avg Match Score',
      value: `${avgMatchScore}%`,
      icon: <Target className="w-6 h-6 text-blue-600" />,
    },
    {
      label: 'Avg ATS Score',
      value: `${avgAtsScore}%`,
      icon: <TrendingUp className="w-6 h-6 text-teal-600" />,
    },
  ];

  const quickActions: QuickAction[] = [
    {
      id: 'upload',
      label: 'Upload Resume',
      description: 'Add a new resume to your library',
      icon: <Upload className="w-8 h-8" />,
      href: '/upload',
      color: 'from-blue-50 to-blue-100',
    },
    {
      id: 'matcher',
      label: 'Job Matcher',
      description: 'Match your resume with jobs',
      icon: <Target className="w-8 h-8" />,
      href: '/analysis',
      color: 'from-teal-50 to-teal-100',
    },
    {
      id: 'ats',
      label: 'ATS Analyzer',
      description: 'Optimize for ATS systems',
      icon: <Zap className="w-8 h-8" />,
      href: '/ats',
      color: 'from-amber-50 to-amber-100',
    },
    {
      id: 'chat',
      label: 'Resume Chat',
      description: 'Chat about your resume',
      icon: <MessageSquare className="w-8 h-8" />,
      href: '/chat',
      color: 'from-purple-50 to-purple-100',
    },
    {
      id: 'recommendations',
      label: 'Role Recommendations',
      description: 'Get personalized role suggestions',
      icon: <CheckCircle className="w-8 h-8" />,
      href: '/roles',
      color: 'from-green-50 to-green-100',
    },
    {
      id: 'compare',
      label: 'Compare Resumes',
      description: 'Compare multiple versions',
      icon: <GitCompare className="w-8 h-8" />,
      href: '/compare',
      color: 'from-pink-50 to-pink-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {getGreeting()}, {user?.user_metadata?.first_name || 'Welcome'}
          </h1>
          <p className="text-slate-600 mt-2">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-slate-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">{card.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{card.value}</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg">{card.icon}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <a
                  key={action.id}
                  href={action.href}
                  className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all p-6 border border-slate-200 hover:border-blue-300 group cursor-pointer`}
                >
                  <div className={`bg-gradient-to-br ${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3 text-slate-700 group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {action.label}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">{action.description}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Recent Analyses */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-slate-600" />
              <h2 className="text-xl font-bold text-slate-900">Recent Analyses</h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentAnalyses.length > 0 ? (
              <div className="space-y-3">
                {recentAnalyses.map((analysis) => (
                  <div key={analysis.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate text-sm">
                          {analysis.resume_title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                        Match: {analysis.match_score}%
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-teal-100 text-teal-700 border-teal-200">
                        ATS: {analysis.ats_score}%
                      </Badge>
                    </div>
                    {analysis.final_recommendation && (
                      <div className="flex items-center gap-1 mt-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-700">{analysis.final_recommendation}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No analyses yet</p>
                <p className="text-xs text-slate-400 mt-1">Upload a resume to get started</p>
              </div>
            )}

            {recentAnalyses.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* RAG Tech Banner */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Powered by Advanced AI</h3>
              <p className="text-blue-100 mt-1">
                Using RAG technology and machine learning for accurate resume analysis
              </p>
            </div>
            <Zap className="w-8 h-8 opacity-80" />
          </div>
        </div>
      </div>
    </div>
  );
}
