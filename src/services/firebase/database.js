// src/services/firebase/database.js
import { ref, get, set, update, remove, query, orderByChild, equalTo } from 'firebase/database';
import { database } from './index';

// User data operations
export async function getUserData(userId) {
  const userRef = ref(database, `users/${userId}`);
  const snapshot = await get(userRef);
  if (snapshot.exists()) {
    return snapshot.val();
  }
  return null;
}

export async function updateUserData(userId, data) {
  const userRef = ref(database, `users/${userId}`);
  return update(userRef, data);
}

// Vocab operations
export async function getVocabSets(userId) {
  const vocabRef = ref(database, `vocab/${userId}`);
  const snapshot = await get(vocabRef);
  if (snapshot.exists()) {
    return snapshot.val();
  }
  return {};
}

export async function createVocabSet(userId, setId, setData) {
  const vocabSetRef = ref(database, `vocab/${userId}/${setId}`);
  return set(vocabSetRef, setData);
}

export async function updateVocabSet(userId, setId, setData) {
  const vocabSetRef = ref(database, `vocab/${userId}/${setId}`);
  return update(vocabSetRef, setData);
}

export async function deleteVocabSet(userId, setId) {
  const vocabSetRef = ref(database, `vocab/${userId}/${setId}`);
  return remove(vocabSetRef);
}

// Term operations
export async function createTerm(userId, setId, termId, termData) {
  const termRef = ref(database, `vocab/${userId}/${setId}/terms/${termId}`);
  return set(termRef, termData);
}

export async function updateTerm(userId, setId, termId, termData) {
  const termRef = ref(database, `vocab/${userId}/${setId}/terms/${termId}`);
  return update(termRef, termData);
}

export async function deleteTerm(userId, setId, termId) {
  const termRef = ref(database, `vocab/${userId}/${setId}/terms/${termId}`);
  return remove(termRef);
}

// Learning data operations
export async function createLearningHistory(userId, termId, historyData) {
  const historyRef = ref(database, `learning/${userId}/history/${termId}`);
  return set(historyRef, historyData);
}

export async function updateLearningHistory(userId, termId, historyData) {
  const historyRef = ref(database, `learning/${userId}/history/${termId}`);
  return update(historyRef, historyData);
}

export async function getLearningHistory(userId) {
  const historyRef = ref(database, `learning/${userId}/history`);
  const snapshot = await get(historyRef);
  if (snapshot.exists()) {
    return snapshot.val();
  }
  return {};
}