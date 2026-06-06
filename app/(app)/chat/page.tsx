'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface Resume {
  id: string;
  title: string;
  raw_text: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  resume_id: string;
  created_at: string;
}

const SUGGESTED_QUESTIONS = [
  'What skills do I have?',
  'Am I suitable for Data Analyst?',
  'What projects should I highlight?',
  'What certifications are present?',
];

const DEMO_RESPONSES: Record<string, string> = {
  'skills': 'Based on your resume, you have strong skills in Python, SQL, Machine Learning, and data analysis.',
  'suitable': 'Your SQL and Python skills make you well-suited for Data Analyst or ML Engineer positions.',
  'default': 'I can help answer questions about your resume. Your resume shows strong technical skills and project experience.',
};

export default function ChatPage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchResumes();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchResumes = async () => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('id, title, raw_text')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        setResumes(data);
        setSelectedResume(data[0]);
        await fetchChatSession(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  };

  const fetchChatSession = async (resumeId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, resume_id, created_at')
        .eq('resume_id', resumeId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const sessionId = data[0].id;
        setCurrentSessionId(sessionId);
        await fetchMessages(sessionId);
      } else {
        await createChatSession(resumeId);
      }
    } catch (error) {
      console.error('Error fetching chat session:', error);
    }
  };

  const createChatSession = async (resumeId: string) => {
  try {
    if (!user?.id) {
      console.error('User not logged in');
      return;
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([
        {
          user_id: user.id,
          resume_id: resumeId,
          title: 'Chat Session',
          created_at: new Date().toISOString(),
        },
      ])
      .select('id');

    if (error) throw error;

    if (data && data.length > 0) {
      setCurrentSessionId(data[0].id);
      setMessages([]);
      await fetchMessages(data[0].id);
    }
  } catch (error) {
    console.error('Error creating chat session:', error);
  }
};
  const fetchMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleResumeSelect = async (resume: Resume) => {
    setSelectedResume(resume);
    await fetchChatSession(resume.id);
  };

  const getDemoResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('skill')) {
      return DEMO_RESPONSES['skills'];
    }
    if (lowerMessage.includes('suitable') || lowerMessage.includes('data analyst')) {
      return DEMO_RESPONSES['suitable'];
    }
    return DEMO_RESPONSES['default'];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedResume || !currentSessionId) return;

    const userMessage = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const { data: userMsg, error: userError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSessionId,
          role: 'user',
          content: userMessage,
          created_at: new Date().toISOString(),
        })
        .select('id, role, content, created_at');

      if (userError) throw userError;

      setMessages((prev) => [...prev, userMsg[0]]);

      const assistantResponse = getDemoResponse(userMessage);

      const { data: assistantMsg, error: assistantError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSessionId,
          role: 'assistant',
          content: assistantResponse,
          created_at: new Date().toISOString(),
        })
        .select('id, role, content, created_at');

      if (assistantError) throw assistantError;

      setMessages((prev) => [...prev, assistantMsg[0]]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = async (question: string) => {
    setInputValue(question);
  };

  return (
    <div className="flex h-screen gap-4 p-4 bg-[#F8FAFC]">
      {/* Left Panel - Resume List */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900">Your Resumes</h2>
        <div className="space-y-2 flex-1 overflow-y-auto">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              onClick={() => handleResumeSelect(resume)}
              className={`p-4 rounded-2xl cursor-pointer transition-all ${
                selectedResume?.id === resume.id
                  ? 'border-2 border-[#2563EB] bg-white shadow-md'
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-medium text-gray-900">{resume.title}</p>
              <p className="text-sm text-gray-500 mt-1 truncate">{resume.raw_text.substring(0, 50)}...</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Chat Interface */}
      <div className="w-full lg:w-2/3 flex flex-col gap-4 bg-white rounded-2xl shadow-sm p-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedResume?.title || 'Select a Resume'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Ask questions about your resume</p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <p className="text-gray-500 text-center">No messages yet. Ask a question to get started!</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {SUGGESTED_QUESTIONS.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="px-4 py-2 rounded-full bg-[#F8FAFC] border border-gray-200 text-sm text-gray-700 hover:border-[#2563EB] hover:text-[#2563EB] transition-all"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex gap-3 border-t border-gray-200 pt-4">
          <Input
            type="text"
            placeholder="Ask about your resume..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading || !selectedResume}
            className="rounded-2xl"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !selectedResume || !inputValue.trim()}
            className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-2xl"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
