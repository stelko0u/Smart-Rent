'use client';

import React, { useState } from 'react';
import AngleLeft from '../../components/icons/AngleLeft';
import AngleRight from '../../components/icons/AngleRight';
import ReactModal from 'react-modal';
import { Xmark } from '../icons';

interface ImageSliderProps {
  images: string[];
  carName: string;
}

export default function ImageSlider({ images, carName }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);

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
  const toggleFullScreen = () => setFullScreen((fs) => !fs);

  return (
    <div className="relative w-full space-y-4">
      <div className="relative h-96 md:h-125 overflow-hidden rounded-2xl shadow-lg bg-black group">
        <img
          src={images[currentIndex]}
          alt={`${carName} - ${currentIndex + 1}`}
          className="w-full h-full object-cover cursor-pointer"
          onClick={toggleFullScreen}
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2  rounded-full shadow-lg transition-transform z-10 hover:scale-110 cursor-pointer"
            >
              <AngleLeft className="w-12 h-12 p-2 bg-black/50 rounded-full z-0" />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg transition-transform z-10 hover:scale-110 cursor-pointer"
            >
              <AngleRight className="w-12 h-12 p-2 bg-black/50 rounded-full z-0" />
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
      <ReactModal
        isOpen={fullScreen}
        onRequestClose={toggleFullScreen}
        className="max-w-6xl w-full relative z-50 flex items-center justify-center outline-none"
        overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
        shouldCloseOnOverlayClick={true}
        ariaHideApp={false}
      >
        <button
          onClick={prevSlide}
          className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 mx-3 rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer"
        >
          <AngleLeft className="w-12 h-12 p-2 bg-white/80 text-black rounded-full" />
        </button>
        <img
          src={images[currentIndex]}
          alt={`${carName} - Fullscreen`}
          className="md:max-w-250 max-h-175 object-contain"
        />
        <button
          onClick={nextSlide}
          className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 mx-3 rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer"
        >
          <AngleRight className="w-12 h-12 p-2 bg-white/80 text-black   rounded-full" />
        </button>
      </ReactModal>

      {fullScreen && images.length > 1 && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="pointer-events-auto absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`w-16 h-12 rounded overflow-hidden ${
                  i === currentIndex
                    ? 'ring-2 ring-white'
                    : 'opacity-60 hover:opacity-100'
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
        </div>
      )}
    </div>
  );
}
