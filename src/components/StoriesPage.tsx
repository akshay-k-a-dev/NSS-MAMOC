import React, { useMemo, useRef, useState } from 'react';
import { Folder, File as FileIcon, Upload, Plus, Trash2, Pencil, ChevronRight, Image as ImageIcon, FileText, Eye, X } from 'lucide-react';

type FileItem = {
  id: string;
  name: string;
  type: 'file';
  mime: string;
  url?: string;
};

type FolderItem = {
  id: string;
  name: string;
  type: 'folder';
  children: Array<FolderItem | FileItem>;
};

type NodeItem = FolderItem | FileItem;

// Accept any props to stay compatible with existing lazy import usage
export const StoriesPage: React.FC<{ canManage?: boolean } & Record<string, any>> = ({ canManage = false }) => {
  const [root, setRoot] = useState<FolderItem>({
    id: 'root',
    name: 'Root',
    type: 'folder',
    children: [],
  });
  const [path, setPath] = useState<string[]>(['root']);
  const [preview, setPreview] = useState<{ url: string; mime: string; name: string } | null>(null);
  const [previewList, setPreviewList] = useState<FileItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number>(-1);
  const previewTouchStartX = useRef<number | null>(null);
  const [contextItem, setContextItem] = useState<NodeItem | null>(null);
  const [contextPos, setContextPos] = useState<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressTargetCenter = useRef<{ x: number; y: number } | null>(null);

  const currentFolder = useMemo<FolderItem>(() => {
    let cursor: FolderItem = root;
    for (let i = 1; i < path.length; i++) {
      const nextId = path[i];
      const next = cursor.children.find(c => c.type === 'folder' && c.id === nextId) as FolderItem | undefined;
      if (next) cursor = next;
    }
    return cursor;
  }, [root, path]);

  const updateFolderByPath = (targetPath: string[], updater: (folder: FolderItem) => void) => {
    const clone = structuredClone(root) as FolderItem;
    let cursor: FolderItem = clone;
    for (let i = 1; i < targetPath.length; i++) {
      const nextId = targetPath[i];
      cursor = cursor.children.find(c => c.type === 'folder' && c.id === nextId) as FolderItem;
    }
    updater(cursor);
    setRoot(clone);
  };

  const createFolder = () => {
    if (!canManage) return;
    const name = prompt('Folder name');
    if (!name) return;
    updateFolderByPath(path, (folder) => {
      folder.children.unshift({ id: 'fld-' + Date.now(), name, type: 'folder', children: [] });
    });
  };

  const uploadFiles = (files: FileList | null) => {
    if (!canManage) return;
    if (!files || files.length === 0) return;
    const items: FileItem[] = Array.from(files).map((f) => ({
      id: 'fil-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      name: f.name,
      type: 'file',
      mime: f.type || 'application/octet-stream',
      url: URL.createObjectURL(f),
    }));
    updateFolderByPath(path, (folder) => {
      folder.children = [...items, ...folder.children];
    });
  };

  const renameItem = (item: NodeItem) => {
    if (!canManage) return;
    const name = prompt('New name', item.name);
    if (!name || name === item.name) return;
    const clone = structuredClone(root) as FolderItem;
    const walk = (folder: FolderItem) => {
      const found = folder.children.find(c => c.id === item.id);
      if (found) {
        found.name = name;
        return true;
      }
      for (const child of folder.children) {
        if (child.type === 'folder' && walk(child)) return true;
      }
      return false;
    };
    walk(clone);
    setRoot(clone);
  };

  const deleteItem = (item: NodeItem) => {
    if (!canManage) return;
    if (!confirm(`Delete "${item.name}"?`)) return;
    const clone = structuredClone(root) as FolderItem;
    const walk = (folder: FolderItem) => {
      const idx = folder.children.findIndex(c => c.id === item.id);
      if (idx >= 0) {
        folder.children.splice(idx, 1);
        return true;
      }
      for (const child of folder.children) {
        if (child.type === 'folder' && walk(child)) return true;
      }
      return false;
    };
    walk(clone);
    setRoot(clone);
  };

  const openContext = (e: React.MouseEvent, item: NodeItem) => {
    if (!canManage) return;
    e.preventDefault();
    setContextItem(item);
    setContextPos({ x: e.clientX, y: e.clientY });
  };

  const startLongPress = (e: React.TouchEvent, item: NodeItem) => {
    if (!canManage) return;
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    const touch = e.touches[0];
    longPressTargetCenter.current = { x: touch.clientX, y: touch.clientY };
    longPressTimer.current = window.setTimeout(() => {
      setContextItem(item);
      const pos = longPressTargetCenter.current || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      setContextPos({ x: pos.x, y: pos.y });
    }, 650);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
    longPressTargetCenter.current = null;
  };

  const isImage = (mime: string) => mime.startsWith('image/');
  const isPdf = (mime: string) => mime === 'application/pdf';

  return (
    <div className="min-h-screen bg-gray-50 py-8" onClick={() => { if (contextPos) { setContextPos(null); setContextItem(null); } }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">File Manager</h1>
          <div className="flex items-center gap-2">
            <label className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 cursor-pointer flex items-center gap-2 disabled:opacity-50" aria-disabled={!canManage}>
              <Upload size={18} /> Upload Files
              <input disabled={!canManage} type="file" multiple className="hidden" onChange={(e) => { uploadFiles(e.target.files); e.currentTarget.value=''; }} />
            </label>
            <button onClick={createFolder} disabled={!canManage} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
              <Plus size={18} /> New Folder
            </button>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-4 flex items-center gap-2 text-sm">
          <button onClick={() => setPath(['root'])} className="text-blue-700 hover:underline">Root</button>
          {path.slice(1).map((id, idx) => {
            const segPath = ['root', ...path.slice(1, idx + 1)];
            const folder = ((): FolderItem | null => {
              let cursor: FolderItem = root;
              for (let i = 1; i < segPath.length; i++) {
                const nextId = segPath[i];
                const next = cursor.children.find(c => c.type === 'folder' && c.id === nextId) as FolderItem | undefined;
                if (!next) return null;
                cursor = next;
              }
              return cursor;
            })();
            if (!folder) return null;
            return (
              <div key={id} className="flex items-center gap-2">
                <ChevronRight size={16} className="text-gray-400" />
                <button onClick={() => setPath(segPath)} className="text-blue-700 hover:underline">{folder.name}</button>
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          {currentFolder.children.length === 0 ? (
            <div className="text-gray-500">This folder is empty. Create a folder or upload files.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {currentFolder.children.map((item) => (
                <div key={item.id}
                  className="group border border-gray-200 rounded-lg p-3 hover:shadow cursor-pointer"
                  onContextMenu={(e) => openContext(e, item as NodeItem)}
                  onClick={() => {
                    if (item.type === 'folder') setPath([...path, item.id]);
                    else if (item.type === 'file') {
                      const file = item as FileItem;
                      if (file.url) {
                        // Build preview list of images in current folder and open at clicked index
                        const images = currentFolder.children.filter(c => c.type === 'file' && (c as FileItem).mime.startsWith('image/')) as FileItem[];
                        const idx = images.findIndex(img => img.id === file.id);
                        setPreviewList(images);
                        setPreviewIndex(idx >= 0 ? idx : 0);
                        const chosen = images[idx >= 0 ? idx : 0];
                        if (chosen && chosen.url) setPreview({ url: chosen.url, mime: chosen.mime, name: chosen.name });
                      }
                    }
                  }}
                  onTouchStart={(e) => startLongPress(e, item as NodeItem)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                >
                  <div className="aspect-square rounded-lg bg-gray-50 border flex items-center justify-center relative">
                    {item.type === 'folder' ? (
                      <Folder className="text-amber-500" size={36} />
                    ) : isImage((item as FileItem).mime) ? (
                      (item as FileItem).url ? <img src={(item as FileItem).url} alt={item.name} className="w-full h-full object-cover rounded" /> : <ImageIcon size={36} />
                    ) : isPdf((item as FileItem).mime) ? (
                      <FileText className="text-red-600" size={36} />
                    ) : (
                      <FileIcon className="text-gray-500" size={36} />
                    )}
                    <button
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-white p-1 rounded shadow"
                      onClick={(e) => { e.stopPropagation(); if (item.type==='file' && (item as FileItem).url){ const images = currentFolder.children.filter(c => c.type==='file' && (c as FileItem).mime.startsWith('image/')) as FileItem[]; const idx = images.findIndex(img=>img.id===(item as FileItem).id); setPreviewList(images); setPreviewIndex(idx>=0?idx:0); const chosen = images[idx>=0?idx:0]; if (chosen && chosen.url) setPreview({ url: chosen.url, mime: chosen.mime, name: chosen.name }); } }}
                      title="Preview"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="truncate text-sm" title={item.name}>{item.name}</div>
                    <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition opacity-100">
                      <button onClick={(e) => { e.stopPropagation(); renameItem(item as NodeItem); }} className="p-1 text-gray-600 hover:bg-gray-100 rounded" title="Rename"><Pencil size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteItem(item as NodeItem); }} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Context Menu */}
        {contextPos && contextItem && (
          <div className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-md text-sm"
               style={{ left: contextPos.x + 2, top: contextPos.y + 2 }}
               onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => { renameItem(contextItem); setContextPos(null); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Rename</button>
            <button onClick={() => { deleteItem(contextItem); setContextPos(null); }} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50">Delete</button>
          </div>
        )}

        {/* Preview Modal */}
        {preview && (
          <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
            <button className="absolute top-4 right-4 text-white" onClick={() => setPreview(null)} aria-label="Close"><X size={28} /></button>
            {/* Navigation buttons */}
            {previewList.length > 1 && (
              <>
                <button
                  className="absolute left-2 sm:left-6 text-white bg-black/40 hover:bg-black/60 px-3 py-2 rounded"
                  onClick={(e) => { e.stopPropagation(); const next = (previewIndex - 1 + previewList.length) % previewList.length; setPreviewIndex(next); const f = previewList[next]; if (f.url) setPreview({ url: f.url, mime: f.mime, name: f.name }); }}
                  aria-label="Previous"
                >
                  ‹
                </button>
                <button
                  className="absolute right-2 sm:right-6 text-white bg-black/40 hover:bg-black/60 px-3 py-2 rounded"
                  onClick={(e) => { e.stopPropagation(); const next = (previewIndex + 1) % previewList.length; setPreviewIndex(next); const f = previewList[next]; if (f.url) setPreview({ url: f.url, mime: f.mime, name: f.name }); }}
                  aria-label="Next"
                >
                  ›
                </button>
              </>
            )}
            <div
              className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] p-4 overflow-auto"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => { previewTouchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (previewTouchStartX.current == null) return;
                const deltaX = e.changedTouches[0].clientX - previewTouchStartX.current;
                previewTouchStartX.current = null;
                if (Math.abs(deltaX) < 40) return;
                if (previewList.length > 1 && isImage(preview.mime)) {
                  let next = previewIndex;
                  if (deltaX < 0) next = (previewIndex + 1) % previewList.length; // swipe left -> next
                  else next = (previewIndex - 1 + previewList.length) % previewList.length; // swipe right -> prev
                  setPreviewIndex(next);
                  const f = previewList[next];
                  if (f && f.url) setPreview({ url: f.url, mime: f.mime, name: f.name });
                }
              }}
            >
              <div className="mb-3 font-semibold">{preview.name}</div>
              {isImage(preview.mime) && preview.url && (
                <img src={preview.url} alt={preview.name} className="max-w-full h-auto mx-auto" />
              )}
              {isPdf(preview.mime) && preview.url && (
                <object data={preview.url} type="application/pdf" className="w-full h-[70vh]">
                  <p>PDF preview is not supported in this browser. <a href={preview.url} className="text-blue-700 underline">Download</a></p>
                </object>
              )}
              {!isImage(preview.mime) && !isPdf(preview.mime) && (
                <div className="text-gray-600 text-sm">No inline preview available. Please download the file.</div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StoriesPage;


