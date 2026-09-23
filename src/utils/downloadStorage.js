import { Preferences } from '@capacitor/preferences';

const DOWNLOADS_KEY = 'alphaFlixDownloads';

export async function loadDownloads() {
  const { value } = await Preferences.get({ key: DOWNLOADS_KEY });
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse downloads list:', error);
    return [];
  }
}

export async function saveDownloads(downloads) {
  await Preferences.set({ key: DOWNLOADS_KEY, value: JSON.stringify(downloads) });
}

export async function addDownload(download) {
  const current = await loadDownloads();
  const next = [
    ...current.filter((item) => item.id !== download.id),
    {
      ...download,
      status: download.status || 'completed',
      downloadedAt: download.downloadedAt || new Date().toISOString(),
    },
  ];
  await saveDownloads(next);
  return next;
}

export async function removeDownloadById(id) {
  const current = await loadDownloads();
  const next = current.filter((item) => item.id !== id);
  await saveDownloads(next);
  return next;
}

export async function updateDownloadById(id, updates) {
  const current = await loadDownloads();
  const next = current.map((item) => (item.id === id ? { ...item, ...updates } : item));
  await saveDownloads(next);
  return next;
}
