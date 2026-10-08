import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3001);
const frontendUrl = process.env.FRONTEND_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';
const distPath = path.resolve(__dirname, 'dist');

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('Google OAuth environment variables are not configured. Classroom sync will not work until they are set.');
}

const redirectUri = process.env.GOOGLE_REDIRECT_URI ||
  (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/api/google/callback` : `http://localhost:${port}/api/google/callback`);

const oauthClient = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri
);

const tokenStore = new Map();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

const classroomScopes = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
];

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'AccessiLearn Classroom API' });
});

app.get('/api/google/auth-url', (_req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({
      error: 'Google OAuth is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment.',
    });
  }

  const authUrl = oauthClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: classroomScopes,
  });

  return res.json({ url: authUrl });
});

app.get('/api/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing authorization code.');
  }

  try {
    const { tokens } = await oauthClient.getToken(String(code));
    oauthClient.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauthClient });
    const userInfo = await oauth2.userinfo.get();
    const email = (userInfo.data.email || 'unknown').toLowerCase();

    tokenStore.set(email, tokens);

    const html = `<!DOCTYPE html>
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'google-classroom-auth',
                success: true,
                email: ${JSON.stringify(email)},
              }, '*');
            }
            window.close();
          </script>
        </body>
      </html>`;

    return res.send(html);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.status(500).send('Failed to complete Google Classroom authorization.');
  }
});

app.get('/api/google/classroom', async (req, res) => {
  const email = String(req.query.email || '').toLowerCase();

  if (!email || !tokenStore.has(email)) {
    return res.status(401).json({ error: 'Google Classroom authorization is required before fetching classroom data.' });
  }

  try {
    const tokens = tokenStore.get(email);
    oauthClient.setCredentials(tokens);

    const classroom = google.classroom({ version: 'v1', auth: oauthClient });
    const coursesResponse = await classroom.courses.list({
      courseStates: 'ACTIVE',
      pageSize: 5,
    });

    const courses = Array.isArray(coursesResponse.data.courses) ? coursesResponse.data.courses : [];
    const tasks = [];

    for (const course of courses.slice(0, 3)) {
      const courseworkResponse = await classroom.courses.courseWork.list({
        courseId: course.id,
        pageSize: 3,
        orderBy: 'dueDate desc',
      });

      const works = Array.isArray(courseworkResponse.data.courseWork) ? courseworkResponse.data.courseWork : [];

      for (const work of works) {
        const dueDate = work.dueDate || work.dueTime || null;
        let dueDateText = 'No due date';

        if (dueDate) {
          const { year, month, day } = dueDate;
          if (year && month && day) {
            dueDateText = new Date(year, month - 1, day).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
          }
        }

        tasks.push({
          id: work.id || `${course.id}-${Math.random().toString(36).slice(2)}`,
          title: work.title || 'Untitled activity',
          module: course.name || 'Google Classroom',
          instructions: work.description || 'No description provided for this activity yet.',
          due_date: dueDateText,
          points: work.maxPoints ?? 100,
          accessible_formats: ['Readable text', 'Speech-friendly format', 'Accessible submission'],
        });
      }
    }

    return res.json({ tasks });
  } catch (error) {
    console.error('Google Classroom fetch error:', error);
    return res.status(500).json({
      error: 'Unable to fetch Google Classroom activity for this account.',
    });
  }
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get(/^(?!\/api\/).*$/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`AccessiLearn running on http://0.0.0.0:${port}`);
  if (frontendUrl !== 'http://localhost:3000') {
    console.log(`Frontend origin: ${frontendUrl}`);
  }
});
