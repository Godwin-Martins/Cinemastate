import { FaTelegramPlane, FaWhatsapp, FaDiscord } from "react-icons/fa";
import { motion } from "framer-motion";

export default function Footer() {
  const genres = ["Action", "Horror", "Comedy", "Fantasy", "Adventure", "Animation"];

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <footer className="w-full bg-navy text-gray-300 py-10 mt-12">
      <motion.div
        className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* Brand + About */}
        <motion.div className="flex flex-col gap-4" variants={item}>
          <span className="text-2xl font-bold text-skyblue">AlphaFlix</span>
          <p className="text-gray-400 text-sm">
            Your ultimate source for movie streaming news, reviews, and updates.
          </p>
          <div className="flex gap-4 text-skyblue text-xl mt-2">
            <motion.a
              href="https://t.me/alphaflix_telegram"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              variants={item}
              whileHover={{ scale: 1.2 }}
            >
              <FaTelegramPlane />
            </motion.a>
            <motion.a
              href="https://www.whatsapp.com/channel/0029Vb6ZPze35fLnBvNYtV24"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              variants={item}
              whileHover={{ scale: 1.2 }}
            >
              <FaWhatsapp />
            </motion.a>
            <motion.a
              href="https://discord.com/invite/6fAjX5bK"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
              variants={item}
              whileHover={{ scale: 1.2 }}
            >
              <FaDiscord />
            </motion.a>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div className="flex flex-col gap-2" variants={item}>
          <h3 className="text-lg font-semibold text-gray-200">Quick Links</h3>
          {["Home", "Movies", "Series", "Contact", "About"].map((link) => (
            <motion.a
              key={link}
              href={`/${link.toLowerCase()}`}
              className="hover:text-skyblue transition"
              variants={item}
              whileHover={{ x: 5 }}
            >
              {link}
            </motion.a>
          ))}
        </motion.div>

        {/* Popular Genres */}
        <motion.div className="flex flex-col gap-2" variants={item}>
          <h3 className="text-lg font-semibold text-gray-200">Popular Genres</h3>
          <p className="text-gray-400 text-sm">Explore movies by genre:</p>
          <motion.div className="flex flex-wrap gap-2 mt-2" variants={container}>
            {genres.map((genre) => {
              const slug = genre.toLowerCase().replace(/\s+/g, "-");
              return (
                <motion.a
                  key={genre}
                  href={`/genre/${slug}`}
                  className="px-3 py-1 bg-gray-800 text-gray-200 rounded-md hover:bg-skyblue hover:text-navy transition"
                  variants={item}
                  whileHover={{ scale: 1.05 }}
                >
                  {genre}
                </motion.a>
              );
            })}
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-8 border-t border-gray-700 pt-4 text-center text-gray-500 text-sm"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
        viewport={{ once: true }}
      >
        &copy; {new Date().getFullYear()} AlphaFlix. All rights reserved.
      </motion.div>
    </footer>
  );
}
