'use client';

import React, { useState } from 'react';
import AngleLeft from '../../components/icons/AngleLeft';
import AngleRight from '../../components/icons/AngleRight';

interface ImageSliderProps {
  images: string[];
  carName: string;
}

export default function ImageSlider({ images, carName }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-2xl flex items-center justify-center">
        <span className="text-gray-500">No images available</span>
      </div>
    );
  }

  const prevSlide = () =>
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const nextSlide = () =>
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  const goToSlide = (index: number) => setCurrentIndex(index);

  return (
    <div className="relative w-full space-y-4">
      {/* Main Image */}
      <div className="relative h-96 md:h-[500px] overflow-hidden rounded-2xl shadow-lg bg-black group">
        <img
          src={images[currentIndex]}
          alt={`${carName} - ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full shadow-lg transition-transform z-10 hover:scale-150 cursor-pointer"
            >
              <AngleLeft className="w-12 h-12 p-2 bg-black/50 rounded-full " />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full shadow-lg transition-transform z-10 hover:scale-150 cursor-pointer"
            >
              <AngleRight className="w-12 h-12 p-2 bg-black/50 rounded-full " />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-base">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`relative h-20 rounded overflow-hidden ${
                i === currentIndex
                  ? 'ring-2 ring-indigo-500'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Thumb ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
