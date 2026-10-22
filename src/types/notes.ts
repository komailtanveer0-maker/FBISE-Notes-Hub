export type ClassLevel = '9th' | '10th' | '1st-year' | '2nd-year';

export type StudyGroup = 
  | 'Science (Pre-Medical)'
  | 'Science (Pre-Engineering)'
  | 'Computer Science (ICS)'
  | 'General Science'
  | 'Humanities & Arts'
  | 'All Groups';

export interface Note {
  id: string;
  title: string;
  description: string;
  class_level: ClassLevel;
  subject: string;
  study_group?: StudyGroup;
  chapter?: string;
  tags: string[];
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  teacher_id: string;
  teacher_name?: string;
  published: boolean;
  downloads_count: number;
  is_demo?: boolean;
}

export interface TeacherSession {
  token: string;
  teacherId: string;
  name: string;
  role: 'teacher' | 'admin';
  expiresAt: number;
}

export interface PublicResource {
  id: string;
  title: string;
  organization: string;
  category: 'Past Papers' | 'Model Papers' | 'Curriculum & SLOs' | 'Official Textbooks' | 'Exam Guidelines';
  class_levels: ClassLevel[];
  subjects: string[];
  url: string;
  description: string;
  isOfficial: boolean;
}

export interface DashboardStats {
  totalNotes: number;
  notesByClass: Record<ClassLevel, number>;
  totalDownloads: number;
  storageUsedBytes: number;
  recentNotes: Note[];
}
