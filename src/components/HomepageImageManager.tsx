import React, { useState, useRef } from 'react';
import { Upload, Trash2, Eye, ArrowUp, ArrowDown, X } from 'lucide-react';

interface HomepageImage {
  id: string;
  src: string;
  alt: string;
  type: 'left' | 'right';
}

interface HomepageImageManagerProps {
  leftImages: HomepageImage[];
  rightImages: HomepageImage[];
  onUpdateImages: (leftImages: HomepageImage[], rightImages: HomepageImage[]) => void;
}

export const HomepageImageManager: React.FC<HomepageImageManagerProps> = ({
  leftImages,
  rightImages,
  onUpdateImages,
}) => {
  const [activeTab, setActiveTab] = useState<'left' | 'right'>('left');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList | null, type: 'left' | 'right') => {
    if (!files) return;

    const newImages: HomepageImage[] = Array.from(files).map((file, index) => ({
      id: `img-${Date.now()}-${index}`,
      src: URL.createObjectURL(file),
      alt: `NSS Activity ${type === 'left' ? 'Left' : 'Right'} ${leftImages.length + rightImages.length + index + 1}`,
      type,
    }));

    if (type === 'left') {
      onUpdateImages([...leftImages, ...newImages], rightImages);
    } else {
      onUpdateImages(leftImages, [...rightImages, ...newImages]);
    }
  };

  const handleDeleteImage = (imageId: string, type: 'left' | 'right') => {
    if (type === 'left') {
      onUpdateImages(leftImages.filter(img => img.id !== imageId), rightImages);
    } else {
      onUpdateImages(leftImages, rightImages.filter(img => img.id !== imageId));
    }
  };

  const handleMoveImage = (imageId: string, direction: 'up' | 'down', type: 'left' | 'right') => {
    const images = type === 'left' ? leftImages : rightImages;
    const currentIndex = images.findIndex(img => img.id === imageId);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= images.length) return;
    
    const newImages = [...images];
    [newImages[currentIndex], newImages[newIndex]] = [newImages[newIndex], newImages[currentIndex]];
    
    if (type === 'left') {
      onUpdateImages(newImages, rightImages);
    } else {
      onUpdateImages(leftImages, newImages);
    }
  };

  const renderImageGrid = (images: HomepageImage[], type: 'left' | 'right') => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((image, index) => (
        <div key={image.id} className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="aspect-square">
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setPreviewImage(image.src)}
            />
          </div>
          
          {/* Overlay controls */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex space-x-2">
              <button
                onClick={() => setPreviewImage(image.src)}
                className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
                title="Preview"
              >
                <Eye size={16} />
              </button>
              
              {index > 0 && (
                <button
                  onClick={() => handleMoveImage(image.id, 'up', type)}
                  className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
                  title="Move up"
                >
                  <ArrowUp size={16} />
                </button>
              )}
              
              {index < images.length - 1 && (
                <button
                  onClick={() => handleMoveImage(image.id, 'down', type)}
                  className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
                  title="Move down"
                >
                  <ArrowDown size={16} />
                </button>
              )}
              
              <button
                onClick={() => handleDeleteImage(image.id, type)}
                className="p-2 bg-red-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-red-600/80 transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          
          {/* Image info */}
          <div className="p-3">
            <p className="text-sm text-gray-600 truncate">{image.alt}</p>
            <p className="text-xs text-gray-400">Position: {index + 1}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Homepage Image Management</h2>
        <p className="text-gray-600">Manage images for the scrolling boxes on the homepage</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('left')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'left'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Left Scrolling Box ({leftImages.length} images)
          </button>
          <button
            onClick={() => setActiveTab('right')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'right'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Right Scrolling Box ({rightImages.length} images)
          </button>
        </nav>
      </div>

      <div className="p-6">
        {/* Upload Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeTab === 'left' ? 'Left' : 'Right'} Scrolling Box Images
            </h3>
            <button
              onClick={() => {
                const inputRef = activeTab === 'left' ? leftFileInputRef : rightFileInputRef;
                inputRef.current?.click();
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Upload size={16} />
              <span>Add Images</span>
            </button>
          </div>
          
          <input
            ref={activeTab === 'left' ? leftFileInputRef : rightFileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files, activeTab)}
            className="hidden"
          />
          
          <p className="text-sm text-gray-500 mb-4">
            Upload multiple images at once. Images will be displayed in the order they appear here.
            The {activeTab} box scrolls {activeTab === 'left' ? 'downward' : 'upward'} continuously.
          </p>
        </div>

        {/* Image Grid */}
        {activeTab === 'left' ? (
          leftImages.length > 0 ? (
            renderImageGrid(leftImages, 'left')
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No images uploaded yet</p>
              <p className="text-sm text-gray-400">Click "Add Images" to upload photos for the left scrolling box</p>
            </div>
          )
        ) : (
          rightImages.length > 0 ? (
            renderImageGrid(rightImages, 'right')
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No images uploaded yet</p>
              <p className="text-sm text-gray-400">Click "Add Images" to upload photos for the right scrolling box</p>
            </div>
          )
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors z-10"
            >
              <X size={24} />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};
