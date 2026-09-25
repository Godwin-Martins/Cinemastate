// src/pages/Movies.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import SectionSlider from "../components/SectionSlider";
import Banner from "../components/Banner";

const API_KEY = "2ff044456d4fa1c8534fc9e4378e227f";
let moviesCache = null;

const MOVIE_SECTIONS = [
  { title: "Trending", url: `/trending/movie/week?api_key=${API_KEY}` },
  { title: "Action", url: `/discover/movie?api_key=${API_KEY}&with_genres=28` },
  { title: "Action & Adventure", url: `/discover/movie?api_key=${API_KEY}&with_genres=28,12` },
  { title: "Marvel Movies", url: `/discover/movie?api_key=${API_KEY}&with_companies=420|19551|38679&sort_by=popularity.desc` },
  { title: "DC Movies", url: `/discover/movie?api_key=${API_KEY}&with_companies=184898|128064|128064&sort_by=popularity.desc` },
  { title: "Animation", url: `/discover/movie?api_key=${API_KEY}&with_genres=16` },
  { title: "Anime", url: `/discover/movie?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc` },
  { title: "Horror", url: `/discover/movie?api_key=${API_KEY}&with_genres=27` },
  { title: "Comedy", url: `/discover/movie?api_key=${API_KEY}&with_genres=35` },
  { title: "Thrillers", url: `/discover/movie?api_key=${API_KEY}&with_genres=53` },
  { title: "Fantasy", url: `/discover/movie?api_key=${API_KEY}&with_genres=14` },
  { title: "War", url: `/discover/movie?api_key=${API_KEY}&with_genres=10752` },
  { title: "Sci-Fi", url: `/discover/movie?api_key=${API_KEY}&with_genres=878` },
  { title: "Crime", url: `/discover/movie?api_key=${API_KEY}&with_genres=80` },
  { title: "Mystery", url: `/discover/movie?api_key=${API_KEY}&with_genres=9648` },
  { title: "Top Rated", url: `/movie/top_rated?api_key=${API_KEY}` },
];

export default function Movies() {
  const [sectionData, setSectionData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      if (moviesCache) {
        setSectionData(moviesCache);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const sectionResponses = await Promise.all(
          MOVIE_SECTIONS.map((section) =>
            axios.get(`https://api.themoviedb.org/3${section.url}`)
          )
        );

        const results = {};
        MOVIE_SECTIONS.forEach((section, index) => {
          results[section.title] = sectionResponses[index].data.results;
        });

        moviesCache = results;
        setSectionData(results);
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-skyblue border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      {/* Same banner UI as Home, filtered to popular movies */}
      <Banner fetchUrl={`/movie/popular?api_key=${API_KEY}`} forcedMediaType="movie" />

      <main className="mx-auto w-full max-w-[1800px] px-2 py-6 md:px-6 md:py-8">
        {MOVIE_SECTIONS.map((section) =>
          sectionData[section.title]?.length ? (
            <SectionSlider
              key={section.title}
              title={section.title}
              items={sectionData[section.title].map((item) => ({ ...item, media_type: "movie" })).filter(i => i && (i.title || i.name))}
              fetchUrl={section.url}
            />
          ) : null
        )}
      </main>
    </>
  );
}