import axios from 'axios';

const USER_SERVICE_URL = 'http://localhost:3001';
const DECK_SERVICE_URL = 'http://localhost:3002';
const STUDY_SERVICE_URL = 'http://localhost:3003';
const SHARING_SERVICE_URL = 'http://localhost:3004';

axios.defaults.withCredentials = true;

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API ERROR]', err.response?.data || err.message);
    return Promise.reject(err);
  }
);

export const userAPI = {
  register: (data) => axios.post(`${USER_SERVICE_URL}/api/users/register`, data),
  login: (data) => axios.post(`${USER_SERVICE_URL}/api/users/login`, data),
  logout: () => axios.post(`${USER_SERVICE_URL}/api/users/logout`),
  getMe: () => axios.get(`${USER_SERVICE_URL}/api/users/me`),
  updateMe: (data) => axios.put(`${USER_SERVICE_URL}/api/users/me`, data),
};

export const deckAPI = {
  createDeck: (data) => axios.post(`${DECK_SERVICE_URL}/api/decks`, data),
  getMyDecks: (params) => axios.get(`${DECK_SERVICE_URL}/api/decks`, { params }),
  getPublicDecks: (params) => axios.get(`${DECK_SERVICE_URL}/api/decks/public`, { params }),
  getDeck: (deckId) => axios.get(`${DECK_SERVICE_URL}/api/decks/${deckId}`),
  updateDeck: (deckId, data) => axios.put(`${DECK_SERVICE_URL}/api/decks/${deckId}`, data),
  deleteDeck: (deckId) => axios.delete(`${DECK_SERVICE_URL}/api/decks/${deckId}`),

  // Cards
  createCard: (deckId, data) => axios.post(`${DECK_SERVICE_URL}/api/decks/${deckId}/cards`, data),
  getCards: (deckId) => axios.get(`${DECK_SERVICE_URL}/api/decks/${deckId}/cards`),
  getCard: (deckId, cardId) => axios.get(`${DECK_SERVICE_URL}/api/decks/${deckId}/cards/${cardId}`),
  updateCard: (deckId, cardId, data) => axios.put(`${DECK_SERVICE_URL}/api/decks/${deckId}/cards/${cardId}`, data),
  deleteCard: (deckId, cardId) => axios.delete(`${DECK_SERVICE_URL}/api/decks/${deckId}/cards/${cardId}`),
};

export const studyAPI = {
  createSession: (data) => axios.post(`${STUDY_SERVICE_URL}/api/study/sessions`, data),
  getSession: (sessionId) => axios.get(`${STUDY_SERVICE_URL}/api/study/sessions/${sessionId}`),
  createAttempt: (sessionId, data) => axios.post(`${STUDY_SERVICE_URL}/api/study/sessions/${sessionId}/attempts`, data),
  endSession: (sessionId) => axios.post(`${STUDY_SERVICE_URL}/api/study/sessions/${sessionId}/end`),
  updateMastery: (cardId, data) => axios.put(`${STUDY_SERVICE_URL}/api/study/mastery/${cardId}`, data),
  getProgress: (deckId) =>
    axios.get(`${STUDY_SERVICE_URL}/api/study/progress/overview`, { params: { deckId } }),
};

export const sharingAPI = {
  createShare: (deckId, data) =>
    axios.post(`${SHARING_SERVICE_URL}/api/sharing/decks/${deckId}`, data),
  getShares: (deckId) => axios.get(`${SHARING_SERVICE_URL}/api/sharing/decks/${deckId}`),
  deleteShare: (deckId, shareId) =>
    axios.delete(`${SHARING_SERVICE_URL}/api/sharing/decks/${deckId}/${shareId}`),
  resolveToken: (shareToken) =>
    axios.get(`${SHARING_SERVICE_URL}/api/sharing/link/${shareToken}`),
};
