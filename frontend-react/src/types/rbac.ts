export interface DepartmentNode {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  depth: number;
  displayOrder: number;
  archivedAt: string | null;
  memberCount: number;
  leaderUserId: string | null;
  deputyUserId: string | null;
  children: DepartmentNode[];
}

export interface PermissionGroupNode {
  id: string;
  name: string;
  parentId: string | null;
  isSystem: boolean;
  displayOrder: number;
  grants: Record<string, Record<string, boolean>>;
  memberCount: number;
  children: PermissionGroupNode[];
}

export interface RbacUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissionGroupId: string | null;
  permissionGroup: { id: string; name: string; isSystem: boolean } | null;
  departmentMember: {
    departmentId: string;
    deptRole: 'leader' | 'deputy' | 'member';
    department: { id: string; name: string; path: string };
  } | null;
  isActive: boolean;
}

export interface RbacMatrixMeta {
  resources: string[];
  actions: string[];
  resourceActions: Record<string, string[]>;
}
