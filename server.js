import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3001);
const frontendUrl = process.env.FRONTEND_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';
const distPath = path.resolve(__dirname, 'dist');

async function proxyGoogleApi(url, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.error?.message || 'Google API request failed';
    throw new Error(message);
  }

  return payload;
}

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'AccessiLearn Classroom API' });
});

app.get('/api/google/auth-url', (_req, res) => {
  return res.status(400).json({
    error: 'This app uses Firebase Google sign-in with a direct access token instead of a custom OAuth redirect URL.'
  });
});

app.post('/api/google/classroom', async (req, res) => {
  const token = req.body?.token || req.query?.token;

  if (!token) {
    return res.status(401).json({ error: 'Google access token is required.' });
  }

  try {
    const coursePayload = await proxyGoogleApi('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=10', token);
    const courses = Array.isArray(coursePayload.courses) ? coursePayload.courses : [];
    const tasks = [];
    const grades = [];

    for (const course of courses.slice(0, 3)) {
      const courseworkUrl = `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork?courseWorkStates=PUBLISHED&pageSize=5`;
      const courseworkPayload = await proxyGoogleApi(courseworkUrl, token);
      const works = Array.isArray(courseworkPayload.courseWork) ? courseworkPayload.courseWork : [];

      for (const work of works) {
        const dueDate = work.dueDate || null;
        let dueDateText = 'No due date';
        const submissionUrl = `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork/${work.id}/studentSubmissions?userId=me&pageSize=1`;
        const submissionPayload = await proxyGoogleApi(submissionUrl, token);
        const submission = submissionPayload.studentSubmissions?.[0];

        if (dueDate && dueDate.year && dueDate.month && dueDate.day) {
          dueDateText = new Date(dueDate.year, dueDate.month - 1, dueDate.day).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
        }

        tasks.push({
          id: work.id || `${course.id}-${Math.random().toString(36).slice(2)}`,
          title: work.title || 'Untitled activity',
          module: course.name || 'Google Classroom',
          instructions: work.description || 'No description provided for this activity yet.',
          due_date: dueDateText,
          points: work.maxPoints ?? 100,
          accessible_formats: ['Readable text', 'Speech-friendly format', 'Accessible submission'],
          alternateLink: work.alternateLink || null,
        });

        grades.push({
          id: `${course.id}-${work.id}`,
          course: course.name || 'Google Classroom',
          title: work.title || 'Untitled activity',
          due_date: dueDateText,
          max_points: typeof work.maxPoints === 'number' ? work.maxPoints : null,
          state: submission?.state || 'NEW',
          assigned_grade: typeof submission?.assignedGrade === 'number' ? submission.assignedGrade : undefined,
          alternateLink: work.alternateLink || null,
        });
      }
    }

    return res.json({ tasks, grades });
  } catch (error) {
    console.error('Google Classroom fetch error:', error);
    return res.status(500).json({
      error: error.message || 'Unable to fetch Google Classroom activity for this account.',
    });
  }
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get(/^(?!\/api\/).*$/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get(/^(?!\/api\/).*$/, (_req, res) => {
    res.type('html').send(`<!doctype html><html><body><h1>AccessiLearn is starting up.</h1><p>The frontend build is still being generated.</p></body></html>`);
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`AccessiLearn running on http://0.0.0.0:${port}`);
  if (frontendUrl !== 'http://localhost:3000') {
    console.log(`Frontend origin: ${frontendUrl}`);
  }
});
