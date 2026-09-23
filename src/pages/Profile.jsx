// src/pages/Profile.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { auth } from "../firebase";
import { signOut, updateProfile } from "firebase/auth"; 
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  migrateLocalMedia,
  removeFavoriteMedia,
  removeMediaFromWatchHistory,
} from "../utils/userMediaStorage";

const img1 = "/avatars/shazam.jpg"; // Shazam
const img2 = "/avatars/black-adam.jpg"; // Black Adam
const img3 = "/avatars/spiderman.jpg"; // Spiderman
const img4 = "/avatars/superman.jpg"; // Superman
const img5 = "/avatars/loki.jpg"; // Loki
const img6 = "/avatars/iron-heart.jpg"; // Iron Heart
const img7 = "/avatars/black-panther.jpg"; // Black Panther
const img8 = "/avatars/captain-america.jpg"; // Captain America
const img9 = "/avatars/wonder-woman.jpg"; // Wonder Woman
const img10 = "/avatars/the-flash.jpg"; // The Flash
const img11 = "/avatars/aquaman.jpg"; // Aquaman
const img12 = "/avatars/batman.jpg"; // Batman
const img13 = "/avatars/green-lantern.jpg"; // Green Lantern
const img14 = "/avatars/thor.jpg"; // Thor
const img15 = "/avatars/hulk.jpg"; // Hulk
const img16 = "/avatars/black-widow.jpg"; // Black Widow
const img17 = "/avatars/dr-strange.jpg"; // Doctor Strange
const img18 = "/avatars/captain-marvel.jpg"; // Captain Marvel
const img19 = "/avatars/ant-man.jpg"; // Ant-Man
const img20 = "/avatars/vision.jpg"; // Vision

const PROFILE_PICTURES = [
  img1, img2, img3, img4, img5, img6, img7, img8, img9, img10,
  img11, img12, img13, img14, img15, img16, img17, img18, img19, img20,
];
// --- END OF DEFAULT PROFILE PICTURE CONSTANTS ---

