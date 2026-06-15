import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Link } from "wouter";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* Glowing 404 */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="text-[9rem] font-black leading-none mb-4 select-none"
            style={{
              background: "linear-gradient(135deg, #4D8FFF 0%, #1F6BFF 40%, #8B4DFF 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              filter: "drop-shadow(0 0 28px rgba(31,107,255,0.35))",
            }}
          >
            404
          </motion.div>

          {/* Football */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl mb-6 select-none"
          >
            ⚽
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-2xl font-black mb-3 text-foreground"
          >
            העמוד לא נמצא
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-muted-foreground mb-8 max-w-sm mx-auto"
          >
            נראה שהעמוד שחיפשת יצא להחלפה. בוא נחזיר אותך למגרש.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link href="/">
              <Button variant="accent" size="lg" className="gap-2 font-bold px-8">
                <Home className="w-4 h-4" />
                חזור לבית
              </Button>
            </Link>
            <Link href="/matches">
              <Button variant="outline" size="lg" className="gap-2 font-bold px-8 border-border/30">
                <Search className="w-4 h-4" />
                משחקים
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
