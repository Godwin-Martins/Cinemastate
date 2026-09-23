import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Capacitor } from '@capacitor/core';
import { DownloadManagerPlugin } from '../plugins/download-manager-plugin';
import { motion } from "framer-motion";
import { FiX, FiArrowLeft, FiRefreshCw, FiExternalLink } from 'react-icons/fi';
import { useState, useEffect } from 'react';

export default function WebView() {
  const { url } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [nativeOpened, setNativeOpened] = useState(false);

  // Decode the URL parameter
  const decodedUrl = decodeURIComponent(url);
  const downloadMetadata = location.state?.downloadMetadata;

  // Detect iOS devices
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);
    setIsAndroid(Capacitor.getPlatform() === 'android');
  }, []);

  useEffect(() => {
    if (!downloadMetadata || !isAndroid) {
      return;
    }

    if (DownloadManagerPlugin?.setPendingMetadata) {
      DownloadManagerPlugin.setPendingMetadata({
        title: downloadMetadata.title,
        posterUrl: downloadMetadata.posterUrl,
        sourceUrl: decodedUrl,
        episodeNumber: downloadMetadata.episodeNumber ?? null,
        itemType: downloadMetadata.itemType,
      });
    }
  }, [downloadMetadata, decodedUrl, isAndroid]);

  useEffect(() => {
    if (!isAndroid || nativeOpened) {
      return;
    }

    if (DownloadManagerPlugin?.openNativeWebView) {
      DownloadManagerPlugin.openNativeWebView({
        url: decodedUrl,
        metadata: {
          title: downloadMetadata?.title || 'AlphaFlix Download',
          posterUrl: downloadMetadata?.posterUrl || '',
          itemType: downloadMetadata?.itemType || 'media',
          episodeNumber: downloadMetadata?.episodeNumber ?? null,
        },
      });
      setNativeOpened(true);
    }
  }, [isAndroid, nativeOpened, decodedUrl, downloadMetadata]);

  const handleRefresh = () => {
    setIsLoading(true);
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const handleOpenExternal = () => {
    window.open(decodedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-navy z-50 flex flex-col"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between p-2 sm:p-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-lg"
      >
        {/* Left Section - Navigation Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: '#0ea5e9' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-skyblue/90 hover:bg-skyblue rounded-full transition-all duration-200 shadow-md"
            title="Go back"
          >
            <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-navy font-bold" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-gray-700/80 hover:bg-gray-600 rounded-full transition-all duration-200"
            title="Refresh"
          >
            <FiRefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300" />
          </motion.button>
        </div>

        {/* Center Section - URL Display */}
        <div className="flex-1 mx-2 sm:mx-4 max-w-none sm:max-w-2xl min-w-0">
          <div className="relative">
            <div className="text-white text-xs sm:text-sm truncate bg-gray-800/80 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-600/50 shadow-inner">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                <span className="truncate text-xs sm:text-sm">{decodedUrl}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {isIOS && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenExternal}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-orange-600/80 hover:bg-orange-500 rounded-full transition-all duration-200"
              title="Open for downloads (iOS)"
            >
              <FiExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenExternal}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-gray-700/80 hover:bg-gray-600 rounded-full transition-all duration-200"
            title="Open in external browser"
          >
            <FiExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: '#dc2626' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-2 text-xs sm:text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-red-700"
            title="Close immediately"
          >
            <FiX className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            <span>Cancel</span>
          </motion.button>
        </div>
      </motion.div>

      {isIOS && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-600/90 text-white text-xs sm:text-sm px-3 py-2 text-center border-b border-orange-500/50"
        >
          <div className="flex items-center justify-center gap-2">
            <span>📱</span>
            <span>iOS: Use the orange button to open downloads in Safari</span>
          </div>
        </motion.div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-navy/80 backdrop-blur-sm z-10 flex items-center justify-center"
        >
          <div className="text-center px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-skyblue border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
            <p className="text-white text-base sm:text-lg font-medium">Loading...</p>
          </div>
        </motion.div>
      )}

      {/* Web Content */}
      <div className="flex-1 relative overflow-hidden">
        <iframe
          src={decodedUrl}
          className="w-full h-full border-0 webview-scrollbar"
          title="External Content"
          referrerPolicy="no-referrer"
          sandbox={isIOS 
            ? "allow-scripts allow-same-origin allow-forms allow-presentation allow-downloads allow-modals allow-top-navigation-by-user-activation"
            : "allow-scripts allow-same-origin allow-forms allow-presentation allow-downloads allow-downloads-without-user-activation allow-modals allow-orientation-lock allow-pointer-lock allow-top-navigation-by-user-activation"
          }
          allow="downloads; fullscreen; autoplay; encrypted-media; picture-in-picture"
          onLoad={() => setIsLoading(false)}
          style={{
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            KhtmlUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            userSelect: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        />
      </div>
    </motion.div>
  );
}