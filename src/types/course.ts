export interface CourseSummary {
  id: string;
  title: string;
  category: string;
  level: string;
  description: string;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  durationHours: number;
  accessPeriod: string;
  price: string;
  instructor: {
    name: string;
    role: string;
  };
  benefits: string[];
}
