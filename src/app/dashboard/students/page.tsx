import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StudentsTable } from '@/components/students/StudentsTable';
import { StudentFiltersBar } from '@/components/students/StudentFiltersBar';
import Link from 'next/link';
import { UserPlus, Download, Upload } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Students' };

interface SearchParams {
  page?: string;
  search?: string;
  class_id?: string;
  gender?: string;
  is_active?: string;
  is_boarding?: string;
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile?.school_id) redirect('/auth/setup');

  const page = parseInt(params.page ?? '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  // Build query
  let query = supabase
    .from('students')
    .select(`
      id, student_id, first_name, last_name, admission_number, 
      admission_date, gender, is_active, is_boarding, avatar_url,
      created_at,
      classes(id, name, section),
      guardians(first_name, last_name, phone, is_primary)
    `, { count: 'exact' })
    .eq('school_id', profile.school_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.search) {
    query = query.or(
      `first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,student_id.ilike.%${params.search}%,admission_number.ilike.%${params.search}%`
    );
  }
  if (params.class_id) query = query.eq('class_id', params.class_id);
  if (params.gender) query = query.eq('gender', params.gender);
  if (params.is_active !== undefined) query = query.eq('is_active', params.is_active === 'true');
  if (params.is_boarding !== undefined) query = query.eq('is_boarding', params.is_boarding === 'true');

  const { data: students, count } = await query;

  // Get classes for filter dropdown
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, section')
    .eq('school_id', profile.school_id)
    .order('level', { ascending: true });

  const totalPages = Math.ceil((count ?? 0) / limit);
  const canManage = ['super_admin', 'school_admin'].includes(profile.role);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-description">
            {count?.toLocaleString() ?? 0} students enrolled
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-accent transition-colors">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-accent transition-colors">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <Link
              href="/dashboard/students/new"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Add Student
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <StudentFiltersBar
        classes={classes ?? []}
        currentFilters={params}
      />

      {/* Table */}
      <StudentsTable
        students={students ?? []}
        totalCount={count ?? 0}
        currentPage={page}
        totalPages={totalPages}
        canManage={canManage}
      />
    </div>
  );
}
