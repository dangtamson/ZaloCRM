import type { AxiosInstance } from 'axios';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { apiClient } from '../api/client';
import type { DepartmentNode, PermissionGroupNode, RbacMatrixMeta, RbacUser } from '../types/rbac';

type RbacApi = Pick<AxiosInstance, 'delete' | 'get' | 'patch' | 'post'>;

export interface RbacState {
  departments: DepartmentNode[];
  permissionGroups: PermissionGroupNode[];
  users: RbacUser[];
  matrixMeta: RbacMatrixMeta | null;
  loading: boolean;
  loadDepartments: () => Promise<void>;
  loadPermissionGroups: () => Promise<void>;
  loadUsers: (filter?: { departmentId?: string; permissionGroupId?: string; q?: string }) => Promise<void>;
}

export function createRbacStore(api: RbacApi = apiClient) {
  return createStore<RbacState>()((set) => ({
    departments: [],
    permissionGroups: [],
    users: [],
    matrixMeta: null,
    loading: false,
    loadDepartments: async () => {
      set({ loading: true });
      try {
        const { data } = await api.get<{ tree?: DepartmentNode[] }>('/departments');
        set({ departments: data.tree ?? [] });
      } finally {
        set({ loading: false });
      }
    },
    loadPermissionGroups: async () => {
      set({ loading: true });
      try {
        const [tree, meta] = await Promise.all([
          api.get<{ tree?: PermissionGroupNode[] }>('/permission-groups'),
          api.get<RbacMatrixMeta>('/permission-groups/meta'),
        ]);
        set({ permissionGroups: tree.data.tree ?? [], matrixMeta: meta.data });
      } finally {
        set({ loading: false });
      }
    },
    loadUsers: async (filter = {}) => {
      set({ loading: true });
      try {
        const params = new URLSearchParams();
        if (filter.departmentId) params.set('departmentId', filter.departmentId);
        if (filter.permissionGroupId) params.set('permissionGroupId', filter.permissionGroupId);
        if (filter.q) params.set('q', filter.q);
        const query = params.toString();
        const { data } = await api.get<{ users?: RbacUser[] }>(`/rbac/users${query ? `?${query}` : ''}`);
        set({ users: data.users ?? [] });
      } finally {
        set({ loading: false });
      }
    },
  }));
}

export const rbacStore = createRbacStore();

export function useRbacStore<T>(selector: (state: RbacState) => T): T {
  return useStore(rbacStore, selector);
}
