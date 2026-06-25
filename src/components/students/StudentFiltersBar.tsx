'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

interface Class {
  id: string;
  name: string;
  section?: string;
}

interface StudentFiltersBarProps {
  classes: Class[];
  currentFilters: {
    search?: string;
    class_id?: string;
    gender?: string;
    is_active?: string;
    is_boarding?: string;
  };
}

export function StudentFiltersBar({ classes, currentFilters }: StudentFiltersBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentFilters.search ?? '');

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page');
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = () => {
    setSearch('');
    router.push('?');
  };

  const hasFilters = Object.values(currentFilters).some(Boolean);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateFilter('search', search || undefined);
          }}
          onBlur={() => updateFilter('search', search || undefined)}
          placeholder="Search by name, ID, or admission number..."
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                     placeholder:text-muted-foreground transition-all"
        />
      </div>

      {/* Class filter */}
      <select
        value={currentFilters.class_id ?? ''}
        onChange={(e) => updateFilter('class_id', e.target.value || undefined)}
        className="px-3 py-2.5 text-sm bg-card border border-border rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-ring
                   text-foreground cursor-pointer min-w-[140px]"
      >
        <option value="">All Classes</option>
        {classes.map((cls) => (
          <option key={cls.id} value={cls.id}>
            {cls.name}{cls.section ? ` ${cls.section}` : ''}
          </option>
        ))}
      </select>

      {/* Gender filter */}
      <select
        value={currentFilters.gender ?? ''}
        onChange={(e) => updateFilter('gender', e.target.value || undefined)}
        className="px-3 py-2.5 text-sm bg-card border border-border rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-ring
                   text-foreground cursor-pointer min-w-[120px]"
      >
        <option value="">All Genders</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>

      {/* Status filter */}
      <select
        value={currentFilters.is_active ?? ''}
        onChange={(e) => updateFilter('is_active', e.target.value || undefined)}
        className="px-3 py-2.5 text-sm bg-card border border-border rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-ring
                   text-foreground cursor-pointer min-w-[120px]"
      >
        <option value="">All Status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>

      {/* Boarding filter */}
      <select
        value={currentFilters.is_boarding ?? ''}
        onChange={(e) => updateFilter('is_boarding', e.target.value || undefined)}
        className="px-3 py-2.5 text-sm bg-card border border-border rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-ring
                   text-foreground cursor-pointer min-w-[130px]"
      >
        <option value="">All Students</option>
        <option value="true">Boarding</option>
        <option value="false">Day Students</option>
      </select>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-muted-foreground
                     hover:text-foreground hover:bg-accent border border-border rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      )}
    </div>
  );
}
