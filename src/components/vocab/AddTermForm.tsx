// src/components/vocab/AddTermForm.tsx
import React, { useState } from 'react';
import { useVocab } from '../../hooks/useVocab';

interface AddTermFormProps {
  setId: string;
}

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

const AddTermForm: React.FC<AddTermFormProps> = ({ setId }) => {
  const [vocab, setVocab] = useState('');
  const [meaning, setMeaning] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usePartOfSpeech, setUsePartOfSpeech] = useState(false);
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [autoDetect, setAutoDetect] = useState(false);
  
  const { addTerm } = useVocab();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vocab.trim() || !meaning.trim()) {
      setError('Từ vựng và nghĩa không được để trống');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let selectedPartOfSpeech;
      
      if (usePartOfSpeech) {
        // Nếu người dùng chọn nhập part_of_speech
        selectedPartOfSpeech = partOfSpeech;
      } else if (autoDetect) {
        // Nếu người dùng chọn tự động xác định
        selectedPartOfSpeech = detectPartOfSpeech(vocab);
      } else {
        // Trường hợp không chọn gì
        selectedPartOfSpeech = undefined;
      }
      
      await addTerm(setId, vocab, meaning, selectedPartOfSpeech);
      
      // Reset form
      setVocab('');
      setMeaning('');
      if (usePartOfSpeech) {
        setPartOfSpeech('');
      }
    } catch (err) {
      console.error('Error adding term:', err);
      setError('Đã xảy ra lỗi khi thêm từ vựng');
    } finally {
      setLoading(false);
    }
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

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Thêm từ vựng mới</h3>
      
      {error && (
        <div className="p-3 mb-4 bg-red-50 text-red-500 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="vocab" className="block text-sm font-medium text-gray-700">
            Từ vựng
          </label>
          <input
            type="text"
            id="vocab"
            value={vocab}
            onChange={(e) => setVocab(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Nhập từ vựng"
            required
          />
        </div>
        
        <div>
          <label htmlFor="meaning" className="block text-sm font-medium text-gray-700">
            Nghĩa
          </label>
          <input
            type="text"
            id="meaning"
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Nhập nghĩa của từ"
            required
          />
        </div>
      </div>
      
      <div className="mt-4">
        <p className="block text-sm font-medium text-gray-700 mb-2">Từ loại</p>
        
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
              value={partOfSpeech}
              onChange={(e) => setPartOfSpeech(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required={usePartOfSpeech}
            >
              <option value="">Chọn loại từ</option>
              {PARTS_OF_SPEECH.map(pos => (
                <option key={pos.value} value={pos.value}>{pos.label}</option>
              ))}
            </select>
          </div>
        )}
        
        {autoDetect && vocab && (
          <div className="mt-2 text-sm text-gray-600">
            Hệ thống sẽ tự động xác định từ loại khi bạn thêm từ vựng.
            {vocab.trim() && (
              <div className="mt-1">
                Dự đoán từ loại cho "{vocab}": <span className="font-medium">{PARTS_OF_SPEECH.find(pos => pos.value === detectPartOfSpeech(vocab))?.label || 'Không xác định'}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Đang thêm...' : 'Thêm từ vựng'}
        </button>
      </div>
    </form>
  );
};

export default AddTermForm;