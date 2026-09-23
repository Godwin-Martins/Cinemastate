// src/components/Header.jsx
import { Search, Film, Tv, UserRound, DownloadCloudIcon, Smartphone, Home as HomeIcon } from "lucide-react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { FaUserCircle } from "react-icons/fa";

export default function Header() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleSearchClick = () => navigate("/search");

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/profile");
    } catch (error) {
      console.error("Error signing in:", error);
      if (error.code === "auth/popup-closed-by-user") {
        alert("Sign-in cancelled. Please try again.");
      } else {
        alert("Failed to sign in. Please check your network and try again.");
      }
    }
  };

  const handleProfileClick = () => {
    if (user) {
      navigate("/profile");
    } else {
      handleSignIn();
    }
  };

  const navLinkClass = (section) => ({ isActive }) => {
    const isSectionActive =
      isActive ||
      (section === "movies" && location.pathname.startsWith("/movie/")) ||
      (section === "series" && location.pathname.startsWith("/series/"));

    return `relative pb-1 flex items-center gap-2 text-lg transition ${
      isSectionActive ? "text-skyblue border-b-2 border-skyblue" : "text-white hover:text-skyblue"
    }`;
  };

  const mobileNavItems = [
    {
      label: "Home",
      to: "/",
      icon: HomeIcon,
      active: location.pathname === "/",
    },
    {
      label: "Movies",
      to: "/movies",
      icon: Film,
      active: location.pathname.startsWith("/movie") || location.pathname === "/movies",
    },
    {
      label: "Series",
      to: "/series",
      icon: Tv,
      active: location.pathname.startsWith("/series") || location.pathname === "/series",
    },
    {
      label: "Search",
      to: "/search",
      icon: Search,
      active: location.pathname === "/search",
      separate: true,
    },
    {
      label: user ? "Profile" : "Sign in",
      to: "/profile",
      icon: UserRound,
      active: location.pathname === "/profile",
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-transparent px-4 py-4 shadow-lg backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="Brand Icon" className="h-8 w-8 object-contain" />
          <h1 className="cursor-pointer text-2xl font-bold text-skyblue">
            <Link to="/">AlphaFlix</Link>
          </h1>
        </div>

        <nav className="hidden gap-6 text-lg md:flex">
          <NavLink to="/" className={navLinkClass("home")}>
            <HomeIcon className="w-4 h-4 text-inherit" />
            <span>Home</span>
          </NavLink>
          <NavLink to="/movies" className={navLinkClass("movies")}>
            <Film className="w-4 h-4 text-inherit" />
            <span>Movies</span>
          </NavLink>
          <NavLink to="/series" className={navLinkClass("series")}>
            <Tv className="w-4 h-4 text-inherit" />
            <span>Series</span>
          </NavLink>
        </nav>

        <div className="hidden items-center gap-4 text-white md:flex">
          <button onClick={handleSearchClick} aria-label="Search">
            <Search className="cursor-pointer" />
          </button>

          <button onClick={handleProfileClick} aria-label="Profile" className="flex items-center gap-2">
            {user ? (
              user.photoURL ? (
                <img src={user.photoURL.split('?')[0]} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <FaUserCircle className="h-8 w-8 text-skyblue" />
              )
            ) : (
              <span className="text-skyblue">Sign in</span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => window.open('/apk/AlphaFlix.apk', '_blank', 'noopener,noreferrer')}
            className="rounded-full bg-blue-600 p-2 text-white transition hover:bg-blue-500"
            aria-label="Download AlphaFlix APK"
          >
            <Smartphone size={20} />
          </button>
        </div>
      </header>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 px-2 py-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
          {mobileNavItems.map(({ label, to, icon: Icon, active, separate }) => (
            <button
              key={label}
              onClick={() => label === "Profile" || label === "Sign in" ? handleProfileClick() : navigate(to)}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-medium transition ${
                active
                  ? "bg-[#007ACC]/15 text-[#007ACC]"
                  : separate
                  ? "bg-skyblue/10 text-skyblue"
                  : "text-gray-300"
              }`}
            >
              {label === "Profile" && user && user.photoURL ? (
                <img src={user.photoURL.split('?')[0]} alt="Profile" className="mb-1 h-5 w-5 rounded-full object-cover" />
              ) : (
                <Icon className={`mb-1 h-5 w-5 ${active ? "text-[#007ACC]" : "text-gray-300"}`} />
              )}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
