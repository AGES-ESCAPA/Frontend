export type EmployeeStatus = 'active' | 'pending' | 'inactive' | 'ACTIVE' | 'PENDING' | 'INACTIVE';

export interface Employee {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  assignedCoursesCount: number;
  status: EmployeeStatus;
}

export interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onResendInvite: (employee: Employee) => void;
  onUnlink: (employee: Employee) => void;
}
