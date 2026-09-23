// src/components/SectionSlider.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SeeMoreModal from "./SeeMoreModal";
import { filterMediaArray } from "../utils/mediaFilter";

export default function SectionSlider({ title, items, fetchUrl }) {
  const scrollRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -clientWidth : clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <section className="mb-8 relative">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
        <button
          onClick={() => setIsOpen(true)}
          className="text-sm text-sky-400 hover:text-sky-300"
        >
          See more
        </button>
      </div>

      {/* Left Arrow - only show on large screens */}
      <button
        onClick={() => scroll("left")}
        className="hidden lg:flex absolute top-1/2 -translate-y-1/2 left-2 z-20 
                   bg-black/50 hover:bg-black/70 p-2 rounded-full"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>

      {/* Right Arrow - only show on large screens */}
      <button
        onClick={() => scroll("right")}
        className="hidden lg:flex absolute top-1/2 -translate-y-1/2 right-2 z-20 
                   bg-black/50 hover:bg-black/70 p-2 rounded-full"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex touch-pan-x overflow-x-auto gap-4 px-2 scrollbar-horizontal scroll-smooth"
      >
        {filterMediaArray(items).slice(0, 20).map((item, index) => (
          <motion.div
            key={item.id}
            className="flex-shrink-0 
              max-w-[160px] md:max-w-[200px] lg:max-w-[180px] 
              w-[140px] md:w-[200px] lg:w-[180px]"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
          >
            <Link to={`/${item.media_type === "tv" ? "series" : "movie"}/${item.id}`}>
              <div className="relative rounded-lg overflow-hidden shadow-lg bg-navy/60">
                {/* Rating badge */}
                <div className="hidden lg:flex absolute top-2 right-2 items-center bg-black/70 px-2 py-1 rounded-full z-10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-yellow-400 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                  </svg>
                  <span className="text-xs text-white font-semibold">
                    {item.vote_average ? item.vote_average.toFixed(1) : "N/A"}
                  </span>
                </div>

                <img
                  src={
                    item.poster_path
                      ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                      : "/no-poster.png"
                  }
                  alt={item.title || item.name}
                  className="w-full h-56 md:h-64 lg:h-72 object-cover"
                />
                <div className="p-2">
                  <h3 className="text-sm font-semibold truncate">
                    {item.title || item.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {item.release_date || item.first_air_date || ""}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {isOpen && (
        <SeeMoreModal
          title={title}
          items={items}
          fetchUrl={fetchUrl}
          onClose={() => setIsOpen(false)}
        />
      )}
    </section>
  );
}
