import { LoginForm } from '@/components/auth/LoginForm';
import { GraduationCap } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign In — EduCore' };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] gradient-primary p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold">EduCore</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Manage your school<br />
            like never before
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            One platform for students, teachers, parents, and administrators. 
            Built for Ghanaian schools.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Students', value: '50,000+' },
              { label: 'Schools', value: '200+' },
              { label: 'Teachers', value: '3,500+' },
              { label: 'Attendance Records', value: '2M+' },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-white/70 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/50 text-sm">
          © {new Date().getFullYear()} EduCore · Built for Ghana 🇬🇭
        </p>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">EduCore</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-1">Sign in to your school account</p>
          </div>

          <LoginForm />

          <p className="text-center text-sm text-muted-foreground mt-6">
            Need access?{' '}
            <a href="mailto:admin@school.edu.gh" className="text-primary hover:underline font-medium">
              Contact your administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
