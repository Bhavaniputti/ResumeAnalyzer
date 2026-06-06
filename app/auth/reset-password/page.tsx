'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) toast.error(error);
    else setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shadow-lg shadow-blue-200"><FileText className="w-5 h-5 text-white" /></div>
            <span className="text-xl font-bold text-foreground">ResumeAI</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
        </div>
        <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4"><Mail className="w-8 h-8 text-[#2563EB]" /></div>
              <h3 className="font-semibold text-foreground mb-2">Check your email</h3>
              <p className="text-sm text-muted-foreground mb-6">We sent a reset link to <strong>{email}</strong></p>
              <Link href="/auth/login"><Button variant="outline" className="w-full rounded-xl">Back to Sign In</Button></Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-11 rounded-xl" /></div>
              <Button type="submit" disabled={loading} className="w-full h-11 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold rounded-xl">{loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Send Reset Link</Button>
              <Link href="/auth/login"><Button type="button" variant="ghost" className="w-full rounded-xl">Back to Sign In</Button></Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
