import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAndSortNotes, validateNoteUpload, formatBytes, CLASS_CONFIG } from './notes-logic.ts';
import { Note } from '../types/notes.ts';

const mockNotes: Note[] = [
  {
    id: 'note-1',
    title: 'Kinematics Formulas and Solved Numerical Problems',
    description: 'Comprehensive derivation of equations of motion with FBISE SLO examples.',
    class_level: '9th',
    subject: 'Physics',
    chapter: 'Chapter 2',
    tags: ['motion', 'velocity', 'acceleration'],
    file_path: '/uploads/sample1.pdf',
    file_name: 'physics_kinematics.pdf',
    file_type: 'application/pdf',
    file_size: 1048576, // 1MB
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
    teacher_id: 'teacher-1',
    teacher_name: 'Prof. Ahmad',
    published: true,
    downloads_count: 120
  },
  {
    id: 'note-2',
    title: 'Periodic Table Trends and Atomic Radii',
    description: 'Detailed study of electronegativity and ionization energy.',
    class_level: '9th',
    subject: 'Chemistry',
    chapter: 'Chapter 3',
    tags: ['elements', 'groups', 'periods'],
    file_path: '/uploads/sample2.pdf',
    file_name: 'chemistry_periodic_table.pdf',
    file_type: 'application/pdf',
    file_size: 2097152, // 2MB
    created_at: '2026-03-05T12:00:00Z',
    updated_at: '2026-03-05T12:00:00Z',
    teacher_id: 'teacher-2',
    teacher_name: 'Dr. Fatima',
    published: true,
    downloads_count: 85
  },
  {
    id: 'note-3',
    title: 'Quadratic Equations Board Questions Review',
    description: 'Past 10 years FBISE board questions solved step by step.',
    class_level: '10th',
    subject: 'Mathematics',
    chapter: 'Unit 2',
    tags: ['roots', 'discriminant', 'quadratics'],
    file_path: '/uploads/sample3.pdf',
    file_name: 'maths_quadratics.pdf',
    file_type: 'application/pdf',
    file_size: 512000,
    created_at: '2026-03-10T14:00:00Z',
    updated_at: '2026-03-10T14:00:00Z',
    teacher_id: 'teacher-1',
    teacher_name: 'Prof. Ahmad',
    published: true,
    downloads_count: 240
  }
];

test('filterAndSortNotes filters by classLevel', () => {
  const result9th = filterAndSortNotes(mockNotes, { classLevel: '9th' });
  assert.equal(result9th.length, 2);
  assert.ok(result9th.every(n => n.class_level === '9th'));

  const result10th = filterAndSortNotes(mockNotes, { classLevel: '10th' });
  assert.equal(result10th.length, 1);
  assert.equal(result10th[0].id, 'note-3');
});

test('filterAndSortNotes filters by subject case-insensitively', () => {
  const result = filterAndSortNotes(mockNotes, { subject: 'physics' });
  assert.equal(result.length, 1);
  assert.equal(result[0].subject, 'Physics');
});

test('filterAndSortNotes searches in title, description, chapter, and tags', () => {
  // Query matching tag 'acceleration'
  const tagSearch = filterAndSortNotes(mockNotes, { searchQuery: 'acceleration' });
  assert.equal(tagSearch.length, 1);
  assert.equal(tagSearch[0].id, 'note-1');

  // Query matching chapter 'Unit 2'
  const chapterSearch = filterAndSortNotes(mockNotes, { searchQuery: 'unit 2' });
  assert.equal(chapterSearch.length, 1);
  assert.equal(chapterSearch[0].id, 'note-3');

  // Query matching title keyword
  const titleSearch = filterAndSortNotes(mockNotes, { searchQuery: 'periodic' });
  assert.equal(titleSearch.length, 1);
  assert.equal(titleSearch[0].id, 'note-2');
});

test('filterAndSortNotes sorts by newest, title, and most-downloaded', () => {
  const newest = filterAndSortNotes(mockNotes, { sortBy: 'newest' });
  assert.equal(newest[0].id, 'note-3'); // 2026-03-10
  assert.equal(newest[2].id, 'note-1'); // 2026-03-01

  const mostDownloaded = filterAndSortNotes(mockNotes, { sortBy: 'most-downloaded' });
  assert.equal(mostDownloaded[0].id, 'note-3'); // 240 downloads
  assert.equal(mostDownloaded[1].id, 'note-1'); // 120 downloads
  assert.equal(mostDownloaded[2].id, 'note-2'); // 85 downloads

  const titleAsc = filterAndSortNotes(mockNotes, { sortBy: 'title-asc' });
  assert.equal(titleAsc[0].title.startsWith('Kinematics'), true);
});

test('validateNoteUpload validates required fields properly', () => {
  // Valid payload
  const valid = validateNoteUpload({
    title: 'Electromagnetic Induction Formulas',
    description: 'Detailed derivations for Faraday and Lenz laws.',
    class_level: '2nd-year',
    subject: 'Physics',
    hasFile: true
  });
  assert.equal(valid.isValid, true);
  assert.equal(Object.keys(valid.errors).length, 0);

  // Missing file and short title
  const invalid = validateNoteUpload({
    title: 'No',
    description: 'Too short',
    class_level: 'invalid-class',
    subject: '',
    hasFile: false
  });
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.title);
  assert.ok(invalid.errors.description);
  assert.ok(invalid.errors.class_level);
  assert.ok(invalid.errors.subject);
  assert.ok(invalid.errors.file);
});

test('formatBytes formats numbers into KB and MB properly', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1048576), '1 MB');
  assert.equal(formatBytes(2621440), '2.5 MB');
});

test('CLASS_CONFIG has all four federal board classes defined', () => {
  assert.ok(CLASS_CONFIG['9th']);
  assert.ok(CLASS_CONFIG['10th']);
  assert.ok(CLASS_CONFIG['1st-year']);
  assert.ok(CLASS_CONFIG['2nd-year']);
});
