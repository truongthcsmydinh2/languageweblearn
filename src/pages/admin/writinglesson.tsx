import React, { useEffect, useState } from 'react';

const LEVELS = [
  { value: 'BEGINNER', label: 'Beginner', color: 'bg-green-500' },
  { value: 'INTERMEDIATE', label: 'Intermediate', color: 'bg-yellow-500' },
  { value: 'ADVANCED', label: 'Advanced', color: 'bg-red-500' },
];
const TYPES = [
  { value: 'EMAILS', label: 'Emails', color: 'bg-blue-500' },
  { value: 'DIARIES', label: 'Diaries', color: 'bg-purple-500' },
  { value: 'ESSAYS', label: 'Essays', color: 'bg-pink-500' },
  { value: 'ARTICLES', label: 'Articles', color: 'bg-indigo-500' },
  { value: 'STORIES', label: 'Stories', color: 'bg-orange-500' },
  { value: 'REPORTS', label: 'Reports', color: 'bg-teal-500' },
];

interface Lesson {
  id: number;
  title: string;
  content: string;
  level: string;
  type: string;
  created_at: string;
  updated_at: string;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

const AdminWritingLesson = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ id?: number; title: string; content: string; level: string; type: string }>({ title: '', content: '', level: 'BEGINNER', type: 'EMAILS' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [sentences, setSentences] = useState<{ vietnamese: string; answer_key: string; sentence_order: number }[]>([]);
  const [bulkAnswer, setBulkAnswer] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const fetchLessons = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/writinglesson');
    const data = await res.json();
    setLessons(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  useEffect(() => {
    const arr = splitSentences(form.content).map((v, idx) => {
      const existingSentence = sentences.find(s => s.sentence_order === idx + 1);
      return {
        vietnamese: v,
        answer_key: existingSentence ? existingSentence.answer_key : '',
        sentence_order: idx + 1
      };
    });
    setSentences(arr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.content]);

  useEffect(() => {
    if (!bulkAnswer) return;
    const enSentences = splitSentences(bulkAnswer);
    setSentences(prev => prev.map((item, idx) => ({
      ...item,
      answer_key: enSentences[idx] !== undefined ? enSentences[idx] : item.answer_key
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkAnswer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.content.trim() || !form.level || !form.type) {
      setError('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    if (sentences.some(s => !s.answer_key.trim())) {
      setError('Vui lòng nhập đáp án chuẩn cho tất cả các câu!');
      return;
    }
    const method = editingId ? 'PUT' : 'POST';
    const payload = editingId
      ? { ...form, id: editingId, sentences }
      : { ...form, sentences };
    const res = await fetch('/api/admin/writinglesson', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setError('Có lỗi xảy ra!');
      return;
    }
    setForm({ title: '', content: '', level: 'BEGINNER', type: 'EMAILS' });
    setEditingId(null);
    setShowForm(false);
    setSentences([]);
    setBulkAnswer('');
    fetchLessons();
  };

  const handleEdit = (lesson: Lesson) => {
    setForm({ title: lesson.title, content: lesson.content, level: lesson.level, type: lesson.type });
    setEditingId(lesson.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    await fetch('/api/admin/writinglesson', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchLessons();
  };

  const getLevel = (level: string) => LEVELS.find(l => l.value === level);
  const getType = (type: string) => TYPES.find(t => t.value === type);

  // Tính số câu khớp
  const sentenceCountMismatch = bulkAnswer && splitSentences(bulkAnswer).length !== sentences.length;
  const missingAnswerIdx = sentences.findIndex(s => !s.answer_key.trim());

  // Hàm xóa hết đáp án
  const handleClearAnswers = () => {
    setSentences(prev => prev.map(item => ({ ...item, answer_key: '' })));
    setBulkAnswer('');
  };

  // Hàm dịch bằng Gemini
  const translateWithGemini = async () => {
    if (!form.content.trim()) {
      setError('Vui lòng nhập nội dung tiếng Việt trước!');
      return;
    }

    setIsTranslating(true);
    setError('');

    try {
      const response = await fetch('/api/admin/translate-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vietnameseText: form.content,
          lessonType: form.type,
          lessonLevel: form.level
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translatedText) {
          setBulkAnswer(data.translatedText);
          // Tự động cập nhật sentences với bản dịch
          const translatedSentences = splitSentences(data.translatedText);
          setSentences(prev => prev.map((item, idx) => ({
            ...item,
            answer_key: translatedSentences[idx] || item.answer_key
          })));
        }
      } else {
        const errorData = await response.json();
        setError(`Lỗi dịch: ${errorData.error || 'Không thể dịch văn bản'}`);
      }
    } catch (error) {
      console.error('Error translating with Gemini:', error);
      setError('Có lỗi xảy ra khi dịch văn bản');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#181b22] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-8 text-center drop-shadow">Quản trị bài viết luyện viết</h1>
        <div className="mb-6 flex justify-end">
          <button
            className="bg-yellow-400 hover:bg-yellow-500 text-[#181b22] font-bold py-2 px-6 rounded-full shadow-lg"
            onClick={() => {
              setShowForm(true);
              setForm({ title: '', content: '', level: 'BEGINNER', type: 'EMAILS' });
              setEditingId(null);
              setSentences([]);
              setBulkAnswer('');
            }}
          >
            Thêm bài viết mới
          </button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-[#232733] rounded-xl p-6 mb-8 shadow-lg">
            <div className="mb-4">
              <label className="block text-yellow-400 font-bold mb-2">Tiêu đề</label>
              <input
                className="w-full p-3 rounded border border-yellow-400 bg-[#181b22] text-white"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-yellow-400 font-bold mb-2">Nội dung tiếng Việt</label>
              <textarea
                className="w-full p-3 rounded border border-yellow-400 bg-[#181b22] text-white min-h-[120px]"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                required
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={translateWithGemini}
                  disabled={isTranslating || !form.content.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isTranslating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang dịch...
                    </>
                  ) : (
                    <>
                      <span>🤖</span>
                      Dịch bằng Gemini
                    </>
                  )}
                </button>
              </div>
            </div>
            {sentences.length > 0 && (
              <div className="mb-4">
                <label className="block text-yellow-400 font-bold mb-2">Nhập đoạn đáp án chuẩn tiếng Anh (tự động tách câu)</label>
                <textarea
                  className="w-full p-3 rounded border border-yellow-400 bg-[#181b22] text-white min-h-[80px]"
                  placeholder="Nhập toàn bộ đoạn đáp án chuẩn tiếng Anh, mỗi câu kết thúc bằng dấu chấm, hỏi, cảm thán..."
                  value={bulkAnswer}
                  onChange={e => setBulkAnswer(e.target.value)}
                />
                <div className="flex items-center gap-4 mt-1">
                  <div className="text-gray-400 text-xs">Hệ thống sẽ tự động tách và gán vào từng câu bên dưới theo thứ tự.</div>
                  <button type="button" className="text-xs text-red-400 underline ml-auto" onClick={handleClearAnswers}>Xóa hết đáp án</button>
                </div>
                {sentenceCountMismatch && (
                  <div className="text-red-400 text-xs mt-1 font-semibold">⚠️ Số câu tiếng Anh ({splitSentences(bulkAnswer).length}) không khớp với số câu tiếng Việt ({sentences.length})!</div>
                )}
              </div>
            )}
            {sentences.length > 0 && (
              <div className="mb-4">
                <label className="block text-yellow-400 font-bold mb-2">Đáp án chuẩn cho từng câu</label>
                <div className="space-y-2">
                  {sentences.map((s, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-gray-300 min-w-[30px]">{idx + 1}.</span>
                      <span className="text-white flex-1">{s.vietnamese}</span>
                      <input
                        className={`flex-1 p-2 rounded border ${!s.answer_key.trim() ? 'border-red-400' : 'border-yellow-400'} bg-[#181b22] text-white`}
                        placeholder="Đáp án chuẩn tiếng Anh"
                        value={s.answer_key}
                        onChange={e => {
                          const val = e.target.value;
                          setSentences(prev => prev.map((item, i) => i === idx ? { ...item, answer_key: val } : item));
                        }}
                        required
                      />
                      {!s.answer_key.trim() && <span className="text-red-400 text-xs ml-2">Thiếu đáp án</span>}
                    </div>
                  ))}
                </div>
                {missingAnswerIdx !== -1 && (
                  <div className="text-red-400 text-xs mt-1 font-semibold">⚠️ Còn {sentences.filter(s => !s.answer_key.trim()).length} câu chưa nhập đáp án chuẩn!</div>
                )}
              </div>
            )}
            <div className="mb-4 flex gap-4">
              <div className="flex-1">
                <label className="block text-yellow-400 font-bold mb-2">Độ khó</label>
                <select
                  className="w-full p-3 rounded border border-yellow-400 bg-[#181b22] text-white"
                  value={form.level}
                  onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                  required
                >
                  {LEVELS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-yellow-400 font-bold mb-2">Loại bài</label>
                <select
                  className="w-full p-3 rounded border border-yellow-400 bg-[#181b22] text-white"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  required
                >
                  {TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {error && <div className="text-red-400 mb-2">{error}</div>}
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-500 text-[#181b22] font-bold py-2 px-8 rounded-full shadow-lg"
              >
                {editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
              <button
                type="button"
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-8 rounded-full"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm({ title: '', content: '', level: 'BEGINNER', type: 'EMAILS' });
                  setSentences([]);
                  setBulkAnswer('');
                }}
              >
                Hủy
              </button>
            </div>
          </form>
        )}
        <div className="bg-[#232733] rounded-xl shadow-lg p-6 overflow-x-auto">
          {loading ? (
            <div className="text-white text-center">Đang tải...</div>
          ) : lessons.length === 0 ? (
            <div className="text-gray-400 text-center">Chưa có bài viết nào.</div>
          ) : (
            <table className="w-full text-white border-separate border-spacing-y-2">
              <thead>
                <tr className="text-yellow-400 text-left text-base">
                  <th className="py-2">Tiêu đề</th>
                  <th className="py-2">Độ khó</th>
                  <th className="py-2">Loại bài</th>
                  <th className="py-2">Ngày tạo</th>
                  <th className="py-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map(lesson => (
                  <tr key={lesson.id} className="bg-[#232733] rounded-xl shadow border border-gray-700">
                    <td className="py-2 font-semibold max-w-[220px] truncate text-base">{lesson.title}</td>
                    <td className="py-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getLevel(lesson.level)?.color || 'bg-gray-500'}`}>{getLevel(lesson.level)?.label || lesson.level}</span>
                    </td>
                    <td className="py-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getType(lesson.type)?.color || 'bg-gray-500'}`}>{getType(lesson.type)?.label || lesson.type}</span>
                    </td>
                    <td className="py-2 text-xs">{new Date(lesson.created_at).toLocaleString()}</td>
                    <td className="py-2 flex gap-2">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-4 rounded-full shadow"
                        onClick={() => handleEdit(lesson)}
                      >
                        Sửa
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-4 rounded-full shadow"
                        onClick={() => handleDelete(lesson.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminWritingLesson;