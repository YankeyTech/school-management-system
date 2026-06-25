import type { Metadata } from 'next';
import { AIAssistantClient } from '@/components/ai/AIAssistantClient';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'AI Assistant' };

export default async function AIAssistantPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, schools(name, settings)')
    .eq('user_id', user.id)
    .single();

  if (!profile?.school_id) redirect('/auth/setup');

  return (
    <div className="page-container h-[calc(100vh-64px-48px)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            ✨ AI Assistant
          </h1>
          <p className="page-description">
            Ask anything about students, results, attendance, or school management
          </p>
        </div>
      </div>

      <AIAssistantClient
        schoolId={profile.school_id}
        userRole={profile.role}
        userName={profile.first_name}
      />
    </div>
  );
}
