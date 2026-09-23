import { useEffect, useState } from "react";
import { auth } from "../firebase";
import SectionSlider from "../components/SectionSlider";
import axios from "axios";
import { filterMediaArray } from "../utils/mediaFilter";
import { migrateLocalMedia } from "../utils/userMediaStorage";

const API_KEY = "2ff044456d4fa1c8534fc9e4378e227f";

// For mixed sections, provide both movieUrl and tvUrl — results will be merged and shuffled.
// For TV-only or single-type sections, use a single url + mediaType as before.
const sections = [
  { title: "Trending", url: `/trending/all/week?api_key=${API_KEY}`, mediaType: null },
  { title: "Top Rated", movieUrl: `/movie/top_rated?api_key=${API_KEY}`, tvUrl: `/tv/top_rated?api_key=${API_KEY}` },
  { title: "Animations", movieUrl: `/discover/movie?api_key=${API_KEY}&with_genres=16`, tvUrl: `/discover/tv?api_key=${API_KEY}&with_genres=16` },
  { title: "Horror Movies", url: `/discover/movie?api_key=${API_KEY}&with_genres=27`, mediaType: "movie" },
  { title: "Mystery Series", url: `/discover/tv?api_key=${API_KEY}&with_genres=9648`, mediaType: "tv" },
  { title: "Action", movieUrl: `/discover/movie?api_key=${API_KEY}&with_genres=28`, tvUrl: `/discover/tv?api_key=${API_KEY}&with_genres=10759` },
  { title: "War", movieUrl: `/discover/movie?api_key=${API_KEY}&with_genres=10752`, tvUrl: `/discover/tv?api_key=${API_KEY}&with_genres=10768` },
  { title: "Comedy", movieUrl: `/discover/movie?api_key=${API_KEY}&with_genres=35`, tvUrl: `/discover/tv?api_key=${API_KEY}&with_genres=35` },
  { title: "Hollywood", movieUrl: `/discover/movie?api_key=${API_KEY}&with_origin_country=US`, tvUrl: `/discover/tv?api_key=${API_KEY}&with_origin_country=US` },
  { title: "Nollywood", movieUrl: `/discover/movie?api_key=${API_KEY}&with_origin_country=NG`, tvUrl: `/discover/tv?api_key=${API_KEY}&with_origin_country=NG` },
  { title: "K Drama", url: `/discover/tv?api_key=${API_KEY}&with_origin_country=KR`, mediaType: "tv" },
  { title: "Thrillers", movieUrl: `/discover/movie?api_key=${API_KEY}&with_genres=53`, tvUrl: `/discover/tv?api_key=${API_KEY}&with_genres=80` },
  { title: "Adventure", movieUrl: `/discover/movie?api_key=${API_KEY}&with_genres=12`, tvUrl: `/discover/tv?api_key=${API_KEY}&with_genres=10759` },
  { title: "Fantasy", movieUrl: `/discover/movie?api_key=${API_KEY}&with_genres=14`, tvUrl: `/discover/tv?api_key=${API_KEY}&with_genres=10765` },
];

// Fisher-Yates shuffle so movies and series are interleaved naturally
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const homeCache = new Map();

export default function Home() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [continueWatching, setContinueWatching] = useState([]);
  const [becauseYouWatched, setBecauseYouWatched] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check user auth
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchSections() {
      const cacheKey = user?.uid || "guest";
      const cachedHome = homeCache.get(cacheKey);
      if (cachedHome) {
        setData(cachedHome.data);
        setContinueWatching(cachedHome.continueWatching);
        setBecauseYouWatched(cachedHome.becauseYouWatched);
        setLoading(false);
        return;
      }

      const results = {};
      let cachedContinueWatching = [];
      let cachedBecauseYouWatched = [];
      
      // Load watch history if user is logged in
      let watchHistory = [];
      if (user) {
        const { history } = await migrateLocalMedia(user.uid);
        watchHistory = history;
        cachedContinueWatching = watchHistory.slice(0, 20);
        setContinueWatching(cachedContinueWatching);
      }

      // Fetch "Because You Watched" recommendations
      if (watchHistory.length > 0) {
        try {
          const lastWatchedItem = watchHistory[0];
          const mediaType = lastWatchedItem.media_type === 'tv' ? 'tv' : 'movie';
          
          const lastWatchedRes = await axios.get(
            `https://api.themoviedb.org/3/${mediaType}/${lastWatchedItem.id}?api_key=${API_KEY}`
          );
          
          const watchedItemName = lastWatchedRes.data.title || lastWatchedRes.data.name;
          
          const recommendationsRes = await axios.get(
            `https://api.themoviedb.org/3/${mediaType}/${lastWatchedItem.id}/recommendations?api_key=${API_KEY}`
          );
          
          if (recommendationsRes.data.results && recommendationsRes.data.results.length > 0) {
            const watchedIds = new Set(watchHistory.map(item => item.id));
            const recommendations = recommendationsRes.data.results
              .filter(item => !watchedIds.has(item.id))
              .map(item => ({
                ...item,
                sourceTitle: watchedItemName
              }));
            
            cachedBecauseYouWatched = recommendations.slice(0, 20);
            setBecauseYouWatched(cachedBecauseYouWatched);
          }
        } catch (e) {
          console.error("Error fetching recommendations:", e);
        }
      }

      // Fetch regular sections
      await Promise.all(
        sections.map(async (section) => {
          try {
            if (section.movieUrl && section.tvUrl) {
              // Mixed section: fetch both movie and TV in parallel, stamp media_type, shuffle together
              const [movieRes, tvRes] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3${section.movieUrl}`),
                axios.get(`https://api.themoviedb.org/3${section.tvUrl}`),
              ]);
              const movies = movieRes.data.results.map((item) => ({ ...item, media_type: "movie" }));
              const tvShows = tvRes.data.results.map((item) => ({ ...item, media_type: "tv" }));
              results[section.title] = shuffleArray([...movies, ...tvShows]);
            } else {
              // Single-type section (Trending, Mystery, K Drama)
              const res = await axios.get(`https://api.themoviedb.org/3${section.url}`);
              results[section.title] = section.mediaType
                ? res.data.results.map((item) => ({ ...item, media_type: section.mediaType }))
                : res.data.results;
            }
          } catch {
            results[section.title] = [];
          }
        })
      );
      homeCache.set(cacheKey, {
        data: results,
        continueWatching: cachedContinueWatching,
        becauseYouWatched: cachedBecauseYouWatched,
      });
      setData(results);
      setLoading(false);
    }
    fetchSections();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main>
      {/* Continue Watching Section - Only show if user has watch history */}
      {user && continueWatching.length > 0 && (
        <SectionSlider
          title="Continue Watching"
          items={continueWatching}
        />
      )}

      {/* Because You Watched Section - Only show if there are recommendations */}
      {user && becauseYouWatched.length > 0 && (
        <SectionSlider
          title={`Because You Watched ${becauseYouWatched[0]?.sourceTitle || ''}`}
          items={becauseYouWatched}
        />
      )}

      {/* Regular sections */}
      {sections.map((section) =>
        data[section.title] ? (
          <SectionSlider
            key={section.title}
            title={section.title}
            items={filterMediaArray(data[section.title])}
            fetchUrl={section.url || section.movieUrl || section.tvUrl}
          />
        ) : null
      )}
    </main>
  );
}