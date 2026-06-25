import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get profile + school data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, schools(*)')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    redirect('/auth/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar profile={profile} />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar profile={profile} />
        <main className="flex-1 overflow-y-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
