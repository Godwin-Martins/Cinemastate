// src/components/Banner.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaPlay } from "react-icons/fa"; 
import { MdInfoOutline } from "react-icons/md"; 
import { FiX, FiServer } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const API_KEY = "2ff044456d4fa1c8534fc9e4378e227f";
const IMG_BASE = "https://image.tmdb.org/t/p/original";
const bannerCache = new Map();

export default function Banner({
  fetchUrl = `/trending/all/week?api_key=${API_KEY}`,
  forcedMediaType = null, // pass "movie" or "tv" when fetchUrl doesn't return media_type (e.g. /movie/popular, /tv/popular)
}) {
  const [trending, setTrending] = useState([]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [activeServer, setActiveServer] = useState("vidsrc"); // Default streaming provider
  const [logos, setLogos] = useState({}); // { [itemId]: logoFilePath | null }

  useEffect(() => {
    const cacheKey = `${fetchUrl}:${forcedMediaType || "all"}`;
    const cachedResults = bannerCache.get(cacheKey);
    if (cachedResults) {
      setTrending(cachedResults);
      setIndex(0);
      return undefined;
    }

    async function fetchTrending() {
      try {
        const res = await axios.get(`https://api.themoviedb.org/3${fetchUrl}`);
        const rawResults = Array.isArray(res.data.results) ? res.data.results : [];

        const results = rawResults
          .filter((item) => {
            if (!forcedMediaType) return true;
            if (forcedMediaType === "movie") {
              return item.title || item.media_type !== "tv";
            }
            if (forcedMediaType === "tv") {
              return item.name || item.media_type !== "movie";
            }
            return true;
          })
          .map((item) => ({
            ...item,
            media_type: forcedMediaType || item.media_type || (item.title ? "movie" : "tv"),
          }));

        const nextTrending = results.slice(0, 20);
        bannerCache.set(cacheKey, nextTrending);
        setTrending(nextTrending);
      } catch (err) {
        console.error("Error fetching trending:", err);
      }
    }
    setIndex(0);
    fetchTrending();
  }, [fetchUrl, forcedMediaType]);

  useEffect(() => {
    if (trending.length > 0) {
      const interval = setInterval(() => {
        setDirection(1);
        setIndex((prev) => (prev + 1) % trending.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [trending]);

  // Fetch the title logo (clearlogo) for the current item, once, then cache it
  useEffect(() => {
    if (!trending.length) return;

    const currentItem = trending[index];
    const currentType = currentItem.media_type || (currentItem.title ? "movie" : "tv");

    if (logos[currentItem.id] !== undefined) return; // already fetched (or attempted)

    let cancelled = false;

    async function fetchLogo() {
      try {
        const res = await axios.get(
          `https://api.themoviedb.org/3/${currentType}/${currentItem.id}/images?api_key=${API_KEY}&include_image_language=en,null`
        );
        const logosList = res.data.logos || [];
        const bestLogo =
          logosList.find((l) => l.iso_639_1 === "en") ||
          logosList.find((l) => l.iso_639_1) ||
          logosList.find((l) => l.iso_639_1 === null) ||
          logosList[0];

        if (!cancelled) {
          setLogos((prev) => ({ ...prev, [currentItem.id]: bestLogo?.file_path || null }));
        }
      } catch (err) {
        console.error("Error fetching logo:", err);
        if (!cancelled) {
          setLogos((prev) => ({ ...prev, [currentItem.id]: null }));
        }
      }
    }

    fetchLogo();

    return () => {
      cancelled = true;
    };
  }, [trending, index, logos]);

  if (!trending.length) return null;

  const item = trending[index];
  const mediaType = item.media_type || (item.title ? "movie" : "tv");
  const logoPath = logos[item.id];

  const getVideoUrl = (media) => {
    if (!media) return "";
    const type = media.media_type === "movie" || media.title ? "movie" : "tv";

    if (activeServer === "vidlink") {
      // VidLink Route Builder
      if (type === "movie") {
        return `https://vidlink.pro/movie/${media.id}?primaryColor=0ea5e9`;
      }
      // Default to season 1, episode 1 for TV (Banner has no episode context)
      return `https://vidlink.pro/tv/${media.id}/1/1?primaryColor=0ea5e9`;
    }

    // Default Vidsrc (vsrc.su) Route Builder
    if (type === "movie") {
      return `https://vsrc.su/embed/movie/${media.id}?autoplay=1`;
    }
    return `https://vsrc.su/embed/tv/${media.id}/1/1?autoplay=1`; // default season 1, ep 1
  };

  const handlePlay = (media) => {
    setCurrentMedia(media);
    setShowPlayer(true);
  };

  const handleClosePlayer = () => {
    setShowPlayer(false);
    setCurrentMedia(null);
    setActiveServer("vidsrc"); // Reset back to default server on close
  };

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir < 0 ? 300 : -300, opacity: 0 }),
  };

  return (
    <section className="relative h-[400px] md:h-[580px] overflow-hidden">
      {/* Background */}
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={item.id}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMG_BASE}${item.backdrop_path})` }}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-800/40 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-navy to-transparent"></div>
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute bottom-6 md:bottom-12 left-4 md:left-10 right-4 md:right-auto z-10">
        <AnimatePresence>
          <motion.div
            key={item.id}
            className="p-0 md:p-6 rounded-xl max-w-full md:max-w-2xl bg-transparent md:bg-navy/40 md:backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            {logoPath ? (
              <img
                src={`${IMG_BASE}${logoPath}`}
                alt={item.title || item.name}
                className="max-w-[220px] md:max-w-[340px] max-h-20 md:max-h-28 object-contain mb-2 drop-shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextSibling.style.display = "block";
                }}
              />
            ) : null}
            <h2
              className="text-2xl md:text-4xl font-bold text-sky-400 mb-2 drop-shadow-lg"
              style={logoPath ? { display: "none" } : undefined}
            >
              {item.title || item.name}
            </h2>
            <p className="text-sm md:text-base text-gray-200 mb-2">
              ⭐ {item.vote_average.toFixed(1)} TMDB
            </p>
            <p className="text-xs md:text-sm text-gray-300 mb-4 line-clamp-2 md:line-clamp-3">
              {item.overview || "No description available."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Play Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 bg-sky-600 border border-sky-600 text-white px-4 py-2 md:px-6 md:py-2 rounded-lg font-semibold hover:bg-sky-400 hover:text-navy transition"
                onClick={() => handlePlay({ ...item, media_type: mediaType })}
              >
                <FaPlay /> Play
              </motion.button>

              {/* Info Button */}
              <Link to={`/${mediaType === "movie" ? "movie" : "series"}/${item.id}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center gap-2 border border-sky-400 text-sky-400 px-4 py-2 md:px-6 md:py-2 rounded-lg font-semibold hover:bg-sky-400/10 transition w-full"
                >
                  <MdInfoOutline /> Info
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {showPlayer && currentMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={handleClosePlayer}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative w-[90%] md:w-[60%] h-[60%] bg-black rounded-lg overflow-visible"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Toolbar: Server Switcher + Close Button */}
              <div className="absolute -top-12 inset-x-0 flex items-center justify-between z-10 px-1">
                {/* Server Switcher Controls */}
                <div className="flex items-center gap-2 bg-gray-900/80 p-1.5 rounded-lg border border-gray-800 backdrop-blur-sm shadow-md">
                  <span className="text-xs text-gray-400 font-medium px-2 flex items-center gap-1.5">
                    <FiServer className="w-3.5 h-3.5 text-skyblue" /> Server:
                  </span>
                   <button
                    onClick={() => setActiveServer("vidsrc")}
                    className={`text-xs font-bold px-3 py-1 rounded transition-all duration-250 ${
                      activeServer === "vidsrc"
                        ? "bg-sky-600 text-white shadow-sm"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    Vidsrc
                  </button>
                  <button
                    onClick={() => setActiveServer("vidlink")}
                    className={`text-xs font-bold px-3 py-1 rounded transition-all duration-250 ${
                      activeServer === "vidlink"
                        ? "bg-sky-600 text-white shadow-sm"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    VidLink
                  </button>
                 
                </div>

                {/* Close Button */}
                <button
                  onClick={handleClosePlayer}
                  className="flex items-center gap-2 rounded-full border border-red-500/70 bg-red-600/20 px-3 py-1.5 text-sm font-semibold text-red-100 transition-colors duration-200 hover:bg-red-600/30"
                >
                  <FiX className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>

              {/* Video iframe */}
              <div className="w-full h-full rounded-lg overflow-hidden">
                <iframe
                  src={getVideoUrl(currentMedia)}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={`${currentMedia.title || currentMedia.name} - Player`}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}