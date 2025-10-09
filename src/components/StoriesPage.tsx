import React, { useState, useEffect, useRef } from "react";
import {
  FolderPlus,
  Folder,
  Image as ImageIcon,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type MediaItem = {
  id: string;
  name: string;
  url: string;
  type: "image" | "video" | "pdf" | "text";
};

type Album = {
  id: string;
  name: string;
  albums: Album[];
  media: MediaItem[];
};

export const GalleryApp: React.FC = () => {
  const [rootAlbum, setRootAlbum] = useState<Album>({
    id: "root",
    name: "Albums",
    albums: [],
    media: [],
  });
  const [path, setPath] = useState<Album[]>([rootAlbum]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const currentAlbum = path[path.length - 1];

  const updateAlbum = (updater: (album: Album) => Album) => {
    const updateRecursive = (album: Album): Album => {
      if (album.id === currentAlbum.id) return updater(album);
      return {
        ...album,
        albums: album.albums.map(updateRecursive),
      };
    };
    setRootAlbum((prev) => updateRecursive(prev));
  };

  const createAlbum = () => {
    const name = prompt("Album name?");
    if (!name) return;
    updateAlbum((album) => ({
      ...album,
      albums: [...album.albums, { id: "a-" + Date.now(), name, albums: [], media: [] }],
    }));
  };

  const uploadMedia = (files: FileList | null) => {
    if (!files) return;
    const newItems: MediaItem[] = Array.from(files).map((f) => {
      let type: MediaItem["type"] = "image";
      if (f.type.startsWith("video/")) type = "video";
      else if (f.type === "application/pdf") type = "pdf";
      else if (f.type.startsWith("text/")) type = "text";
      return { id: "m-" + Date.now() + Math.random(), name: f.name, url: URL.createObjectURL(f), type };
    });
    updateAlbum((album) => ({ ...album, media: [...album.media, ...newItems] }));
  };

  const deleteAlbum = (id: string) => {
    if (confirm("Delete this album and all its contents?")) {
      updateAlbum((album) => ({ ...album, albums: album.albums.filter((a) => a.id !== id) }));
    }
  };

  const deleteMedia = (id: string) => {
    if (confirm("Delete this media?")) {
      updateAlbum((album) => ({ ...album, media: album.media.filter((m) => m.id !== id) }));
    }
  };

  // Keyboard navigation for preview
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewIndex(null);
      if (previewIndex !== null) {
        if (e.key === "ArrowRight") setPreviewIndex((i) => (i! < currentAlbum.media.length - 1 ? i! + 1 : i));
        if (e.key === "ArrowLeft") setPreviewIndex((i) => (i! > 0 ? i! - 1 : i));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewIndex, currentAlbum.media.length]);

  // Handle swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < 40) return; // ignore small moves
    if (deltaX < 0 && previewIndex! < currentAlbum.media.length - 1) setPreviewIndex(previewIndex! + 1);
    if (deltaX > 0 && previewIndex! > 0) setPreviewIndex(previewIndex! - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        {path.map((a, i) => (
          <span key={a.id}>
            {i > 0 && " > "}
            <button className="text-blue-600 hover:underline" onClick={() => setPath(path.slice(0, i + 1))}>
              {a.name}
            </button>
          </span>
        ))}
      </div>

      {/* Header Buttons */}
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">{currentAlbum.name}</h1>
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white px-3 py-1 rounded-lg flex items-center gap-1" onClick={createAlbum}>
            <FolderPlus size={16} /> New Album
          </button>
          <label className="bg-green-600 text-white px-3 py-1 rounded-lg cursor-pointer flex items-center gap-1">
            <ImageIcon size={16} /> Add Files
            <input
              type="file"
              multiple
              accept="image/*,video/*,application/pdf,text/plain"
              className="hidden"
              onChange={(e) => {
                uploadMedia(e.target.files);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {/* Sub-Albums */}
      {currentAlbum.albums.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-2">Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
            {currentAlbum.albums.map((album) => (
              <div
                key={album.id}
                className="p-4 border rounded-lg bg-white shadow cursor-pointer relative group"
                onClick={() => setPath([...path, album])}
              >
                <Folder className="w-10 h-10 text-yellow-500 mb-2" />
                <p className="font-medium truncate">{album.name}</p>
                <button
                  className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAlbum(album.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Media Grid */}
      {currentAlbum.media.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-2">Media</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {currentAlbum.media.map((item, i) => (
              <div key={item.id} className="relative group" onClick={() => setPreviewIndex(i)}>
                {item.type === "image" ? (
                  <img src={item.url} alt={item.name} className="w-full h-40 object-cover rounded-lg" />
                ) : item.type === "video" ? (
                  <video src={item.url} className="w-full h-40 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded-lg">
                    <span>{item.type.toUpperCase()}</span>
                  </div>
                )}
                <button
                  className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMedia(item.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {currentAlbum.albums.length === 0 && currentAlbum.media.length === 0 && (
        <div className="text-gray-500">This album is empty.</div>
      )}

      {/* Preview Modal */}
      {previewIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button className="absolute top-4 right-4 text-white" onClick={() => setPreviewIndex(null)}>
            <X size={32} />
          </button>
          <button
            className="absolute left-4 text-white"
            onClick={() => previewIndex! > 0 && setPreviewIndex(previewIndex! - 1)}
          >
            <ChevronLeft size={32} />
          </button>
          <button
            className="absolute right-4 text-white"
            onClick={() => previewIndex! < currentAlbum.media.length - 1 && setPreviewIndex(previewIndex! + 1)}
          >
            <ChevronRight size={32} />
          </button>

          <div className="max-w-5xl max-h-[80vh] flex items-center justify-center">
            {currentAlbum.media[previewIndex].type === "image" && (
              <img src={currentAlbum.media[previewIndex].url} alt={currentAlbum.media[previewIndex].name} className="max-h-[80vh] rounded-lg" />
            )}
            {currentAlbum.media[previewIndex].type === "video" && (
              <video src={currentAlbum.media[previewIndex].url} controls autoPlay className="max-h-[80vh] rounded-lg" />
            )}
            {(currentAlbum.media[previewIndex].type === "pdf" || currentAlbum.media[previewIndex].type === "text") && (
              <iframe src={currentAlbum.media[previewIndex].url} className="w-[80vw] h-[80vh] bg-white rounded-lg" title="Preview" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryApp;
