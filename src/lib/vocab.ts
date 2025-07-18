import { db } from '@/lib/mysql';

export interface Vocab {
  id: string;
  word: string;
  meaning: string;
}

export async function getVocabByIds(vocabIds: string): Promise<Vocab[]> {
  const ids = vocabIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));

  if (ids.length === 0) {
    return [];
  }

  const placeholders = ids.join(',');
  const query = `
    SELECT id, vocab as word, meanings 
    FROM terms 
    WHERE id IN (${placeholders})
    ORDER BY FIELD(id, ${placeholders})
  `;

  const [terms] = await db.query(query);

  if (!terms || !Array.isArray(terms)) {
    return [];
  }

  const processedWords: Vocab[] = (terms as any[]).map(term => {
    let meanings = [];
    try {
      if (term.meanings) {
        if (typeof term.meanings === 'string') {
          meanings = JSON.parse(term.meanings);
        } else {
          meanings = term.meanings;
        }
      }
      if (!Array.isArray(meanings)) meanings = [];
    } catch (e) {
      meanings = [];
    }

    const meaning = meanings.length > 0 ? meanings[0] : '';

    return {
      id: term.id.toString(),
      word: term.word,
      meaning,
    };
  });

  return processedWords;
}

export async function getRandomVocab(count: number): Promise<Vocab[]> {
  const query = `
    SELECT id, vocab as word, meanings
    FROM terms
    ORDER BY RAND()
    LIMIT ?
  `;

  const [terms] = await db.query(query, [count]);

  if (!terms || !Array.isArray(terms)) {
    return [];
  }

  const processedWords: Vocab[] = (terms as any[]).map(term => {
    let meanings = [];
    try {
      if (term.meanings) {
        if (typeof term.meanings === 'string') {
          meanings = JSON.parse(term.meanings);
        } else {
          meanings = term.meanings;
        }
      }
      if (!Array.isArray(meanings)) meanings = [];
    } catch (e) {
      meanings = [];
    }

    const meaning = meanings.length > 0 ? meanings[0] : '';

    return {
      id: term.id.toString(),
      word: term.word,
      meaning,
    };
  });

  return processedWords;
}