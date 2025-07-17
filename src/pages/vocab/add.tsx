import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

type AddMode = 'single' | 'multiple';

interface DuplicateTerm {
  vocab: string;
  meaning: string;
  duplicateId?: number;
  reason?: string;
  error?: string;
}

interface SimilarTerm {
  id: number;
  vocab: string;
  meaning: string;
  similarity: 'vocab' | 'meaning';
}

interface ModifiedTerm {
  originalVocab: string;
  modifiedVocab: string;
  meaning: string;
}

const AddVocabPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<AddMode>('single');
  const [isLoading, setIsLoading] = useState(false);
  const [singleTerm, setSingleTerm] = useState({ vocab: '', meaning: '', part_of_speech: '' });
  const [usePartOfSpeech, setUsePartOfSpeech] = useState(false);
  const [autoDetect, setAutoDetect] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<number | null>(null);
  const [existingMeanings, setExistingMeanings] = useState<string[]>([]);
  const [showExistingMeanings, setShowExistingMeanings] = useState(false);
  const [duplicateTerms, setDuplicateTerms] = useState<DuplicateTerm[]>([]);
  const [similarTerms, setSimilarTerms] = useState<SimilarTerm[]>([]);
  const [modifiedVocab, setModifiedVocab] = useState<string | null>(null);
  const [modifiedTerms, setModifiedTerms] = useState<ModifiedTerm[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showSimilarTermsModal, setShowSimilarTermsModal] = useState(false);
  const [showModifiedVocabModal, setShowModifiedVocabModal] = useState(false);
  const [includeBulkPartOfSpeech, setIncludeBulkPartOfSpeech] = useState(false);

  // Danh sách từ loại phổ biến
  const PARTS_OF_SPEECH = [
    { value: 'noun', label: 'Danh từ' },
    { value: 'verb', label: 'Động từ' },
    { value: 'adjective', label: 'Tính từ' },
    { value: 'adverb', label: 'Trạng từ' },
    { value: 'preposition', label: 'Giới từ' },
    { value: 'conjunction', label: 'Liên từ' },
    { value: 'pronoun', label: 'Đại từ' },
    { value: 'interjection', label: 'Thán từ' },
    { value: 'phrase', label: 'Cụm từ' },
  ];

  // Hàm xác định từ loại tự động (đã cải thiện)
  const detectPartOfSpeech = (word: string): string => {
    // Kiểm tra chuỗi rỗng
    if (!word || !word.trim()) return '';
    
    const lowerWord = word.toLowerCase().trim();
    
    // Kiểm tra nếu có nhiều từ => phrase
    if (lowerWord.includes(' ')) {
      return 'phrase';
    }
    
    // Danh sách từ tính từ thường gặp kết thúc bằng "ing"
    const adjectivesWithIng = [
      'amazing', 'amusing', 'annoying', 'boring', 'charming', 'confusing',
      'convincing', 'depressing', 'disappointing', 'disgusting', 'embarrassing',
      'encouraging', 'entertaining', 'exciting', 'fascinating', 'frightening',
      'interesting', 'shocking', 'surprising', 'worrying', 'pleasing', 'tiring',
      'relaxing', 'satisfying', 'terrifying', 'thrilling', 'welcoming', 'moving'
    ];
    
    // Kiểm tra từ có trong danh sách tính từ đặc biệt
    if (adjectivesWithIng.includes(lowerWord)) {
      return 'adjective';
    }
    
    // Tính từ (có cấu trúc đặc trưng) - đặt trước để ưu tiên hơn so với các quy tắc khác
    if (
      lowerWord.endsWith('ic') || lowerWord.endsWith('ical') || // magic, logical, climatic
      lowerWord.endsWith('able') || lowerWord.endsWith('ible') || // comfortable, possible
      lowerWord.endsWith('al') || lowerWord.endsWith('ial') || // national, facial
      lowerWord.endsWith('ant') || lowerWord.endsWith('ent') || // distant, different
      lowerWord.endsWith('ful') || lowerWord.endsWith('less') || // beautiful, careless
      lowerWord.endsWith('ive') || lowerWord.endsWith('ative') || // active, creative
      lowerWord.endsWith('ous') || lowerWord.endsWith('ious') || // dangerous, delicious
      lowerWord.endsWith('ary') || lowerWord.endsWith('ory') || // necessary, satisfactory
      (lowerWord.endsWith('y') && lowerWord.length > 3) // happy, funny, sexy, etc.
    ) {
      return 'adjective';
    }
    
    // Trạng từ (có cấu trúc đặc trưng)
    if (
      lowerWord.endsWith('ly') || // quickly
      lowerWord.endsWith('ward') || lowerWord.endsWith('wards') || // forward, backwards
      lowerWord.endsWith('wise') // clockwise
    ) {
      return 'adverb';
    }
    
    // Danh từ (có cấu trúc đặc trưng)
    if (
      lowerWord.endsWith('tion') || lowerWord.endsWith('sion') || // creation, decision
      lowerWord.endsWith('ity') || lowerWord.endsWith('ness') || // equality, happiness
      lowerWord.endsWith('ment') || lowerWord.endsWith('hood') || // development, childhood
      lowerWord.endsWith('ship') || lowerWord.endsWith('dom') || // friendship, kingdom
      lowerWord.endsWith('ism') || lowerWord.endsWith('ist') || // capitalism, scientist
      lowerWord.endsWith('ance') || lowerWord.endsWith('ence') || // performance, difference
      lowerWord.endsWith('er') || lowerWord.endsWith('or') || // teacher, actor
      lowerWord.endsWith('age') || // village
      lowerWord.endsWith('graphy') || // biography
      lowerWord.endsWith('logy') // biology
    ) {
      return 'noun';
    }
    
    // Động từ (có cấu trúc đặc trưng)
    if (
      lowerWord.endsWith('ize') || lowerWord.endsWith('ise') || // realize, advertise
      lowerWord.endsWith('ate') || // activate
      lowerWord.endsWith('fy') || lowerWord.endsWith('ify') || // classify, simplify
      lowerWord.endsWith('en') && lowerWord.length > 4 || // brighten, strengthen (nhưng không phải "men", "ten")
      // Nhiều từ kết thúc bằng 'ing' là động từ, trừ những trường hợp đã kiểm tra ở trên
      (lowerWord.endsWith('ing') && !adjectivesWithIng.includes(lowerWord) && lowerWord.length > 5) ||
      (lowerWord.endsWith('ed') && !lowerWord.endsWith('ied') && lowerWord.length > 4) // jumped (nhưng không phải "red" hoặc "bed")
    ) {
      return 'verb';
    }
    
    // Giới từ phổ biến
    const prepositions = ['in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'against', 'between', 'through', 'during', 'before', 'after', 'above', 'below', 'under', 'over', 'into', 'throughout', 'behind', 'beyond', 'around', 'beside', 'among', 'along', 'across', 'towards', 'upon'];
    if (prepositions.includes(lowerWord)) {
      return 'preposition';
    }
    
    // Liên từ phổ biến
    const conjunctions = ['and', 'but', 'or', 'nor', 'so', 'yet', 'for', 'because', 'if', 'although', 'since', 'unless', 'while', 'where', 'whereas', 'whether', 'though', 'until', 'whenever', 'after', 'before', 'once', 'than', 'that'];
    if (conjunctions.includes(lowerWord)) {
      return 'conjunction';
    }
    
    // Đại từ phổ biến
    const pronouns = ['i', 'me', 'my', 'mine', 'myself', 'you', 'your', 'yours', 'yourself', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'we', 'us', 'our', 'ours', 'ourselves', 'they', 'them', 'their', 'theirs', 'themselves', 'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which', 'what', 'whatever', 'whoever', 'whomever', 'everyone', 'everybody', 'someone', 'somebody', 'anyone', 'anybody', 'everyone', 'everybody', 'noone', 'nobody'];
    if (pronouns.includes(lowerWord)) {
      return 'pronoun';
    }
    
    // Thán từ phổ biến
    const interjections = ['oh', 'wow', 'hey', 'hi', 'hello', 'ouch', 'ah', 'alas', 'aha', 'oops', 'yay', 'hurray', 'uh', 'um', 'er', 'hmm', 'yeah', 'no', 'yes', 'goodbye', 'bye', 'damn', 'shit', 'yikes', 'phew', 'woah', 'cheers', 'congrats', 'bingo', 'bravo', 'hooray'];
    if (interjections.includes(lowerWord)) {
      return 'interjection';
    }
    
    // Nếu word ngắn và không kết thúc bằng 's' thì có thể là danh từ
    if (lowerWord.length <= 5 && !lowerWord.endsWith('s')) {
      return 'noun';
    }
    
    // Mặc định là noun cho các từ không xác định được
    return 'noun';
  };

  // Xử lý khi thay đổi tùy chọn
  const handlePartOfSpeechOptionChange = (option: 'manual' | 'auto' | 'none') => {
    if (option === 'manual') {
      setUsePartOfSpeech(true);
      setAutoDetect(false);
    } else if (option === 'auto') {
      setUsePartOfSpeech(false);
      setAutoDetect(true);
    } else {
      setUsePartOfSpeech(false);
      setAutoDetect(false);
    }
  };

  const handleSingleTermAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra đầu vào
    if (!singleTerm.vocab.trim()) {
      alert('Từ vựng không được để trống!');
      return;
    }
    
    if (!singleTerm.meaning.trim()) {
      alert('Nghĩa của từ không được để trống!');
      return;
    }
    
    // Kiểm tra người dùng đã đăng nhập chưa
    if (!user || !user.uid) {
      alert('Bạn cần đăng nhập để thêm từ vựng!');
      router.push('/auth/signin');
      return;
    }
    
    try {
      setIsLoading(true);
      setDuplicateError(null);
      setDuplicateId(null);
      setExistingMeanings([]);
      setSimilarTerms([]);
      setModifiedVocab(null);
      
      // Xác định part_of_speech
      let selectedPartOfSpeech;
      if (usePartOfSpeech) {
        selectedPartOfSpeech = singleTerm.part_of_speech;
      } else if (autoDetect) {
        selectedPartOfSpeech = detectPartOfSpeech(singleTerm.vocab);
      }
      
      // Tạo term mới
      const newTerm = {
        vocab: singleTerm.vocab.trim(),
        meaning: singleTerm.meaning.trim(),
        level_en: 0,
        level_vi: 0,
        timeAdded: Date.now(),
        review_time_en: new Date().toISOString().slice(0, 10), // Set to current date
        review_time_vi: new Date().toISOString().slice(0, 10), // Set to current date
        part_of_speech: selectedPartOfSpeech
      };

      console.log('Sending term to API:', newTerm);
      console.log('User ID:', user.uid);

      // Gọi API với firebase_uid trong header
      const response = await fetch('/api/vocab', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'firebase_uid': user.uid
        },
        body: JSON.stringify(newTerm),
      });

      console.log('API response status:', response.status);
      
      if (response.status === 409) {
        const data = await response.json();
        setDuplicateError(data.message);
        setDuplicateId(data.duplicateId);
        if (data.meanings) {
          setExistingMeanings(data.meanings);
          setShowExistingMeanings(true);
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.meanings) {
        // Nếu từ đã tồn tại và được cập nhật nghĩa mới
        alert(data.message);
        router.push('/vocab');
        return;
      }
      
      // Kiểm tra xem từ vựng có bị sửa đổi không
      if (data.modifiedVocab) {
        setModifiedVocab(data.modifiedVocab);
        setShowModifiedVocabModal(true);
        setIsLoading(false);
        return;
      }
      
      // Kiểm tra xem có các từ tương tự không
      if (data.similarTerms && data.similarTerms.length > 0) {
        setSimilarTerms(data.similarTerms);
        setShowSimilarTermsModal(true);
        setIsLoading(false);
        return;
      }
      
      router.push('/vocab');
    } catch (error) {
      console.error('Error adding term:', error);
      alert(`Có lỗi xảy ra khi thêm từ: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Kiểm tra người dùng đã đăng nhập chưa
      if (!user || !user.uid) {
        alert('Bạn cần đăng nhập để thêm từ vựng!');
        router.push('/auth/signin');
        return;
      }
      
      setIsLoading(true);
      setDuplicateTerms([]);
      setModifiedTerms([]);
      
      // Tạo danh sách các từ mới
      const newTerms = bulkText
        .split('\n')
        .map(line => {
          // Nếu sử dụng part_of_speech, format sẽ là: vocab [tab] part_of_speech [tab] meaning
          // Nếu không, format sẽ vẫn là: vocab [tab] meaning
          let vocab, meaning, part_of_speech;
          
          if (includeBulkPartOfSpeech) {
            const parts = line.split('\t');
            if (parts.length < 3) return null;
            
            [vocab, part_of_speech, meaning] = parts;
          } else {
            const parts = line.split('\t');
            if (parts.length < 2) return null;
            
            [vocab, meaning] = parts;
          }
          
          if (!vocab?.trim() || !meaning?.trim()) return null;
          
          return {
            vocab: vocab.trim(),
            meaning: meaning.trim(),
            level_en: 0,
            level_vi: 0,
            timeAdded: Date.now(),
            review_time_en: new Date().toISOString().slice(0, 10), // Set to current date
            review_time_vi: new Date().toISOString().slice(0, 10), // Set to current date
            part_of_speech: includeBulkPartOfSpeech ? part_of_speech?.trim() : undefined
          };
        })
        .filter((term): term is NonNullable<typeof term> => term !== null);

      if (newTerms.length === 0) {
        alert('Không có từ nào được thêm. Vui lòng kiểm tra định dạng nhập.');
        setIsLoading(false);
        return;
      }

      console.log('Sending bulk terms to API:', newTerms.length, 'terms');
      console.log('User ID:', user.uid);

      // Gọi API để thêm nhiều từ vựng - THÊM firebase_uid vào header
      const response = await fetch('/api/vocab/bulk-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': user.uid
        },
        body: JSON.stringify({ terms: newTerms }),
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to add vocab terms');
      }

      // Đọc dữ liệu từ response
      const result = await response.json();
      console.log('API success response:', result);
      
      // Kiểm tra xem có từ nào bị trùng hoặc sửa đổi không
      const hasSkippedDuplicates = result.duplicates > 0 && result.skippedDuplicates && result.skippedDuplicates.length > 0;
      const hasModifiedTerms = result.modifiedTerms && result.modifiedTerms.length > 0;
      
      if (hasSkippedDuplicates || hasModifiedTerms) {
        if (hasSkippedDuplicates) {
          setDuplicateTerms(result.skippedDuplicates);
        }
        
        if (hasModifiedTerms) {
          setModifiedTerms(result.modifiedTerms);
        }
        
        setShowDuplicateModal(true);
        setIsLoading(false);
        
        // Hiển thị thông báo với số liệu chính xác
        alert(`Đã xử lý ${result.total} từ (thêm mới: ${result.added}, bỏ qua do trùng lặp: ${result.duplicates}, sửa đổi: ${result.modifiedTerms?.length || 0})`);
      } else {
        // Hiển thị thông báo với số liệu chính xác
        alert(`Đã thêm thành công ${result.added} từ vựng mới`);
        router.push('/vocab');
      }
    } catch (error) {
      console.error('Error adding terms:', error);
      alert('Có lỗi xảy ra khi thêm từ: ' + (error instanceof Error ? error.message : String(error)));
      setIsLoading(false);
    }
  };

  const viewDuplicateTerm = (id: number) => {
    router.push(`/vocab?highlight=${id}`);
  };

  const continueBulkAdd = () => {
    setShowDuplicateModal(false);
    router.push('/vocab');
  };

  const continueAfterSimilarTerms = () => {
    setShowSimilarTermsModal(false);
    router.push('/vocab');
  };

  const continueAfterModifiedVocab = () => {
    setShowModifiedVocabModal(false);
    router.push('/vocab');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-indigo-800 mb-6">Thêm từ vựng mới</h1>

          {/* Mode Selection */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMode('single')}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                mode === 'single'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Thêm từng từ
            </button>
            <button
              onClick={() => setMode('multiple')}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                mode === 'multiple'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Thêm nhiều từ
            </button>
          </div>

          {duplicateError && (
            <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
              <p className="font-medium">{duplicateError}</p>
              
              <div className="mt-2 flex space-x-2">
                {duplicateId && (
                  <button 
                    onClick={() => viewDuplicateTerm(duplicateId)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Xem từ đã tồn tại
                  </button>
                )}
                <button 
                  onClick={() => {
                    setDuplicateError(null);
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Thử lại
                </button>
              </div>
            </div>
          )}

          {showExistingMeanings && existingMeanings.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
              <h3 className="font-medium text-yellow-800 mb-2">Các nghĩa hiện tại của từ này:</h3>
              <ul className="list-disc list-inside">
                {existingMeanings.map((meaning, index) => (
                  <li key={index} className="text-yellow-800">{meaning}</li>
                ))}
              </ul>
            </div>
          )}

          {mode === 'single' ? (
            <form onSubmit={handleSingleTermAdd} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Từ vựng</label>
                <input
                  type="text"
                  value={singleTerm.vocab}
                  onChange={(e) => setSingleTerm({ ...singleTerm, vocab: e.target.value })}
                  className="w-full p-3 border text-black placeholder:text-gray-400 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập thuật ngữ ở đây"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Nghĩa</label>
                <input
                  type="text"
                  value={singleTerm.meaning}
                  onChange={(e) => setSingleTerm({ ...singleTerm, meaning: e.target.value })}
                  className="w-full p-3 border text-black placeholder:text-gray-400 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập nghĩa của từ ở đây"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <p className="block text-gray-700 mb-2">Từ loại</p>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="noPartOfSpeech"
                      name="partOfSpeechOption"
                      checked={!usePartOfSpeech && !autoDetect}
                      onChange={() => handlePartOfSpeechOptionChange('none')}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="noPartOfSpeech" className="text-sm font-medium text-gray-700">
                      Không sử dụng từ loại
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="autoDetectPartOfSpeech"
                      name="partOfSpeechOption"
                      checked={!usePartOfSpeech && autoDetect}
                      onChange={() => handlePartOfSpeechOptionChange('auto')}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="autoDetectPartOfSpeech" className="text-sm font-medium text-gray-700">
                      Tự động xác định từ loại
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="manualPartOfSpeech"
                      name="partOfSpeechOption"
                      checked={usePartOfSpeech && !autoDetect}
                      onChange={() => handlePartOfSpeechOptionChange('manual')}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="manualPartOfSpeech" className="text-sm font-medium text-gray-700">
                      Tự chọn từ loại
                    </label>
                  </div>
                </div>
                
                {usePartOfSpeech && (
                  <div className="mt-2">
                    <select
                      id="partOfSpeech"
                      value={singleTerm.part_of_speech}
                      onChange={(e) => setSingleTerm({ ...singleTerm, part_of_speech: e.target.value })}
                      className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required={usePartOfSpeech}
                    >
                      <option value="">Chọn loại từ</option>
                      {PARTS_OF_SPEECH.map(pos => (
                        <option key={pos.value} value={pos.value}>{pos.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {autoDetect && singleTerm.vocab && (
                  <div className="mt-2 text-sm text-gray-600">
                    Hệ thống sẽ tự động xác định từ loại khi bạn thêm từ vựng.
                    {singleTerm.vocab.trim() && (
                      <div className="mt-1">
                        Dự đoán từ loại cho "{singleTerm.vocab}": <span className="font-medium">{PARTS_OF_SPEECH.find(pos => pos.value === detectPartOfSpeech(singleTerm.vocab))?.label || 'Không xác định'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {isLoading ? 'Đang thêm...' : 'Thêm từ'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleBulkAdd} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Nhập danh sách từ (mỗi dòng một từ)
                </label>
                
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="includeBulkPartOfSpeech"
                      checked={includeBulkPartOfSpeech}
                      onChange={(e) => setIncludeBulkPartOfSpeech(e.target.checked)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="includeBulkPartOfSpeech" className="text-sm font-medium text-gray-700">
                      Bao gồm cả từ loại
                    </label>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {includeBulkPartOfSpeech 
                      ? 'Định dạng: Từ vựng [Tab] Từ loại [Tab] Nghĩa'
                      : 'Định dạng: Từ vựng [Tab] Nghĩa'}
                  </p>
                  
                  {includeBulkPartOfSpeech && (
                    <p className="text-sm text-gray-600 mt-1">
                      Các từ loại hợp lệ: noun, verb, adjective, adverb, preposition, conjunction, pronoun, interjection, phrase
                    </p>
                  )}
                </div>
                
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full h-64 p-3 border text-black placeholder:text-gray-400 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder={includeBulkPartOfSpeech 
                    ? "book\tnoun\tsách\nrun\tverb\tchạy\nbeautiful\tadjective\tđẹp"
                    : "book\tsách\nrun\tchạy\nbeautiful\tđẹp"}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {isLoading ? 'Đang thêm...' : 'Thêm danh sách từ'}
              </button>
            </form>
          )}

          <button
            onClick={() => router.push('/vocab')}
            className="w-full mt-4 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
        </div>
      </div>

      {/* Modal hiển thị danh sách từ trùng lặp */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <h2 className="text-xl text-black font-bold mb-4">Kết quả thêm từ vựng</h2>
            
            {duplicateTerms.length > 0 && (
              <>
                <p className="mb-4 text-black">Các từ vựng sau đã tồn tại trong cơ sở dữ liệu của bạn và đã được bỏ qua:</p>
                
                <div className="border rounded-lg overflow-hidden mb-6">
                  <table className="w-full">
                    <thead className="bg-gray-400 text-white">
                      <tr>
                        <th className="px-4 py-2 text-left">Từ vựng</th>
                        <th className="px-4 py-2 text-left">Nghĩa</th>
                        <th className="px-4 py-2 text-left">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {duplicateTerms.map((term, index) => (
                        <tr key={index} className="border-t bg-gray-300 text-black">
                          <td className="px-4 py-2">{term.vocab}</td>
                          <td className="px-4 py-2">{term.meaning}</td>
                          <td className="px-4 py-2">
                            {term.duplicateId && (
                              <button
                                onClick={() => viewDuplicateTerm(term.duplicateId!)}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                              >
                                Xem
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            
            {modifiedTerms.length > 0 && (
              <>
                <p className="mb-4">Các từ vựng sau đã được sửa đổi để tránh trùng lặp:</p>
                
                <div className="border rounded-lg overflow-hidden mb-6">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Từ gốc</th>
                        <th className="px-4 py-2 text-left">Từ đã sửa</th>
                        <th className="px-4 py-2 text-left">Nghĩa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modifiedTerms.map((term, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{term.originalVocab}</td>
                          <td className="px-4 py-2 font-medium text-green-600">{term.modifiedVocab}</td>
                          <td className="px-4 py-2">{term.meaning}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={continueBulkAdd}
                className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hiển thị các từ tương tự */}
      {showSimilarTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">Từ vựng đã được thêm thành công</h2>
            
            <p className="mb-4">Từ "{singleTerm.vocab}" đã được thêm thành công với nghĩa "{singleTerm.meaning}".</p>
            
            <p className="mb-4">Đã tìm thấy các từ tương tự trong cơ sở dữ liệu của bạn:</p>
            
            <div className="border rounded-lg overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Từ vựng</th>
                    <th className="px-4 py-2 text-left">Nghĩa</th>
                    <th className="px-4 py-2 text-left">Tương tự</th>
                    <th className="px-4 py-2 text-left">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {similarTerms.map((term, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">
                        <span className={term.similarity === 'vocab' ? 'font-bold text-blue-600' : ''}>
                          {term.vocab}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={term.similarity === 'meaning' ? 'font-bold text-blue-600' : ''}>
                          {term.meaning}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {term.similarity === 'vocab' ? 'Từ giống nhau' : 'Nghĩa giống nhau'}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => viewDuplicateTerm(term.id)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={continueAfterSimilarTerms}
                className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hiển thị thông tin về từ vựng đã được sửa đổi */}
      {showModifiedVocabModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">Từ vựng đã được thêm thành công</h2>
            
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
              <p className="mb-2">Từ vựng của bạn đã được thêm thành công, nhưng đã được sửa đổi để tránh trùng lặp:</p>
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium">Từ gốc:</span>
                <span>{singleTerm.vocab}</span>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium">Từ đã sửa:</span>
                <span className="font-medium text-green-600">{modifiedVocab}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Nghĩa:</span>
                <span>{singleTerm.meaning}</span>
              </div>
            </div>
            
            <p className="mb-4">Từ vựng của bạn đã được thêm với tên đã sửa đổi để tránh xung đột với các từ vựng hiện có.</p>
            
            <div className="flex justify-end">
              <button
                onClick={continueAfterModifiedVocab}
                className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddVocabPage; 