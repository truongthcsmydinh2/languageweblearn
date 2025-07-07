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
  };
}

export default function StoryWithMultipleChoice({ story, terms, onComplete }: Props) {
  const [answers, setAnswers] = useState<AnswerState>({});
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    position: { x: number; y: number };
    options: string[];
    correctAnswer: string;
    term: Term;
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
        "foggiest": "mơ hồ nhất",
        "mass media": "phương tiện truyền thông đại chúng",
        "compatible": "tương thích, phù hợp",
        "genius": "thiên tài, người có tài năng xuất chúng",
        "not a cloud in the sky": "trời quang mây tạnh, không còn vấn đề gì"
      };
      
      // Tìm các cụm từ tiếng Anh
      const englishPhrases = [
        "not a cloud in the sky",
        "mass media"
      ];
      
      // Tìm cụm từ trước
      englishPhrases.forEach(phrase => {
        if (content.toLowerCase().includes(phrase.toLowerCase())) {
          englishWords.add(phrase.toLowerCase());
        }
      });
      
      // Sau đó tìm từ đơn
      englishWords.forEach(word => {
        if (basicMeanings[word]) {
          englishWords.add(word);
        }
      });
      
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

  // Tạo các lựa chọn cho một từ
  const generateOptions = (correctTerm: Term) => {
    // Các nghĩa tiếng Việt thông dụng để làm lựa chọn
    const commonMeanings = [
      "quá đông đúc", "vật thể, đồ vật", "cung hoàng đạo", "gây ấn tượng",
      "sự nhầm lẫn", "thân cây", "người xâm phạm", "mơ hồ nhất",
      "dự báo tương lai", "đường thẳng", "gây phiền phức", "tranh luận",
      "tự tin", "nhắc nhở", "chính xác", "do dự"
    ];
    
    // Xử lý đáp án đúng nếu có nhiều nghĩa (phân tách bởi dấu phẩy, dấu chấm, dấu ngoặc)
    const correctAnswer = correctTerm.meaning;
    
    // Lấy 3 từ ngẫu nhiên khác làm đáp án sai
    const otherTerms = effectiveTerms
      .filter(t => t.id !== correctTerm.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(3, effectiveTerms.length - 1));
    
    // Lấy các nghĩa từ otherTerms hoặc từ commonMeanings nếu không đủ
    const wrongMeanings = otherTerms.map(t => t.meaning);
    
    // Bổ sung thêm nghĩa từ danh sách thông dụng nếu chưa đủ 3 nghĩa sai
    while (wrongMeanings.length < 3) {
      const randomMeaning = commonMeanings[Math.floor(Math.random() * commonMeanings.length)];
      // Đảm bảo nghĩa sai không có phần trùng với nghĩa đúng
      const isOverlapping = checkMeaningOverlap(randomMeaning, correctAnswer);
      
      if (!isOverlapping && !wrongMeanings.includes(randomMeaning)) {
        wrongMeanings.push(randomMeaning);
      }
    }
    
    // Kết hợp đáp án đúng và các đáp án sai
    const options = [correctAnswer, ...wrongMeanings];
    
    // Trộn ngẫu nhiên các đáp án
    return options.slice(0, 4).sort(() => Math.random() - 0.5);
  };

  // Kiểm tra xem hai nghĩa có phần trùng lặp không (cho đáp án có nhiều nghĩa)
  const checkMeaningOverlap = (meaning1: string, meaning2: string): boolean => {
    // Loại bỏ ký tự ngoặc đơn và phân tách theo dấu phẩy hoặc dấu chấm
    const parts1 = meaning1
      .toLowerCase()
      .replace(/[()]/g, '')
      .split(/[,;.]/)
      .map(part => part.trim())
      .filter(part => part.length > 0);
    
    const parts2 = meaning2
      .toLowerCase()
      .replace(/[()]/g, '')
      .split(/[,;.]/)
      .map(part => part.trim())
      .filter(part => part.length > 0);
    
    // Kiểm tra xem có phần nào trùng nhau không
    for (const part1 of parts1) {
      for (const part2 of parts2) {
        if (part1.includes(part2) || part2.includes(part1)) {
          return true;
        }
      }
    }
    
    return false;
  };

  const handleWordClick = (event: React.MouseEvent, term: Term) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const options = generateOptions(term);

    setSelectedWord({
      word: term.vocab,
      position: {
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY + 5
      },
      options,
      correctAnswer: term.meaning,
      term
    });
  };

  const handleOptionClick = (option: string) => {
    if (!selectedWord) return;

    const isCorrect = option === selectedWord.correctAnswer;
    const termId = selectedWord.term.id.toString();

    setAnswers(prev => ({
      ...prev,
      [termId]: {
        isCorrect,
        attempts: (prev[termId]?.attempts || 0) + 1
      }
    }));

    if (isCorrect && !answers[termId]?.isCorrect) {
      setCompletedCount(prev => prev + 1);
    }

    // Đóng popup sau khi chọn đáp án
    if (isCorrect) {
      setSelectedWord(null);
    }
  };

  const handleClosePopup = () => {
    setSelectedWord(null);
  };

  const getWordStyle = (term: Term) => {
    const answer = answers[term.id.toString()];
    if (!answer) return 'bg-yellow-100 cursor-pointer hover:bg-yellow-200';
    if (answer.isCorrect) return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800 cursor-pointer hover:bg-red-200';
  };

  // Tách và highlight các từ trong câu chuyện
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Chọn nghĩa tiếng Việt</h2>
        <p className="text-gray-600">
          Click vào từ tiếng Anh và chọn nghĩa tiếng Việt phù hợp
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Đã hoàn thành: {completedCount}/{effectiveTerms.length} từ
          </div>
          {completedCount === effectiveTerms.length && (
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tiếp tục
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 relative">
        <div className="prose max-w-none text-gray-800 leading-relaxed">
          {renderStory()}
        </div>

        <AnimatePresence>
          {selectedWord && (
            <>
              {/* Overlay để bắt sự kiện click ra ngoài */}
              <div 
                className="fixed inset-0 bg-black bg-opacity-10 z-40"
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
                <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden w-64 max-h-[calc(100vh-2rem)]">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-medium text-gray-800">
                      Chọn nghĩa tiếng Việt cho từ "{selectedWord.word}"
                    </h3>
                  </div>
                  <div className="p-2">
                    {selectedWord.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleOptionClick(option)}
                        className="w-full p-2 text-left hover:bg-gray-50 rounded transition-colors duration-200 mb-2 border border-gray-200 shadow-sm"
                      >
                        {option}
                      </button>
                    ))}
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