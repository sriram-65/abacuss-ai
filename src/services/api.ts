import { Question, QuizResult } from '../types';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

export const api = {
  async login(username: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async register(username: string, password: string, role: string = 'student') {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role }),
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },

  async getQuestions(): Promise<Question[]> {
    const res = await fetch('/api/questions', { headers: getHeaders() });
    return res.json();
  },

  async createQuestion(data: { title: string; digits: number; columns: number; allowNegative: boolean }) {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteQuestion(id: string) {
    await fetch(`/api/questions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  async saveResult(result: Partial<QuizResult>) {
    const res = await fetch('/api/results', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(result),
    });
    return res.json();
  },

  async getMyResults(): Promise<QuizResult[]> {
    const res = await fetch('/api/results/me', { headers: getHeaders() });
    return res.json();
  },
};
