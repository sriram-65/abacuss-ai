import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-abscuss-key';

// MongoDB Connection (will be called on each function invocation)
let cached = (global as any).mongoose || { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!).then((mongoose) => mongoose);
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
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

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);
const Result = mongoose.models.Result || mongoose.model('Result', resultSchema);

// Auth Middleware
const authenticate = async (req: any, res: any, next: any) => {
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
  try {
    await connectDB();
    const { username, password, role } = req.body;
    const user = new User({ username, password, role: role || 'student' });
    await user.save();
    res.json({ id: user.id });
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    await connectDB();
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Question Routes
app.get('/api/questions', authenticate, async (req, res) => {
  try {
    await connectDB();
    const questions = await Question.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/questions', authenticate, isAdmin, async (req, res) => {
  try {
    await connectDB();
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
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/questions/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await connectDB();
    await Question.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Result Routes
app.post('/api/results', authenticate, async (req: any, res) => {
  try {
    await connectDB();
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
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/results/me', authenticate, async (req: any, res) => {
  try {
    await connectDB();
    const results = await Result.find({ user_id: req.user.id }).sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Export for Vercel
export default app;
