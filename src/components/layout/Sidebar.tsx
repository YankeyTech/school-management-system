'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import type { Profile } from '@/types';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  DollarSign,
  Library,
  Building2,
  Bus,
  MessageSquare,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  School,
  Bell,
  ChevronDown,
  Clock,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  badge?: string;
  children?: NavItem[];
}

const NAV_SECTIONS: { section: string; items: NavItem[] }[] = [
  {
    section: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard/home',
        icon: LayoutDashboard,
        roles: ['super_admin', 'school_admin', 'teacher', 'parent', 'student'],
      },
      {
        label: 'Announcements',
        href: '/dashboard/announcements',
        icon: Bell,
        roles: ['super_admin', 'school_admin', 'teacher', 'parent', 'student'],
      },
    ],
  },
  {
    section: 'People',
    items: [
      {
        label: 'Students',
        href: '/dashboard/students',
        icon: Users,
        roles: ['super_admin', 'school_admin', 'teacher'],
      },
      {
        label: 'Teachers',
        href: '/dashboard/teachers',
        icon: GraduationCap,
        roles: ['super_admin', 'school_admin'],
      },
      {
        label: 'Parents',
        href: '/dashboard/parents',
        icon: UserCheck,
        roles: ['super_admin', 'school_admin'],
      },
    ],
  },
  {
    section: 'Academic',
    items: [
      {
        label: 'Classes',
        href: '/dashboard/classes',
        icon: School,
        roles: ['super_admin', 'school_admin', 'teacher'],
      },
      {
        label: 'Subjects',
        href: '/dashboard/subjects',
        icon: BookOpen,
        roles: ['super_admin', 'school_admin'],
      },
      {
        label: 'Timetable',
        href: '/dashboard/timetable',
        icon: Clock,
        roles: ['super_admin', 'school_admin', 'teacher', 'student'],
      },
      {
        label: 'Attendance',
        href: '/dashboard/attendance',
        icon: CalendarDays,
        roles: ['super_admin', 'school_admin', 'teacher'],
      },
    ],
  },
  {
    section: 'Assessments',
    items: [
      {
        label: 'Exams',
        href: '/dashboard/exams',
        icon: FileText,
        roles: ['super_admin', 'school_admin', 'teacher', 'student'],
      },
      {
        label: 'Assignments',
        href: '/dashboard/assignments',
        icon: ClipboardList,
        roles: ['super_admin', 'school_admin', 'teacher', 'student'],
      },
      {
        label: 'Results',
        href: '/dashboard/results',
        icon: BarChart3,
        roles: ['super_admin', 'school_admin', 'teacher', 'parent', 'student'],
      },
    ],
  },
  {
    section: 'Finance',
    items: [
      {
        label: 'Finance',
        href: '/dashboard/finance',
        icon: DollarSign,
        roles: ['super_admin', 'school_admin'],
      },
    ],
  },
  {
    section: 'Resources',
    items: [
      {
        label: 'Library',
        href: '/dashboard/library',
        icon: Library,
        roles: ['super_admin', 'school_admin', 'teacher', 'student'],
      },
      {
        label: 'Hostel',
        href: '/dashboard/hostel',
        icon: Building2,
        roles: ['super_admin', 'school_admin'],
      },
      {
        label: 'Transport',
        href: '/dashboard/transport',
        icon: Bus,
        roles: ['super_admin', 'school_admin'],
      },
    ],
  },
  {
    section: 'Tools',
    items: [
      {
        label: 'Messages',
        href: '/dashboard/messages',
        icon: MessageSquare,
        roles: ['super_admin', 'school_admin', 'teacher', 'parent', 'student'],
      },
      {
        label: 'Reports',
        href: '/dashboard/reports',
        icon: BarChart3,
        roles: ['super_admin', 'school_admin'],
      },
      {
        label: 'AI Assistant',
        href: '/dashboard/ai-assistant',
        icon: Sparkles,
        roles: ['super_admin', 'school_admin', 'teacher', 'student'],
      },
      {
        label: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        roles: ['super_admin', 'school_admin'],
      },
    ],
  },
];

interface SidebarProps {
  profile: Profile & { schools?: { name: string; logo_url?: string } | null };
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      item.roles.includes(profile.role)
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-card border-r border-border h-full z-50 transition-all duration-300',
          'fixed lg:relative',
          sidebarCollapsed ? 'w-[72px]' : 'w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-[64px] border-b border-border flex-shrink-0">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-foreground text-sm">EduCore</span>
              <span className="text-xs text-muted-foreground truncate">
                {profile.schools?.name ?? 'Super Admin'}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {filteredSections.map((section) => (
            <div key={section.section}>
              {!sidebarCollapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 px-3 mb-2">
                  {section.section}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={cn(
                        'nav-item group',
                        isActive && 'active',
                        sidebarCollapsed && 'justify-center px-0'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'nav-item-icon',
                          isActive
                            ? 'text-primary-foreground'
                            : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      />
                      {!sidebarCollapsed && (
                        <span className="flex-1">{item.label}</span>
                      )}
                      {!sidebarCollapsed && item.badge && (
                        <span className="ml-auto bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full font-medium">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse button */}
        <div className="px-3 py-4 border-t border-border">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="nav-item w-full justify-center"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            {!sidebarCollapsed && (
              <span className="text-xs">Collapse</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
