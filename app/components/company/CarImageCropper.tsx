'use client';

import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface Props {
  image: string;
  onSave: (croppedImage: string) => void;
}

export default function CarImageCropper({ image, onSave }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 50.625, // 90% width * (9/16) to maintain 16:9 aspect ratio
    x: 5,
    y: 24.6875, // Center vertically: (100 - 50.625) / 2
  });

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
  };

  const handleSave = () => {
    if (!imgRef.current || !completedCrop) return;

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    // Set canvas size to the cropped dimensions at natural resolution
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    onSave(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="space-y-4">
      <div className="max-w-full overflow-auto">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={16 / 9}
        >
          <img
            src={image}
            onLoad={onImageLoad}
            alt="Crop preview"
            className="max-w-full h-auto"
            style={{ maxHeight: '70vh' }}
          />
        </ReactCrop>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Save image
        </button>
      </div>
    </div>
  );
}
