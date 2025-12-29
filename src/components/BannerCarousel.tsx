import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Banner {
  id: string;
  tipo: "imagem" | "video";
  url: string; // URL da imagem ou ID/URL do YouTube
  link: string; // Link de redirecionamento
  titulo?: string;
  ativo: boolean;
}

interface BannerCarouselProps {
  banners: Banner[];
  autoPlay?: boolean;
  interval?: number;
}

// Extrai o ID do vídeo do YouTube
function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function BannerCarousel({ banners, autoPlay = true, interval = 5000 }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeBanners = banners.filter(b => b.ativo);

  useEffect(() => {
    if (!autoPlay || activeBanners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const currentBanner = activeBanners[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handleBannerClick = () => {
    if (currentBanner.link) {
      window.open(currentBanner.link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="relative w-full h-48 sm:h-56 md:h-64 rounded-xl overflow-hidden group glass-card">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 cursor-pointer"
          onClick={handleBannerClick}
        >
          {currentBanner.tipo === "video" ? (
            <div className="relative w-full h-full bg-secondary">
              {getYouTubeId(currentBanner.url) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(currentBanner.url)}?autoplay=0&mute=1&controls=0&showinfo=0&rel=0`}
                  className="w-full h-full pointer-events-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              {/* Overlay for click handling */}
              <div className="absolute inset-0 bg-transparent" />
            </div>
          ) : (
            <img
              src={currentBanner.url}
              alt={currentBanner.titulo || "Banner promocional"}
              className="w-full h-full object-cover"
            />
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />

          {/* Banner title and CTA */}
          {currentBanner.titulo && (
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-lg font-semibold text-foreground drop-shadow-lg flex items-center gap-2">
                {currentBanner.titulo}
                <ExternalLink className="h-4 w-4 opacity-70" />
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      {activeBanners.length > 1 && (
        <>
          <Button
            variant="glass"
            size="icon"
            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="glass"
            size="icon"
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Dots indicator */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-primary w-6"
                  : "bg-foreground/40 hover:bg-foreground/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
