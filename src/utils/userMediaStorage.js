import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const FAVORITES_COLLECTION = "favorites";
const HISTORY_COLLECTION = "watchHistory";

const getCollection = (userId, collectionName) =>
  collection(db, "users", userId, collectionName);

const readLocalList = (key) => {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : [];
  } catch {
    return [];
  }
};

export const getFavoriteMedia = async (userId) => {
  const favoritesQuery = query(
    getCollection(userId, FAVORITES_COLLECTION),
    orderBy("saved_at", "desc")
  );
  const snapshot = await getDocs(favoritesQuery);
  return snapshot.docs.map((item) => item.data());
};

export const getWatchHistory = async (userId) => {
  const historyQuery = query(
    getCollection(userId, HISTORY_COLLECTION),
    orderBy("watched_at", "desc"),
    limit(50)
  );
  const snapshot = await getDocs(historyQuery);
  return snapshot.docs.map((item) => item.data());
};

export const hasFavoriteMedia = async (userId, mediaId, mediaType) => {
  const favoriteRef = doc(
    getCollection(userId, FAVORITES_COLLECTION),
    `${mediaType}_${mediaId}`
  );
  const snapshot = await getDoc(favoriteRef);
  return snapshot.exists();
};

export const saveFavoriteMedia = async (userId, media) => {
  const mediaType = media.media_type || (media.title ? "movie" : "tv");
  await setDoc(doc(getCollection(userId, FAVORITES_COLLECTION), `${mediaType}_${media.id}`), {
    ...media,
    media_type: mediaType,
    saved_at: new Date().toISOString(),
  });
};

export const removeFavoriteMedia = async (userId, media) => {
  const mediaType = media.media_type || (media.title ? "movie" : "tv");
  await deleteDoc(doc(getCollection(userId, FAVORITES_COLLECTION), `${mediaType}_${media.id}`));
};

export const addMediaToWatchHistory = async (userId, media) => {
  const mediaType = media.media_type || (media.title ? "movie" : "tv");
  await setDoc(doc(getCollection(userId, HISTORY_COLLECTION), `${mediaType}_${media.id}`), {
    ...media,
    media_type: mediaType,
    watched_at: new Date().toISOString(),
  });
};

export const removeMediaFromWatchHistory = async (userId, media) => {
  const mediaType = media.media_type || (media.title ? "movie" : "tv");
  await deleteDoc(doc(getCollection(userId, HISTORY_COLLECTION), `${mediaType}_${media.id}`));
};

export const migrateLocalMedia = async (userId) => {
  const localFavorites = readLocalList(`savedMedia_${userId}`);
  const localHistory = readLocalList(`watchHistory_${userId}`);
  const [remoteFavorites, remoteHistory] = await Promise.all([
    getFavoriteMedia(userId),
    getWatchHistory(userId),
  ]);

  if (remoteFavorites.length === 0) {
    await Promise.all(localFavorites.map((media) => saveFavoriteMedia(userId, media)));
  }
  if (remoteHistory.length === 0) {
    await Promise.all(localHistory.map((media) => addMediaToWatchHistory(userId, media)));
  }

  if (localFavorites.length || localHistory.length) {
    localStorage.removeItem(`savedMedia_${userId}`);
    localStorage.removeItem(`watchHistory_${userId}`);
  }

  return {
    favorites: remoteFavorites.length ? remoteFavorites : localFavorites,
    history: remoteHistory.length ? remoteHistory : localHistory,
  };
};
