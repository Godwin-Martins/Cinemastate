import { useEffect, useState, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { DownloadManagerPlugin } from '../plugins/download-manager-plugin';
import {
  addDownload,
  loadDownloads,
  removeDownloadById,
  saveDownloads,
} from '../utils/downloadStorage';
import { FiTrash2, FiPlay, FiRefreshCw } from 'react-icons/fi';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`;
};

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function Downloads() {
  const [downloads, setDownloads] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [playUrl, setPlayUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const platform = useMemo(() => Capacitor.getPlatform(), []);

  const parsePendingDownloads = (pendingString) => {
    if (!pendingString) {
      return [];
    }
    try {
      const parsed = JSON.parse(pendingString);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Unable to parse pending downloads payload', error);
      return [];
    }
  };

  const loadAndVerifyDownloads = async () => {
    setIsRefreshing(true);
    const list = await loadDownloads();

    if (platform === 'android' && DownloadManagerPlugin?.getPendingDownloads) {
      const pendingResponse = await DownloadManagerPlugin.getPendingDownloads();
      const pendingList = parsePendingDownloads(pendingResponse?.pending || '');
      const merged = [...list, ...pendingList];
      await saveDownloads(merged);
    }

    const updated = await Promise.all(
      list.map(async (item) => {
        if (platform === 'android') {
          const response = await DownloadManagerPlugin.checkFileExists({ filePath: item.filePath });
          const exists = response?.exists ?? false;
          return { ...item, status: exists ? 'completed' : 'missing' };
        }
        return item;
      })
    );
    setDownloads(updated);
    await saveDownloads(updated);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadAndVerifyDownloads();
  }, []);

  useEffect(() => {
    if (platform !== 'android' || !DownloadManagerPlugin?.addListener) {
      return undefined;
    }

    const listener = DownloadManagerPlugin.addListener('downloadComplete', async (event) => {
      if (!event?.download) {
        return;
      }
      const nextDownloads = await addDownload(event.download);
      setDownloads(nextDownloads);
    });

    return () => listener.remove();
  }, [platform]);

  const handleOpenPlayer = async (download) => {
    if (platform === 'android') {
      const uri = Capacitor.convertFileSrc(download.filePath);
      setPlayUrl(uri);
      setSelectedId(download.id);
      return;
    }

    await DownloadManagerPlugin.openFile({ filePath: download.filePath });
  };

  const handleDelete = async (download) => {
    setStatusMessage('Removing movie...');
    const response = await DownloadManagerPlugin.deleteFile({ filePath: download.filePath });
    const removed = await removeDownloadById(download.id);
    setDownloads(removed);
    setStatusMessage(response?.success ? 'Removed locally.' : 'Removed from list.');
    setSelectedId((current) => (current === download.id ? null : current));
  };

  const activeDownload = downloads.find((item) => item.id === selectedId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Downloads</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Manage downloaded movies and series episodes stored in Downloads/AlphaFlix.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAndVerifyDownloads}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-full bg-skyblue px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiRefreshCw className="h-4 w-4" />
          {isRefreshing ? 'Refreshing…' : 'Refresh list'}
        </button>
      </div>

      {downloads.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-center text-slate-300 shadow-xl">
          <p className="text-lg font-medium text-white">No downloads yet.</p>
          <p className="mt-2 text-sm text-slate-400">
            Download a movie from the app and return here to watch it offline.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {downloads.map((download) => (
            <div key={download.id} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-xl">
              <div className="flex flex-col gap-4 p-5 sm:flex-row">
                <img
                  src={download.posterUrl || '/poster-fallback.png'}
                  alt={download.title}
                  className="h-40 w-full max-w-[160px] rounded-3xl object-cover shadow-lg sm:h-44"
                />

                <div className="flex flex-1 flex-col justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-white">{download.title}</p>
                      <span className="rounded-full bg-skyblue/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-skyblue ring-1 ring-skyblue/20">
                        {download.status === 'missing' ? 'Missing' : 'Offline'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      {formatBytes(download.fileSize || download.sizeBytes)} • {formatDate(download.downloadedAt)}
                    </p>
                    <p className="mt-2 max-w-xl text-sm text-slate-400 line-clamp-2">
                      {download.filePath}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPlayer(download)}
                      disabled={download.status === 'missing'}
                      className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white"
                    >
                      <FiPlay className="h-4 w-4" />
                      Play
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(download)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                    >
                      <FiTrash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeDownload && playUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-lg font-semibold text-white">{activeDownload.title}</p>
                <p className="text-sm text-slate-400">Offline playback</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setPlayUrl('');
                }}
                className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Close
              </button>
            </div>
            <video
              controls
              autoPlay
              className="h-[70vh] w-full bg-black object-contain"
              src={playUrl}
            />
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="fixed bottom-6 right-6 rounded-3xl bg-slate-950/95 px-4 py-3 text-sm text-slate-200 shadow-2xl ring-1 ring-white/10">
          {statusMessage}
        </div>
      )}
    </div>
  );
}
