'use client';

import Link from 'next/link';
import { FileText, Brain, Target, MessageSquare, BarChart3, Zap, ArrowRight, CheckCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const features = [
  { icon: Brain, title: 'AI-Powered Analysis', desc: 'Llama 3.3 70B analyzes your resume with deep contextual understanding.' },
  { icon: Target, title: 'Job Match Scoring', desc: 'Precise match percentages between your resume and any job description.' },
  { icon: BarChart3, title: 'ATS Optimization', desc: 'Score against Applicant Tracking Systems and beat the bots.' },
  { icon: MessageSquare, title: 'Resume Chat (RAG)', desc: 'Chat with your resume using RAG pipeline powered by ChromaDB.' },
  { icon: Zap, title: 'Role Recommendations', desc: 'Discover ideal job roles based on your unique skills profile.' },
  { icon: Brain, title: 'Interview Prep', desc: 'Generate tailored interview questions for your target role.' },
];

const stats = [
  { value: '94%', label: 'Match Accuracy' },
  { value: '3x', label: 'ATS Pass Rate' },
  { value: '12K+', label: 'Users Hired' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'Software Engineer at Google', text: 'ResumeAI helped me increase my ATS score from 62% to 91%. Got callbacks from all 5 companies!', avatar: 'SC' },
  { name: 'Marcus Johnson', role: 'Data Scientist at Meta', text: 'The job match analysis was spot-on. Identified exactly the skills I was missing.', avatar: 'MJ' },
  { name: 'Priya Sharma', role: 'Product Manager at Stripe', text: 'Interview prep feature is incredible. Walked into my interviews fully prepared.', avatar: 'PS' },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center"><FileText className="w-4 h-4 text-white" /></div>
            <span className="text-lg font-bold text-foreground">ResumeAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link href="/auth/signup"><Button size="sm" className="bg-[#2563EB] hover:bg-blue-700 text-white">Get Started</Button></Link>
          </div>
        </div>
      </header>

      <section className="pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-50 text-blue-700 border-blue-200 px-4 py-1.5">
            <Zap className="w-3.5 h-3.5 mr-1.5" /> Powered by Llama 3.3 70B + ChromaDB RAG
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Land Your Dream Job with <span className="brand-gradient-text">AI-Powered</span> Resume Intelligence
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Analyze your resume against job descriptions, optimize for ATS systems, and get personalized AI coaching.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-[#2563EB] hover:bg-blue-700 text-white px-8 h-12 font-semibold rounded-xl shadow-lg shadow-blue-200">
                Analyze Your Resume Free <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <a href="#features"><Button size="lg" variant="outline" className="px-8 h-12 font-semibold rounded-xl">Learn More</Button></a>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            {['No credit card', 'Free to start', 'Instant results'].map(t => <span key={t} className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" />{t}</span>)}
          </div>

          <div className="mt-16 mx-auto max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-border bg-white">
            <div className="bg-slate-100 flex items-center gap-2 px-4 py-3 border-b border-border">
              <div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-yellow-400" /><div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="ml-4 bg-white rounded-md px-4 py-1 text-xs text-muted-foreground flex-1 max-w-xs">app.resumeai.com/dashboard</div>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Match Score', value: '87%', sub: 'vs Senior Dev role', color: 'text-blue-600' },
                { label: 'ATS Score', value: '91/100', sub: 'Excellent optimization', color: 'text-teal-600' },
                { label: 'Missing Skills', value: '3', sub: 'Docker, K8s, AWS', color: 'text-orange-600' },
              ].map(c => (
                <div key={c.label} className="bg-[#F8FAFC] rounded-xl p-5 border border-border text-left">
                  <p className="text-xs font-medium text-muted-foreground mb-2">{c.label}</p>
                  <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white border-y border-border">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(s => <div key={s.label} className="text-center"><p className="text-3xl font-bold brand-gradient-text">{s.value}</p><p className="text-sm text-muted-foreground mt-1">{s.label}</p></div>)}
        </div>
      </section>

      <section id="features" className="py-20 px-6 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-teal-50 text-teal-700 border-teal-200">Features</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">Everything you need to get hired</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><f.icon className="w-6 h-6" /></div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="brand-gradient rounded-2xl p-10 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to land your dream job?</h2>
            <p className="text-blue-100 mb-8 max-w-xl mx-auto">Join thousands improving their resumes with ResumeAI.</p>
            <Link href="/auth/signup"><Button size="lg" className="bg-white text-[#2563EB] hover:bg-blue-50 px-10 font-semibold rounded-xl">Start Free <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-lg brand-gradient flex items-center justify-center"><FileText className="w-3 h-3 text-white" /></div><span className="font-bold text-foreground">ResumeAI</span></div>
          <p className="text-sm text-muted-foreground">Built with LangChain, ChromaDB & Llama 3.3 70B</p>
        </div>
      </footer>
    </div>
  );
}
