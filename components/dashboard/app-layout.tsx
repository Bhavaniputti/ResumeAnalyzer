'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, LayoutDashboard, Upload, BarChart3, MessageSquare, Target, GitCompare, History, User, LogOut, Menu, X, Zap, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/upload', icon: Upload, label: 'Upload Resume' },
  { href: '/analysis', icon: Target, label: 'Job Matcher' },
  { href: '/ats', icon: BarChart3, label: 'ATS Analyzer' },
  { href: '/chat', icon: MessageSquare, label: 'Resume Chat' },
  { href: '/roles', icon: Zap, label: 'Role Recommendations' },
  { href: '/compare', icon: GitCompare, label: 'Compare Resumes' },
];
const accountNav = [
  { href: '/profile', icon: User, label: 'Profile' },
];

function NavLink({ item, onClose }: { item: { href: string; icon: React.ElementType; label: string }; onClose?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href;
  return (
    <Link href={item.href} onClick={onClose} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all', active ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}>
      <item.icon className="w-4 h-4 flex-shrink-0" /><span>{item.label}</span>{active && <ChevronRight className="w-3 h-3 ml-auto opacity-70" />}
    </Link>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { if (!loading && !user) router.push('/auth/login'); }, [user, loading, router]);

  const handleSignOut = async () => { await signOut(); toast.success('Signed out'); router.push('/'); };

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="w-12 h-12 brand-gradient rounded-2xl flex items-center justify-center animate-pulse"><FileText className="w-6 h-6 text-white" /></div></div>;
  if (!user) return null;

  const Sidebar = ({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) => (
    <div className="flex flex-col h-full bg-white border-r border-border">
      <div className="h-16 flex items-center px-6 border-b border-border flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}><div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center"><FileText className="w-4 h-4 text-white" /></div><span className="font-bold text-foreground">ResumeAI</span></Link>
        {mobile && <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>}
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">Main</p>
        {navItems.map(i => <NavLink key={i.href} item={i} onClose={onClose} />)}
        <div className="pt-4"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">Account</p>{accountNav.map(i => <NavLink key={i.href} item={i} onClose={onClose} />)}</div>
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 mb-2">
          <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">{user?.email?.charAt(0).toUpperCase() || 'U'}</div>
          <div className="min-w-0 flex-1"><p className="text-sm font-medium text-foreground truncate">{user?.user_metadata?.full_name || 'User'}</p><p className="text-xs text-muted-foreground truncate">{user?.email}</p></div>
        </div>
        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"><LogOut className="w-4 h-4" />Sign Out</button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <div className="hidden lg:flex w-64 flex-shrink-0"><Sidebar /></div>
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden transition-transform"><Sidebar mobile onClose={() => setMobileOpen(false)} /></div>
        </>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden h-16 bg-white border-b border-border flex items-center px-4 gap-4 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground"><Menu className="w-5 h-5" /></button>
          <Link href="/dashboard" className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center"><FileText className="w-3.5 h-3.5 text-white" /></div><span className="font-bold text-foreground">ResumeAI</span></Link>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
