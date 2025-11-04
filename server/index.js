import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import yaml from 'js-yaml';

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const COURSES_DIR = path.join(DATA_DIR, 'courses');
const SYLLABUS_YAML_PATH = path.join(DATA_DIR, 'syllabus.yaml');

// Ensure folders exist
for (const dir of [DATA_DIR, COURSES_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

 

// Multer setup - use memory storage to avoid FS ENOENT issues
const upload = multer({ storage: multer.memoryStorage() });

// Helper: normalize header keys
function normalizeKey(key) {
  return String(key || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

// Helper: build hierarchy from rows
function buildHierarchy(rows) {
  const topicsMap = {};

  rows.forEach((row) => {
    const topicName = row.topic?.trim();
    const mainName = row.main_topic?.trim();
    const subName = row.subtopic?.trim();

    if (!topicName) return;
    if (!topicsMap[topicName]) {
      topicsMap[topicName] = { name: topicName, main_topics: [] };
    }

    const topicObj = topicsMap[topicName];
    let mainObj = topicObj.main_topics.find((m) => m.name === mainName);
    if (!mainObj) {
      mainObj = { name: mainName || '', subtopics: [] };
      topicObj.main_topics.push(mainObj);
    }

    if (subName && !mainObj.subtopics.includes(subName)) {
      mainObj.subtopics.push(subName);
    }
  });

  return Object.values(topicsMap);
}

// Helpers for multi-course storage
function slugifyName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function listCourseFiles() {
  if (!fs.existsSync(COURSES_DIR)) return [];
  return fs.readdirSync(COURSES_DIR)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => ({ slug: f.replace(/\.yaml$/, ''), file: path.join(COURSES_DIR, f) }));
}

// GET /api/courses - list available courses
app.get('/api/courses', (req, res) => {
  try {
    const items = listCourseFiles();
    const result = items.map(({ slug, file }) => {
      let name = slug;
      try {
        const y = yaml.load(fs.readFileSync(file, 'utf-8')) || {};
        if (typeof y.name === 'string' && y.name.trim()) name = y.name.trim();
      } catch {}
      return { name, slug };
    });
    return res.json(result);
  } catch (e) {
    return res.json([]);
  }
});

// GET /api/syllabus?course=<slug> - serve topics for a specific course
app.get('/api/syllabus', (req, res) => {
  try {
    const { course } = req.query || {};
    if (!course) return res.json({ topics: [] });
    const filePath = path.join(COURSES_DIR, `${String(course)}.yaml`);
    if (!fs.existsSync(filePath)) return res.json({ topics: [] });
    const yamlStr = fs.readFileSync(filePath, 'utf-8');
    const data = yaml.load(yamlStr) || {};
    const topics = Array.isArray(data.topics) ? data.topics : [];
    return res.json({ topics });
  } catch (err) {
    console.error('Error reading course YAML:', err);
    return res.status(500).json({ topics: [] });
  }
});

// POST /api/courses - create a new course from Excel (409 if exists)
app.post('/api/courses', upload.single('file'), (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Course name is required' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const slug = slugifyName(name);
    if (!slug) return res.status(400).json({ success: false, message: 'Invalid course name' });
    const outPath = path.join(COURSES_DIR, `${slug}.yaml`);
    if (fs.existsSync(outPath)) return res.status(409).json({ success: false, message: 'Course already exists' });

    const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json(ws, { defval: '' });
    if (!rawRows.length) return res.status(400).json({ success: false, message: 'Excel sheet is empty' });

    const rows = rawRows.map((r) => {
      const obj = {};
      Object.keys(r).forEach((k) => { obj[normalizeKey(k)] = r[k]; });
      return {
        topic: obj.topic || obj.topics || '',
        main_topic: obj.main_topic || obj.maintopic || obj.module || '',
        subtopic: obj.subtopic || obj.sub_topic || obj.topic_item || '',
      };
    });

    const hasRequired = rows.some((r) => r.topic) && rows.some((r) => r.main_topic);
    if (!hasRequired) return res.status(400).json({ success: false, message: 'Invalid Excel format. Expected columns: topic, main_topic, subtopic.' });

    const dataToSave = { name, topics: buildHierarchy(rows) };
    try {
      const yamlStr = yaml.dump(dataToSave);
      fs.writeFileSync(outPath, yamlStr, 'utf-8');
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to save YAML' });
    }

    return res.json({ success: true, slug });
  } catch (err) {
    console.error('Create course error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process Excel file' });
  }
});

// GET /api/sample-excel - provide a sample Excel with expected columns
app.get('/api/sample-excel', (req, res) => {
  try {
    const rows = [
      { topic: 'Cloud Fundamentals', main_topic: 'AWS Overview', subtopic: 'Global Infrastructure' },
      { topic: 'Cloud Fundamentals', main_topic: 'AWS Overview', subtopic: 'Shared Responsibility Model' },
      { topic: 'Compute', main_topic: 'EC2', subtopic: 'Instance Types' },
      { topic: 'Compute', main_topic: 'EC2', subtopic: 'Security Groups' },
      { topic: 'Storage', main_topic: 'S3', subtopic: 'Buckets and Objects' },
    ];
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rows, { header: ['topic', 'main_topic', 'subtopic'] });
    xlsx.utils.book_append_sheet(wb, ws, 'Syllabus');
    const buf = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sample_syllabus.xlsx"');
    return res.send(buf);
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to generate sample file' });
  }
});

// PUT /api/courses/:slug - update an existing course from Excel
app.put('/api/courses/:slug', upload.single('file'), (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim();
    if (!slug) return res.status(400).json({ success: false, message: 'Invalid slug' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const outPath = path.join(COURSES_DIR, `${slug}.yaml`);
    if (!fs.existsSync(outPath)) return res.status(404).json({ success: false, message: 'Course not found' });

    const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json(ws, { defval: '' });
    if (!rawRows.length) return res.status(400).json({ success: false, message: 'Excel sheet is empty' });

    const rows = rawRows.map((r) => {
      const obj = {};
      Object.keys(r).forEach((k) => { obj[normalizeKey(k)] = r[k]; });
      return {
        topic: obj.topic || obj.topics || '',
        main_topic: obj.main_topic || obj.maintopic || obj.module || '',
        subtopic: obj.subtopic || obj.sub_topic || obj.topic_item || '',
      };
    });

    const hasRequired = rows.some((r) => r.topic) && rows.some((r) => r.main_topic);
    if (!hasRequired) return res.status(400).json({ success: false, message: 'Invalid Excel format. Expected columns: topic, main_topic, subtopic.' });

    let currentName = slug;
    try {
      const existing = yaml.load(fs.readFileSync(outPath, 'utf-8')) || {};
      if (typeof existing.name === 'string' && existing.name.trim()) currentName = existing.name.trim();
    } catch {}

    const dataToSave = { name: currentName, topics: buildHierarchy(rows) };
    try {
      const yamlStr = yaml.dump(dataToSave);
      fs.writeFileSync(outPath, yamlStr, 'utf-8');
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to save YAML' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Update course error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process Excel file' });
  }
});

// Fallback to index.html if needed
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
