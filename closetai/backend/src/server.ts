import express from 'express';
import bodyParser from 'body-parser';
import recommend from './api/recommend';
import analytics from './routes/analytics';
import { DEMO_MODE } from './lib/env';

const app = express();
app.use(bodyParser.json());

app.use('/api/recommend', recommend);
app.use('/api/analytics', analytics);

app.get('/health', (req,res)=>res.json({ ok:true, demo: DEMO_MODE }));

const port = process.env.PORT ?? 3000;
app.listen(port, ()=> console.log(`Backend API running on ${port}`));
