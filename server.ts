import express from 'express';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-abscuss-key';

// MongoDB Connection
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables.');
  console.error('Please set MONGODB_URI in the Secrets panel in AI Studio.');
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      if (err.message.includes('ECONNREFUSED')) {
        console.error('It seems like the application is trying to connect to a local MongoDB instance.');
        console.error('Make sure your MONGODB_URI is a valid Atlas connection string.');
      }
    });
}

// Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student'], default: 'student' }
}, { timestamps: true });

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) { delete ret._id; }
});

const questionSchema = new mongoose.Schema({
  title: String,
  digits: Number,
  columns: Number,
  allow_negative: Boolean,
  problems: [{
    numbers: [Number],
    answer: Number
  }]
}, { timestamps: true });

questionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) { delete ret._id; }
});

const resultSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  total_questions: Number,
  correct_answers: Number,
  accuracy: Number,
  total_time: Number,
  details: [{
    questionId: String,
    timeTaken: Number,
    isCorrect: Boolean,
    userAnswer: Number,
    correctAnswer: Number
  }]
}, { timestamps: true });

resultSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) { delete ret._id; }
});

const User = mongoose.model('User', userSchema);
const Question = mongoose.model('Question', questionSchema);
const Result = mongoose.model('Result', resultSchema);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  };

  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    const { username, password, role } = req.body;
    try {
      const user = new User({ username, password, role: role || 'student' });
      await user.save();
      res.json({ id: user.id });
    } catch (err) {
      res.status(400).json({ error: 'Username already exists' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });

  // Question Routes
  app.get('/api/questions', authenticate, async (req, res) => {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.json(questions);
  });

  app.post('/api/questions', authenticate, isAdmin, async (req, res) => {
    const { title, digits, columns, allowNegative, count = 10 } = req.body;
    
    const problems = [];
    for (let p = 0; p < count; p++) {
      const numbers: number[] = [];
      let currentSum = 0;
      for (let i = 0; i < columns; i++) {
        let num: number;
        const max = Math.pow(10, digits) - 1;
        const min = Math.pow(10, digits - 1);
        
        if (allowNegative && i > 0) {
          num = Math.floor(Math.random() * (max - min + 1)) + min;
          if (Math.random() > 0.5) num = -num;
        } else {
          num = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        numbers.push(num);
        currentSum += num;
      }
      problems.push({ numbers, answer: currentSum });
    }

    const questionSet = new Question({
      title,
      digits,
      columns,
      allow_negative: allowNegative,
      problems
    });
    await questionSet.save();
    res.json(questionSet);
  });

  app.delete('/api/questions/:id', authenticate, isAdmin, async (req, res) => {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  });

  // Result Routes
  app.post('/api/results', authenticate, async (req: any, res) => {
    const { total_questions, correct_answers, accuracy, total_time, details } = req.body;
    const result = new Result({
      user_id: req.user.id,
      total_questions,
      correct_answers,
      accuracy,
      total_time,
      details
    });
    await result.save();
    res.json(result);
  });

  app.get('/api/results/me', authenticate, async (req: any, res) => {
    const results = await Result.find({ user_id: req.user.id }).sort({ createdAt: -1 });
    res.json(results);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));
  }

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on http://localhost:3000');
  });
}

startServer();
