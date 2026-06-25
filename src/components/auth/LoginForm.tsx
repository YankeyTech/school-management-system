'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : error.message
        );
        return;
      }

      toast.success('Signed in successfully!');
      router.push('/dashboard/home');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = `w-full px-4 py-3 text-sm bg-background border rounded-lg
    focus:outline-none focus:ring-2 focus:ring-ring transition-all
    placeholder:text-muted-foreground text-foreground`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="your@school.edu.gh"
          className={`${inputClass} border-border`}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-foreground">Password</label>
          <a
            href="/auth/forgot-password"
            className="text-xs text-primary hover:underline"
          >
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className={`${inputClass} border-border pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !email || !password}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold
                   text-white bg-primary rounded-lg hover:bg-primary/90
                   disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      {/* Demo credentials */}
      <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Demo credentials:</p>
        <p>Admin: admin@demo.educore.app / demo123</p>
        <p>Teacher: teacher@demo.educore.app / demo123</p>
      </div>
    </form>
  );
}
