// src/pages/ShowMovieDetails.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../firebase";
import {
  addMediaToWatchHistory,
  migrateLocalMedia,
  removeFavoriteMedia,
  saveFavoriteMedia,
} from "../utils/userMediaStorage";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { FiDownload, FiX, FiArrowLeft, FiPlay, FiServer, FiHeart, FiShare2 } from 'react-icons/fi';

const API_KEY = "2ff044456d4fa1c8534fc9e4378e227f";
const IMG_BASE = "https://image.tmdb.org/t/p/original";
const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

function ScrollingRole({ role, className }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [overflowDistance, setOverflowDistance] = useState(0);

  useEffect(() => {
    const updateOverflow = () => {
      const container = containerRef.current;
      const text = textRef.current;

      if (container && text) {
        setOverflowDistance(Math.max(0, text.scrollWidth - container.clientWidth));
      }
    };

    updateOverflow();
    const resizeObserver = new ResizeObserver(updateOverflow);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [role]);

  return (
    <div ref={containerRef} className={`role-scroller ${className}`}>
      <span
        ref={textRef}
        className={overflowDistance > 0 ? "role-scroller__text role-scroller__text--moving" : "role-scroller__text"}
        style={{ "--role-scroll-distance": `${overflowDistance}px` }}
      >
        {role || "Unknown role"}
      </span>
    </div>
  );
}

export default function ShowMovieDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const mediaType = location.pathname.includes("/series/") ? "tv" : "movie";
  
  const [media, setMedia] = useState(null);
  const [cast, setCast] = useState([]);
  const [isCastExpanded, setIsCastExpanded] = useState(false); // Controls expanding/collapsing cast list
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationPage, setRecommendationPage] = useState(1);
  const [hasMoreRecommendations, setHasMoreRecommendations] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seasonEpisodes, setSeasonEpisodes] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isDescriptionOverflowing, setIsDescriptionOverflowing] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [hoveredEpisodeId, setHoveredEpisodeId] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadContext, setDownloadContext] = useState({ itemType: "media", episode: null });
  const hoverTimeoutRef = useRef(null);
  const descriptionRef = useRef(null);
  const recommendationSentinelRef = useRef(null);
  const recommendationRequestRef = useRef(false);

  // Streaming Server State Management
  const [activeServer, setActiveServer] = useState("vidsrc"); // Default streaming provider

  useEffect(() => {
    setShowFullDescription(false);
    setIsDescriptionOverflowing(false);
  }, [media?.overview]);

  useEffect(() => {
    const description = descriptionRef.current;
    if (!description) return undefined;

    const checkDescriptionOverflow = () => {
      const wasClamped = description.classList.contains("line-clamp-3");
      if (wasClamped) {
        description.classList.remove("line-clamp-3");
      }

      const fullDescriptionHeight = description.scrollHeight;
      const computedStyle = window.getComputedStyle(description);
      const lineHeight =
        parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.2;

      if (wasClamped) {
        description.classList.add("line-clamp-3");
      }

      setIsDescriptionOverflowing(fullDescriptionHeight > lineHeight * 3 + 1);
    };

    checkDescriptionOverflow();
    const resizeObserver = new ResizeObserver(checkDescriptionOverflow);
    resizeObserver.observe(description);

    return () => resizeObserver.disconnect();
  }, [media?.overview, showFullDescription]);

  // Function to handle banner hover for trailer
  const handleBannerHover = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      if (trailerUrl) {
        setShowTrailer(true);
      }
    }, 5000); // 5 second delay
  };

  const handleBannerLeave = () => {
    setShowTrailer(false);
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Function to update the saved state from localStorage
  const checkSavedStatus = useCallback(async (mediaId) => {
    const user = auth.currentUser;
    if (user && mediaId) {
      try {
        const { favorites } = await migrateLocalMedia(user.uid);
        setIsSaved(favorites.some((item) => item.id === mediaId));
      } catch (error) {
        console.error("Error checking saved media:", error);
        setIsSaved(false);
      }
    } else {
      setIsSaved(false);
    }
  }, []);

  useEffect(() => {
    const fetchMediaDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch main media details
        const mediaRes = await axios.get(
          `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${API_KEY}&append_to_response=credits,recommendations,videos,images&include_image_language=en,null`
        );
        
        setMedia(mediaRes.data);
        const initialRecommendations = (mediaRes.data.recommendations?.results || []).map(item => ({
          ...item,
          media_type: item.media_type || mediaType,
        }));
        setRecommendations(initialRecommendations);
        setRecommendationPage(1);
        setHasMoreRecommendations(true);
        
        // After fetching media details, check the saved status
        await checkSavedStatus(mediaRes.data.id);

        // Set cast - use aggregate_credits for TV (full cast across all seasons)
        if (mediaType === "tv") {
          const aggRes = await axios.get(
            `https://api.themoviedb.org/3/tv/${id}/aggregate_credits?api_key=${API_KEY}`
          );
          setCast(aggRes.data.cast || []);
        } else {
          setCast(mediaRes.data.credits?.cast || []);
        }
        
        // If it's a series, fetch episodes
        if (mediaType === "tv" && mediaRes.data.seasons?.length > 0) {
          const seasonRes = await axios.get(
            `https://api.themoviedb.org/3/tv/${id}/season/${selectedSeason}?api_key=${API_KEY}`
          );
          setSeasonEpisodes(seasonRes.data.episodes || []);
        }

        // Fetch trailer URL from videos
        if (mediaRes.data.videos?.results?.length > 0) {
          const trailer = mediaRes.data.videos.results.find(
            video => video.type === "Trailer" && video.site === "YouTube"
          );
          if (trailer) {
            setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&rel=0&playlist=${trailer.key}&loop=1`);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching media details:", error);
        toast.error("Failed to load media details. Please try again.", {
          position: "top-right",
          autoClose: 3000,
        });
        setLoading(false);
      }
    };

    fetchMediaDetails();
  }, [mediaType, id, selectedSeason, checkSavedStatus]);

  const mediaGenreKey = media?.genres?.map(genre => genre.id).join("|") || "";

  const loadRecommendations = useCallback(async (page, reset = false) => {
    if (!mediaGenreKey || recommendationRequestRef.current || (!hasMoreRecommendations && !reset)) {
      return;
    }

    recommendationRequestRef.current = true;
    setIsLoadingRecommendations(true);

    try {
      const discoverParams = `api_key=${API_KEY}&language=en-US&page=${page}&sort_by=popularity.desc&include_adult=false&with_genres=${mediaGenreKey}`;
      const [moviesRes, seriesRes] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/discover/movie?${discoverParams}`),
        axios.get(`https://api.themoviedb.org/3/discover/tv?${discoverParams}`),
      ]);

      const currentId = Number(id);
      const mixedResults = [
        ...(moviesRes.data.results || []).map(item => ({ ...item, media_type: "movie" })),
        ...(seriesRes.data.results || []).map(item => ({ ...item, media_type: "tv" })),
      ]
        .filter(item => !(item.id === currentId && item.media_type === mediaType))
        .sort((first, second) => (second.popularity || 0) - (first.popularity || 0));

      setRecommendations(previous => {
        const existingKeys = new Set(previous.map(item => `${item.media_type}-${item.id}`));
        const newItems = mixedResults.filter(item => !existingKeys.has(`${item.media_type}-${item.id}`));
        return reset ? newItems : [...previous, ...newItems];
      });
      setRecommendationPage(page + 1);
      setHasMoreRecommendations(
        page < Math.max(moviesRes.data.total_pages || 1, seriesRes.data.total_pages || 1)
      );
    } catch (error) {
      console.error("Error fetching genre recommendations:", error);
      setHasMoreRecommendations(false);
    } finally {
      recommendationRequestRef.current = false;
      setIsLoadingRecommendations(false);
    }
  }, [hasMoreRecommendations, id, mediaGenreKey, mediaType]);

  useEffect(() => {
    if (mediaGenreKey) {
      loadRecommendations(1);
    }
  }, [mediaGenreKey, loadRecommendations]);

  useEffect(() => {
    const sentinel = recommendationSentinelRef.current;
    if (!sentinel || !mediaGenreKey) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadRecommendations(recommendationPage);
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadRecommendations, mediaGenreKey, recommendationPage]);

  // Function to add media to watch history
  const addToWatchHistory = async () => {
    const user = auth.currentUser;
    if (!user || !media) return;

    const mediaToAdd = {
      ...media,
      media_type: mediaType,
    };
    try {
      await addMediaToWatchHistory(user.uid, mediaToAdd);
    } catch (error) {
      console.error("Error updating watch history:", error);
    }
  };

  // Function to handle playing media
  const handlePlay = (episode = null) => {
    addToWatchHistory();

    if (mediaType === "tv") {
      const episodeToPlay = episode || seasonEpisodes[0];
      if (episodeToPlay) {
        setCurrentEpisode(episodeToPlay);
        setCurrentSeason(selectedSeason);
        setShowPlayer(true);
        toast.info(`Playing ${media.name} - S${selectedSeason}E${episodeToPlay.episode_number}`, {
          position: "top-center",
          autoClose: 2000,
        });
      }
    } else {
      setShowPlayer(true);
      toast.info(`Playing ${media.title}`, {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  // Function to close player
  const handleClosePlayer = () => {
    setShowPlayer(false);
    setCurrentEpisode(null);
    setActiveServer("vidsrc"); // Reset back to default server on close
  };

  // Dynamic URL construction with VidLink fallback routing
  const getVideoUrl = () => {
    if (activeServer === "vidlink") {
      // VidLink Route Builder
      if (mediaType === "movie") {
        return `https://vidlink.pro/movie/${id}?primaryColor=0ea5e9`;
      } else if (mediaType === "tv" && currentEpisode) {
        return `https://vidlink.pro/tv/${id}/${currentSeason}/${currentEpisode.episode_number}?primaryColor=0ea5e9`;
      }
      return `https://vidlink.pro/${mediaType}/${id}?primaryColor=0ea5e9`;
    } else {
      // Default Vidsrc (vsrc.su) Route Builder
      if (mediaType === "movie") {
        return `https://vsrc.su/embed/movie/${id}?autoplay=1`;
      } else if (mediaType === "tv" && currentEpisode) {
        return `https://vsrc.su/embed/tv/${id}/${currentSeason}/${currentEpisode.episode_number}?autoplay=1`;
      }
      return `https://vsrc.su/embed/${mediaType}/${id}?autoplay=1`;
    }
  };

  // Download Handler function - opens in-app webview
  const handleDownload = (item, itemType = 'media', episode = null) => {
    setDownloadContext({ itemType, episode });
    setShowDownloadModal(true);
  };

  const confirmDownload = (serverKey) => {
    const tmdbId = media?.id ?? id;
    let downloadUrl;

    if (serverKey === 'moviepire') {
      if (downloadContext.itemType === 'movie') {
        downloadUrl = `https://video.moviepire.co/download/movie/${tmdbId}`;
      } else if (downloadContext.itemType === 'series' && downloadContext.episode) {
        downloadUrl = `https://video.moviepire.co/download/tv/${tmdbId}/${selectedSeason}/${downloadContext.episode.episode_number}`;
      } else {
        downloadUrl = `https://video.moviepire.co/download/tv/${tmdbId}`;
      }
    } else {
      if (downloadContext.itemType === 'movie') {
        downloadUrl = `https://vidvault.ru/movie/${tmdbId}`;
      } else if (downloadContext.itemType === 'series' && downloadContext.episode) {
        downloadUrl = `https://vidvault.ru/tv/${tmdbId}/${selectedSeason}/${downloadContext.episode.episode_number}`;
      } else {
        downloadUrl = `https://vidvault.ru/tv/${tmdbId}`;
      }
    }

    setShowDownloadModal(false);
    navigate(
      `/webview/${encodeURIComponent(downloadUrl)}`,
      {
        state: {
          downloadMetadata: {
            title: media?.title || media?.name || "AlphaFlix Download",
            posterUrl: media?.poster_path ? `${POSTER_BASE}${media.poster_path}` : "",
            itemType: downloadContext.itemType,
            episodeNumber: downloadContext.episode?.episode_number ?? null,
          },
        },
      }
    );
  };

  const handleSave = async () => {
    if (!media) return;
    
    const user = auth.currentUser;
    if (!user) {
      toast.warning("Please sign in to save media to your list", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    
    try {
      if (isSaved) {
        await removeFavoriteMedia(user.uid, { ...media, media_type: mediaType });
      setIsSaved(false);
      toast.success(`Removed ${media.title || media.name} from your list`, {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      } else {
        await saveFavoriteMedia(user.uid, { ...media, media_type: mediaType });
      setIsSaved(true);
      toast.success(`Saved ${media.title || media.name} to your list`, {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      }
    } catch (error) {
      console.error("Error updating saved media:", error);
      toast.error("Could not update your favorites. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleShare = () => {
    if (!media) return;
    
    const mediaTitle = media.title || media.name;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: mediaTitle,
        text: `Check out this ${mediaType}: ${mediaTitle}`,
        url: shareUrl,
      })
        .then(() => {
          toast.success("Shared successfully!", {
            position: "bottom-center",
            autoClose: 2000,
          });
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            console.log('Error sharing', error);
            toast.error("Failed to share", {
              position: "bottom-center",
              autoClose: 2000,
            });
          }
        });
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          toast.success(`Link copied to clipboard!`, {
            position: "bottom-center",
            autoClose: 2500,
            hideProgressBar: false,
          });
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
          toast.error("Failed to copy link", {
            position: "bottom-center",
            autoClose: 2500,
          });
        });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-16 h-16 border-4 border-skyblue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-white text-xl">Media not found</p>
      </div>
    );
  }

  const title = media.title || media.name;

  // Pick the best logo: prefer English, then any language, then no-language (null) logos
  const logos = media.images?.logos || [];
  const bestLogo =
    logos.find(l => l.iso_639_1 === "en") ||
    logos.find(l => l.iso_639_1) ||
    logos.find(l => l.iso_639_1 === null) ||
    logos[0];
  const logoPath = bestLogo?.file_path || null;

  const status = media.status;
  const releaseDate = media.release_date || media.first_air_date;
  const runtime = media.runtime || media.episode_run_time?.[0];
  const genres = media.genres?.map(g => g.name).join(", ");
  const rating = media.vote_average?.toFixed(1);

  const saveButtonClass = isSaved 
    ? "flex items-center justify-center w-12 h-12 bg-red-600/90 hover:bg-red-700/90 text-white rounded-full font-semibold transition flex-shrink-0"
    : "flex items-center justify-center w-12 h-12 bg-gray-700/70 hover:bg-gray-600/70 rounded-full font-semibold transition flex-shrink-0";

  const saveIcon = <FiHeart className="h-5 w-5" fill={isSaved ? "currentColor" : "none"} />;

  return (
    <div className="text-white">
      <AnimatePresence>
        {showDownloadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            onClick={() => setShowDownloadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 12, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-gray-700 bg-slate-900/95 p-5 shadow-2xl shadow-black/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-skyblue/80">Download</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">Choose a server</h3>
                  <p className="mt-2 text-sm text-gray-400">Pick where you want to continue the download.</p>
                </div>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="rounded-full p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
                  aria-label="Close download server modal"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => confirmDownload("vidvault")}
                  className="group rounded-2xl border border-slate-700 bg-slate-800/80 p-4 text-left transition hover:border-skyblue/60 hover:bg-slate-800"
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-skyblue/15 text-skyblue">
                    <FiServer className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-semibold text-white">Server 1</h4>
                  <p className="mt-1 text-sm text-gray-400">Open the download page with this option.</p>
                </button>

                <button
                  onClick={() => confirmDownload("moviepire")}
                  className="group rounded-2xl border border-slate-700 bg-slate-800/80 p-4 text-left transition hover:border-skyblue/60 hover:bg-slate-800"
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-skyblue/15 text-skyblue">
                    <FiServer className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-semibold text-white">Server 2</h4>
                  <p className="mt-1 text-sm text-gray-400">Open the download page with this option.</p>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Player Modal with Server Switcher Interface */}
      {showPlayer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
          onClick={handleClosePlayer}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative bg-navy rounded-xl w-full max-w-4xl h-[60vh] flex flex-col gap-3"
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
                  onClick={() => {
                    setActiveServer("vidsrc");
                    toast.success("Switched to Server 2 (Vidsrc)", { autoClose: 1500 });
                  }}
                  className={`text-xs font-bold px-3 py-1 rounded transition-all duration-250 ${
                    activeServer === "vidsrc"
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  Vidsrc
                </button>
                <button
                  onClick={() => {
                    setActiveServer("vidlink");
                    toast.success("Switched to Server 1 (VidLink)", { autoClose: 1500 });
                  }}
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

            {/* Iframe Viewport Container */}
            <div className="w-full h-full rounded-xl overflow-hidden border border-gray-800 shadow-2xl bg-black">
              <iframe
                src={getVideoUrl()}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
                title={`${title} - Player`}
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Banner Section */}
      <div 
        className="relative h-[620px] md:h-[500px] lg:h-[620px] xl:h-[700px] w-full overflow-hidden"
        onMouseEnter={handleBannerHover}
        onMouseLeave={handleBannerLeave}
      >
        {/* Trailer Overlay */}
        {showTrailer && trailerUrl && (
          <div className="absolute inset-0 z-20 w-full h-full">
            <iframe
              src={trailerUrl}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Trailer"
              style={{ border: 'none' }}
            />
          </div>
        )}

        {/* Background Image */}
        <div 
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-300 ${
            showTrailer ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ 
            backgroundImage: `url(${IMG_BASE}${media.backdrop_path})`,
            backgroundPosition: "center 15%" // Subtle tilt upwards so foreheads stay in view
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-800/40 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-navy to-transparent"></div>
        </div>

        {/* Content with poster on large screens */}
        <div className="relative z-30 container mx-auto px-4 md:px-8 h-full flex flex-col justify-end pb-2 md:pb-8 lg:pb-12 lg:flex-row lg:items-end lg:gap-8">
          
          {/* Back Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 z-40 flex items-center justify-center w-16 h-16 bg-skyblue/80 hover:bg-skyblue rounded-full transition shadow-lg"
            title="Go back"
          >
            <FiArrowLeft className="w-8 h-8 text-navy font-bold" />
          </motion.button>
          
          {/* Poster */}
          <div className={`hidden lg:block flex-shrink-0 transition-opacity duration-300 ${showTrailer ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="relative rounded-lg overflow-hidden group">
              <img
                src={media.poster_path ? `${POSTER_BASE}${media.poster_path}` : "/no-poster.png"}
                alt={title}
                className="w-72 h-120 object-cover rounded-lg shadow-lg" 
              />
              
              <div 
                className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-blue-800/20 to-transparent 
                          transition duration-300 group-hover:from-blue-900/80 group-hover:via-blue-800/40"
              ></div>
              
              <div className="absolute inset-0 border-2 border-transparent rounded-lg transition duration-300 group-hover:border-skyblue/50"></div>
            </div>
          </div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-4 lg:mt-0 lg:flex-1"
          >
            {logoPath ? (
              <img
                src={`${IMG_BASE}${logoPath}`}
                alt={title}
                className="max-w-[280px] md:max-w-[380px] max-h-24 md:max-h-32 object-contain mb-2 drop-shadow-lg"
                onError={(e) => {
                  // If the logo fails to load, fall back to text
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextSibling.style.display = "block";
                }}
              />
            ) : null}
            <h1
              className="text-3xl md:text-5xl font-bold mb-2"
              style={logoPath ? { display: "none" } : undefined}
            >
              {title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span className="flex items-center">
                <span className="text-yellow-400 mr-1">★</span>
                <span>{rating}/10</span>
              </span>
              <span>{releaseDate?.substring(0, 4)}</span>
              {runtime && <span>{runtime} min</span>}
              <span className="px-2 py-1 bg-skyblue/20 rounded-full text-sm">{status}</span>
            </div>
            
            <div className="mb-6 max-w-2xl">
              <p
                ref={descriptionRef}
                className={`text-gray-300 ${showFullDescription ? "" : "line-clamp-3"}`}
              >
                {media.overview}
              </p>
              {(isDescriptionOverflowing || showFullDescription) && (
                <button
                  type="button"
                  onClick={() => setShowFullDescription(previous => !previous)}
                  aria-expanded={showFullDescription}
                  className="mt-1 text-skyblue hover:text-white font-semibold transition"
                >
                  {showFullDescription ? "less" : "more"}
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <span className="text-sm"><span className="font-semibold">Genres:</span> {genres}</span>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {/* Play Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlay()}
                className="flex items-center justify-center gap-2 bg-sky-600 border border-sky-600 text-white px-4 py-2 md:px-6 md:py-2 rounded-lg font-semibold hover:bg-sky-400 hover:text-navy transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Play
              </motion.button>

              {/* DOWNLOAD ICON for MOVIES */}
              {mediaType === "movie" && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDownload(title, 'movie')}
                  className="flex items-center justify-center w-12 h-12 bg-gray-700/70 hover:bg-gray-600/70 rounded-full font-semibold transition flex-shrink-0"
                  title={`Download ${title}`}
                >
                  <FiDownload className="w-5 h-5" />
                </motion.button>
              )}

              {/* Save Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className={saveButtonClass}
                title={isSaved ? "Remove from favorites" : "Add to favorites"}
                aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
              >
                {saveIcon}
              </motion.button>

              {/* Share Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="flex items-center justify-center w-12 h-12 bg-gray-700/70 hover:bg-gray-600/70 rounded-full font-semibold transition flex-shrink-0"
                title="Share"
                aria-label="Share"
              >
                <FiShare2 className="h-5 w-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Episodes Section (for TV series) */}
      {mediaType === "tv" && media.seasons && (
        <div className="container mx-auto px-4 md:px-8 py-8">
          <h2 className="text-2xl font-bold mb-6">Episodes</h2>
          
          {/* Season Selector */}
          <div className="flex flex-wrap gap-2 mb-6">
            {media.seasons.map(season => (
              <button
                key={season.season_number}
                onClick={() => setSelectedSeason(season.season_number)}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedSeason === season.season_number
                    ? "bg-skyblue text-navy"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                Season {season.season_number}
              </button>
            ))}
          </div>
          
          {/* Episodes List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {seasonEpisodes.map(episode => {
              const isHovered = hoveredEpisodeId === episode.id;

              return (
                <motion.div
                  key={episode.id}
                  layout
                  onMouseEnter={() => setHoveredEpisodeId(episode.id)}
                  onMouseLeave={() => setHoveredEpisodeId(null)}
                  className="bg-gray-800/50 rounded-lg overflow-hidden flex flex-col relative border border-transparent hover:border-skyblue/30 transition-colors duration-300 shadow-md"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {/* Main Header Content row */}
                  <div className="flex w-full">
                    <div className="w-1/3 flex-shrink-0">
                      <img
                        src={episode.still_path ? `${IMG_BASE}${episode.still_path}` : media.backdrop_path ? `${IMG_BASE}${media.backdrop_path}` : "/no-poster.png"}
                        alt={episode.name}
                        className="w-full h-full min-h-[110px] object-cover"
                      />
                    </div>
                    <div className="p-4 w-2/3 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-semibold text-sm sm:text-base line-clamp-2">
                            E{episode.episode_number}. {episode.name}
                          </h3>
                          <span className="text-xs text-gray-400 flex-shrink-0">{episode.runtime}m</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{episode.air_date}</p>
                      </div>
                    </div>
                  </div>

                  {/* Overview Text Box container */}
                  <div className="px-4 pb-4 pt-1 flex-1">
                    <motion.p 
                      layout="position"
                      className={`text-sm text-gray-300 transition-all duration-200 ${
                        isHovered ? "" : "line-clamp-2"
                      }`}
                    >
                      {episode.overview || "No description available for this episode."}
                    </motion.p>
                  </div>

                  {/* Actions Dropdown Panel shown dynamically on Hover */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 pb-4 overflow-hidden"
                      >
                        <div className="flex gap-3 border-t border-gray-700/50 pt-3 mt-1">
                          {/* Play Button Action */}
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handlePlay(episode)}
                            className="flex-1 flex items-center justify-center gap-2 bg-skyblue hover:bg-sky-400 text-navy font-bold text-xs py-2 px-3 rounded-md transition"
                          >
                            <FiPlay className="w-3.5 h-3.5 fill-current" />
                            Play
                          </motion.button>

                          {/* Download Button Action */}
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleDownload(media.name, 'series', episode)}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-700/80 hover:bg-gray-600 text-white font-bold text-xs py-2 px-3 rounded-md transition border border-gray-600/40"
                            title={`Download Episode ${episode.episode_number}`}
                          >
                            <FiDownload className="w-3.5 h-3.5" />
                            Download
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cast Section */}
      {cast.length > 0 && (
        <div className="container mx-auto px-4 md:px-8 py-8 relative">
          
          {/* FLOATING & STICKY HEADER INTERFACE */}
          <div className={`w-full z-40 transition-all duration-300 ${
            isCastExpanded 
              ? "sticky top-0 bg-navy/80 backdrop-blur-md border-b border-gray-800/60 py-4 mb-6 -mx-4 px-4 md:-mx-8 md:px-8" 
              : "flex justify-between items-center mb-6"
          }`}>
            <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold">Starring</h2>
              {cast.length > 10 && (
                <button 
                  onClick={() => setIsCastExpanded(!isCastExpanded)}
                  className="text-skyblue hover:underline text-sm font-semibold transition duration-200 bg-gray-800/40 hover:bg-gray-800 border border-gray-700/50 px-4 py-2 rounded-lg"
                >
                  {isCastExpanded ? "Show Less" : `See All (${cast.length})`}
                </button>
              )}
            </div>
          </div>
          
          {/* Dynamic layout change based on expanded state */}
          <div className={
            isCastExpanded 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto" 
              : "flex overflow-x-auto gap-4 pb-4 custom-scrollbar"
          }>
            {(isCastExpanded ? cast : cast.slice(0, 10)).map(person => {
              const characterName = person.roles?.[0]?.character || person.character;
              const episodeCount = person.total_episode_count || person.roles?.[0]?.episode_count;

              return (
                <motion.div
                  key={person.id}
                  className={isCastExpanded ? "w-full" : "flex-shrink-0 w-32"}
                  whileHover={{ y: -5 }}
                >
                  <Link to={`/person/${person.id}`}>
                    {/* Rendered View when "See All" is activated */}
                    {isCastExpanded ? (
                      <div className="flex items-center p-5 bg-gray-900/40 border border-gray-800/80 rounded-xl transition duration-300 hover:border-skyblue/50 hover:bg-skyblue/5 group shadow-md">
                        <div className="w-16 h-16 flex-shrink-0 mr-4">
                          {person.profile_path ? (
                            <img
                              src={`${POSTER_BASE}${person.profile_path}`}
                              alt={person.name}
                              className="w-full h-full object-cover rounded-full shadow-inner border border-gray-700/30"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center border border-gray-700/50">
                              <svg className="w-7 h-7 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-white truncate group-hover:text-skyblue transition-colors duration-300">{person.name}</h3>
                          <ScrollingRole role={characterName} className="text-gray-400 text-sm mt-0.5" />
                          {episodeCount && (
                            <p className="text-gray-500 text-xs mt-1 font-medium tracking-wide">
                              {episodeCount} {episodeCount === 1 ? 'episode' : 'episodes'}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Fallback slider view before expansion */
                      <>
                        {person.profile_path ? (
                          <img
                            src={`${POSTER_BASE}${person.profile_path}`}
                            alt={person.name}
                            className="w-full h-48 object-cover rounded-lg shadow-md border border-transparent hover:border-skyblue/30 transition-all duration-300"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-800/70 border border-gray-700/50 rounded-lg flex flex-col items-center justify-center shadow-md p-2">
                            <svg className="w-14 h-14 text-gray-500 mb-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">No Image</span>
                          </div>
                        )}
                        
                        <div className="mt-2">
                          <h3 className="font-semibold text-sm truncate">{person.name}</h3>
                          <ScrollingRole role={characterName} className="text-gray-400 text-xs" />
                          {episodeCount && (
                            <p className="text-gray-500 text-[11px] mt-0.5">
                              {episodeCount} {episodeCount === 1 ? 'episode' : 'episodes'}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Genre-based infinite recommendations */}
      {(recommendations.length > 0 || isLoadingRecommendations) && (
        <div className="container mx-auto px-4 md:px-8 py-8">
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>

          {/* Mobile: horizontal scroll */}
          <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar md:hidden">
            {recommendations.map(item => (
              <motion.div
                key={`${item.media_type}-${item.id}`}
                className="flex-shrink-0 w-40 bg-gray-800/50 rounded-lg overflow-hidden"
                whileHover={{ y: -10 }}
              >
                <Link to={`/${item.media_type === "tv" ? "series" : "movie"}/${item.id}`}>
                  <img
                    src={item.poster_path ? `${POSTER_BASE}${item.poster_path}` : "/no-poster.png"}
                    alt={item.title || item.name}
                    className="w-full h-56 object-cover"
                  />
                  <div className="p-2">
                    <h3 className="font-semibold text-sm truncate">{item.title || item.name}</h3>
                    <p className="text-gray-400 text-xs">{item.release_date || item.first_air_date}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Desktop: grid */}
          <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {recommendations.map(item => (
              <motion.div
                key={`${item.media_type}-${item.id}`}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-800/50 rounded-lg overflow-hidden"
              >
                <Link to={`/${item.media_type === "tv" ? "series" : "movie"}/${item.id}`}>
                  <img
                    src={item.poster_path ? `${POSTER_BASE}${item.poster_path}` : "/no-poster.png"}
                    alt={item.title || item.name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-2">
                    <h3 className="font-semibold text-sm truncate">{item.title || item.name}</h3>
                    <p className="text-gray-400 text-xs">{item.release_date || item.first_air_date}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div ref={recommendationSentinelRef} className="h-8 flex items-center justify-center" aria-live="polite">
            {isLoadingRecommendations && (
              <span className="text-gray-400 text-sm">Loading more titles...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}