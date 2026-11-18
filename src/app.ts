import express from 'express';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}

// Deliberate lint error: unused variable. This PR must go red and must not merge.
const unusedOnPurpose = 1;
