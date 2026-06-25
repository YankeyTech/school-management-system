'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  admission_date: string;
  gender: string;
  is_active: boolean;
  is_boarding: boolean;
  avatar_url?: string;
  classes?: { id: string; name: string; section?: string } | null;
  guardians?: Array<{
    first_name: string;
    last_name: string;
    phone: string;
    is_primary: boolean;
  }>;
}

interface StudentsTableProps {
  students: Student[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  canManage: boolean;
}

export function StudentsTable({
  students,
  totalCount,
  currentPage,
  totalPages,
  canManage,
}: StudentsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const columns = useMemo<ColumnDef<Student>[]>(
    () => [
      {
        id: 'student',
        header: 'Student',
        cell: ({ row }) => {
          const s = row.original;
          const initials = `${s.first_name[0]}${s.last_name[0]}`;
          return (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold">
                {initials}
              </div>
              <div>
                <Link
                  href={`/dashboard/students/${s.id}`}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {s.first_name} {s.last_name}
                </Link>
                <p className="text-xs text-muted-foreground">{s.student_id}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'admission_number',
        header: 'Admission No.',
        cell: ({ getValue }) => (
          <span className="text-sm font-mono text-muted-foreground">
            {getValue() as string}
          </span>
        ),
      },
      {
        id: 'class',
        header: 'Class',
        cell: ({ row }) => {
          const cls = row.original.classes;
          return cls ? (
            <span className="text-sm text-foreground">
              {cls.name}{cls.section ? ` ${cls.section}` : ''}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">Unassigned</span>
          );
        },
      },
      {
        accessorKey: 'gender',
        header: 'Gender',
        cell: ({ getValue }) => (
          <span className="text-sm capitalize text-foreground">
            {getValue() as string}
          </span>
        ),
      },
      {
        id: 'guardian',
        header: 'Guardian',
        cell: ({ row }) => {
          const primary = row.original.guardians?.find((g) => g.is_primary);
          return primary ? (
            <div>
              <p className="text-sm text-foreground">
                {primary.first_name} {primary.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{primary.phone}</p>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">Not set</span>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex flex-col gap-1">
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit',
                  s.is_active ? 'badge-active' : 'badge-inactive'
                )}
              >
                {s.is_active ? 'Active' : 'Inactive'}
              </span>
              {s.is_boarding && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                  Boarding
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link
                href={`/dashboard/students/${s.id}`}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                title="View"
              >
                <Eye className="h-3.5 w-3.5" />
              </Link>
              {canManage && (
                <>
                  <Link
                    href={`/dashboard/students/${s.id}/edit`}
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [canManage]
  );

  const table = useReactTable({
    data: students,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="data-table-container">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border bg-muted/30">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <User className="h-8 w-8 text-muted-foreground/40" />
                    <p>No students found</p>
                    <p className="text-xs">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-medium text-foreground">
            {(currentPage - 1) * 20 + 1}–{Math.min(currentPage * 20, totalCount)}
          </span>{' '}
          of{' '}
          <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span>{' '}
          students
        </p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={cn(
                  'w-8 h-8 rounded-md text-sm font-medium transition-colors',
                  currentPage === pageNum
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent border border-border'
                )}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
