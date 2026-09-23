// src/pages/SearchPage.jsx
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { motion } from "framer-motion";

const API_KEY = "2ff044456d4fa1c8534fc9e4378e227f";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingSeries, setTrendingSeries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const [moviesRes, seriesRes] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`),
          axios.get(`https://api.themoviedb.org/3/trending/tv/week?api_key=${API_KEY}`)
        ]);
        setTrendingMovies(moviesRes.data.results);
        setTrendingSeries(seriesRes.data.results);
      } catch (error) {
        console.error("Error fetching trending content:", error);
      }
    };
    fetchTrending();
  }, []);

  const searchContent = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchParams({});
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(
        `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(res.data.results);
      setSearchParams({ q: searchQuery });
    } catch (error) {
      console.error("Error searching content:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchContent(query);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [query, searchContent]);

  const renderMediaCard = (media) => {
    const isMovie = media.media_type === "movie" || media.title;
    const title = isMovie ? media.title : media.name;
    const releaseDate = isMovie ? media.release_date : media.first_air_date;
    // Updated link to match new routing
    const linkPath = isMovie ? `/movie/${media.id}` : `/series/${media.id}`;

    return (
      <motion.div
        key={media.id}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link to={linkPath}>
          <div className="relative rounded-lg overflow-hidden shadow-lg bg-navy/60">
            {/* Rating badge */}
            {media.vote_average && (
              <div className="absolute top-2 right-2 flex items-center bg-black/70 px-2 py-1 rounded-full z-10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-yellow-400 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                </svg>
                <span className="text-xs text-white font-semibold">{media.vote_average.toFixed(1)}</span>
              </div>
            )}
            <img
              src={media.poster_path ? `https://image.tmdb.org/t/p/w342${media.poster_path}` : "/no-poster.png"}
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

  const showSearchResults = query.trim() !== "";
  const contentToShow = showSearchResults ? searchResults : [...trendingMovies, ...trendingSeries];

  return (
    <main className="w-full max-w-[1800px] mx-auto px-2 md:px-6 py-8">
      <div className="mb-8 flex justify-center">
        <div className="group relative w-full max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-[#0ea5e9]" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for movies or series..."
            aria-label="Search for movies or series"
            className="h-11 w-full rounded-lg border border-[#102d53] bg-[#102d53]/80 py-2 pl-11 pr-11 text-base text-white outline-none transition placeholder:text-slate-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute inset-y-0 right-3 flex items-center rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {loading && <div className="text-center text-white py-8">Searching...</div>}

      {!loading && (
        <>
          {showSearchResults ? (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-white">
                Search Results {query && `for "${query}"`}
              </h2>
              {contentToShow.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-1 sm:gap-4">
                  {contentToShow.map(renderMediaCard)}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  No results found for "{query}"
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-white">Trending Movies & Series</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-1 sm:gap-4">
                {contentToShow.map(renderMediaCard)}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}