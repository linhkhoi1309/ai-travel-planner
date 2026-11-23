import express, { type ErrorRequestHandler } from 'express';
import { sendProblem } from './problem.js';
import { spendingCapRouter } from './routes/spendingCap.js';
import { createStore, type Store } from './store.js';

export interface AppOptions {
  store?: Store;
  now?: () => Date;
}

/** Builds an app with its own store, freshly seeded unless one is passed. */
export function createApp(options: AppOptions = {}) {
  const store = options.store ?? createStore();
  const now = options.now ?? (() => new Date());

  const app = express();

  // Mounted before express.json(): this route reads its own body so that
  // auth and ownership are checked before the JSON is parsed (contract 4.1).
  app.use(spendingCapRouter(store, now));

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const onError: ErrorRequestHandler = (err, _req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    console.error(err);
    sendProblem(res, 'internal', 'Something went wrong on our side.');
  };
  app.use(onError);

  return app;
}
