import { Check, X } from "lucide-react";

function getPlatform() {
  const userAgent = navigator.userAgent || "";

  if (/iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    return "ios";
  }

  if (/Android/i.test(userAgent)) {
    return "android";
  }

  return "desktop";
}

const platformInstructions = {
  ios: {
    title: "Get the best iPhone experience",
    steps: [
      "Open AlphaFlix in Safari.",
      "Tap Share, then choose Add to Home Screen.",
      "Open AlphaFlix from your Home Screen for the best performance.",
    ],
  },
  android: {
    title: "Get the best Android experience",
    steps: [
      "Tap the phone icon at the top of the screen.",
      "Install the AlphaFlix APK when the download is complete.",
      "Open AlphaFlix from your device for the best performance.",
    ],
  },
  desktop: {
    title: "Get the best desktop experience",
    steps: [
      "In Chrome or Edge, select the Install app icon in the address bar.",
      "Confirm the installation when prompted.",
      "Open AlphaFlix from your apps for the best performance.",
    ],
  },
};

export default function WelcomeModal({ onClose, onDontShowAgainChange }) {
  const instructions = platformInstructions[getPlatform()];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-sky-400/20 bg-[#10243a] shadow-2xl shadow-sky-950/50"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close welcome message"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-white/10 bg-gradient-to-br from-sky-500/20 to-transparent px-6 pb-5 pt-7 sm:px-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Welcome</p>
          <h2 id="welcome-title" className="pr-8 text-3xl font-bold text-white">Welcome to AlphaFlix</h2>
          <p className="mt-2 text-slate-300">{instructions.title}</p>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <ol className="space-y-4 text-sm leading-6 text-slate-200">
            {instructions.steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-xs font-bold text-sky-300">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <label className="mt-7 flex cursor-pointer items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              onChange={(event) => onDontShowAgainChange(event.target.checked)}
              className="h-4 w-4 accent-sky-500"
            />
            <span>Don&apos;t show this again</span>
          </label>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2 focus:ring-offset-[#10243a]"
          >
            <Check className="h-5 w-5" />
            OK, got it
          </button>
        </div>
      </section>
    </div>
  );
}