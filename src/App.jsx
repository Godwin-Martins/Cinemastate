// src/App.jsx
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Banner from "./components/Banner";
import Home from "./pages/Home";
import Footer from "./components/Footer";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import SearchPage from "./pages/SearchPage";
import GenrePage from "./pages/GenrePage";
import ShowMovieDetails from "./pages/ShowMovieDetails";
import Person from "./pages/Person";
import Profile from "./pages/Profile";
import WebView from "./pages/WebView";
import Downloads from "./pages/Downloads";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import WelcomeModal from "./components/WelcomeModal";
import AndroidUpdateModal from "./components/AndroidUpdateModal";
import { useEffect, useState } from "react";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Smartphone } from "lucide-react";
import { downloadAlphaFlixApk } from "./utils/apkDownloader";

const WELCOME_DISMISSED_KEY = "alphaflix-welcome-dismissed";

function PageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    let pageName = "AlphaFlix";

    if (pathname === "/movies") pageName = "Movies";
    else if (pathname === "/series") pageName = "Series";
    else if (pathname === "/search") pageName = "Search";
    else if (pathname === "/profile") pageName = "Profile";
    else if (pathname === "/downloads") pageName = "Downloads";
    else if (pathname.startsWith("/genre/")) pageName = "Genre";
    else if (pathname.startsWith("/person/")) pageName = "Person";
    else if (pathname.startsWith("/movie/")) pageName = "Movie";
    else if (pathname.startsWith("/series/")) pageName = "Series";
    else if (pathname.startsWith("/webview/")) pageName = "Download";
    else if (pathname !== "/") pageName = "Page Not Found";

    document.title = pageName === "AlphaFlix" ? pageName : `${pageName} | AlphaFlix`;
  }, [pathname]);

  return null;
}

function App() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showAndroidUpdateModal, setShowAndroidUpdateModal] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    setShowWelcomeModal(localStorage.getItem(WELCOME_DISMISSED_KEY) !== "true");
  }, []);

  const closeWelcomeModal = () => {
    if (dontShowAgain) {
      localStorage.setItem(WELCOME_DISMISSED_KEY, "true");
    }

    setShowWelcomeModal(false);

    if (/Android/i.test(navigator.userAgent || "")) {
      setShowAndroidUpdateModal(true);
    }
  };

  const updateAndroidApp = () => {
    setShowAndroidUpdateModal(false);
    downloadAlphaFlixApk();
  };

  return (
    <Router>
      <PageTitle />
      <ScrollToTop />
      <Header />
      <div className="pb-24 md:pb-0">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Banner />
                <Home />
              </>
            }
          />
          <Route path="/movies" element={<Movies />} />
          <Route path="/series" element={<Series />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/genre/:genreName" element={<GenrePage />} />
          <Route path="/movie/:id" element={<ShowMovieDetails />} />
          <Route path="/series/:id" element={<ShowMovieDetails />} />
          <Route path="/person/:id" element={<Person />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/webview/:url" element={<WebView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />

      {showWelcomeModal && (
        <WelcomeModal
          onClose={closeWelcomeModal}
          onDontShowAgainChange={setDontShowAgain}
        />
      )}

      {showAndroidUpdateModal && (
        <AndroidUpdateModal
          onClose={() => setShowAndroidUpdateModal(false)}
          onUpdate={updateAndroidApp}
        />
      )}

      <button
        type="button"
        onClick={() => downloadAlphaFlixApk()}
        className="fixed bottom-6 right-6 z-50 hidden items-center gap-2 rounded-full bg-blue-600 px-4 py-2 font-semibold text-white shadow-lg transition hover:bg-blue-500 lg:flex"
      >
        <Smartphone className="h-5 w-5" />
        Install APK
      </button>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        className="alphaflix-toast-container"
        toastClassName="alphaflix-toast"
        bodyClassName="alphaflix-toast-body"
      />
    </Router>
  );
}

export default App;
