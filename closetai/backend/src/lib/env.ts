import dotenv from 'dotenv';
dotenv.config();
export const DEMO_MODE = (process.env.DEMO_MODE ?? 'true') === 'true';
export const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://dev:dev@localhost:5432/closetai';
export const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
export const EMBEDDING_SERVER_URL = process.env.EMBEDDING_SERVER_URL ?? 'http://localhost:8000';
export const RANKER_SERVER_URL = process.env.RANKER_SERVER_URL ?? 'http://localhost:8501';
