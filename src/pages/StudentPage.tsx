import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Question } from '../types';
import { motion } from 'motion/react';
import { Play, Clock, ChevronRight, Trophy } from 'lucide-react';

export default function StudentPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [qData, rData] = await Promise.all([
      api.getQuestions(),
      api.getMyResults()
    ]);
    setQuestions(qData);
    setResults(rData);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-serif italic">Student Dashboard</h1>
            <p className="text-gray-500 mt-2 uppercase tracking-widest text-xs">Sharpen Your Mind</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-black/5 flex items-center gap-3">
              <Trophy className="text-yellow-500" size={20} />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Total Accuracy</p>
                <p className="text-lg font-serif">
                  {results.length > 0 
                    ? Math.round(results.reduce((acc, r) => acc + r.accuracy, 0) / results.length) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Quizzes */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 text-gray-400">
              <h2 className="text-sm font-semibold uppercase tracking-wider">Available Training Sets</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((q, idx) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/quiz/${q.id}`)}
                  className="bg-white rounded-[32px] p-8 shadow-sm border border-black/5 cursor-pointer group hover:border-black/20 hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <h3 className="text-2xl font-serif mb-4 group-hover:italic transition-all">{q.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                        {q.digits} Digits
                      </span>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                        {q.columns} Columns
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock size={14} />
                        <span className="text-xs font-medium">5:00 Limit</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play size={16} fill="white" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 group-hover:bg-black/5 transition-colors" />
                </motion.div>
              ))}
            </div>

            {questions.length === 0 && (
              <div className="text-center py-20 bg-white/50 rounded-[32px] border border-dashed border-gray-300">
                <p className="text-gray-400 italic">No training sets available yet.</p>
              </div>
            )}
          </div>

          {/* Recent Performance */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-2 text-gray-400">
              <h2 className="text-sm font-semibold uppercase tracking-wider">Recent Performance</h2>
            </div>

            <div className="space-y-3">
              {results.slice(0, 5).map((r, idx) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-black/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                      r.accuracy >= 80 ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                    )}>
                      {Math.round(r.accuracy)}%
                    </div>
                    <div>
                      <p className="text-sm font-medium">Session #{r.id}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </motion.div>
              ))}

              {results.length === 0 && (
                <p className="text-center text-gray-400 text-sm italic py-10">No sessions completed.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
