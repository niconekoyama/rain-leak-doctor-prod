'use client';

import React, { useState } from 'react';

interface ImageUploadProps {
  maxImages?: number;
  onImagesChange: (files: File[]) => void;
  images: File[];
}

export function ImageUpload({
  maxImages = 3,
  onImagesChange,
  images,
}: ImageUploadProps) {
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + images.length > maxImages) {
        setError(`画像は最大${maxImages}枚までアップロードできます。`);
        return;
      }
      onImagesChange([...images, ...files]);
      setError('');
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        雨漏り箇所の写真（{maxImages}枚） <span className="text-red-500">*</span>
      </label>
      <p className="text-sm text-gray-500 mb-4">
        雨漏り箇所を異なる角度から{maxImages}枚撮影してください。
      </p>

      {images.length < maxImages && (
        <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            クリックして画像を選択
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
        </label>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(image)}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
