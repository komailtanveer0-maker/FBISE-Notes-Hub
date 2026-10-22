import { ClassLevel, Note, StudyGroup } from '../types/notes';

export const CLASS_CONFIG: Record<ClassLevel, {
  name: string;
  badge: string;
  description: string;
  defaultSubjects: string[];
}> = {
  '9th': {
    name: '9th Class (SSC Part I)',
    badge: 'SSC-I',
    description: 'Federal Board Secondary School Certificate Part 1 notes, solved questions, and SLO guides.',
    defaultSubjects: [
      'Physics',
      'Chemistry',
      'Biology',
      'Mathematics',
      'Computer Science',
      'English Compulsory',
      'Urdu Compulsory',
      'Islamiat Compulsory',
      'Pakistan Studies'
    ]
  },
  '10th': {
    name: '10th Class (SSC Part II)',
    badge: 'SSC-II',
    description: 'Federal Board Secondary School Certificate Part 2 notes, numericals, and board exam summaries.',
    defaultSubjects: [
      'Physics',
      'Chemistry',
      'Biology',
      'Mathematics',
      'Computer Science',
      'English Compulsory',
      'Urdu Compulsory',
      'Pakistan Studies',
      'Islamiat Compulsory'
    ]
  },
  '1st-year': {
    name: '1st Year (HSSC Part I - 11th)',
    badge: 'HSSC-I',
    description: 'Federal Board Higher Secondary School Certificate Part 1 comprehensive notes and derivations.',
    defaultSubjects: [
      'Physics',
      'Chemistry',
      'Biology',
      'Mathematics',
      'Computer Science',
      'English Compulsory',
      'Urdu Compulsory',
      'Islamic Education',
      'Principles of Accounting',
      'Economics'
    ]
  },
  '2nd-year': {
    name: '2nd Year (HSSC Part II - 12th)',
    badge: 'HSSC-II',
    description: 'Federal Board Higher Secondary School Certificate Part 2 final revision sheets and practicals.',
    defaultSubjects: [
      'Physics',
      'Chemistry',
      'Biology',
      'Mathematics',
      'Computer Science',
      'English Compulsory',
      'Urdu Compulsory',
      'Pakistan Studies',
      'Commercial Geography',
      'Statistics'
    ]
  }
};

export const STUDY_GROUPS: StudyGroup[] = [
  'All Groups',
  'Science (Pre-Medical)',
  'Science (Pre-Engineering)',
  'Computer Science (ICS)',
  'General Science',
  'Humanities & Arts'
];

export interface NoteFilterCriteria {
  searchQuery?: string;
  classLevel?: ClassLevel | 'all';
  subject?: string;
  sortBy?: 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'most-downloaded';
}

/**
 * Pure filter and search logic for FBISE notes.
 */
export function filterAndSortNotes(notes: Note[], criteria: NoteFilterCriteria): Note[] {
  let result = [...notes];

  // Filter by class
  if (criteria.classLevel && criteria.classLevel !== 'all') {
    result = result.filter(n => n.class_level === criteria.classLevel);
  }

  // Filter by subject
  if (criteria.subject && criteria.subject !== 'all' && criteria.subject.trim() !== '') {
    const sLower = criteria.subject.toLowerCase();
    result = result.filter(n => n.subject.toLowerCase() === sLower);
  }

  // Filter by search query
  if (criteria.searchQuery && criteria.searchQuery.trim() !== '') {
    const q = criteria.searchQuery.toLowerCase().trim();
    result = result.filter(n => {
      const titleMatch = n.title.toLowerCase().includes(q);
      const descMatch = n.description.toLowerCase().includes(q);
      const subjectMatch = n.subject.toLowerCase().includes(q);
      const chapterMatch = n.chapter?.toLowerCase().includes(q) ?? false;
      const tagMatch = n.tags?.some(tag => tag.toLowerCase().includes(q)) ?? false;
      return titleMatch || descMatch || subjectMatch || chapterMatch || tagMatch;
    });
  }

  // Sort notes
  const sortMode = criteria.sortBy || 'newest';
  result.sort((a, b) => {
    switch (sortMode) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      case 'most-downloaded':
        return (b.downloads_count || 0) - (a.downloads_count || 0);
      default:
        return 0;
    }
  });

  return result;
}

/**
 * Validates note submission fields before sending to server.
 */
export function validateNoteUpload(data: {
  title: string;
  description: string;
  class_level: string;
  subject: string;
  hasFile: boolean;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.title || data.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters long.';
  } else if (data.title.trim().length > 120) {
    errors.title = 'Title must not exceed 120 characters.';
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.description = 'Description must provide at least 10 characters detailing what this note covers.';
  }

  const validClasses: ClassLevel[] = ['9th', '10th', '1st-year', '2nd-year'];
  if (!data.class_level || !validClasses.includes(data.class_level as ClassLevel)) {
    errors.class_level = 'Please select a valid FBISE class.';
  }

  if (!data.subject || data.subject.trim().length < 2) {
    errors.subject = 'Please select or enter a subject.';
  }

  if (!data.hasFile) {
    errors.file = 'Please choose a study file (PDF or document) to upload.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Format bytes into readable string (KB, MB).
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
