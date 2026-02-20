import axios from 'axios';
import { EMBEDDING_SERVER_URL } from '../lib/env';
import logger from '../lib/logger';

// wrapper to call Python embedding service
export async function embedImage(imageUrl: string) {
  try {
    const res = await axios.post(`${EMBEDDING_SERVER_URL}/embed_image`, { url: imageUrl }, { timeout: 30000 });
    return res.data.vector;
  } catch (err:any) {
    logger.error('embedImage error', err.message);
    throw err;
  }
}

export async function embedText(text: string) {
  try {
    const res = await axios.post(`${EMBEDDING_SERVER_URL}/embed_text`, { text }, { timeout: 10000 });
    return res.data.vector;
  } catch (err:any) {
    logger.error('embedText error', err.message);
    throw err;
  }
}
