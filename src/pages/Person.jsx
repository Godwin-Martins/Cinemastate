// src/pages/Person.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";

const API_KEY = "2ff044456d4fa1c8534fc9e4378e227f";
const IMG_BASE = "https://image.tmdb.org/t/p/original";
const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

export default function Person() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [knownFor, setKnownFor] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPersonDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch person details
        const [personRes, movieCreditsRes, tvCreditsRes] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/person/${id}?api_key=${API_KEY}`),
          axios.get(`https://api.themoviedb.org/3/person/${id}/movie_credits?api_key=${API_KEY}`),
          axios.get(`https://api.themoviedb.org/3/person/${id}/tv_credits?api_key=${API_KEY}`)
        ]);
        
        setPerson(personRes.data);
        
        // Combine movie and TV credits for "Known For" section
        const combinedCredits = [
          ...(movieCreditsRes.data.cast || []),
          ...(tvCreditsRes.data.cast || [])
        ];

        // Filter to only acting roles and exclude 'Self' appearances
        const actingCredits = combinedCredits.filter(
          item => item.character && !item.character.toLowerCase().includes("self")
        );

        // Remove duplicates by ID
        const uniqueCreditsMap = {};
        actingCredits.forEach(item => {
          if (!uniqueCreditsMap[item.id]) {
            uniqueCreditsMap[item.id] = item;
          }
        });
        const uniqueCredits = Object.values(uniqueCreditsMap);

        // Sort by popularity and take top 20
        const sortedCredits = uniqueCredits
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 20);
        
        setKnownFor(sortedCredits);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching person details:", error);
        setLoading(false);
      }
    };

    fetchPersonDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-16 h-16 border-4 border-skyblue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-white text-xl">Person not found</p>
      </div>
    );
  }

  return (
    <div className="text-white min-h-screen bg-gray-900">
      {/* Back Button - Top Left */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate(-1)}
        className="fixed top-15 left-6 z-40 flex items-center justify-center w-16 h-16 bg-skyblue/80 hover:bg-skyblue rounded-full transition shadow-lg"
        title="Go back"
      >
        <FiArrowLeft className="w-8 h-8 text-navy font-bold" />
      </motion.button>

      {/* Background image */}
      {person.profile_path && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${IMG_BASE}${person.profile_path})` }}
        ></div>
      )}
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Image */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-gray-800/50 rounded-xl overflow-hidden shadow-2xl">
                <img
                  src={person.profile_path ? `${IMG_BASE}${person.profile_path}` : "/no-profile.png"}
                  alt={person.name}
                  className="w-full h-auto object-cover"
                />
              </div>
              
              <div className="bg-gray-800/50 rounded-xl p-6 mt-6 shadow-2xl">
                <h2 className="text-xl font-bold mb-4">Personal Info</h2>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="text-gray-400 text-sm">Known For</h3>
                    <p className="font-medium">{person.known_for_department || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-gray-400 text-sm">Gender</h3>
                    <p className="font-medium">
                      {person.gender === 1 ? "Female" : person.gender === 2 ? "Male" : "Not specified"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-gray-400 text-sm">Birthday</h3>
                    <p className="font-medium">
                      {person.birthday 
                        ? new Date(person.birthday).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) 
                        : "Unknown"}
                    </p>
                  </div>
                  
                  {person.deathday && (
                    <div>
                      <h3 className="text-gray-400 text-sm">Day of Death</h3>
                      <p className="font-medium">
                        {new Date(person.deathday).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                  
                  {person.place_of_birth && (
                    <div>
                      <h3 className="text-gray-400 text-sm">Place of Birth</h3>
                      <p className="font-medium">{person.place_of_birth}</p>
                    </div>
                  )}
                  
                  {person.also_known_as && person.also_known_as.length > 0 && (
                    <div>
                      <h3 className="text-gray-400 text-sm">Also Known As</h3>
                      <div className="mt-1">
                        {person.also_known_as.map((name, index) => (
                          <span key={index} className="inline-block bg-gray-700/50 rounded-full px-3 py-1 text-sm mr-2 mb-2">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Biography and Known For */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{person.name}</h1>
              
              {/* Biography Section */}
              <div className="bg-gray-800/50 rounded-xl p-6 mb-8 shadow-2xl">
                <h2 className="text-2xl font-bold mb-4">Biography</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {person.biography || "No biography available."}
                </p>
              </div>

              {/* Known For Section */}
              <div className="bg-gray-800/50 rounded-xl p-6 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6">Known For</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {knownFor.map((item) => (
                    <motion.div 
                      key={item.id} 
                      className="bg-gray-700/30 rounded-lg overflow-hidden hover:bg-gray-700/50 transition"
                      whileHover={{ y: -5 }}
                    >
                      <Link to={`/${item.title ? 'movie' : 'series'}/${item.id}`}>
                        <div className="aspect-w-2 aspect-h-3">
                          <img
                            src={item.poster_path ? `${POSTER_BASE}${item.poster_path}` : "/no-poster.png"}
                            alt={item.title || item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-sm truncate">{item.title || item.name}</h3>
                          <p className="text-gray-400 text-xs truncate">
                            {item.character ? `as ${item.character}` : item.job}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4) || "N/A"}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
