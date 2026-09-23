import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const location = useLocation();

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-16 text-center">
      <div className="max-w-lg">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-skyblue">404 error</p>
        <h1 className="mb-4 text-4xl font-bold md:text-6xl">Page not found</h1>
        <p className="mb-8 text-gray-400">
          We could not find <span className="text-gray-200">{location.pathname}</span>.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-full border border-gray-700 px-5 py-3 font-semibold transition hover:border-skyblue hover:text-skyblue"
          >
            <ArrowLeft className="h-5 w-5" />
            Go back
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-skyblue px-5 py-3 font-semibold text-navy transition hover:bg-sky-400"
          >
            <Home className="h-5 w-5" />
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
