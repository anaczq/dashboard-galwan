import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageGalleryProps {
  images: string[];
  onClose?: () => void;
}

export function ImageGallery({ images, onClose }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const openGallery = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const closeGallery = () => {
    setIsOpen(false);
    onClose?.();
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="aspect-square cursor-pointer overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-80"
            onClick={() => openGallery(index)}
          >
            <img src={image} alt={`Imagem ${index + 1}`} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={closeGallery}
            >
              <X className="h-4 w-4" />
            </Button>

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            <img
              src={images[currentIndex]}
              alt={`Imagem ${currentIndex + 1}`}
              className="max-h-[80vh] w-full object-contain"
            />

            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
