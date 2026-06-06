'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';

interface Profile {
  full_name: string;
  email: string;
  created_at: string;
}

interface Stats {
  total_resumes: number;
  total_analyses: number;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    email: user?.email || '',
    created_at: '',
  });
  const [stats, setStats] = useState<Stats>({
    total_resumes: 0,
    total_analyses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load profile and stats on mount
  const loadData = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, created_at')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile({
        full_name: profileData.full_name || '',
        email: profileData.email || user.email || '',
        created_at: profileData.created_at || '',
      });
    }

    // Fetch resume count
    const { count: resumeCount } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Fetch analysis count
    const { count: analysisCount } = await supabase
      .from('resume_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    setStats({
      total_resumes: resumeCount || 0,
      total_analyses: analysisCount || 0,
    });

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: profile.full_name,
        email: profile.email,
        updated_at: new Date().toISOString(),
      });

    if (!error) {
      // Profile saved successfully
    }

    setSaving(false);
  };

  const getInitials = (name: string) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    const parts = name.split(' ');
    return (
      (parts[0]?.charAt(0) || '') + (parts[1]?.charAt(0) || '')
    ).toUpperCase();
  };

  const memberSinceDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account information</p>
        </div>

        {/* Avatar and Name Section */}
        <Card className="bg-white rounded-2xl border-0 shadow-sm mb-8">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center">
              {/* Gradient Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center text-white text-4xl font-bold mb-6">
                {getInitials(profile.full_name)}
              </div>

              {/* Profile Form */}
              <div className="w-full space-y-6">
                {/* Full Name */}
                <div>
                  <Label className="text-gray-700 font-semibold mb-2 block">
                    Full Name
                  </Label>
                  <Input
                    value={profile.full_name}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    placeholder="Enter your full name"
                    className="bg-[#F8FAFC] border-gray-200 rounded-xl text-center"
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <Label className="text-gray-700 font-semibold mb-2 block">
                    Email
                  </Label>
                  <Input
                    value={profile.email}
                    disabled
                    className="bg-gray-100 border-gray-200 rounded-xl text-center text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Email cannot be changed
                  </p>
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-2 rounded-xl"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Resumes */}
          <Card className="bg-white rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#2563EB] text-lg">
                Total Resumes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-gray-900">
                {loading ? '-' : stats.total_resumes}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {stats.total_resumes === 1 ? 'Resume uploaded' : 'Resumes uploaded'}
              </p>
            </CardContent>
          </Card>

          {/* Total Analyses */}
          <Card className="bg-white rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#14B8A6] text-lg">
                Total Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-gray-900">
                {loading ? '-' : stats.total_analyses}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {stats.total_analyses === 1 ? 'Analysis run' : 'Analyses run'}
              </p>
            </CardContent>
          </Card>

          {/* Member Since */}
          <Card className="bg-white rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 text-lg">
                Member Since
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">
                {loading ? '-' : memberSinceDate}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Account created
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
