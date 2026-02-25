import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Question } from '../types';
import { motion } from 'motion/react';
import { Plus, Trash2, Settings2, Hash, Columns, MinusCircle } from 'lucide-react';

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState('');
  const [digits, setDigits] = useState(1);
  const [columns, setColumns] = useState(4);
  const [allowNegative, setAllowNegative] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const data = await api.getQuestions();
    setQuestions(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createQuestion({ title, digits, columns, allowNegative });
      setTitle('');
      loadQuestions();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this question set?')) {
      await api.deleteQuestion(id);
      loadQuestions();
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-serif italic">Admin Panel</h1>
            <p className="text-gray-500 mt-2 uppercase tracking-widest text-xs">Curate the Curriculum</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Creation Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 bg-white rounded-[32px] p-8 shadow-sm border border-black/5 h-fit"
          >
            <div className="flex items-center gap-2 mb-6 text-gray-400">
              <Settings2 size={18} />
              <h2 className="text-sm font-semibold uppercase tracking-wider">New Question Set</h2>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Set Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Level 1 Basics"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white transition-all outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Digits</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select
                      value={digits}
                      onChange={(e) => setDigits(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white transition-all outline-none appearance-none"
                    >
                      <option value={1}>1 Digit</option>
                      <option value={2}>2 Digits</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Columns</label>
                  <div className="relative">
                    <Columns className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select
                      value={columns}
                      onChange={(e) => setColumns(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white transition-all outline-none appearance-none"
                    >
                      <option value={4}>4 Cols</option>
                      <option value={5}>5 Cols</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="neg"
                  checked={allowNegative}
                  onChange={(e) => setAllowNegative(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                />
                <label htmlFor="neg" className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <MinusCircle size={16} />
                  Allow Negative Numbers
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-50"
              >
                <Plus size={20} />
                Generate Set
              </button>
            </form>
          </motion.div>

          {/* Questions List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-4 text-gray-400">
              <h2 className="text-sm font-semibold uppercase tracking-wider">Existing Sets ({questions.length})</h2>
            </div>

            {questions.map((q, idx) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 flex items-center justify-between group hover:border-black/20 transition-all"
              >
                <div>
                  <h3 className="text-xl font-serif">{q.title}</h3>
                  <div className="flex gap-4 mt-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                      {q.digits} Digits
                    </span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                      {q.columns} Columns
                    </span>
                    {q.allow_negative && (
                      <span className="text-[10px] uppercase tracking-widest font-bold text-red-400 bg-red-50 px-2 py-1 rounded">
                        Negative Allowed
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right mr-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Problems</p>
                    <p className="text-xs font-mono text-gray-600">{q.problems.length} Questions</p>
                  </div>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            ))}

            {questions.length === 0 && (
              <div className="text-center py-20 bg-white/50 rounded-[32px] border border-dashed border-gray-300">
                <p className="text-gray-400 italic">No questions created yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
