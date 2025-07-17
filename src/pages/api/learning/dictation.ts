import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import http from 'http';
import util from 'util';

// IP của máy chủ MySQL
// const MYSQL_SERVER_IP = '192.168.99.119';

// Đường dẫn chia sẻ mạng Windows tới máy chủ (cập nhật theo cấu trúc thực tế)
// const NETWORK_SHARE_PATH = '\\192.168.99.119\\Downloads\\short-stories';
// Đường dẫn URL cho browser truy cập
// const REMOTE_AUDIO_URL = `http://${MYSQL_SERVER_IP}/short-stories/audio`;

// Promisify fs.readFile
const readFileAsync = util.promisify(fs.readFile);

// Interface dữ liệu dictation
interface DictationInfo {
  id: string;
  title: string;
  audioUrl: string;
  script: string;
  createdAt: Date;
  duration: number;
}

// Dữ liệu mẫu để thêm vào database khi cần
const sampleExercises = [
  {
    title: "First Snowfall",
    script: "It was the first snowfall of the season. Sarah woke up early and looked out her window. The ground was covered in a white blanket. She quickly put on her warm clothes and ran outside. The air was cold and crisp. She caught a snowflake on her tongue and smiled. Winter had finally arrived, and she couldn't wait to build a snowman with her friends.",
    duration: 25,
    audioFile: "short-stories-0001-1-first-snowfall.mp3"
  },
  {
    title: "The Lost Dog",
    script: "Max was walking home from school when he heard a whimper. He looked around and saw a small dog hiding under a bush. The dog had no collar and seemed lost. Max approached slowly, offering his hand. The dog sniffed it cautiously, then licked his fingers. He decided to take the dog home and put up 'Found Dog' posters in the neighborhood. After two days, he received a call from a relieved family who had been searching for their pet.",
    duration: 30,
    audioFile: "short-stories-0002-1-lost-dog.mp3"
  },
  {
    title: "The Old Bookstore",
    script: "Anna discovered an old bookstore tucked away on a quiet street. The bell jingled as she pushed open the door. Inside, shelves reached from floor to ceiling, packed with books of all sizes and colors. The air smelled of paper and ink. An elderly man with glasses perched on his nose greeted her with a smile. 'Feel free to explore,' he said. Anna spent hours browsing through stories of adventure, mystery, and magic, eventually leaving with a treasure trove of books and plans to return very soon.",
    duration: 35,
    audioFile: "short-stories-0003-1-old-bookstore.mp3"
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      console.log("===== API DICTATION ĐƯỢC GỌI =====");
      // Lấy danh sách bài học từ dictation_lessons
      const [lessons] = await db.execute('SELECT * FROM dictation_lessons ORDER BY created_at DESC');
      // Lấy danh sách câu cho từng bài
      const lessonIds = (lessons as any[]).map(l => l.id);
      let sentencesByLesson: Record<string, any[]> = {};
      if (lessonIds.length > 0) {
        const [sentences] = await db.execute(
          `SELECT * FROM dictation_sentences WHERE lesson_id IN (${lessonIds.map(() => '?').join(',')}) ORDER BY sentence_order ASC`,
          lessonIds
        );
        for (const s of sentences as any[]) {
          if (!sentencesByLesson[s.lesson_id]) sentencesByLesson[s.lesson_id] = [];
          sentencesByLesson[s.lesson_id].push(s);
        }
      }
      // Trả về danh sách bài học kèm câu
      const result = (lessons as any[]).map(lesson => ({
        ...lesson,
        sentences: sentencesByLesson[lesson.id] || []
      }));
      return res.status(200).json(result);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bài dictation:', error);
      return res.status(500).json({ message: 'Lỗi server', error: String(error) });
    }
  }

  // === API POST: Thêm mới bài dictation và các câu ===
  if (req.method === 'POST') {
    try {
      const { title, content, level, thumbnail, base_audio_url, sentence_count, sentences } = req.body;
      if (!title || !content || !level || !base_audio_url || !sentence_count || !Array.isArray(sentences) || sentences.length === 0) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
      }
      // Thêm bài vào dictation_lessons
      const [result] = await db.execute(
        `INSERT INTO dictation_lessons (title, content, level, thumbnail, base_audio_url, sentence_count, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [title, content, level, thumbnail || null, base_audio_url, sentence_count]
      );
      // Lấy id bài vừa thêm
      const lessonId = (result as any).insertId;
      // Thêm từng câu vào dictation_sentences
      for (const s of sentences) {
        await db.execute(
          `INSERT INTO dictation_sentences (lesson_id, sentence_order, text, audio_url) VALUES (?, ?, ?, ?)`,
          [lessonId, s.id, s.text, s.audioUrl]
        );
      }
      return res.status(201).json({ success: true, lessonId });
    } catch (error) {
      console.error('Lỗi khi thêm bài dictation:', error);
      return res.status(500).json({ message: 'Lỗi server', error: String(error) });
    }
  }

  // === API PUT: Sửa bài dictation và các câu ===
  if (req.method === 'PUT') {
    try {
      const { id, title, content, level, thumbnail, base_audio_url, sentence_count, sentences } = req.body;
      if (!id || !title || !content || !level || !base_audio_url || !sentence_count || !Array.isArray(sentences) || sentences.length === 0) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
      }
      // Cập nhật bài
      await db.execute(
        `UPDATE dictation_lessons SET title=?, content=?, level=?, thumbnail=?, base_audio_url=?, sentence_count=? WHERE id=?`,
        [title, content, level, thumbnail || null, base_audio_url, sentence_count, id]
      );
      // Xoá hết câu cũ (không xoá bài, chỉ xoá câu)
      await db.execute(`DELETE FROM dictation_sentences WHERE lesson_id=?`, [id]);
      // Thêm lại các câu mới
      for (const s of sentences) {
        await db.execute(
          `INSERT INTO dictation_sentences (lesson_id, sentence_order, text, audio_url) VALUES (?, ?, ?, ?)`,
          [id, s.id, s.text, s.audioUrl]
        );
      }
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Lỗi khi sửa bài dictation:', error);
      return res.status(500).json({ message: 'Lỗi server', error: String(error) });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const id = req.query.id || req.body.id;
      if (!id) return res.status(400).json({ message: 'Thiếu id bài dictation' });
      // Xoá các câu trước
      await db.execute('DELETE FROM dictation_sentences WHERE lesson_id=?', [id]);
      // Xoá bài học
      await db.execute('DELETE FROM dictation_lessons WHERE id=?', [id]);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Lỗi khi xoá bài dictation:', error);
      return res.status(500).json({ message: 'Lỗi server', error: String(error) });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// Quét file từ đường dẫn chia sẻ mạng
async function scanAndAddExercisesFromNetworkShare() {
  try {
    // Danh sách file cố định khi không thể truy cập vào thư mục
    const knownFiles = [
      'short-stories-0001-1-first-snowfall.mp3',
      'short-stories-0002-1-lost-dog.mp3',
      'short-stories-0003-1-old-bookstore.mp3'
    ];
    
    for (const audioFile of knownFiles) {
      await processAudioFile(audioFile);
    }
  } catch (error) {
    console.error('Lỗi khi quét và thêm bài tập từ đường dẫn mạng:', error);
    throw error;
  }
}

// Thêm dữ liệu mẫu vào database
async function addSampleExercises() {
  try {
    for (const exercise of sampleExercises) {
      // Kiểm tra xem bài tập đã tồn tại trong database chưa
      const [existing] = await db.execute(
        'SELECT id FROM dictation_exercises WHERE audio_file = ?',
        [exercise.audioFile]
      );
      
      if ((existing as any[]).length === 0) {
        // Tạo URL để truy cập file audio
        const audioUrl = `/api/learning/dictation/audio?file=${encodeURIComponent(exercise.audioFile)}`;
        
        // Thêm bài tập vào database
        const exerciseId = uuidv4();
        
        await db.execute(
          `INSERT INTO dictation_exercises 
           (id, title, audio_file, script_file, audio_url, script, duration) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            exerciseId,
            exercise.title,
            exercise.audioFile,
            `${exercise.audioFile.replace('.mp3', '.txt')}`,
            audioUrl,
            exercise.script,
            exercise.duration
          ]
        );
      }
    }
  } catch (error) {
    console.error('Lỗi khi thêm bài tập mẫu:', error);
    throw error;
  }
}

