import { Download, Smartphone, X } from "lucide-react";

export default function AndroidUpdateModal({ onClose, onUpdate }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="android-update-title"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-400/20 bg-[#10243a] shadow-2xl shadow-emerald-950/50"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Android update message"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-white/10 bg-gradient-to-br from-emerald-500/20 to-transparent px-6 pb-5 pt-7 sm:px-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Android update</p>
          <h2 id="android-update-title" className="pr-8 text-3xl font-bold text-white">Update AlphaFlix</h2>
          <p className="mt-2 text-slate-300">Get the latest version of the AlphaFlix Android app.</p>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <p className="text-sm leading-6 text-slate-200">
            Tap the Android phone Icon to download the latest update, then install it when the download finishes.
          </p>

          <button
            type="button"
            onClick={onUpdate}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-[#10243a]"
          >
            <Smartphone className="h-5 w-5" />
            <Download className="h-5 w-5" />
            Update Android app
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full rounded-xl px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Maybe later
          </button>
        </div>
      </section>
    </div>
  );
}
