import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout';
import { MdVolumeUp, MdCheckCircle, MdClose, MdNavigateNext, MdNavigateBefore } from 'react-icons/md';
import { useAuth } from '@/contexts/AuthContext';

interface Sentence {
  id: number;
  text: string;
  audio_url: string;
}

interface Lesson {
  id: string;
  title: string;
  level: string;
  sentences: Sentence[];
  created_at: string;
}

const DictationLessonPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const [audioRate, setAudioRate] = useState(1);
  const [repeatCount, setRepeatCount] = useState(1);
  const [playTimes, setPlayTimes] = useState(0);
  const [checking, setChecking] = useState(false);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);

  // Lấy dữ liệu bài học
  useEffect(() => {
    if (!id) return;
    setStartTime(Date.now());
    const fetchLesson = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/learning/dictation');
        const data = await res.json();
        const found = Array.isArray(data) ? data.find((l: any) => l.id == id || l.lessonId == id) : null;
        if (found && found.sentences) {
          setLesson({
            id: found.id,
            title: found.title,
            level: found.level,
            sentences: found.sentences,
            created_at: found.created_at || found.createdAt,
          });
          setAnswers(new Array(found.sentences.length).fill(''));
          setError(null);
        } else {
          setLesson(null);
          setError('Không tìm thấy bài dictation này.');
        }
      } catch (e) {
        setLesson(null);
        setError('Không lấy được dữ liệu bài dictation.');
      }
      setIsLoading(false);
    };
    fetchLesson();
  }, [id]);

  // Phát audio với tốc độ và số lần lặp
  const playAudio = (audioUrl: string, times = repeatCount) => {
    let count = 0;
    const play = () => {
      const audio = new Audio(audioUrl);
      audio.playbackRate = audioRate;
      audio.play();
      setPlayTimes(count + 1);
      audio.onended = () => {
        count++;
        if (count < times) play();
      };
    };
    play();
  };

  // Bắt phím tắt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (lesson) playAudio(lesson.sentences[currentSentence].audio_url);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!showResult && !checking) handleCheckAnswer();
        else if (showResult && wrongIndex === null) handleNext();
        else if (showResult && wrongIndex !== null) {
          setShowResult(false);
          setChecking(false);
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lesson, currentSentence, showResult, checking, wrongIndex, audioRate, repeatCount]);

  // Kiểm tra đáp án từng ký tự
  const handleCheckAnswer = () => {
    setChecking(true);
    if (!lesson) return;
    const userAns = (answers[currentSentence] || '');
    const correct = lesson.sentences[currentSentence].text;
    let firstWrong = null;
    for (let i = 0; i < correct.length; i++) {
      if (userAns[i] !== correct[i]) {
        firstWrong = i;
        break;
      }
    }
    if (firstWrong === null && userAns.length === correct.length) {
      // Đúng hoàn toàn
      setWrongIndex(null);
      setShowResult(true);
      setChecking(false);
      setTimeout(() => handleNext(), 1000);
    } else {
      setWrongIndex(firstWrong ?? userAns.length);
      setShowResult(true);
      setChecking(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(firstWrong ?? userAns.length, firstWrong ?? userAns.length);
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // Khi nhập lại, giữ nguyên phần đúng
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (wrongIndex !== null && lesson) {
      const correct = lesson.sentences[currentSentence].text.trim();
      const correctWords = correct.split(/\s+/);
      const prefix = correctWords.slice(0, wrongIndex).join(' ');
      if (!value.startsWith(prefix)) value = prefix + (value.startsWith(' ') ? '' : ' ') + value.slice(prefix.length);
    }
    handleAnswerChange(currentSentence, value);
  };

  const handleAnswerChange = (idx: number, value: string) => {
    setAnswers(ans => ans.map((a, i) => (i === idx ? value : a)));
  };

  const handleCheckResult = async () => {
    setShowResult(true);
    // Lưu tiến trình nếu đã đăng nhập
    if (user && lesson) {
      const correctCount = answers.reduce((acc, ans, idx) =>
        ans.trim().toLowerCase() === lesson.sentences[idx].text.trim().toLowerCase() ? acc + 1 : acc, 0);
      const duration = Math.floor((Date.now() - startTime) / 1000);
      try {
        const res = await fetch('/api/learning/dictation/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            lessonId: lesson.id,
            answers,
            correctCount,
            total: lesson.sentences.length,
            duration
          })
        });
        if (res.ok) {
          setSaveStatus('Đã lưu kết quả làm bài!');
        } else {
          setSaveStatus('Lưu kết quả thất bại!');
        }
      } catch (e) {
        setSaveStatus('Lưu kết quả thất bại!');
      }
    }
  };

  const handlePrev = () => {
    setCurrentSentence(i => (i > 0 ? i - 1 : i));
  };
  const handleNext = () => {
    setCurrentSentence(i => (lesson && i < lesson.sentences.length - 1 ? i + 1 : i));
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto py-12 text-center text-red-600 font-semibold">{error}</div>
      </Layout>
    );
  }

  if (!lesson) return null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-gray-900 rounded-2xl shadow-xl p-6 relative border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-block bg-blue-700 text-white rounded-full p-2"><MdVolumeUp size={28} /></span>
            <h1 className="text-2xl font-bold text-white tracking-wide">{lesson.title}</h1>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-blue-900 text-blue-200 text-xs px-3 py-1 rounded-full">Cấp độ: {lesson.level}</span>
            <span className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full">Ngày tạo: {lesson.created_at ? new Date(lesson.created_at).toLocaleDateString('vi-VN') : ''}</span>
          </div>
          {/* Stepper số câu */}
          <div className="flex justify-center gap-2 mb-6">
            {lesson.sentences.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSentence(idx)}
                className={`w-4 h-4 rounded-full border-2 ${idx === currentSentence ? 'bg-blue-500 border-blue-400 shadow' : 'bg-gray-700 border-gray-600'} transition`}
                aria-label={`Câu ${idx + 1}`}
              />
            ))}
          </div>
          {/* Tùy chọn tốc độ & số lần phát */}
          <div className="flex gap-4 items-center justify-center mb-4">
            <div className="bg-gray-800 rounded-lg shadow px-3 py-2 flex items-center gap-2">
              <MdVolumeUp className="text-blue-400" />
              <span className="text-sm font-medium text-blue-200">Tốc độ:</span>
              <select value={audioRate} onChange={e => setAudioRate(Number(e.target.value))} className="border border-gray-700 bg-gray-900 text-blue-100 rounded px-2 py-1">
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
              </select>
            </div>
            <div className="bg-gray-800 rounded-lg shadow px-3 py-2 flex items-center gap-2">
              <span className="text-sm font-medium text-blue-200">Số lần phát:</span>
              <select value={repeatCount} onChange={e => setRepeatCount(Number(e.target.value))} className="border border-gray-700 bg-gray-900 text-blue-100 rounded px-2 py-1">
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>
          </div>
          {/* Khu vực nghe audio và nhập đáp án */}
          <div className="flex flex-col items-center mb-6">
            <button
              onClick={() => playAudio(lesson.sentences[currentSentence].audio_url)}
              className="w-16 h-16 bg-gradient-to-br from-blue-700 to-indigo-900 text-white rounded-full flex items-center justify-center shadow-lg mb-3 hover:scale-105 transition-transform border-2 border-blue-900"
            >
              <MdVolumeUp size={36} />
            </button>
            <span className="text-gray-200 font-semibold mb-2">Câu {currentSentence + 1}/{lesson.sentences.length}</span>
            <input
              ref={inputRef}
              type="text"
              className={`w-full p-4 rounded-xl text-lg border-2 focus:outline-none transition-all bg-gray-800 text-white placeholder-gray-500 ${showResult ? (wrongIndex === null ? 'border-green-500 bg-green-900/30' : 'border-red-500 bg-red-900/30') : 'border-blue-900'}`}
              placeholder="Nhập đáp án, nhấn Enter để kiểm tra..."
              value={answers[currentSentence] || ''}
              onChange={handleInputChange}
              disabled={showResult && wrongIndex === null}
            />
            {/* Hiển thị phần đúng/sai khi sai - xoá hoàn toàn */}
            {/* Thông báo kết quả */}
            {showResult && (
              <div className="mt-4 flex flex-col items-center gap-2">
                {wrongIndex === null ? (
                  <span className="text-green-400 flex items-center gap-1 animate-bounce"><MdCheckCircle size={24}/> <b>Chính xác!</b></span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1 animate-shake"><MdClose size={24}/> <b>Sai rồi!</b></span>
                )}
                <span className="text-yellow-200">Đáp án đúng: <b>{lesson.sentences[currentSentence].text}</b></span>
                {wrongIndex !== null && (
                  <span className="text-yellow-400">Bạn sai ở ký tự thứ {wrongIndex + 1}</span>
                )}
              </div>
            )}
          </div>
          {/* Nút chức năng */}
          <div className="flex gap-4 justify-center mt-6">
            {!showResult && (
              <button onClick={handleCheckAnswer} className="bg-gradient-to-r from-green-700 to-green-900 text-white px-6 py-2 rounded-full font-bold shadow hover:scale-105 transition">Kiểm tra kết quả</button>
            )}
            {showResult && (
              <button onClick={() => { setShowResult(false); setSaveStatus(null); setStartTime(Date.now()); }} className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-6 py-2 rounded-full font-bold shadow hover:scale-105 transition">Làm lại</button>
            )}
            <button onClick={() => router.push('/learning/dailydictation')} className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-6 py-2 rounded-full font-bold shadow hover:scale-105 transition">Quay lại danh sách</button>
          </div>
          {saveStatus && (
            <div className="mt-4 text-center text-sm text-green-400 font-semibold">{saveStatus}</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DictationLessonPage; 