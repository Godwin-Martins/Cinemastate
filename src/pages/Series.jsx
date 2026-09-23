// src/pages/Series.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import SectionSlider from "../components/SectionSlider";
import Banner from "../components/Banner";

const API_KEY = "2ff044456d4fa1c8534fc9e4378e227f";
let seriesCache = null;

const SERIES_SECTIONS = [
  { title: "Trending", url: `/trending/tv/week?api_key=${API_KEY}` },
  { title: "Action", url: `/discover/tv?api_key=${API_KEY}&with_genres=10759` },
  { title: "Action & Adventure", url: `/discover/tv?api_key=${API_KEY}&with_genres=10759` },
  { title: "Marvel Series", url: `/discover/tv?api_key=${API_KEY}&with_companies=420|4201&sort_by=popularity.desc` },
  { title: "DC Series", url: `/discover/tv?api_key=${API_KEY}&with_companies=71|164|2243|27711&sort_by=popularity.desc` },
  { title: "Animation", url: `/discover/tv?api_key=${API_KEY}&with_genres=16` },
  { title: "Horror", url: `/discover/tv?api_key=${API_KEY}&with_genres=27` },
  { title: "Comedy", url: `/discover/tv?api_key=${API_KEY}&with_genres=35` },
  { title: "Thrillers", url: `/discover/tv?api_key=${API_KEY}&with_genres=80` },
  { title: "Fantasy", url: `/discover/tv?api_key=${API_KEY}&with_genres=10765` },
  { title: "War", url: `/discover/tv?api_key=${API_KEY}&with_genres=10768` },
  { title: "Sci-Fi", url: `/discover/tv?api_key=${API_KEY}&with_genres=10765` },
  { title: "Crime", url: `/discover/tv?api_key=${API_KEY}&with_genres=80` },
  { title: "Mystery", url: `/discover/tv?api_key=${API_KEY}&with_genres=9648` },
  { title: "Top Rated", url: `/tv/top_rated?api_key=${API_KEY}` },
];

export default function Series() {
  const [sectionData, setSectionData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeries = async () => {
      if (seriesCache) {
        setSectionData(seriesCache);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const sectionResponses = await Promise.all(
          SERIES_SECTIONS.map((section) =>
            axios.get(`https://api.themoviedb.org/3${section.url}`)
          )
        );

        const results = {};
        SERIES_SECTIONS.forEach((section, index) => {
          results[section.title] = sectionResponses[index].data.results;
        });

        seriesCache = results;
        setSectionData(results);
      } catch (error) {
        console.error("Error fetching series:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
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
      {/* Same banner UI as Home, filtered to popular series */}
      <Banner fetchUrl={`/tv/popular?api_key=${API_KEY}`} forcedMediaType="tv" />

      <main className="mx-auto w-full max-w-[1800px] px-2 py-6 md:px-6 md:py-8">
        {SERIES_SECTIONS.map((section) =>
          sectionData[section.title]?.length ? (
                <SectionSlider
                  key={section.title}
                  title={section.title}
                  items={sectionData[section.title].map((item) => ({ ...item, media_type: "tv" })).filter(i => i && (i.title || i.name))}
                  fetchUrl={section.url}
                />
          ) : null
        )}
      </main>
    </>
  );
}