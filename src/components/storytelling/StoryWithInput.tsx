import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Term {
  id: number;
  vocab: string;
  meaning: string;
  part_of_speech: string;
}

interface StoryTerm {
  id: string;
  vocabId: number;
  context: string;
  contextual_meaning?: string;
}

interface Story {
  id: string;
  content: string;
  originalContent: string;
  terms: StoryTerm[];
}

interface Props {
  story: Story;
  terms: Term[];
  onComplete: () => void;
}

interface AnswerState {
  [key: string]: {
    isCorrect: boolean;
    attempts: number;
    userInput: string;
  };
}

export default function StoryWithInput({ story, terms, onComplete }: Props) {
  const [answers, setAnswers] = useState<AnswerState>({});
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    position: { x: number; y: number };
    term: Term;
    input: string;
  } | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [detectedTerms, setDetectedTerms] = useState<Term[]>([]);

  // Phát hiện từ tiếng Anh khi không có terms
  useEffect(() => {
    if (terms.length === 0) {
      console.log("No terms provided, attempting to detect English words in story");
      // Tìm tất cả từ tiếng Anh trong câu chuyện
      const englishWords = new Set<string>();
      const regex = /\b([a-zA-Z]{4,})\b/g;
      let match;
      
      const content = story.content;
      while ((match = regex.exec(content)) !== null) {
        if (!/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(match[1])) {
          englishWords.add(match[1].toLowerCase());
        }
      }
      
      // Từ điển nghĩa tiếng Việt cơ bản
      const basicMeanings: Record<string, string> = {
        "overcrowded": "quá đông đúc",
        "object": "vật thể, đồ vật",
        "horoscope": "cung hoàng đạo",
        "strike": "gây ấn tượng, đánh",
        "confusion": "sự nhầm lẫn, bối rối",
        "stem": "thân cây",
        "trespasser": "người xâm phạm",
        "foggiest": "mơ hồ nhất"
      };
      
      // Nếu tìm được từ tiếng Anh, tạo terms mới
      if (englishWords.size > 0) {
        const extractedTerms: Term[] = Array.from(englishWords).map((word, index) => ({
          id: index,
          vocab: word,
          meaning: basicMeanings[word] || `Nghĩa của từ "${word}"`,
          part_of_speech: 'unknown'
        }));
        
        console.log("Extracted terms:", extractedTerms);
        setDetectedTerms(extractedTerms);
      }
    }
  }, [terms, story.content]);
  
  // Sử dụng terms được phát hiện nếu không có terms từ props
  const effectiveTerms = terms.length > 0 ? terms : detectedTerms;

  // Tính độ tương đồng giữa hai chuỗi và hỗ trợ trường hợp từ có nhiều nghĩa
  const calculateSimilarity = (str1: string, str2: string): number => {
    // Chuẩn hóa chuỗi đầu vào
    const userInput = str1.toLowerCase().trim();
    const correctAnswer = str2.toLowerCase().trim();
    
    // Kiểm tra nếu chuỗi không dấu trùng khớp
    const removeDiacritics = (str: string) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };
    
    const userInputNoDiacritics = removeDiacritics(userInput);
    const correctAnswerNoDiacritics = removeDiacritics(correctAnswer);
    
    // Nếu phiên bản không dấu trùng khớp hoàn toàn, trả về độ chính xác cao
    if (userInputNoDiacritics === correctAnswerNoDiacritics) {
      return 95;
    }
    
    // Xử lý trường hợp từ có nhiều nghĩa (a, b, c, d) hoặc (a,b,c) hoặc a, b, c, d
    // 1. Tách đáp án chính xác thành các phần riêng biệt
    // Loại bỏ ký tự ngoặc đơn và phân tách theo dấu phẩy hoặc dấu chấm
    const correctParts = correctAnswer
      .replace(/[()]/g, '')  // Xóa ngoặc đơn
      .split(/[,;.]/)         // Phân tách bằng dấu phẩy, dấu chấm phẩy hoặc dấu chấm
      .map(part => part.trim()) // Cắt khoảng trắng
      .filter(part => part.length > 0); // Loại bỏ phần tử rỗng
    
    // 2. Kiểm tra xem đáp án người dùng có chứa ít nhất một trong các phần đó
    // Cũng xử lý tương tự cho đáp án người dùng
    const userParts = userInput
      .replace(/[()]/g, '')
      .split(/[,;.]/)
      .map(part => part.trim())
      .filter(part => part.length > 0);
    
    // Kiểm tra nếu người dùng chỉ nhập một chuỗi không phân tách, thì coi nó như một phần
    // Ví dụ: nhập "vật thể đồ vật" thay vì "vật thể, đồ vật"
    if (userParts.length === 1) {
      for (const correctPart of correctParts) {
        // Chuyển đổi tất cả sang không dấu để so sánh
        const userPartNoDiacritics = removeDiacritics(userParts[0]);
        const correctPartNoDiacritics = removeDiacritics(correctPart);
        
        // Nếu đáp án của người dùng chứa ít nhất một nghĩa đúng
        if (userPartNoDiacritics.includes(correctPartNoDiacritics) || 
            correctPartNoDiacritics.includes(userPartNoDiacritics)) {
          return 85; // Đáp án một phần nhưng đúng
        }
      }
    }
    
    // Kiểm tra nếu có ít nhất một phần trong đáp án người dùng trùng với một phần trong đáp án đúng
    for (const userPart of userParts) {
      for (const correctPart of correctParts) {
        // Chuyển đổi tất cả sang không dấu để so sánh
        const userPartNoDiacritics = removeDiacritics(userPart);
        const correctPartNoDiacritics = removeDiacritics(correctPart);
        
        // Nếu hai phần giống nhau đủ nhiều
        const similarityScore = calculateLevenshteinSimilarity(userPartNoDiacritics, correctPartNoDiacritics);
        if (similarityScore >= 80) {
          return 80; // Chỉ cần một phần đúng, coi là đúng
        }
      }
    }
    
    // Nếu không trùng khớp với bất kỳ phần nào, sử dụng thuật toán Levenshtein Distance
    return calculateLevenshteinSimilarity(userInputNoDiacritics, correctAnswerNoDiacritics);
  };
  
  // Hàm tính toán độ tương đồng dựa trên Levenshtein Distance
  const calculateLevenshteinSimilarity = (s1: string, s2: string): number => {
    const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
    
    for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= s2.length; j++) {
      for (let i = 1; i <= s1.length; i++) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    const distance = matrix[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return ((maxLength - distance) / maxLength) * 100;
  };

  const handleWordClick = (event: React.MouseEvent, term: Term) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSelectedWord({
      word: term.vocab,
      position: {
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY + 5
      },
      term,
      input: ''
    });
  };

  const handleInputChange = (value: string) => {
    if (!selectedWord) return;
    setSelectedWord({
      ...selectedWord,
      input: value
    });
  };

  const handleSubmit = () => {
    if (!selectedWord) return;

    const similarity = calculateSimilarity(selectedWord.input, selectedWord.term.meaning);
    const isCorrect = similarity >= 70;
    const termId = selectedWord.term.id.toString();

    setAnswers(prev => ({
      ...prev,
      [termId]: {
        isCorrect,
        attempts: (prev[termId]?.attempts || 0) + 1,
        userInput: selectedWord.input
      }
    }));

    if (isCorrect && !answers[termId]?.isCorrect) {
      setCompletedCount(prev => prev + 1);
    }

    if (isCorrect) {
      setSelectedWord(null);
    }
  };

  const handleDontKnow = () => {
    if (!selectedWord) return;
    
    const termId = selectedWord.term.id.toString();
    
    setAnswers(prev => ({
      ...prev,
      [termId]: {
        isCorrect: false,
        attempts: (prev[termId]?.attempts || 0) + 1,
        userInput: "Không biết"
      }
    }));
    
    // Hiển thị đáp án đúng
    setSelectedWord({
      ...selectedWord,
      input: selectedWord.term.meaning
    });
  };

  const handleClosePopup = () => {
    setSelectedWord(null);
  };

  const getWordStyle = (term: Term) => {
    const answer = answers[term.id.toString()];
    if (!answer) return 'bg-yellow-100 cursor-pointer hover:bg-yellow-200 text-gray-900';
    if (answer.isCorrect) return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800 cursor-pointer hover:bg-red-200';
  };

  const renderStory = () => {
    if (!effectiveTerms || effectiveTerms.length === 0) {
      console.log("No terms available for highlighting");
      return story.content;
    }

    console.log("Terms to highlight:", effectiveTerms);
    
    let content = story.content;
    const highlightedStory = [];
    let lastIndex = 0;

    // Regex để tìm các từ tiếng Anh trong ngoặc đơn và nghĩa tiếng Việt trong dấu gạch chân
    const formatRegex = /\(([^)]+)\)\s*__([^_]+)__/g;
    let match;
    
    while ((match = formatRegex.exec(content)) !== null) {
      console.log("Found match:", match[1], "with meaning:", match[2]);
      
      // Thêm nội dung trước cụm từ được tìm thấy
      if (match.index > lastIndex) {
        highlightedStory.push(content.substring(lastIndex, match.index));
      }
      
      // Lấy từ tiếng Anh và nghĩa tiếng Việt
      const englishWord = match[1];
      const vietnameseMeaning = match[2];
      
      // Tìm term tương ứng hoặc tạo term mới nếu không có
      let term = effectiveTerms.find(t => t.vocab.toLowerCase() === englishWord.toLowerCase());
      
      if (!term) {
        console.log("Creating new term for:", englishWord);
        term = {
          id: Math.floor(Math.random() * 10000), // Sử dụng số ngẫu nhiên làm ID
          vocab: englishWord,
          meaning: vietnameseMeaning, // Dùng nghĩa từ câu chuyện làm chuẩn
          part_of_speech: 'unknown'
        };
      } else {
        // Cập nhật nghĩa từ context để đảm bảo đúng với ngữ cảnh câu chuyện
        term = {
          ...term,
          meaning: vietnameseMeaning
        };
      }
      
      // Thêm từ tiếng Anh được highlight
      highlightedStory.push(
        <span
          key={`term-${match.index}`}
          onClick={(e) => !answers[term!.id.toString()]?.isCorrect && handleWordClick(e, term!)}
          className={`px-1 py-0.5 rounded ${getWordStyle(term!)} transition-colors duration-200`}
        >
          ({englishWord})
        </span>
      );
      
      // Không hiển thị nghĩa tiếng Việt để người dùng phải đoán
      
      lastIndex = match.index + match[0].length;
    }
    
    // Thêm phần còn lại của nội dung
    if (lastIndex < content.length) {
      highlightedStory.push(content.substring(lastIndex));
    }
    
    return highlightedStory;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 rounded-2xl shadow-xl border border-gray-700">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary-200 mb-2">Nhập nghĩa tiếng Việt</h2>
        <p className="text-primary-200/80">
          Click vào từ tiếng Anh và nhập nghĩa tiếng Việt phù hợp
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="text-sm text-primary-200/80">
            Đã hoàn thành: {completedCount}/{effectiveTerms.length} từ
          </div>
          {completedCount === effectiveTerms.length && (
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-gradient-to-r from-primary-200 to-secondary-200 text-gray-900 font-bold rounded-lg shadow-lg hover:from-primary-300 hover:to-secondary-300 transition-all"
            >
              Tiếp tục
            </button>
          )}
        </div>
      </div>
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 relative border border-gray-700">
        <div className="prose max-w-none text-primary-200 leading-relaxed">
          {renderStory()}
        </div>
        <AnimatePresence>
          {selectedWord && (
            <>
              {/* Overlay để bắt sự kiện click ra ngoài */}
              <div 
                className="fixed inset-0 bg-black bg-opacity-20 z-40"
                onClick={handleClosePopup}
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed z-50"
                style={{
                  left: Math.min(selectedWord.position.x, window.innerWidth - 270),
                  top: Math.min(selectedWord.position.y, window.innerHeight - 230)
                }}
              >
                <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden w-64 max-h-[calc(100vh-2rem)]">
                  <div className="p-4 bg-gray-800 border-b border-gray-700">
                    <h3 className="font-medium text-primary-200">
                      Nhập nghĩa tiếng Việt cho từ "{selectedWord.word}"
                    </h3>
                  </div>
                  <div className="p-4">
                    <input
                      type="text"
                      value={selectedWord.input}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      placeholder="Nhập nghĩa tiếng Việt..."
                      className="text-primary-200 w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-secondary-200 focus:border-transparent bg-gray-900 font-semibold"
                      autoFocus
                    />
                    <div className="mt-3 flex justify-between">
                      <button
                        onClick={handleDontKnow}
                        className="px-3 py-2 bg-gray-700 text-primary-200 rounded-lg hover:bg-primary-200/10 transition-colors text-sm font-semibold border border-primary-200"
                      >
                        Tôi không biết
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-gradient-to-r from-primary-200 to-secondary-200 text-gray-900 font-bold rounded-lg shadow-lg hover:from-primary-300 hover:to-secondary-300 transition-all"
                      >
                        Kiểm tra
                      </button>
                    </div>
                    {answers[selectedWord.term.id.toString()]?.attempts > 0 && !answers[selectedWord.term.id.toString()]?.isCorrect && (
                      <div className="mt-3 text-sm text-red-400">
                        Gợi ý: {selectedWord.term.meaning.slice(0, 3)}...
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 