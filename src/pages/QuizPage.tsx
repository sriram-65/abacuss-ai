import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Question, QuestionResult } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ArrowRight, Check, Sparkles } from 'lucide-react';

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
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  const loadQuestions = async () => {
    const data = await api.getQuestions();
    const currentSet = data.find(q => q.id === id);
    if (currentSet) {
      setQuestions([currentSet]);
    } else {
      setQuestions(data);
    }
  };

  const handleNext = () => {
    if (!userAnswer.trim()) return;
    
    const now = Date.now();
    const timeTaken = Math.floor((now - questionStartTime) / 1000);
    const currentSet = questions[0];
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

    if (currentIndex < currentSet.problems.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setQuestionStartTime(now);
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

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/60 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          <p className="text-sm">Loading questions...</p>
        </div>
      </div>
    );
  }

  const currentSet = questions[0];
  const currentProblem = currentSet.problems[currentIndex];
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((currentIndex) / currentSet.problems.length) * 100;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Simple header */}
      <div className="fixed top-0 left-0 right-0 p-6">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/40">Question</span>
            <span className="text-2xl font-light">{currentIndex + 1}</span>
            <span className="text-sm text-white/20">/ {currentSet.problems.length}</span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            timeLeft < 30 ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white/60'
          }`}>
            <Clock size={16} />
            <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Main vertical content */}
      <div className="fixed inset-0 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-12"
            >
              {/* Numbers stacked vertically */}
              <div className="flex flex-col items-center gap-4">
                {currentProblem.numbers.map((num, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative"
                  >
                    <div className={`
                      text-4xl md:text-5xl font-light leading-none
                      ${num < 0 ? 'text-red-400/90' : 'text-white'}
                    `}>
                      {num > 0 && i > 0 ? (
                        <div className="flex items-center">
                          <span className="text-3xl text-white/20 mr-4">+</span>
                          <span>{num}</span>
                        </div>
                      ) : (
                        num
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Answer input - centered below numbers */}
              <div className="w-full space-y-4">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                    placeholder="0"
                    className="w-full bg-transparent text-5xl md:text-6xl font-light text-center outline-none placeholder:text-white/10 border-b border-white/10 focus:border-white/30 py-4 transition-colors"
                  />
                </div>

                {/* Next button */}
                <motion.button
                  onClick={handleNext}
                  disabled={!userAnswer.trim()}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    w-full py-4 rounded-2xl font-medium transition-all
                    ${userAnswer.trim() 
                      ? 'bg-white text-black hover:bg-white/90' 
                      : 'bg-white/5 text-white/20 cursor-not-allowed'}
                  `}
                >
                  Next
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Simple progress line */}
      <div className="fixed bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <motion.div 
          className="h-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Mini progress dots */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center gap-1.5">
        {currentSet.problems.map((_, idx) => (
          <div
            key={idx}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              idx === currentIndex 
                ? 'bg-white' 
                : idx < currentIndex 
                  ? 'bg-white/40' 
                  : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
