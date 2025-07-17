import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface DictationSentence {
  id: number;
  text: string;
  audioUrl: string;
}

interface Lesson {
  id: number;
  title: string;
  content: string;
  level: string;
  thumbnail?: string;
  base_audio_url?: string;
  sentence_count?: number;
  created_at: string;
  sentences?: DictationSentence[];
}

// Toast component
const Toast: React.FC<{ message: string; type?: 'success' | 'error'; onClose: () => void }> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white font-bold ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{message}</div>
  );
};

const AdminDictationPage: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Lesson>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sentenceCount, setSentenceCount] = useState<number>(0);
  const [baseAudioUrl, setBaseAudioUrl] = useState<string>('');
  const [sentences, setSentences] = useState<DictationSentence[]>([]);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  // Hàm toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  // Fetch danh sách bài từ API
  const fetchLessons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/learning/dictation');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLessons(data.map((l: any) => ({ ...l, id: l.id || l.lessonId, created_at: l.createdAt || l.created_at })));
      } else {
        setLessons([]);
      }
    } catch (e) {
      setLessons([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  // Đếm số dòng nội dung để gợi ý số câu
  useEffect(() => {
    if (form.content) {
      const lines = form.content.split('\n').filter(line => line.trim() !== '');
      setSentenceCount(lines.length);
    }
  }, [form.content]);

  // Hàm chuẩn hóa base audio url
  function normalizeBaseAudioUrl(url: string) {
    return url.replace(/(\d+)\.mp3$/, '');
  }

  const handleBaseAudioUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const normalized = normalizeBaseAudioUrl(raw);
    setBaseAudioUrl(normalized);
  };

  // Lấy audio
  const handleGenerateAudioLinks = () => {
    if (!baseAudioUrl || !sentenceCount) {
      showToast('Vui lòng nhập link gốc và số câu', 'error');
      return;
    }
    const arr: DictationSentence[] = [];
    const lines = (form.content || '').split('\n').filter(line => line.trim() !== '');
    for (let i = 0; i < sentenceCount; i++) {
      arr.push({
        id: i + 1,
        text: lines[i] || '',
        audioUrl: `${baseAudioUrl}${baseAudioUrl.endsWith('/') ? '' : '/'}${i + 1}.mp3`
      });
    }
    setSentences(arr);
    showToast('Đã lấy audio cho từng câu!');
  };

  // Xếp câu
  const handleSplitSentences = () => {
    const lines = (form.content || '').split('\n').filter(line => line.trim() !== '');
    setSentenceCount(lines.length);
    setSentences(lines.map((text, idx) => ({
      id: idx + 1,
      text,
      audioUrl: baseAudioUrl ? `${baseAudioUrl}${baseAudioUrl.endsWith('/') ? '' : '/'}${idx + 1}.mp3` : ''
    })));
    showToast('Đã xếp câu thành công!');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'content') {
      const lines = e.target.value.split('\n').filter(line => line.trim() !== '');
      setSentenceCount(lines.length);
    }
  };

  const handleSentenceCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSentenceCount(val);
  };

  // Lưu bài dictation vào database
  const handleSaveLesson = async () => {
    if (!form.title || !form.content || !form.level || !baseAudioUrl || !sentenceCount || sentences.length === 0) {
      showToast('Vui lòng nhập đủ thông tin và tạo danh sách audio!', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/learning/dictation', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          title: form.title,
          content: form.content,
          level: form.level,
          thumbnail: form.thumbnail,
          base_audio_url: baseAudioUrl,
          sentence_count: sentenceCount,
          sentences: sentences
        })
      });
      if (!res.ok) throw new Error('Lỗi khi lưu bài dictation');
      showToast(editingId ? 'Cập nhật bài thành công!' : 'Đã lưu bài dictation!');
      setForm({});
      setBaseAudioUrl('');
      setSentenceCount(0);
      setSentences([]);
      setEditingId(null);
      await fetchLessons();
    } catch (e) {
      showToast('Lỗi khi lưu bài dictation!', 'error');
    }
    setIsLoading(false);
  };

  const handleEdit = async (lesson: Lesson) => {
    // Fetch sentences từ API (nếu có API detail), tạm thời chỉ lấy từ DB nếu có
    setForm(lesson);
    setEditingId(lesson.id);
    setBaseAudioUrl(lesson.base_audio_url || '');
    setSentenceCount(lesson.sentence_count || 0);
    // TODO: fetch sentences detail nếu có API, tạm thời clear
    setSentences([]);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá bài dictation này?')) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/learning/dictation?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Lỗi khi xoá bài dictation');
      showToast('Đã xoá bài dictation!', 'success');
      await fetchLessons();
    } catch (e) {
      showToast('Lỗi khi xoá bài dictation!', 'error');
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <h1 className="text-2xl font-bold mb-6">Quản lý bài Dictation</h1>
      <form className="bg-gray-700 rounded-lg p-4 mb-8">
        <div className="mb-3">
          <label className="block font-semibold mb-1">Tiêu đề</label>
          <input name="title" value={form.title || ''} onChange={handleChange} className="w-full text-black p-2 rounded border" />
        </div>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Nội dung (mỗi câu một dòng)</label>
          <textarea name="content" value={form.content || ''} onChange={handleChange} className="w-full text-black p-2 rounded border" rows={6} />
        </div>
        <div className="mb-3 flex gap-2 items-center">
          <label className="block font-semibold mb-1">Số câu</label>
          <input type="number" min={1} value={sentenceCount} onChange={handleSentenceCountChange} className="w-24 text-black p-2 rounded border" />
          <button type="button" onClick={handleSplitSentences} className="ml-2 px-3 py-1 bg-blue-500 text-white rounded">Xếp câu</button>
        </div>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Link gốc audio (kết thúc bằng / hoặc số.mp3)</label>
          <input value={baseAudioUrl} onChange={handleBaseAudioUrlChange} className="w-full text-black p-2 rounded border" placeholder="https://dailydictation.com/upload/general-english/285-the-story-of-anne-frank-2019-04-07-10-56-04/" />
        </div>
        <div className="mb-3">
          <button type="button" onClick={handleGenerateAudioLinks} className="px-3 py-1 bg-green-600 text-white rounded">Lấy audio</button>
        </div>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Cấp độ</label>
          <input name="level" value={form.level || ''} onChange={handleChange} className="w-full text-black p-2 rounded border" />
        </div>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Link thumbnail (nếu có)</label>
          <input name="thumbnail" value={form.thumbnail || ''} onChange={handleChange} className="w-full text-black p-2 rounded border" />
        </div>
        <button type="button" onClick={handleSaveLesson} className="bg-blue-600 text-white px-4 py-2 rounded font-bold" disabled={isLoading}>
          {editingId ? 'Cập nhật' : 'Lưu bài dictation'}
        </button>
        {editingId && (
          <button type="button" onClick={() => { setForm({}); setEditingId(null); setBaseAudioUrl(''); setSentenceCount(0); setSentences([]); }} className="ml-2 px-4 py-2 rounded bg-gray-400 text-white">Huỷ</button>
        )}
      </form>
      <h2 className="text-xl font-bold mb-4">Danh sách bài Dictation</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-700 rounded-lg shadow">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">Tên bài</th>
              <th className="py-2 px-4 border-b text-left">Cấp độ</th>
              <th className="py-2 px-4 border-b text-left">Số câu</th>
              <th className="py-2 px-4 border-b text-left">Chức năng</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="text-gray-500 py-4 text-center">Đang tải...</td></tr>
            ) : lessons.length === 0 ? (
              <tr><td colSpan={4} className="text-gray-500 py-4 text-center">Chưa có bài nào.</td></tr>
            ) : lessons.map(lesson => (
              <tr key={lesson.id} className="border-b">
                <td className="py-2 px-4">{lesson.title}</td>
                <td className="py-2 px-4">{lesson.level}</td>
                <td className="py-2 px-4">{lesson.sentence_count || (lesson.sentences ? lesson.sentences.length : 0)}</td>
                <td className="py-2 px-4">
                  <button onClick={() => handleEdit(lesson)} className="px-3 py-1 bg-yellow-400 rounded text-white font-bold mr-2">Sửa</button>
                  <button onClick={() => handleDelete(lesson.id)} className="px-3 py-1 bg-red-500 rounded text-white font-bold">Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Hiển thị danh sách câu và audio khi tạo mới */}
      {sentences.length > 0 && (
        <div className="mt-8 bg-gray-700 rounded-lg p-4">
          <div className="font-semibold mb-2">Xem trước danh sách câu & audio:</div>
          <ul className="list-decimal ml-6 text-sm">
            {sentences.map(s => (
              <li key={s.id} className="mb-1">
                <span className="font-bold">Câu {s.id}:</span> {s.text} <a href={s.audioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">Audio</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdminDictationPage; 