// Hàm xử lý từng file audio
async function processAudioFile(audioFile: string) {
  try {
    const baseName = audioFile.replace('.mp3', '');
    const scriptFile = `${baseName}.txt`;
    
    // Kiểm tra xem bài tập đã tồn tại trong database chưa
    const [existing] = await db.execute(
      'SELECT id FROM dictation_exercises WHERE audio_file = ?',
      [audioFile]
    );
    
    if ((existing as any[]).length === 0) {
      try {
        // Lấy nội dung script (ưu tiên từ các bản mẫu)
        let scriptContent = await getDefaultScriptContent(audioFile);
        
        // Tạo URL để truy cập file audio
        const audioUrl = `/api/learning/dictation/audio?file=${encodeURIComponent(audioFile)}`;
        
        // Xử lý tên tiêu đề từ tên file
        let title = baseName.split('-').slice(3).join(' ');
        title = title.split('_').join(' ');
        title = title.replace(/\b\w/g, l => l.toUpperCase()); // Chuyển chữ cái đầu mỗi từ thành in hoa
        
        // Tính thời lượng (giả sử)
        const duration = Math.floor(scriptContent.length / 10);
        
        // Thêm bài tập vào database
        const exerciseId = uuidv4();
        
        await db.execute(
          `INSERT INTO dictation_exercises 
           (id, title, audio_file, script_file, audio_url, script, duration) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            exerciseId,
            title,
            audioFile,
            scriptFile,
            audioUrl,
            scriptContent,
            duration
          ]
        );
      } catch (processError) {
        console.error(`Lỗi khi xử lý file ${audioFile}:`, processError);
      }
    } else {
      console.log(`Bài tập với file ${audioFile} đã tồn tại trong database`);
    }
  } catch (error) {
    console.error(`Lỗi khi xử lý file audio ${audioFile}:`, error);
  }
}

// Hàm lấy nội dung script mẫu cho audioFile
async function getDefaultScriptContent(audioFile: string): Promise<string> {
  if (audioFile.includes('first-snowfall')) {
    return "It was the first snowfall of the season. Sarah woke up early and looked out her window. The ground was covered in a white blanket. She quickly put on her warm clothes and ran outside. The air was cold and crisp. She caught a snowflake on her tongue and smiled. Winter had finally arrived, and she couldn't wait to build a snowman with her friends.";
  } else if (audioFile.includes('lost-dog')) {
    return "Max was walking home from school when he heard a whimper. He looked around and saw a small dog hiding under a bush. The dog had no collar and seemed lost. Max approached slowly, offering his hand. The dog sniffed it cautiously, then licked his fingers. He decided to take the dog home and put up 'Found Dog' posters in the neighborhood. After two days, he received a call from a relieved family who had been searching for their pet.";
  } else if (audioFile.includes('old-bookstore')) {
    return "Anna discovered an old bookstore tucked away on a quiet street. The bell jingled as she pushed open the door. Inside, shelves reached from floor to ceiling, packed with books of all sizes and colors. The air smelled of paper and ink. An elderly man with glasses perched on his nose greeted her with a smile. 'Feel free to explore,' he said. Anna spent hours browsing through stories of adventure, mystery, and magic, eventually leaving with a treasure trove of books and plans to return very soon.";
  } else {
    return "This is a placeholder script for the audio file. The actual content could not be loaded.";
  }
} 