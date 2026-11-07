export interface CompanySeats {
  seatsTotal: number;
  seatsUsed: number;
  seatsAvailable: number;
  employeesTotal: number;
  employeesActive: number;
}

export type CompanyEmployeeStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE';

export interface CompanyEmployee {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  status: CompanyEmployeeStatus;
  assignedCourses: number;
  avatarUrl: string | null;
}

export interface CompanyEmployeePage {
  content: CompanyEmployee[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}
