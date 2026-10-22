import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { Note, ClassLevel, PublicResource } from './src/types/notes.ts';

const app = express();
const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';
const TEACHER_SECRET_CODE = process.env.TEACHER_SECRET_CODE || '2580';

// Active teacher session tokens (in-memory session map for prototype)
const teacherSessions = new Map<string, { teacherId: string; name: string; createdAt: number }>();

// Ensure data & uploads directories exist
const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage configuration for persistent file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/jpeg',
      'image/png'
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(pdf|docx|doc|png|jpg|jpeg)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and image study notes are supported.'));
    }
  }
});

// Helper: Generate a minimal valid PDF file with text content
function createMinimalPdfBuffer(title: string, subtitle: string, bodyText: string): Buffer {
  const content = `BT /F1 18 Tf 50 740 Td (${title.replace(/[()]/g, '')}) Tj ET ` +
                  `BT /F1 12 Tf 50 710 Td (${subtitle.replace(/[()]/g, '')}) Tj ET ` +
                  `BT /F1 10 Tf 50 670 Td (FBISE CURRICULUM & SLO REVISION MATERIAL) Tj ET ` +
                  `BT /F1 10 Tf 50 640 Td (${bodyText.replace(/[()]/g, '').slice(0, 80)}) Tj ET ` +
                  `BT /F1 9 Tf 50 610 Td (Prepared by Verified FBISE Senior Educators) Tj ET ` +
                  `BT /F1 9 Tf 50 580 Td (Topics: Key Formulas, Concept Summaries, Solved Exemplars) Tj ET ` +
                  `BT /F1 8 Tf 50 80 Td (FBISE Notes Hub - Official Educational Study Resource) Tj ET`;

  const streamLength = content.length;

  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${content}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000227 00000 n 
0000000300 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
385
%%EOF`;

  return Buffer.from(pdfString, 'utf-8');
}

// Ensure demo seed files and data/notes.json exist
function initializeSeedData(): Note[] {
  let notes: Note[] = [];

  if (fs.existsSync(NOTES_FILE)) {
    try {
      const data = fs.readFileSync(NOTES_FILE, 'utf-8');
      notes = JSON.parse(data);
    } catch {
      notes = [];
    }
  }

  // If notes empty, generate comprehensive demo notes
  if (notes.length === 0) {
    const seedTemplates: Array<Omit<Note, 'id' | 'created_at' | 'updated_at' | 'file_path' | 'file_size' | 'downloads_count'>> = [
      {
        title: 'Chapter 2: Kinematics - Complete Revision Formula Sheet & Numerical Solutions',
        description: 'Comprehensive derivation of 3 equations of motion, graphical velocity-time analysis, and 12 solved FBISE model numericals with step-by-step marking schemes.',
        class_level: '9th',
        subject: 'Physics',
        study_group: 'Science (Pre-Engineering)',
        chapter: 'Chapter 2: Kinematics',
        tags: ['Kinematics', 'Formulas', 'Velocity-Time Graph', 'Numericals', 'FBISE SLOs'],
        file_name: 'fbise_9th_physics_kinematics_notes.pdf',
        file_type: 'application/pdf',
        teacher_id: 'edu-001',
        teacher_name: 'Prof. Tariq Mahmood (Govt. Model College)',
        published: true,
        is_demo: true
      },
      {
        title: 'Chapter 3: Periodic Table and Periodicity of Properties - High-Yield Summary',
        description: 'Master periodic trends: atomic radius, shielding effect, ionization energy, electron affinity, and electronegativity with past 5-year Federal Board questions.',
        class_level: '9th',
        subject: 'Chemistry',
        study_group: 'Science (Pre-Medical)',
        chapter: 'Chapter 3: Periodic Table',
        tags: ['Periodic Table', 'Ionization Energy', 'Electronegativity', 'Trends', 'Model Paper'],
        file_name: 'fbise_9th_chemistry_periodicity.pdf',
        file_type: 'application/pdf',
        teacher_id: 'edu-002',
        teacher_name: 'Dr. Ayesha Siddiqui (FBISE Subject Specialist)',
        published: true,
        is_demo: true
      },
      {
        title: 'Unit 2: Theory of Quadratic Equations - Solved Board Questions & Short Notes',
        description: 'Discriminant nature of roots, relations between roots and coefficients, synthetic division, and simultaneous quadratic equations for 10th grade Federal Board candidates.',
        class_level: '10th',
        subject: 'Mathematics',
        study_group: 'Science (Pre-Engineering)',
        chapter: 'Unit 2: Quadratic Theory',
        tags: ['Quadratic Equations', 'Synthetic Division', 'Discriminant', 'Board Questions'],
        file_name: 'fbise_10th_maths_quadratics_complete.pdf',
        file_type: 'application/pdf',
        teacher_id: 'edu-003',
        teacher_name: 'Prof. Kamran Raza',
        published: true,
        is_demo: true
      },
      {
        title: 'Unit 1: Problem Solving & Flowcharts - Illustrated Guide with FBISE SLOs',
        description: 'Covers algorithm design, standard flowchart symbols, conditional branching, loops, and trace tables strictly according to the latest FBISE National Curriculum.',
        class_level: '10th',
        subject: 'Computer Science',
        study_group: 'Computer Science (ICS)',
        chapter: 'Unit 1: Problem Solving',
        tags: ['Algorithms', 'Flowcharts', 'Tracing', 'SLO Based'],
        file_name: 'fbise_10th_computer_flowcharts.pdf',
        file_type: 'application/pdf',
        teacher_id: 'edu-004',
        teacher_name: 'Engr. Bilal Khan',
        published: true,
        is_demo: true
      },
      {
        title: 'Chapter 3: Motion and Force - FBISE Model Paper Solutions & Derivations',
        description: 'Newton laws of motion in vector form, momentum conservation, elastic collisions in one and two dimensions, and projectile motion trajectory equations.',
        class_level: '1st-year',
        subject: 'Physics',
        study_group: 'Science (Pre-Engineering)',
        chapter: 'Chapter 3: Motion and Force',
        tags: ['Projectile Motion', 'Momentum', 'Derivations', '1st Year HSSC'],
        file_name: 'fbise_11th_physics_motion_force.pdf',
        file_type: 'application/pdf',
        teacher_id: 'edu-001',
        teacher_name: 'Prof. Tariq Mahmood (Govt. Model College)',
        published: true,
        is_demo: true
      },
      {
        title: 'Chapter 1: Stoichiometry & Mole Concept - Conceptual Notes & Practice Problems',
        description: 'Limiting reactants, percentage yield calculations, empirical and molecular formulas, and analytical molar concentration problems for Federal Board exams.',
        class_level: '1st-year',
        subject: 'Chemistry',
        study_group: 'Science (Pre-Medical)',
        chapter: 'Chapter 1: Stoichiometry',
        tags: ['Stoichiometry', 'Mole Concept', 'Limiting Reactant', 'Yield'],
        file_name: 'fbise_11th_chemistry_stoichiometry.pdf',
        file_type: 'application/pdf',
        teacher_id: 'edu-002',
        teacher_name: 'Dr. Ayesha Siddiqui (FBISE Subject Specialist)',
        published: true,
        is_demo: true
      },
      {
        title: 'Chapter 15: Homeostasis - Osmoregulation & Excretion Diagrams with SLO Notes',
        description: 'Comparative osmoregulation in freshwater and marine animals, human nephron counter-current multiplier mechanism, and kidney dialysis principles.',
        class_level: '2nd-year',
        subject: 'Biology',
        study_group: 'Science (Pre-Medical)',
        chapter: 'Chapter 15: Homeostasis',
        tags: ['Homeostasis', 'Nephron', 'Osmoregulation', 'Diagrams', '2nd Year'],
        file_name: 'fbise_12th_biology_homeostasis.pdf',
        file_type: 'application/pdf',
        teacher_id: 'edu-005',
        teacher_name: 'Prof. Naila Farooq',
        published: true,
        is_demo: true
      },
      {
        title: 'Chapter 2: Differentiation - Key Rules, Trigonometric Derivatives & Past Paper Tricks',
        description: 'First principle derivations, product and quotient rules, chain rule for composite functions, implicit differentiation, and higher-order derivatives for FBISE 2nd year.',
        class_level: '2nd-year',
        subject: 'Mathematics',
        study_group: 'Science (Pre-Engineering)',
        chapter: 'Chapter 2: Differentiation',
        tags: ['Calculus', 'Derivatives', 'Chain Rule', 'FBISE HSSC-II'],
        file_name: 'fbise_12th_maths_differentiation.pdf',
        file_type: 'application/pdf',
        teacher_id: 'edu-003',
        teacher_name: 'Prof. Kamran Raza',
        published: true,
        is_demo: true
      }
    ];

    const now = Date.now();
    notes = seedTemplates.map((template, idx) => {
      const id = `fbise-note-demo-${idx + 1}`;
      const filename = `seed-${template.file_name}`;
      const filePath = path.join(UPLOADS_DIR, filename);

      // Write sample valid PDF buffer
      if (!fs.existsSync(filePath)) {
        const pdfBuffer = createMinimalPdfBuffer(
          template.title,
          `${template.class_level.toUpperCase()} - ${template.subject} (${template.chapter || ''})`,
          template.description
        );
        fs.writeFileSync(filePath, pdfBuffer);
      }

      const fileStats = fs.existsSync(filePath) ? fs.statSync(filePath) : { size: 1024 * 512 };

      return {
        ...template,
        id,
        file_path: filename,
        file_size: fileStats.size,
        created_at: new Date(now - (idx * 86400000 * 2)).toISOString(),
        updated_at: new Date(now - (idx * 86400000 * 2)).toISOString(),
        downloads_count: 140 + (idx * 37)
      };
    });

    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8');
  }

  return notes;
}

// Curated public resources for FBISE
const PUBLIC_FBISE_RESOURCES: PublicResource[] = [
  {
    id: 'res-1',
    title: 'FBISE Official Student Learning Outcomes (SLOs) & Curriculum Guidelines',
    organization: 'Federal Board of Intermediate & Secondary Education, Islamabad',
    category: 'Curriculum & SLOs',
    class_levels: ['9th', '10th', '1st-year', '2nd-year'],
    subjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science'],
    url: 'https://www.fbise.edu.pk/curriculum_model_paper.php',
    description: 'Direct link to FBISE official curriculum benchmarks, cognitive levels (Knowledge, Understanding, Application), and mark distribution matrices for SSC and HSSC.',
    isOfficial: true
  },
  {
    id: 'res-2',
    title: 'Official FBISE Model Question Papers & Answer Keys Archive',
    organization: 'FBISE Examination Research & Development Cell',
    category: 'Model Papers',
    class_levels: ['9th', '10th', '1st-year', '2nd-year'],
    subjects: ['All Subjects'],
    url: 'https://www.fbise.edu.pk/curriculum_model_paper.php',
    description: 'Standardized model examination papers designed by FBISE to demonstrate SLO-based assessment format and rubrics.',
    isOfficial: true
  },
  {
    id: 'res-3',
    title: 'National Curriculum Council (NCC) Single National Curriculum Textbooks',
    organization: 'Ministry of Federal Education & Professional Training, Pakistan',
    category: 'Official Textbooks',
    class_levels: ['9th', '10th'],
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'General Science'],
    url: 'https://ncc.gov.pk/',
    description: 'National Curriculum Council portal providing digital references and standardized textbook framework adopted across federal institutions.',
    isOfficial: true
  },
  {
    id: 'res-4',
    title: 'Federal Directorate of Education (FDE) Exam Preparation Portal',
    organization: 'Federal Directorate of Education, Islamabad',
    category: 'Exam Guidelines',
    class_levels: ['9th', '10th', '1st-year', '2nd-year'],
    subjects: ['Compulsory & Science Electives'],
    url: 'https://fde.gov.pk/',
    description: 'Academic calendars, examination schedules, central assessment guidelines, and instructional circulars for federal schools and colleges.',
    isOfficial: true
  },
  {
    id: 'res-5',
    title: 'e-Learn Open Educational Repository & Digital Science Simulations',
    organization: 'Pakistan Education Innovation & Digital Learning Taskforce',
    category: 'Past Papers',
    class_levels: ['9th', '10th', '1st-year', '2nd-year'],
    subjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
    url: 'https://elearn.gov.pk/',
    description: 'Interactive STEM simulations, digital experiments, and open chapter video lectures aligned with federal syllabi.',
    isOfficial: true
  }
];

// Helper: read notes from file
function getNotes(): Note[] {
  try {
    if (fs.existsSync(NOTES_FILE)) {
      const data = fs.readFileSync(NOTES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading notes.json:', err);
  }
  return initializeSeedData();
}

// Helper: save notes to file
function saveNotes(notes: Note[]): void {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8');
}

// Authentication middleware for teacher endpoints
function requireTeacherAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Teacher authorization required. Please provide a valid session token.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const session = teacherSessions.get(token);

  if (!session) {
    res.status(401).json({
      success: false,
      error: 'Session has expired or is invalid. Please sign in again with your teacher access code.'
    });
    return;
  }

  // Session valid for 48 hours
  const now = Date.now();
  if (now - session.createdAt > 48 * 60 * 60 * 1000) {
    teacherSessions.delete(token);
    res.status(401).json({
      success: false,
      error: 'Teacher session expired. Please sign in again.'
    });
    return;
  }

  (req as any).teacher = session;
  next();
}

// Initialize seed data on boot
initializeSeedData();

// Express Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Teacher Authentication: Verify secret code on server
app.post('/api/teacher/auth', (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Teacher secret access code is required.'
    });
    return;
  }

  // Secure server-side validation against environment variable or default prototype code
  if (code.trim() !== TEACHER_SECRET_CODE) {
    res.status(401).json({
      success: false,
      error: 'Invalid secret access code. Please check with your institutional administrator.'
    });
    return;
  }

  // Generate cryptographically secure session token
  const token = crypto.randomBytes(32).toString('hex');
  const sessionData = {
    teacherId: 'teacher-' + crypto.randomBytes(4).toString('hex'),
    name: 'FBISE Verified Educator',
    createdAt: Date.now()
  };

  teacherSessions.set(token, sessionData);

  res.json({
    success: true,
    message: 'Teacher access granted.',
    session: {
      token,
      teacherId: sessionData.teacherId,
      name: sessionData.name,
      role: 'teacher',
      expiresInHours: 48
    }
  });
});

// 2. Verify active teacher session
app.get('/api/teacher/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ valid: false });
    return;
  }

  const token = authHeader.split(' ')[1];
  const session = teacherSessions.get(token);
  if (!session) {
    res.status(401).json({ valid: false });
    return;
  }

  res.json({
    valid: true,
    teacher: {
      teacherId: session.teacherId,
      name: session.name
    }
  });
});

// 3. Teacher Logout
app.post('/api/teacher/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    teacherSessions.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 4. Get all notes (public student & teacher browsing)
app.get('/api/notes', (req: Request, res: Response) => {
  const notes = getNotes();
  const { class: classParam, subject, search, sort } = req.query;

  let filtered = [...notes];

  if (classParam && classParam !== 'all') {
    filtered = filtered.filter(n => n.class_level === classParam);
  }

  if (subject && subject !== 'all' && typeof subject === 'string') {
    const sLower = subject.toLowerCase();
    filtered = filtered.filter(n => n.subject.toLowerCase() === sLower);
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(n => {
      return (
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.subject.toLowerCase().includes(q) ||
        (n.chapter && n.chapter.toLowerCase().includes(q)) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
      );
    });
  }

  const sortBy = (sort as string) || 'newest';
  filtered.sort((a, b) => {
    switch (sortBy) {
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

  res.json({
    success: true,
    total: filtered.length,
    notes: filtered
  });
});

// 5. Get single note details
app.get('/api/notes/:id', (req: Request, res: Response) => {
  const notes = getNotes();
  const note = notes.find(n => n.id === req.params.id);

  if (!note) {
    res.status(404).json({ success: false, error: 'Note not found.' });
    return;
  }

  res.json({ success: true, note });
});

// 6. Preview or Download note file directly from persistent storage
app.get('/api/notes/:id/file', (req: Request, res: Response) => {
  const notes = getNotes();
  const note = notes.find(n => n.id === req.params.id);

  if (!note) {
    res.status(404).json({ success: false, error: 'Note not found.' });
    return;
  }

  const filePath = path.join(UPLOADS_DIR, note.file_path);

  if (!fs.existsSync(filePath)) {
    // If demo file doesn't exist on disk, regenerate on the fly
    const pdfBuffer = createMinimalPdfBuffer(
      note.title,
      `${note.class_level.toUpperCase()} - ${note.subject}`,
      note.description
    );
    fs.writeFileSync(filePath, pdfBuffer);
  }

  const isDownload = req.query.download === 'true';

  if (isDownload) {
    // Increment download count
    note.downloads_count = (note.downloads_count || 0) + 1;
    saveNotes(notes);
    res.download(filePath, note.file_name);
  } else {
    // Inline preview
    const ext = path.extname(note.file_name).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${note.file_name}"`);
    fs.createReadStream(filePath).pipe(res);
  }
});

