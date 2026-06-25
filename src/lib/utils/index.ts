import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'GHS'): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function getGradeColor(grade: string): string {
  const excellent = ['A1', 'A', 'A+'];
  const good = ['B2', 'B3', 'B', 'B+', 'B-'];
  const average = ['C4', 'C5', 'C6', 'C', 'C+', 'C-'];
  const pass = ['D7', 'E8', 'D', 'E'];

  if (excellent.includes(grade)) return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (good.includes(grade)) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
  if (average.includes(grade)) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
  if (pass.includes(grade)) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
  return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
}

export function getPercentageColor(pct: number): string {
  if (pct >= 80) return 'text-emerald-600';
  if (pct >= 65) return 'text-blue-600';
  if (pct >= 50) return 'text-amber-600';
  if (pct >= 40) return 'text-orange-600';
  return 'text-red-600';
}

export function getAttendanceColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-600';
  if (pct >= 75) return 'text-amber-600';
  return 'text-red-600';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .trim();
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function generateStudentId(schoolCode: string, seq: number): string {
  return `${schoolCode}-STU-${String(seq).padStart(5, '0')}`;
}

export function generateReceiptNumber(schoolCode: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${schoolCode}-RCT-${dateStr}-${rand}`;
}

export function generateInvoiceNumber(schoolCode: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${schoolCode}-INV-${dateStr}-${rand}`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function bytesToSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
