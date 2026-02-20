const request = require('supertest');
const express = require('express');

const sponsorsRouter = require('../routes/sponsors.routes');

const app = express();
app.use(express.json());
app.use('/api', sponsorsRouter);

describe('Sponsors API', () => {
  it('should return 4 sponsors', async () => {
    const response = await request(app).get('/api/sponsors/list');
    expect(response.status).toBe(200);
    expect(response.body.sponsors).toHaveLength(4);
  });

  it('should connect a sponsor in demo mode', async () => {
    const response = await request(app)
      .post('/api/sponsors/connect')
      .send({ id: 'perfectcorp', mode: 'demo' });
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });
});