// 2. Component for the Profile Picture Selector/Adjuster
function ProfilePictureSelector({ isOpen, onClose, currentPhotoURL, onUpdate }) {
    const [selectedURL, setSelectedURL] = useState(currentPhotoURL || PROFILE_PICTURES[0]);
    // State to manage the simulated "shift" position (e.g., in percentages for CSS object-position)
    const [position, setPosition] = useState({ x: 50, y: 50 }); // Default: 50% 50% (center)
    const [isDragging, setIsDragging] = useState(false);
    const frameRef = useRef(null);

    // Reset position when the component is opened or URL changes
    useEffect(() => {
        if (isOpen) {
            setSelectedURL(currentPhotoURL || PROFILE_PICTURES[0]);
            setPosition({ x: 50, y: 50 });
        }
    }, [isOpen, currentPhotoURL]);


    // Mouse event handlers for dragging/shifting
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !frameRef.current) return;
        
        const frame = frameRef.current;
        const rect = frame.getBoundingClientRect();

        // Calculate new position based on mouse movement relative to the frame center
        const newX = (e.clientX - rect.left);
        const newY = (e.clientY - rect.top);

        // Normalize to a percentage between 0 and 100
        const xPercent = Math.min(100, Math.max(0, (newX / rect.width) * 100));
        const yPercent = Math.min(100, Math.max(0, (newY / rect.height) * 100));
        
        setPosition({ x: xPercent, y: yPercent });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    if (!isOpen) return null;

    const finalPhotoURL = `${selectedURL}?pos=${position.x}%20${position.y}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-800 rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto w-full max-w-4xl text-center">
                <h2 className="text-2xl font-bold mb-6">Adjust Your Profile Picture</h2>

                {/* --- ADJUSTMENT/SHIFTING AREA --- */}
                <div className="flex flex-col md:flex-row justify-center items-start gap-8 mb-8">
                    {/* 1. Preview Pane */}
                    <div className="flex flex-col items-center">
                        <h3 className="text-lg font-semibold mb-2">Drag to Shift</h3>
                        <div 
                            ref={frameRef}
                            onMouseDown={handleMouseDown}
                            className={`w-48 h-48 rounded-full overflow-hidden border-4 cursor-move ${isDragging ? 'border-amber-400' : 'border-skyblue/50'} relative`}
                        >
                            <img
                                src={selectedURL}
                                alt="Profile Preview"
                                className="w-full h-full object-cover absolute inset-0"
                                style={{
                                    // Apply the shifting using the calculated objectPosition
                                    objectPosition: `${position.x}% ${position.y}%`,
                                }}
                            />
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Position: {position.x.toFixed(0)}% X, {position.y.toFixed(0)}% Y</p>
                    </div>
                    
                    {/* 2. Avatar Selection Grid */}
                    <div className="md:w-3/5 w-full">
                        <h3 className="text-lg font-semibold mb-2">Select Avatar</h3>
                        <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-7 gap-3 max-h-64 overflow-y-auto pr-2">
                            {PROFILE_PICTURES.map((url, index) => (
                                <div
                                    key={index}
                                    className="relative cursor-pointer hover:scale-110 transition-transform"
                                    onClick={() => {
                                        setSelectedURL(url);
                                        setPosition({ x: 50, y: 50 }); // Reset position on new selection
                                    }}
                                >
                                    <img
                                        src={url}
                                        alt={`Avatar ${index + 1}`}
                                        className={`w-full h-auto aspect-square rounded-full object-cover border-2 ${
                                            selectedURL === url ? 'border-amber-400 scale-100' : 'border-transparent hover:border-skyblue/50'
                                        } transition-all`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {/* --- END ADJUSTMENT/SHIFTING AREA --- */}


                <button
                    onClick={() => onUpdate(finalPhotoURL)}
                    className="w-full py-3 px-4 bg-skyblue hover:bg-sky-600 rounded-lg font-bold transition mb-3"
                >
                    Save & Set Profile Picture
                </button>
                <button
                    onClick={onClose}
                    className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

// 3. Main Profile Component
export default function Profile() {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [savedMedia, setSavedMedia] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const navigate = useNavigate();

  // Helper function to extract URL and position from the saved photoURL string
  const parsePhotoURL = (fullURL) => {
    if (!fullURL || !fullURL.includes('?pos=')) {
        return { url: fullURL, position: { x: 50, y: 50 } };
    }
    const [url, params] = fullURL.split('?pos=');
    const [x, y] = params.split('%20').map(val => parseFloat(val));
    return { url, position: { x: x || 50, y: y || 50 } };
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        migrateLocalMedia(currentUser.uid)
          .then(({ favorites, history }) => {
            setSavedMedia(favorites);
            setWatchHistory(history);
          })
          .catch((error) => {
            console.error("Error loading user media:", error);
            setSavedMedia([]);
            setWatchHistory([]);
          });
      } else {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Function to update the user's photoURL in Firebase
  const handleProfilePictureUpdate = async (newPhotoURL) => {
    if (!user) {
      toast.error("User not logged in.", { theme: "colored" });
      return;
    }

    try {
      await updateProfile(user, {
        photoURL: newPhotoURL,
      });

      setUser(prevUser => ({
        ...prevUser,
        photoURL: newPhotoURL,
      }));

      setIsSelectorOpen(false);
      toast.success("Profile picture updated successfully!", {
        position: "bottom-center",
        autoClose: 3000,
        theme: "colored",
      });

    } catch (error) {
      console.error("Error updating profile picture:", error);
      toast.error("Failed to update picture. Please try again.", { theme: "colored" });
    }
  };

  const handleSignOut = async () => {
    // ... (Sign out logic remains the same)
    try {
      await signOut(auth);
      toast.info("Signed out successfully.", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        theme: "colored",
      });
    }
  };

  const removeSavedMedia = async (id) => {
    if (!user) return;
    const mediaToRemove = savedMedia.find((media) => media.id === id);
    if (!mediaToRemove) return;
    await removeFavoriteMedia(user.uid, mediaToRemove);
    setSavedMedia((currentMedia) => currentMedia.filter((media) => media.id !== id));
    toast.warn("Removed from your list.", {
      position: "bottom-right",
      autoClose: 2000,
      hideProgressBar: true,
      theme: "dark",
    });
  };

  const removeFromWatchHistory = async (id) => {
    if (!user) return;
    const mediaToRemove = watchHistory.find((media) => media.id === id);
    if (!mediaToRemove) return;
    await removeMediaFromWatchHistory(user.uid, mediaToRemove);
    setWatchHistory((currentHistory) => currentHistory.filter((media) => media.id !== id));
    toast.warn("Removed from watch history.", {
      position: "bottom-right",
      autoClose: 2000,
      hideProgressBar: true,
      theme: "dark",
    });
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="w-16 h-16 border-4 border-skyblue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const defaultFallbackPicture = "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png";
  const { url: photoURL, position: photoPosition } = parsePhotoURL(user.photoURL);
  
  // Find the base URL of the currently set avatar
  const currentAvatarBaseURL = photoURL.includes('?pos=') ? photoURL.split('?pos=')[0] : photoURL;


  return (
    <div className="text-white min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        
        {/* --- Profile Picture Selector/Adjuster Modal --- */}
        <ProfilePictureSelector 
            isOpen={isSelectorOpen}
            onClose={() => setIsSelectorOpen(false)}
            currentPhotoURL={currentAvatarBaseURL}
            onUpdate={handleProfilePictureUpdate}
        />
        {/* --- End Profile Picture Selector/Adjuster Modal --- */}
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Section */}
          <div className="md:w-1/3">
            <div className="bg-gray-800/50 rounded-xl p-6 shadow-lg">
              <h1 className="text-2xl font-bold mb-6">Profile</h1>

              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  <img
                    src={photoURL || defaultFallbackPicture}
                    alt={user.displayName || "User"}
                    className="w-32 h-32 rounded-full object-cover border-4 border-skyblue"
                    style={{ 
                        // Apply the saved position when displaying the image
                        objectPosition: `${photoPosition.x}% ${photoPosition.y}%`
                    }}
                  />
                  {/* Button to open the selector */}
                  <button
                    onClick={() => setIsSelectorOpen(true)}
                    className="absolute inset-0 w-full h-full rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Change Profile Picture"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.218A2 2 0 0110.407 4h3.185a2 2 0 011.664.89l.812 1.218A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                </div>
                <h2 className="text-xl font-bold mt-4">{user.displayName}</h2>
                <p className="text-gray-400">{user.email}</p>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Saved Media Section (My List) */}
          <div className="md:w-2/3">
            <div className="bg-gray-800/50 rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-6">My List</h2>

              {savedMedia.length === 0 ? (
                <div className="text-center py-12">
                  {/* ... (Empty list SVG/text) ... */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto text-gray-500 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <p className="text-gray-400">
                    Your saved movies and series will appear here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {savedMedia.map((media) => (
                    <div key={media.id} className="relative group">
                      {/* ... (Saved media card) ... */}
                      <Link to={`/${media.media_type === 'tv' ? 'series' : 'movie'}/${media.id}`}>
                        <div className="bg-gray-700/50 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700/70 transition">
                          <img
                            src={
                              media.poster_path
                                ? `https://image.tmdb.org/t/p/w342${media.poster_path}`
                                : "/no-poster.png"
                            }
                            alt={media.title || media.name}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-2">
                            <h3 className="font-semibold text-sm truncate">
                              {media.title || media.name}
                            </h3>
                            <p className="text-gray-400 text-xs">
                              {media.release_date || media.first_air_date}
                            </p>
                          </div>
                        </div>
                      </Link>

                      {/* Remove button on top */}
                      <button
                        onClick={(e) => {
                          e.preventDefault(); 
                          e.stopPropagation();
                          removeSavedMedia(media.id);
                        }}
                        className="absolute top-2 right-2 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove from list"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Watch History Section */}
            <div className="bg-gray-800/50 rounded-xl p-6 shadow-lg mt-8">
              <h2 className="text-2xl font-bold mb-6">Watch History</h2>

              {watchHistory.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto text-gray-500 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-gray-400">
                    Your watch history will appear here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {watchHistory.map((media) => (
                    <div key={`${media.id}-watch`} className="relative group">
                      <Link to={`/${media.media_type === 'tv' ? 'series' : 'movie'}/${media.id}`}>
                        <div className="bg-gray-700/50 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700/70 transition relative">
                          <img
                            src={
                              media.poster_path
                                ? `https://image.tmdb.org/t/p/w342${media.poster_path}`
                                : "/no-poster.png"
                            }
                            alt={media.title || media.name}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-2">
                            <h3 className="font-semibold text-sm truncate">
                              {media.title || media.name}
                            </h3>
                            <p className="text-gray-400 text-xs">
                              {media.release_date || media.first_air_date}
                            </p>
                          </div>
                          {/* Watched indicator */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-skyblue"></div>
                        </div>
                      </Link>

                      {/* Remove button on top */}
                      <button
                        onClick={(e) => {
                          e.preventDefault(); 
                          e.stopPropagation();
                          removeFromWatchHistory(media.id);
                        }}
                        className="absolute top-2 right-2 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove from watch history"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}