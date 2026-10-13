import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { filterMediaArray } from "../utils/mediaFilter";

const API_BASE = "https://api.themoviedb.org/3";
const API_KEY = "2ff044456d4fa1c8534fc9e4378e227f";

function buildPageUrl(fetchUrl, page) {
  const separator = fetchUrl.includes("?") ? "&" : "?";
  return `${API_BASE}${fetchUrl}${separator}page=${page}`;
}

export default function SeeMorePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sectionState = location.state || {};
  const title = sectionState.title || searchParams.get("title") || "More to explore";
  const fetchUrl = sectionState.fetchUrl || searchParams.get("fetchUrl") || "";
  const initialItems = Array.isArray(sectionState.items) ? sectionState.items : null;
  const [items, setItems] = useState(() => filterMediaArray(initialItems || []));
  const [page, setPage] = useState(initialItems?.length ? 1 : 0);
  const [loading, setLoading] = useState(!initialItems?.length && Boolean(fetchUrl));
  const [hasMore, setHasMore] = useState(Boolean(fetchUrl));
  const [error, setError] = useState("");
  const loaderRef = useRef(null);
  const requestRef = useRef(false);

  const loadPage = useCallback(async (pageNumber) => {
    if (!fetchUrl || requestRef.current) return;
    requestRef.current = true;
    setLoading(true);
    setError("");

    try {
      const url = new URL(buildPageUrl(fetchUrl, pageNumber));
      if (!url.searchParams.has("api_key")) {
        url.searchParams.set("api_key", API_KEY);
      }
      const response = await axios.get(url.toString());
      const results = filterMediaArray(response.data.results || []);
      setItems((previous) => {
        const existingIds = new Set(previous.map((item) => item.id));
        return pageNumber === 1
          ? results
          : [...previous, ...results.filter((item) => !existingIds.has(item.id))];
      });
      setPage(pageNumber);
      setHasMore(pageNumber < (response.data.total_pages || pageNumber));
    } catch (requestError) {
      console.error("Error loading more section content:", requestError);
      setError("Could not load more content. Please try again.");
      setHasMore(false);
    } finally {
      requestRef.current = false;
      setLoading(false);
    }
  }, [fetchUrl]);

  useEffect(() => {
    if (initialItems?.length || !fetchUrl) return;
    loadPage(1);
  }, [fetchUrl, initialItems, loadPage]);

  useEffect(() => {
    const node = loaderRef.current;
    if (!node || !fetchUrl || !hasMore) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loading) {
        loadPage(page + 1);
      }
    }, { rootMargin: "300px" });

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchUrl, hasMore, loadPage, loading, page]);

  const renderMediaCard = (media) => {
    const isMovie = media.media_type === "movie" || Boolean(media.title);
    const mediaTitle = isMovie ? media.title : media.name;
    const releaseDate = isMovie ? media.release_date : media.first_air_date;
    const linkPath = isMovie ? `/movie/${media.id}` : `/series/${media.id}`;

    return (
      <motion.div
        key={`${media.media_type || (isMovie ? "movie" : "tv")}-${media.id}`}
        className="transition-transform duration-200 md:hover:scale-105"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link to={linkPath}>
          <div className="relative overflow-hidden rounded-lg bg-navy/60 shadow-lg">
            {media.vote_average > 0 && (
              <div className="absolute right-2 top-2 z-10 flex items-center rounded-full bg-black/70 px-2 py-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1 h-4 w-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                </svg>
                <span className="text-xs font-semibold text-white">{media.vote_average.toFixed(1)}</span>
              </div>
            )}
            <img
              src={media.poster_path ? `https://image.tmdb.org/t/p/w342${media.poster_path}` : "/no-poster.png"}
              alt={mediaTitle}
              className="h-48 w-full object-cover sm:h-48 md:h-64"
            />
            <div className="p-2">
              <h3 className="truncate text-sm font-semibold">{mediaTitle}</h3>
              <p className="text-xs text-gray-400">{releaseDate}</p>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  const handleBack = () => {
    if (sectionState.from) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1800px] px-2 py-8 md:px-6">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        title="Go back"
        className="fixed left-4 top-24 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-sky-600 text-white shadow-lg transition md:hover:scale-105 md:hover:bg-sky-500"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <h1 className="mb-6 pl-14 text-2xl font-bold text-white md:text-3xl">{title}</h1>

      {items.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
          {items.map(renderMediaCard)}
        </div>
      ) : !loading && (
        <div className="py-8 text-center text-gray-400">
          {error || "No content found."}
        </div>
      )}

      {error && items.length > 0 && (
        <p className="py-4 text-center text-red-400">{error}</p>
      )}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        </div>
      )}
      {hasMore && <div ref={loaderRef} className="h-8" />}
      {!hasMore && items.length > 0 && (
        <p className="py-6 text-center text-sm text-gray-400">You&apos;ve reached the end.</p>
      )}
    </main>
  );
}
