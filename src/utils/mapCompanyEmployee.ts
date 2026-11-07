import type { Employee } from '@components/ui/EmployeeTable';
import type { CompanyEmployee } from '@/types/companyEmployee';

export const mapCompanyEmployeeToRow = (employee: CompanyEmployee): Employee => ({
  id: employee.id,
  name: employee.name,
  email: employee.email,
  assignedCourses: employee.assignedCourses,
  avatarUrl: employee.avatarUrl,
  status: employee.status.toLowerCase() as 'active' | 'pending' | 'inactive',
});
