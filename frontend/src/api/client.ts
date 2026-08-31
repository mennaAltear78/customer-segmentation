import axios from 'axios';

const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const baseURL = isLocal
  ? 'http://localhost:8000'
  : (import.meta.env.VITE_API_URL || 'https://customer-segmentation12menna.vercel.app');

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});
