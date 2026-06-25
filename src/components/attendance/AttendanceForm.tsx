'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, XCircle, Clock, AlertCircle,
  QrCode, ClipboardList, Loader2, Save, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface StudentAttendance {
  student_id: string;
  first_name: string;
  last_name: string;
  student_id_code: string;
  avatar_url?: string;
  status: AttendanceStatus;
  remarks?: string;
}

interface Class {
  id: string;
  name: string;
  section?: string;
  level: number;
}

interface AttendanceFormProps {
  classes: Class[];
  termId: string;
  schoolId: string;
  profileId: string;
}

const STATUS_CONFIG: Record<AttendanceStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  ring: string;
}> = {
  present: {
    label: 'Present',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    ring: 'ring-emerald-500',
  },
  absent: {
    label: 'Absent',
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-100 dark:bg-red-900/30',
    ring: 'ring-red-500',
  },
  late: {
    label: 'Late',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    ring: 'ring-amber-500',
  },
  excused: {
    label: 'Excused',
    icon: AlertCircle,
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    ring: 'ring-blue-500',
  },
};

export function AttendanceForm({ classes, termId, schoolId, profileId }: AttendanceFormProps) {
  const router = useRouter();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [markAll, setMarkAll] = useState<AttendanceStatus | ''>('');
  const today = new Date().toISOString().split('T')[0];

  // Load students when class changes
  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      return;
    }

    async function loadStudents() {
      setLoadingStudents(true);
      const supabase = createClient();

      // Check if attendance already taken today
      const { data: existing } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('class_id', selectedClassId)
        .eq('school_id', schoolId)
        .eq('date', today)
        .is('subject_id', null)
        .maybeSingle();

      if (existing) {
        toast.warning('Attendance already taken for this class today');
      }

      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, student_id, avatar_url')
        .eq('class_id', selectedClassId)
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) {
        toast.error('Failed to load students');
        setLoadingStudents(false);
        return;
      }

      setStudents(
        (data ?? []).map((s) => ({
          student_id: s.id,
          first_name: s.first_name,
          last_name: s.last_name,
          student_id_code: s.student_id,
          avatar_url: s.avatar_url,
          status: 'present' as AttendanceStatus,
        }))
      );
      setLoadingStudents(false);
    }

    loadStudents();
  }, [selectedClassId, schoolId, today]);

  function updateStatus(studentId: string, status: AttendanceStatus) {
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, status } : s))
    );
  }

  function handleMarkAll(status: AttendanceStatus) {
    setMarkAll(status);
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  }

  const summary = students.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<AttendanceStatus, number>
  );

  async function handleSave() {
    if (!selectedClassId || students.length === 0) return;
    setSaving(true);

    try {
      const supabase = createClient();

      // Get teacher id
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('profile_id', profileId)
        .single();

      // Get academic year id
      const { data: term } = await supabase
        .from('terms')
        .select('academic_year_id')
        .eq('id', termId)
        .single();

      // Insert attendance record
      const { data: record, error: recErr } = await supabase
        .from('attendance_records')
        .insert({
          school_id: schoolId,
          class_id: selectedClassId,
          term_id: termId,
          academic_year_id: term?.academic_year_id,
          date: today,
          taken_by: teacher?.id,
        })
        .select()
        .single();

      if (recErr) throw recErr;

      // Insert all entries
      const entries = students.map((s) => ({
        attendance_record_id: record.id,
        student_id: s.student_id,
        school_id: schoolId,
        status: s.status,
        remarks: s.remarks || null,
      }));

      const { error: entryErr } = await supabase
        .from('attendance_entries')
        .insert(entries);

      if (entryErr) throw entryErr;

      toast.success('Attendance saved!', {
        description: `${students.length} students — ${summary.present ?? 0} present, ${summary.absent ?? 0} absent`,
      });

      router.push('/dashboard/attendance');
    } catch (err: any) {
      toast.error('Failed to save attendance', { description: err.message });
    } finally {
      setSaving(false);
    }
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-5">
      {/* Class selector */}
      <div className="bg-card border border-border rounded-xl p-5">
        <label className="block text-sm font-medium text-foreground mb-2">
          Select Class <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer"
        >
          <option value="">Choose a class to take attendance...</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.section ? ` (${c.section})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Attendance sheet */}
      {selectedClassId && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {selectedClass?.name} — {students.length} students
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">Mark all:</span>
              {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => {
                const cfg = STATUS_CONFIG[status];
                return (
                  <button
                    key={status}
                    onClick={() => handleMarkAll(status)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                      cfg.bg, cfg.color,
                      markAll === status ? `ring-2 ${cfg.ring}` : ''
                    )}
                  >
                    <cfg.icon className="h-3 w-3" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary bar */}
          {students.length > 0 && (
            <div className="flex gap-4 px-4 py-2.5 bg-muted/10 border-b border-border text-xs">
              {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => {
                const cfg = STATUS_CONFIG[status];
                const count = summary[status] ?? 0;
                return (
                  <span key={status} className={cn('flex items-center gap-1 font-medium', cfg.color)}>
                    <cfg.icon className="h-3 w-3" />
                    {count} {cfg.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Student list */}
          {loadingStudents ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading students...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Users className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No students in this class</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {students.map((student, idx) => {
                const statusCfg = STATUS_CONFIG[student.status];
                return (
                  <div
                    key={student.student_id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors',
                      student.status === 'absent' && 'bg-red-50/50 dark:bg-red-900/5'
                    )}
                  >
                    {/* Row number */}
                    <span className="text-xs text-muted-foreground w-5 flex-shrink-0">
                      {idx + 1}
                    </span>

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {student.first_name[0]}{student.last_name[0]}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{student.student_id_code}</p>
                    </div>

                    {/* Status buttons */}
                    <div className="flex items-center gap-1">
                      {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => {
                        const cfg = STATUS_CONFIG[status];
                        const isActive = student.status === status;
                        return (
                          <button
                            key={status}
                            onClick={() => updateStatus(student.student_id, status)}
                            title={cfg.label}
                            className={cn(
                              'p-1.5 rounded-lg transition-all',
                              isActive
                                ? `${cfg.bg} ${cfg.color} ring-1 ${cfg.ring}`
                                : 'text-muted-foreground hover:bg-accent'
                            )}
                          >
                            <cfg.icon className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>

                    {/* Current status badge */}
                    <span
                      className={cn(
                        'hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs font-medium w-16 justify-center',
                        statusCfg.bg, statusCfg.color
                      )}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Save button */}
          {students.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/10">
              <p className="text-sm text-muted-foreground">
                Date: <span className="font-medium text-foreground">{new Date().toLocaleDateString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Attendance
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
