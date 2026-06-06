'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) toast.error(error);
    else { toast.success('Account created!'); router.push('/dashboard'); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shadow-lg shadow-blue-200"><FileText className="w-5 h-5 text-white" /></div>
            <span className="text-xl font-bold text-foreground">ResumeAI</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground mt-1">Start analyzing resumes for free</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" placeholder="John Smith" value={fullName} onChange={e => setFullName(e.target.value)} required className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={show ? 'text' : 'password'} placeholder="Create a strong password" value={password} onChange={e => setPassword(e.target.value)} required className="h-11 rounded-xl pr-11" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              {password.length > 0 && (
                <div className="flex gap-3 mt-2">
                  {[{ l: '8+ characters', m: password.length >= 8 }, { l: 'Has a number', m: /\d/.test(password) }].map(r => (
                    <span key={r.l} className={`flex items-center gap-1 text-xs ${r.m ? 'text-green-600' : 'text-muted-foreground'}`}><CheckCircle className={`w-3 h-3 ${r.m ? 'text-green-500' : 'text-gray-300'}`} />{r.l}</span>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold rounded-xl">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Create Account
            </Button>
          </form>
          <div className="mt-5 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/auth/login" className="text-[#2563EB] font-medium hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