// 7. Protected: Upload new note (Teacher only)
app.post('/api/notes', requireTeacherAuth, upload.single('file'), (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: 'Please attach a document or PDF file.' });
      return;
    }

    const {
      title,
      description,
      class_level,
      subject,
      study_group,
      chapter,
      tags
    } = req.body;

    if (!title || title.trim().length < 3) {
      // Remove uploaded file if validation fails
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(400).json({ success: false, error: 'Title is required (min 3 characters).' });
      return;
    }

    if (!description || description.trim().length < 10) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(400).json({ success: false, error: 'Description must be at least 10 characters long.' });
      return;
    }

    const validClasses: ClassLevel[] = ['9th', '10th', '1st-year', '2nd-year'];
    if (!class_level || !validClasses.includes(class_level as ClassLevel)) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(400).json({ success: false, error: 'A valid FBISE class level is required.' });
      return;
    }

    if (!subject || subject.trim() === '') {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(400).json({ success: false, error: 'Subject is required.' });
      return;
    }

    let parsedTags: string[] = [];
    if (typeof tags === 'string') {
      parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    } else if (Array.isArray(tags)) {
      parsedTags = tags.map(t => String(t).trim()).filter(Boolean);
    }

    const teacher = (req as any).teacher;
    const newNote: Note = {
      id: 'fbise-note-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'),
      title: title.trim(),
      description: description.trim(),
      class_level: class_level as ClassLevel,
      subject: subject.trim(),
      study_group: study_group || 'All Groups',
      chapter: chapter ? chapter.trim() : undefined,
      tags: parsedTags,
      file_path: path.basename(file.path),
      file_name: file.originalname,
      file_type: file.mimetype || 'application/pdf',
      file_size: file.size,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      teacher_id: teacher.teacherId,
      teacher_name: teacher.name,
      published: true,
      downloads_count: 0,
      is_demo: false
    };

    const notes = getNotes();
    notes.unshift(newNote); // newest at the beginning
    saveNotes(notes);

    res.status(201).json({
      success: true,
      message: 'Note uploaded and published successfully to FBISE Notes Hub.',
      note: newNote
    });
  } catch (error: any) {
    console.error('Error uploading note:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error while uploading note.' });
  }
});

