import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE = "https://api.themoviedb.org/3";

import { filterMediaArray } from "../utils/mediaFilter";

export default function SeeMoreModal({ title, items = [], fetchUrl, onClose }) {
  const [list, setList] = useState(filterMediaArray(items));
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    setList(filterMediaArray(items));
    setPage(1);
    setHasMore(true);
  }, [items]);

  useEffect(() => {
    if (!fetchUrl) return;
    // ensure initial page params
    setHasMore(true);
  }, [fetchUrl]);

  const loadMore = async () => {
    if (!fetchUrl || loading || !hasMore) return;
    try {
      setLoading(true);
      const nextPage = page + 1;
      const separator = fetchUrl.includes("?") ? "&" : "?";
      const url = `${API_BASE}${fetchUrl}${separator}page=${nextPage}`;
      const res = await axios.get(url);
      const results = res.data.results || [];
      if (results.length === 0) setHasMore(false);
      setList((s) => [...s, ...results]);
      setPage(nextPage);
    } catch (e) {
      console.error("Error loading more:", e);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const onScroll = () => {
      if (node.scrollTop + node.clientHeight >= node.scrollHeight - 200) {
        loadMore();
      }
    };
    node.addEventListener("scroll", onScroll);
    return () => node.removeEventListener("scroll", onScroll);
  }, [containerRef.current, page, loading, hasMore]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="relative z-10 max-w-[1600px] w-full bg-gray-900 rounded-xl shadow-xl overflow-hidden"
        style={{ maxHeight: '85vh' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={containerRef} className="p-4 overflow-y-auto" style={{ maxHeight: '75vh' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 items-stretch">
            {list.map((item) => (
              <Link
                key={item.id}
                to={`/${item.media_type === 'tv' ? 'series' : 'movie'}/${item.id}`}
                className="w-full"
              >
                <div className="w-full rounded-lg overflow-hidden shadow-lg bg-navy/60">
                  <img
                    src={item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '/no-poster.png'}
                    alt={item.title || item.name}
                    className="w-full h-56 md:h-64 lg:h-72 object-cover"
                  />
                  <div className="p-2">
                    <h4 className="text-sm font-semibold truncate">{item.title || item.name}</h4>
                    <p className="text-xs text-gray-400">{item.release_date || item.first_air_date || ''}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
            </div>
          )}

          {!hasMore && !fetchUrl && list.length === items.length && (
            <div className="text-center text-sm text-gray-400 py-4">Showing all items</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
