import request from 'supertest';
import appExpress from 'express';
import bodyParser from 'body-parser';
import recommend from '../src/api/recommend';

const app = appExpress();
app.use(bodyParser.json());
app.use('/api/recommend', recommend);

jest.setTimeout(20000);

test('recommend endpoint responds', async () => {
  const res = await request(app).post('/api/recommend').send({ anon_id: 'demo-user', context_text: 'red dress' });
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
  expect(Array.isArray(res.body.recommendations)).toBeTruthy();
});