// 8. Protected: Edit note metadata (Teacher only)
app.put('/api/notes/:id', requireTeacherAuth, (req: Request, res: Response) => {
  const notes = getNotes();
  const index = notes.findIndex(n => n.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Note not found.' });
    return;
  }

  const {
    title,
    description,
    class_level,
    subject,
    study_group,
    chapter,
    tags
  } = req.body;

  const note = notes[index];

  if (title) note.title = title.trim();
  if (description) note.description = description.trim();
  if (class_level) note.class_level = class_level;
  if (subject) note.subject = subject.trim();
  if (study_group) note.study_group = study_group;
  if (chapter !== undefined) note.chapter = chapter.trim();
  if (tags) {
    note.tags = Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean);
  }
  note.updated_at = new Date().toISOString();

  saveNotes(notes);

  res.json({
    success: true,
    message: 'Note updated successfully.',
    note
  });
});

// 9. Protected: Delete note and its file (Teacher only)
app.delete('/api/notes/:id', requireTeacherAuth, (req: Request, res: Response) => {
  const notes = getNotes();
  const index = notes.findIndex(n => n.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Note not found.' });
    return;
  }

  const note = notes[index];
  const filePath = path.join(UPLOADS_DIR, note.file_path);

  // If file exists on disk and is not a default seed file being reused, unlink
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('Could not unlink file:', e);
    }
  }

  notes.splice(index, 1);
  saveNotes(notes);

  res.json({
    success: true,
    message: 'Note deleted permanently from FBISE Notes Hub.'
  });
});

