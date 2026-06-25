import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

// ─── Students ─────────────────────────────────────────────────

export function useStudents(filters?: {
  class_id?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { user } = useAuthStore();
  const schoolId = user?.profile.school_id;

  return useQuery({
    queryKey: ['students', schoolId, filters],
    queryFn: async () => {
      if (!schoolId) return { data: [], count: 0 };
      const supabase = createClient();
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 20;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('students')
        .select('*, classes(name, section), guardians(first_name, last_name, phone, is_primary)', { count: 'exact' })
        .eq('school_id', schoolId)
        .is('deleted_at', null)
        .range(offset, offset + limit - 1);

      if (filters?.class_id) query = query.eq('class_id', filters.class_id);
      if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },
    enabled: !!schoolId,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('students')
        .select('*, classes(*), guardians(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// ─── Teachers ─────────────────────────────────────────────────

export function useTeachers() {
  const { user } = useAuthStore();
  const schoolId = user?.profile.school_id;

  return useQuery({
    queryKey: ['teachers', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('teachers')
        .select('*, departments(name)')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('first_name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!schoolId,
  });
}

// ─── Classes ──────────────────────────────────────────────────

export function useClasses() {
  const { user } = useAuthStore();
  const schoolId = user?.profile.school_id;

  return useQuery({
    queryKey: ['classes', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('classes')
        .select('*, academic_years!inner(is_current)')
        .eq('school_id', schoolId)
        .eq('academic_years.is_current', true)
        .order('level');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!schoolId,
  });
}

// ─── Subjects ─────────────────────────────────────────────────

export function useSubjects() {
  const { user } = useAuthStore();
  const schoolId = user?.profile.school_id;

  return useQuery({
    queryKey: ['subjects', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('subjects')
        .select('*, departments(name)')
        .eq('school_id', schoolId)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!schoolId,
  });
}

// ─── Current Term ─────────────────────────────────────────────

export function useCurrentTerm() {
  const { user } = useAuthStore();
  const schoolId = user?.profile.school_id;

  return useQuery({
    queryKey: ['current-term', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('terms')
        .select('*, academic_years(name)')
        .eq('school_id', schoolId)
        .eq('is_current', true)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!schoolId,
  });
}

// ─── Dashboard Stats ──────────────────────────────────────────

export function useDashboardStats() {
  const { user } = useAuthStore();
  const schoolId = user?.profile.school_id;

  return useQuery({
    queryKey: ['dashboard-stats', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_school_id: schoolId,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ─── Notifications ────────────────────────────────────────────

export function useNotifications() {
  const { user } = useAuthStore();
  const profileId = user?.profile.id;

  return useQuery({
    queryKey: ['notifications', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profileId,
    refetchInterval: 60_000, // Poll every minute
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ─── Attendance ────────────────────────────────────────────────

export function useAttendanceRecords(classId?: string, dateRange?: { from: string; to: string }) {
  const { user } = useAuthStore();
  const schoolId = user?.profile.school_id;

  return useQuery({
    queryKey: ['attendance', schoolId, classId, dateRange],
    queryFn: async () => {
      if (!schoolId) return [];
      const supabase = createClient();
      let query = supabase
        .from('attendance_records')
        .select('*, classes(name), attendance_entries(student_id, status)')
        .eq('school_id', schoolId)
        .order('date', { ascending: false })
        .limit(30);

      if (classId) query = query.eq('class_id', classId);
      if (dateRange) {
        query = query.gte('date', dateRange.from).lte('date', dateRange.to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!schoolId,
  });
}

// ─── Finance ──────────────────────────────────────────────────

export function useInvoices(studentId?: string, status?: string) {
  const { user } = useAuthStore();
  const schoolId = user?.profile.school_id;

  return useQuery({
    queryKey: ['invoices', schoolId, studentId, status],
    queryFn: async () => {
      if (!schoolId) return [];
      const supabase = createClient();
      let query = supabase
        .from('invoices')
        .select('*, students(first_name, last_name, student_id), terms(name)')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (studentId) query = query.eq('student_id', studentId);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!schoolId,
  });
}

// ─── Books ────────────────────────────────────────────────────

export function useBooks(search?: string, category?: string) {
  const { user } = useAuthStore();
  const schoolId = user?.profile.school_id;

  return useQuery({
    queryKey: ['books', schoolId, search, category],
    queryFn: async () => {
      if (!schoolId) return [];
      const supabase = createClient();
      let query = supabase
        .from('books')
        .select('*')
        .eq('school_id', schoolId)
        .order('title');

      if (search) {
        query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
      }
      if (category) query = query.eq('category', category);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!schoolId,
  });
}

// ─── Exams ────────────────────────────────────────────────────

export function useExams(classId?: string, status?: string) {
  const { user } = useAuthStore();
  const schoolId = user?.profile.school_id;

  return useQuery({
    queryKey: ['exams', schoolId, classId, status],
    queryFn: async () => {
      if (!schoolId) return [];
      const supabase = createClient();
      let query = supabase
        .from('exams')
        .select('*, subjects(name), classes(name), exam_types(name)')
        .eq('school_id', schoolId)
        .order('start_datetime', { ascending: false });

      if (classId) query = query.eq('class_id', classId);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!schoolId,
  });
}
