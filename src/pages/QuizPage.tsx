import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Question, QuestionResult } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ArrowRight } from 'lucide-react';

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadQuestions();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadQuestions = async () => {
    const data = await api.getQuestions();
    const currentSet = data.find(q => q.id === id);
    if (currentSet) {
      setQuestions([currentSet]); // We keep the set as the main object
    } else {
      setQuestions(data);
    }
  };

  const handleNext = () => {
    const now = Date.now();
    const timeTaken = Math.floor((now - questionStartTime) / 1000);
    const currentSet = questions[0]; // Assuming we are playing one set
    const currentProblem = currentSet.problems[currentIndex];
    const isCorrect = Number(userAnswer) === currentProblem.answer;

    const newResult: QuestionResult = {
      questionId: currentSet.id,
      timeTaken,
      isCorrect,
      userAnswer: Number(userAnswer),
      correctAnswer: currentProblem.answer
    };

    const updatedResults = [...results, newResult];
    setResults(updatedResults);
    setUserAnswer('');
    setQuestionStartTime(now);

    if (currentIndex < currentSet.problems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishQuiz(updatedResults);
    }
  };

  const finishQuiz = async (finalResults = results) => {
    if (isFinished) return;
    setIsFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const currentSet = questions[0];
    const totalQuestions = currentSet.problems.length;
    const correctAnswers = finalResults.filter(r => r.isCorrect).length;
    const accuracy = (correctAnswers / totalQuestions) * 100;
    const totalTime = Math.floor((Date.now() - startTime) / 1000);

    const savedResult = await api.saveResult({
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      accuracy,
      total_time: totalTime,
      details: finalResults
    });

    navigate(`/summary/${savedResult.id}`, { 
      state: { 
        result: { 
          ...savedResult, 
          total_questions: totalQuestions, 
          correct_answers: correctAnswers, 
          accuracy, 
          total_time: totalTime, 
          details: finalResults 
        } 
      } 
    });
  };

  if (questions.length === 0) return <div className="min-h-screen flex items-center justify-center font-serif italic bg-[#0a0a0a] text-white">Loading...</div>;

  const currentSet = questions[0];
  const currentProblem = currentSet.problems[currentIndex];
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
      <div className="fixed top-0 left-0 w-full p-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center font-mono text-sm">
            {currentIndex + 1}/{currentSet.problems.length}
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-widest opacity-50">{currentSet.title}</h2>
        </div>
        <div className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-colors ${timeLeft < 30 ? "border-red-500/50 bg-red-500/10 text-red-500" : "border-white/10 bg-white/5"}`}>
          <Clock size={18} />
          <span className="font-mono text-xl font-bold">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center"
          >
            <div className="flex flex-col gap-4 mb-12">
              {currentProblem.numbers.map((num, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`text-7xl md:text-9xl font-serif font-light tracking-tighter ${num < 0 ? "text-red-400" : "text-white"}`}
                >
                  {num > 0 && i > 0 ? `+${num}` : num}
                </motion.div>
              ))}
            </div>

            <div className="relative max-w-xs mx-auto">
              <input
                autoFocus
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                placeholder="Answer"
                className="w-full bg-transparent border-b-2 border-white/20 py-4 text-4xl text-center font-mono outline-none focus:border-white transition-colors"
              />
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:text-emerald-400 transition-colors"
              >
                <ArrowRight size={32} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 w-full h-1 bg-white/5">
        <motion.div 
          className="h-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / currentSet.problems.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
