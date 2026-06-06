'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  Loader2,
  User,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Resume {
  title: string;
  file: File;
  parsed?: {
    name?: string;
    email?: string;
    phone?: string;
    skills?: string[];
    experience?: Array<{
      title: string;
      company: string;
      duration: string;
    }>;
    education?: Array<{
      degree: string;
      school: string;
      year: string;
    }>;
  };
}

type Step = 'upload' | 'review' | 'save';

export default function UploadPage() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [resume, setResume] = useState<Resume | null>(null);
  const [title, setTitle] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleFileSelect = async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const fileName = file.name.replace('.pdf', '').replace(/[^a-zA-Z0-9\s]/g, '').trim();
    setTitle(fileName);
    setResume({
      title: fileName,
      file,
    });

    // Try to parse the resume
    await parseResume(file);
    setCurrentStep('review');
  };

  const parseResume = async (file: File) => {
    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/parse-resume`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.log('Resume parsing not available, will save with raw text');
        return;
      }

      const parsed = await response.json();
      setResume((prev) =>
        prev
          ? {
              ...prev,
              parsed,
            }
          : null
      );
    } catch (error) {
      console.log('Resume parsing failed, will save with raw text:', error);
      toast.warning('Resume parsing unavailable, will save without parsing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSaveResume = async () => {
    if (!resume || !title.trim()) {
      toast.error('Please enter a resume title');
      return;
    }

    try {
      setIsSaving(true);

      // Upload PDF to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-${title.replace(/\s+/g, '-')}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, resume.file, {
          contentType: 'application/pdf',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload resume');
        return;
      }

      // Get public URL
      const { data } = supabase.storage.from('resumes').getPublicUrl(fileName);

      // Insert record into resumes table
      const { error: insertError } = await supabase.from('resumes').insert({
        user_id: user.id,
        title: title.trim(),
        file_path: fileName,
        file_url: data.publicUrl,
        raw_text: resume.parsed ? JSON.stringify(resume.parsed) : 'PDF uploaded',
      });

      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error('Failed to save resume');
        return;
      }

      toast.success('Resume uploaded successfully');
      setCurrentStep('save');

      // Reset after 2 seconds
      setTimeout(() => {
        setResume(null);
        setTitle('');
        setCurrentStep('upload');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error('Failed to save resume');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setResume(null);
    setTitle('');
    setCurrentStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Upload Your Resume</h1>
          <p className="text-slate-600 mt-2">Add a new resume to your library</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {(['upload', 'review', 'save'] as const).map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  step === currentStep
                    ? 'bg-blue-600 text-white'
                    : ['upload', 'review', 'save'].indexOf(currentStep) > index
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                }`}
              >
                {['upload', 'review', 'save'].indexOf(currentStep) > index ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 2 && (
                <div
                  className={`w-12 h-1 mx-2 transition-all ${
                    ['upload', 'review', 'save'].indexOf(currentStep) > index
                      ? 'bg-green-600'
                      : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {currentStep === 'upload' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Step 1: Upload Resume</h2>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 bg-slate-50 hover:border-slate-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Drop your resume here</h3>
              <p className="text-slate-600 text-sm mb-4">or click to browse from your computer</p>
              <p className="text-slate-500 text-xs">PDF files up to 5MB</p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </div>

            {/* File Name Display */}
            {resume && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-slate-900">{resume.file.name}</p>
                    <p className="text-sm text-slate-600">
                      {(resume.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setResume(null);
                    setTitle('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="p-1 hover:bg-blue-100 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            )}

            {/* Resume Title Input */}
            {resume && (
              <div className="mt-6">
                <Label htmlFor="title" className="text-sm font-medium text-slate-900">
                  Resume Title
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Senior Developer Resume"
                  className="mt-2 bg-white"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Give your resume a descriptive name to identify it later
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {resume && (
              <div className="flex gap-3 mt-8">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1"
                >
                  Choose Different File
                </Button>
                <Button
                  onClick={() => setCurrentStep('review')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!title.trim()}
                >
                  Continue to Review
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Review */}
        {currentStep === 'review' && resume && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Step 2: Review Resume</h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
                <p className="text-slate-600">Parsing resume...</p>
              </div>
            ) : resume.parsed ? (
              <div className="space-y-6">
                {/* Name */}
                {resume.parsed.name && (
                  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                    <User className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-600">Name</p>
                      <p className="font-medium text-slate-900">{resume.parsed.name}</p>
                    </div>
                  </div>
                )}

                {/* Email */}
                {resume.parsed.email && (
                  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                    <Mail className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-600">Email</p>
                      <p className="font-medium text-slate-900">{resume.parsed.email}</p>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {resume.parsed.phone && (
                  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                    <Phone className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-600">Phone</p>
                      <p className="font-medium text-slate-900">{resume.parsed.phone}</p>
                    </div>
                  </div>
                )}

                {/* Skills */}
                {resume.parsed.skills && resume.parsed.skills.length > 0 && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Code className="w-5 h-5 text-blue-600" />
                      <p className="text-sm text-slate-600 font-medium">Skills</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {resume.parsed.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {resume.parsed.experience && resume.parsed.experience.length > 0 && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="w-5 h-5 text-teal-600" />
                      <p className="text-sm text-slate-600 font-medium">Experience</p>
                    </div>
                    <div className="space-y-3">
                      {resume.parsed.experience.map((exp, idx) => (
                        <div key={idx} className="text-sm">
                          <p className="font-medium text-slate-900">{exp.title}</p>
                          <p className="text-slate-600">{exp.company}</p>
                          <p className="text-xs text-slate-500">{exp.duration}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {resume.parsed.education && resume.parsed.education.length > 0 && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      <p className="text-sm text-slate-600 font-medium">Education</p>
                    </div>
                    <div className="space-y-3">
                      {resume.parsed.education.map((edu, idx) => (
                        <div key={idx} className="text-sm">
                          <p className="font-medium text-slate-900">{edu.degree}</p>
                          <p className="text-slate-600">{edu.school}</p>
                          <p className="text-xs text-slate-500">{edu.year}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="font-medium text-slate-900">Resume uploaded</h3>
                <p className="text-sm text-slate-600 mt-2">
                  Your resume is ready to be saved
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('upload')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSaveResume}
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Resume'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {currentStep === 'save' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Resume Saved</h2>
              <p className="text-slate-600 mb-2">
                Your resume "{title}" has been uploaded successfully
              </p>
              <p className="text-sm text-slate-500 mb-8">
                Redirecting to dashboard...
              </p>

              <Button
                onClick={() => (window.location.href = '/dashboard')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
