// src/components/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const storageKey = `scroll-position:${location.key}`;

    const savePosition = () => {
      sessionStorage.setItem(storageKey, String(window.scrollY));
    };

    window.addEventListener("scroll", savePosition, { passive: true });

    return () => {
      savePosition();
      window.removeEventListener("scroll", savePosition);
    };
  }, [location.key]);

  useEffect(() => {
    if (navigationType !== "POP") {
      window.scrollTo(0, 0);
      return undefined;
    }

    const savedPosition = Number(sessionStorage.getItem(`scroll-position:${location.key}`) || 0);
    let attempts = 0;
    let frameId;

    const restorePosition = () => {
      window.scrollTo(0, savedPosition);
      attempts += 1;

      if (attempts < 20 && document.documentElement.scrollHeight < savedPosition + window.innerHeight) {
        frameId = requestAnimationFrame(restorePosition);
      }
    };

    frameId = requestAnimationFrame(restorePosition);

    return () => cancelAnimationFrame(frameId);
  }, [location.key, navigationType]);

  return null;
}