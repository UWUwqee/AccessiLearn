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
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function proxyGoogleApiList(url, token, resourceName) {
  const items = [];
  let pageToken;

  do {
    const pageUrl = new URL(url);
    if (pageToken) pageUrl.searchParams.set('pageToken', pageToken);

    const payload = await proxyGoogleApi(pageUrl.toString(), token);
    if (Array.isArray(payload[resourceName])) items.push(...payload[resourceName]);
    pageToken = payload.nextPageToken;
  } while (pageToken);

  return items;
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
    const courses = await proxyGoogleApiList(
      'https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&courseStates=ARCHIVED&pageSize=100',
      token,
      'courses'
    );
    const courseWorkItems = [];

    for (const course of courses) {
      const courseworkUrl = `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork?courseWorkStates=PUBLISHED&pageSize=100`;
      const works = await proxyGoogleApiList(courseworkUrl, token, 'courseWork');
      for (const work of works) courseWorkItems.push({ course, work });
    }

    const tasks = courseWorkItems.map(({ course, work }) => {
      const dueDate = work.dueDate || null;
      let dueDateText = 'No due date';

      if (dueDate && dueDate.year && dueDate.month && dueDate.day) {
        dueDateText = new Date(dueDate.year, dueDate.month - 1, dueDate.day).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }

      return {
        id: `${course.id}-${work.id}`,
        title: work.title || 'Untitled activity',
        module: course.name || 'Google Classroom',
        instructions: work.description || 'No description provided for this activity yet.',
        due_date: dueDateText,
        points: work.maxPoints ?? 100,
        accessible_formats: ['Readable text', 'Speech-friendly format', 'Accessible submission'],
        alternateLink: work.alternateLink || null,
      };
    });
    const tasksById = new Map(tasks.map((task) => [task.id, task]));

    const submissionByWorkId = new Map();
    let gradeError = null;

    for (let start = 0; start < courseWorkItems.length && !gradeError; start += 8) {
      const batch = courseWorkItems.slice(start, start + 8);
      const batchResults = await Promise.all(batch.map(async ({ course, work }) => {
        const submissionUrl = `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork/${work.id}/studentSubmissions?userId=me&pageSize=1`;
        try {
          const submissionPayload = await proxyGoogleApi(submissionUrl, token);
          return { key: `${course.id}-${work.id}`, submission: submissionPayload.studentSubmissions?.[0] || null };
        } catch (error) {
          if (error.status === 403) return { key: `${course.id}-${work.id}`, permissionDenied: true };
          throw error;
        }
      }));

      for (const result of batchResults) {
        if (result.permissionDenied) {
          gradeError = 'Google Classroom denied access to your submission status or grades. Sign out, sign back in, and grant the requested student-submissions permission.';
          break;
        }
        submissionByWorkId.set(result.key, result.submission);
      }
    }

    const grades = courseWorkItems.map(({ course, work }) => {
      const key = `${course.id}-${work.id}`;
      const submission = submissionByWorkId.get(key);
      const task = tasksById.get(key);

      return {
        id: key,
        course: course.name || 'Google Classroom',
        title: work.title || 'Untitled activity',
        due_date: task?.due_date || 'No due date',
        max_points: typeof work.maxPoints === 'number' ? work.maxPoints : null,
        state: submission?.state || (gradeError ? 'UNAVAILABLE' : 'NEW'),
        assigned_grade: typeof submission?.assignedGrade === 'number' ? submission.assignedGrade : undefined,
        alternateLink: work.alternateLink || null,
      };
    });

    return res.json({ tasks, grades, gradeError });
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
