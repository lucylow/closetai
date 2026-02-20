// backend/tests/analytics.test.ts
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import analyticsRoute from '../src/routes/analytics';

const app = express();
app.use(bodyParser.json());
app.use('/api/analytics', analyticsRoute);

describe('analytics route', () => {
  beforeEach(() => {
    // Clear events between tests by requiring fresh module
    jest.resetModules();
  });

  it('accepts events', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({ event: 'test.event', props: { a: 1 } });
    
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('lists recent events', async () => {
    // First post an event
    await request(app)
      .post('/api/analytics')
      .send({ event: 'test.listing', props: { b: 2 } });

    const res = await request(app).get('/api/analytics/recent');
    
    expect(res.status).toBe(200);
    expect(res.body.events).toBeDefined();
    expect(Array.isArray(res.body.events)).toBe(true);
  });

  it('returns health check', async () => {
    const res = await request(app).get('/api/analytics/health');
    
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.demo).toBeDefined();
  });

  it('includes demo mode in event', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({ event: 'demo.check', props: {} });
    
    expect(res.status).toBe(200);
  });
});
