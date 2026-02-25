import { useLocation, useNavigate } from 'react-router-dom';
import { QuizResult } from '../types';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Clock, Target, ArrowLeft, RotateCcw } from 'lucide-react';

export default function SummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as QuizResult;

  if (!result) return <div className="min-h-screen flex items-center justify-center font-serif italic">No result data found.</div>;

  return (
    <div className="min-h-screen bg-[#f5f5f0] p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-4 bg-white rounded-full shadow-sm border border-black/5 mb-6"
          >
            <Target size={48} className="text-black" />
          </motion.div>
          <h1 className="text-6xl font-serif italic mb-4">Performance Summary</h1>
          <p className="text-gray-500 uppercase tracking-widest text-xs font-bold">Session Analysis</p>
        </header>

        {/* High Level Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Accuracy', value: `${Math.round(result.accuracy)}%`, icon: Target, color: 'text-black' },
            { label: 'Correct', value: `${result.correct_answers}/${result.total_questions}`, icon: CheckCircle2, color: 'text-emerald-600' },
            { label: 'Total Time', value: `${Math.floor(result.total_time / 60)}m ${result.total_time % 60}s`, icon: Clock, color: 'text-blue-600' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-[32px] p-8 shadow-sm border border-black/5 text-center"
            >
              <stat.icon size={24} className={cn("mx-auto mb-4", stat.color)} />
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">{stat.label}</p>
              <p className="text-3xl font-serif">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-black/5 mb-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-8">Question Breakdown</h2>
          <div className="space-y-4">
            {result.details.map((detail, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-black/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    detail.isCorrect ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                  )}>
                    {detail.isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                  </div>
                  <div>
                    <p className="font-serif text-lg">Question #{idx + 1}</p>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                      Time: {detail.timeTaken}s
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-gray-600">
                    Your Answer: <span className={cn("font-bold", detail.isCorrect ? "text-emerald-600" : "text-red-600")}>{detail.userAnswer}</span>
                  </p>
                  {!detail.isCorrect && (
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                      Correct: {detail.correctAnswer}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/student')}
            className="px-8 py-4 bg-white text-black border border-black/10 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/student')}
            className="px-8 py-4 bg-black text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-900 transition-colors"
          >
            <RotateCcw size={20} />
            Try Another
          </button>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
