import React, { useEffect, useState } from 'react';
import { ApiError, type MediaFile } from '@statusflow/api-client';
import { apiClient } from '../lib/apiClient';

export const MediaLibrary: React.FC = () => {
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MediaFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .listMedia()
      .then(({ media }) => setMediaList(media ?? []))
      .catch(() => setMediaList([]))
      .finally(() => setLoading(false));
  }, []);

  // Storage Stats Calculation
  const totalStorageMb = 5000;
  const usedStorageMb = mediaList.reduce((acc, item) => acc + item.fileSize / (1024 * 1024), 0);
  const usedPercentage = Math.min(100, Math.round((usedStorageMb / totalStorageMb) * 100));

  const filteredMedia = mediaList.filter(item =>
    item.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsUploading(true);
    setUploadError(null);
    try {
      const { media } = await apiClient.uploadMedia(file);
      setMediaList(prev => [media, ...prev]);
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteMedia(id);
      setMediaList(prev => prev.filter(m => m.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Could not delete this file. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Storage Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Media Library Asset Manager</h2>
          <p className="text-sm text-zinc-400 mt-1">Upload and manage image and video assets for your status schedules.</p>
        </div>

        <div className="w-full md:w-72 p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
          <div className="flex justify-between text-xs text-zinc-400 font-medium">
            <span>Media Storage</span>
            <span className="text-emerald-400">{usedPercentage}% Used</span>
          </div>
          <div className="text-sm font-bold text-white">
            {(usedStorageMb / 1024).toFixed(2)} GB <span className="text-xs font-normal text-zinc-500">/ 5.0 GB</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${usedPercentage}%` }}></div>
          </div>
        </div>
      </div>

      {/* Action Toolbar: Upload Button & Search Input */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Upload Zone Button */}
        <label className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2">
          <span>📤</span> Upload Media File
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>

        {/* Search Bar */}
        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media files..."
            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Upload Progress / Error */}
      {isUploading && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-emerald-500/30 text-sm text-emerald-400 text-center animate-pulse">
          Uploading asset...
        </div>
      )}
      {uploadError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
          {uploadError}
        </div>
      )}

      {/* Media Grid Display */}
      {loading ? (
        <div className="py-16 text-center text-sm text-zinc-500">Loading your media library...</div>
      ) : filteredMedia.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-zinc-800 rounded-2xl space-y-2">
          <div className="text-2xl">🖼️</div>
          <div className="text-sm font-semibold text-white">No media assets found</div>
          <div className="text-xs text-zinc-400">Try adjusting your search query or upload a new media file.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMedia.map((item) => (
            <div key={item.id} className="group relative rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all flex flex-col justify-between">
              {/* Media Thumbnail */}
              <div className="relative h-44 bg-zinc-950 overflow-hidden cursor-pointer" onClick={() => setSelectedItem(item)}>
                {item.mimeType.startsWith('video') ? (
                  <video
                    src={item.fileUrl}
                    muted
                    preload="metadata"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <img
                    src={item.fileUrl}
                    alt={item.fileName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-zinc-950/80 backdrop-blur-md text-zinc-300 text-[10px] font-mono border border-zinc-800">
                  {item.mimeType.startsWith('video') ? 'VIDEO' : 'IMAGE'}
                </span>
                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-zinc-950/80 backdrop-blur-md text-zinc-300 text-[10px]">
                  {(item.fileSize / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>

              {/* Item Info & Actions */}
              <div className="p-4 space-y-3">
                <div className="text-xs font-semibold text-white truncate" title={item.fileName}>{item.fileName}</div>

                <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/60">
                  <span>Uploaded {new Date(item.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-400 hover:text-red-300 font-medium hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset Preview Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-white truncate max-w-md">{selectedItem.fileName}</h3>
              <button onClick={() => setSelectedItem(null)} className="text-zinc-400 hover:text-white text-xl">×</button>
            </div>

            <div className="h-64 rounded-xl bg-zinc-950 overflow-hidden flex items-center justify-center border border-zinc-800">
              {selectedItem.mimeType.startsWith('video') ? (
                <video src={selectedItem.fileUrl} controls className="max-h-full object-contain" />
              ) : (
                <img src={selectedItem.fileUrl} alt={selectedItem.fileName} className="max-h-full object-contain" />
              )}
            </div>

            <div className="flex justify-between items-center text-xs text-zinc-400">
              <div>Type: <span className="text-white font-medium">{selectedItem.mimeType}</span></div>
              <div>Size: <span className="text-white font-medium">{(selectedItem.fileSize / (1024 * 1024)).toFixed(1)} MB</span></div>
              <div>Date: <span className="text-white font-medium">{new Date(selectedItem.createdAt).toLocaleDateString()}</span></div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
