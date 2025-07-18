import React, { useState } from 'react';
import { NextPage } from 'next';

interface VocabItem {
  id: number;
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
  difficulty: number;
  synonyms: string[];
}

const VocabSkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse border border-gray-100">
    {/* Header skeleton */}
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <div className="h-8 bg-gray-300 rounded-lg mb-2 w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
      <div className="w-12 h-6 bg-gray-300 rounded-full"></div>
    </div>
    
    {/* Meaning skeleton */}
    <div className="mb-4">
      <div className="h-5 bg-gray-300 rounded mb-2 w-2/3"></div>
    </div>
    
    {/* Example skeleton */}
    <div className="mb-4">
      <div className="h-4 bg-gray-300 rounded mb-1 w-full"></div>
      <div className="h-4 bg-gray-300 rounded w-4/5"></div>
    </div>
    
    {/* Synonyms skeleton */}
    <div className="flex gap-2">
      <div className="h-6 bg-gray-300 rounded-full w-16"></div>
      <div className="h-6 bg-gray-300 rounded-full w-20"></div>
      <div className="h-6 bg-gray-300 rounded-full w-18"></div>
    </div>
  </div>
);

const VocabCard: React.FC<{ vocab: VocabItem; index: number }> = ({ vocab, index }) => {
  const [showTranslation, setShowTranslation] = useState(false);
  
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-100 text-green-800';
    if (difficulty <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  const getPartOfSpeechColor = (pos: string) => {
    const colors: { [key: string]: string } = {
      noun: 'bg-blue-100 text-blue-800',
      verb: 'bg-green-100 text-green-800',
      adjective: 'bg-purple-100 text-purple-800',
      adverb: 'bg-orange-100 text-orange-800',
      preposition: 'bg-pink-100 text-pink-800',
    };
    return colors[pos.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 transform transition-all duration-500 hover:scale-105 hover:shadow-xl"
      style={{ 
        animationDelay: `${index * 100}ms`,
        animation: 'slideInUp 0.6s ease-out forwards'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{vocab.word}</h3>
          <p className="text-gray-500 text-sm">{vocab.pronunciation}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(vocab.difficulty)}`}>
            Level {vocab.difficulty}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPartOfSpeechColor(vocab.partOfSpeech)}`}>
            {vocab.partOfSpeech}
          </span>
        </div>
      </div>
      
      {/* Meaning */}
      <div className="mb-4">
        <p className="text-lg text-gray-700 font-medium">{vocab.meaning}</p>
      </div>
      
      {/* Example */}
      <div className="mb-4 bg-gray-50 rounded-lg p-4">
        <p className="text-gray-800 italic mb-2">📝 "{vocab.example}"</p>
        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
        >
          {showTranslation ? '🙈 Ẩn bản dịch' : '👁️ Xem bản dịch'}
        </button>
        {showTranslation && (
          <p className="text-gray-600 mt-2 text-sm">🇻🇳 {vocab.exampleTranslation}</p>
        )}
      </div>
      
      {/* Synonyms */}
      {vocab.synonyms && vocab.synonyms.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-2">Từ đồng nghĩa:</p>
          <div className="flex flex-wrap gap-2">
            {vocab.synonyms.map((synonym, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
              >
                {synonym}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const VocabStreamingDemo: NextPage = () => {
  const [vocabItems, setVocabItems] = useState<VocabItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('technology');
  const [level, setLevel] = useState('intermediate');
  const [count, setCount] = useState(8);

  const startStreaming = async () => {
    setVocabItems([]);
    setLoading(true);

    try {
      const response = await fetch('/api/demo/stream-vocab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, level, count }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Xử lý từng dòng JSON hoàn chỉnh
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.substring(0, newlineIndex).trim();
          buffer = buffer.substring(newlineIndex + 1);

          if (line) {
            try {
              const vocabItem: VocabItem = JSON.parse(line);
              setVocabItems(prev => [...prev, vocabItem]);
            } catch (e) {
              console.error('Error parsing JSON line:', line, e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            📚 Vocab Streaming Demo
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            Trải nghiệm học từ vựng với skeleton loading và streaming AI
          </p>
          
          {/* Controls */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chủ đề</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="technology, business, travel..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={4}>4 từ</option>
                  <option value={6}>6 từ</option>
                  <option value={8}>8 từ</option>
                  <option value={12}>12 từ</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={startStreaming}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-2 rounded-lg transition-all duration-200 font-medium"
                >
                  {loading ? '🔄 Đang tạo...' : '✨ Tạo từ vựng'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-6 bg-white rounded-xl px-8 py-4 shadow-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{vocabItems.length}</div>
              <div className="text-sm text-gray-600">Đã tải</div>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{count}</div>
              <div className="text-sm text-gray-600">Tổng cộng</div>
            </div>
            {loading && (
              <>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-2xl">⏳</div>
                  <div className="text-sm text-orange-600">Streaming...</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Vocab Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Hiển thị từ vựng đã tải */}
          {vocabItems.map((vocab, index) => (
            <VocabCard key={vocab.id} vocab={vocab} index={index} />
          ))}
          
          {/* Hiển thị skeleton cho các vị trí chưa có dữ liệu */}
          {loading && Array.from({ length: count - vocabItems.length }).map((_, index) => (
            <VocabSkeleton key={`skeleton-${index}`} />
          ))}
        </div>

        {/* Tutorial */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">🎯 Kỹ thuật Skeleton + Streaming</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">1. Skeleton UI</h3>
              <p className="text-gray-600 text-sm">
                Hiển thị ngay khung xương với animation pulse để người dùng biết đang tải
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌊</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">2. JSONL Streaming</h3>
              <p className="text-gray-600 text-sm">
                AI trả về từng dòng JSON hoàn chỉnh, frontend parse và hiển thị ngay
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">3. Progressive Fill</h3>
              <p className="text-gray-600 text-sm">
                Thay thế skeleton bằng dữ liệu thật với animation mượt mà
              </p>
            </div>
          </div>
          
          <div className="mt-8 bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold mb-4">🔧 Ưu điểm của kỹ thuật này:</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Trải nghiệm người dùng mượt mà</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Giảm thời gian chờ đợi cảm nhận</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Hiển thị dữ liệu ngay khi có</span>
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Tận dụng tốc độ streaming AI</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Giao diện responsive và đẹp mắt</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Dễ dàng tùy chỉnh và mở rộng</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocabStreamingDemo;