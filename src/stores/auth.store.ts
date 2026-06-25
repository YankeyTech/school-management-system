import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, Profile, School } from '@/types';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  updateProfile: (profile: Partial<Profile>) => void;
  updateSchool: (school: Partial<School>) => void;
  clearUser: () => void;
  
  // Computed helpers
  isAuthenticated: () => boolean;
  isSuperAdmin: () => boolean;
  isSchoolAdmin: () => boolean;
  isTeacher: () => boolean;
  isParent: () => boolean;
  isStudent: () => boolean;
  hasRole: (roles: string[]) => boolean;
  canManageStudents: () => boolean;
  canManageFinance: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isInitialized: false,

      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      
      updateProfile: (profileUpdate) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                profile: { ...state.user.profile, ...profileUpdate },
              }
            : null,
        })),
        
      updateSchool: (schoolUpdate) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                school: state.user.school
                  ? { ...state.user.school, ...schoolUpdate }
                  : undefined,
              }
            : null,
        })),
        
      clearUser: () => set({ user: null }),

      // Computed
      isAuthenticated: () => !!get().user,
      isSuperAdmin: () => get().user?.profile.role === 'super_admin',
      isSchoolAdmin: () => get().user?.profile.role === 'school_admin',
      isTeacher: () => get().user?.profile.role === 'teacher',
      isParent: () => get().user?.profile.role === 'parent',
      isStudent: () => get().user?.profile.role === 'student',
      
      hasRole: (roles) => {
        const role = get().user?.profile.role;
        return role ? roles.includes(role) : false;
      },
      
      canManageStudents: () =>
        get().hasRole(['super_admin', 'school_admin', 'teacher']),
        
      canManageFinance: () =>
        get().hasRole(['super_admin', 'school_admin']),
    }),
    {
      name: 'educore-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