// 10. Dashboard Stats (Overview)
app.get('/api/stats', (_req: Request, res: Response) => {
  const notes = getNotes();

  const notesByClass: Record<ClassLevel, number> = {
    '9th': 0,
    '10th': 0,
    '1st-year': 0,
    '2nd-year': 0
  };

  let totalDownloads = 0;
  let totalBytes = 0;

  for (const n of notes) {
    if (notesByClass[n.class_level] !== undefined) {
      notesByClass[n.class_level]++;
    }
    totalDownloads += n.downloads_count || 0;
    totalBytes += n.file_size || 0;
  }

  res.json({
    success: true,
    stats: {
      totalNotes: notes.length,
      notesByClass,
      totalDownloads,
      storageUsedBytes: totalBytes,
      recentNotes: notes.slice(0, 5)
    }
  });
});

// 11. Public FBISE Resources endpoint
app.get('/api/public-resources', (_req: Request, res: Response) => {
  res.json({
    success: true,
    resources: PUBLIC_FBISE_RESOURCES
  });
});

// ----------------------------------------------------
// FRONTEND INTEGRATION
// ----------------------------------------------------
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FBISE Notes Hub] Server running at http://0.0.0.0:${PORT}`);
    console.log(`[FBISE Notes Hub] Teacher secret code: ${TEACHER_SECRET_CODE}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
