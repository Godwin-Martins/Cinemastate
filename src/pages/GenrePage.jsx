import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

const API_KEY = "2ff044456d4fa1c8534fc9e4378e227f";
const GENRE_MAP = {
  "Action": 28,
  "Animation": 16,
  "Horror": 27,
  "Thrillers": 53,
  "Fantasy": 14,
  "Adventure": 12,
  "War": 10752,
  "History": 36,
  "Comedy": 35,
  "Crime": 80,
  "Mystery": 9648,
  "Science Fiction": 878,
};

export default function GenrePage() {
  const { genreName } = useParams();
  const findGenreKey = (name) => {
    if (!name) return null;
    const lower = name.toLowerCase();
    return Object.keys(GENRE_MAP).find((k) => {
      const keyLower = k.toLowerCase();
      if (keyLower === lower) return true;
      // support slug-style params like 'science-fiction' -> 'Science Fiction'
      if (keyLower === lower.replace(/[-_]/g, " ")) return true;
      return false;
    });
  };

  const matchedKey = useMemo(() => findGenreKey(genreName), [genreName]);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loader = useRef(null);

  const fetchGenreContent = useCallback(async (pageNum) => {
    if (!hasMore && pageNum > 1) return;

    setLoading(true);
    setError(null);

    try {
      const key = findGenreKey(genreName);
      if (!key) throw new Error(`Genre ${genreName} not supported`);
      const genreId = GENRE_MAP[key];

      const [moviesRes, seriesRes] = await Promise.all([
        axios.get(
          `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&page=${pageNum}`
        ),
        axios.get(
          `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=${genreId}&page=${pageNum}`
        )
      ]);

      const combinedResults = [...moviesRes.data.results, ...seriesRes.data.results];

      setMedia(prev => pageNum === 1 ? combinedResults : [...prev, ...combinedResults]);

      setHasMore(
        moviesRes.data.page < moviesRes.data.total_pages ||
        seriesRes.data.page < seriesRes.data.total_pages
      );
    } catch (err) {
      console.error("Error fetching genre content:", err);
      setError("Failed to load content for this genre");
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [genreName, hasMore]);

  useEffect(() => {
    setMedia([]);
    setPage(1);
    setHasMore(true);
    fetchGenreContent(1);
  }, [genreName, fetchGenreContent]);

  useEffect(() => {
    if (page > 1) fetchGenreContent(page);
  }, [page, fetchGenreContent]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) setPage(prev => prev + 1);
      },
      { threshold: 1 }
    );
    if (loader.current) observer.observe(loader.current);
    return () => loader.current && observer.unobserve(loader.current);
  }, [hasMore]);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const renderMediaCard = (item) => {
    const isMovie = item.media_type === "movie" || item.title !== undefined;
    const title = isMovie ? item.title : item.name;
    const releaseDate = isMovie ? item.release_date : item.first_air_date;
    const linkPath = isMovie ? `/movie/${item.id}` : `/series/${item.id}`;

    return (
      <motion.div
  key={item.id}
  variants={item}
  // whileHover={{ scale: 1.05 }}
  transition={{ type: "spring", stiffness: 150, damping: 20 }} // <-- smooth hover
>
  <Link to={linkPath}>
    <div className="relative rounded-lg overflow-hidden shadow-lg bg-navy/60">
      {/* Rating badge */}
      {item.vote_average && (
        <div className="absolute top-2 right-2 flex items-center bg-black/70 px-2 py-1 rounded-full z-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-yellow-400 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
          </svg>
          <span className="text-xs text-white font-semibold">{item.vote_average.toFixed(1)}</span>
        </div>
      )}
      <img
        src={item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : "/no-poster.png"}
        alt={title}
        className="w-full h-48 sm:h-48 md:h-64 object-cover"
      />
      <div className="p-2">
        <h3 className="text-sm font-semibold truncate">{title}</h3>
        <p className="text-xs text-gray-400">{releaseDate}</p>
      </div>
    </div>
  </Link>
</motion.div>

    );
  };

  return (
    <main className="w-full max-w-[1800px] mx-auto px-2 md:px-6 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-skyblue">{matchedKey || genreName}</h1>

      {error && <div className="text-center text-red-500 py-8">{error}</div>}

      {media.length > 0 ? (
        <motion.div
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-1 sm:gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {media.map(renderMediaCard)}
        </motion.div>
      ) : !loading && (
        <div className="text-center text-gray-400 py-8">
          No content found for {genreName}
        </div>
      )}

      <div ref={loader} className="h-10"></div>

      {loading && <div className="text-center text-white py-8">Loading...</div>}
      {!hasMore && media.length > 0 && <div className="text-center text-gray-400 mt-4">No more content to load.</div>}
    </main>
  );
}
