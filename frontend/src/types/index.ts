export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface Resume {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  processedAt?: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
}

export interface Skill {
  name: string;
  category: string;
  proficiency: number;
  yearsExperience?: number;
}

export interface CareerPath {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  averageSalary: number;
  growthRate: number;
  matchScore: number;
}

export interface SkillGap {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  importance: 'high' | 'medium' | 'low';
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  price: number;
  url: string;
  skills: string[];
}

export interface Recommendation {
  careerPaths: CareerPath[];
  skillGaps: SkillGap[];
  courses: Course[];
}

export interface ResumeAnalysis {
  skills: Skill[];
  experience: {
    years: number;
    level: string;
  };
  education: {
    degree: string;
    field: string;
    institution: string;
  }[];
  recommendations: Recommendation;
}
