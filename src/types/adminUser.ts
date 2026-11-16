export interface AdminUser {
  id: string;
  name: string;
  email: string;
  userType: string;
  status?: string | null;
  createdAt: string;
}
