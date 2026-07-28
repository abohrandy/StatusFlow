import React, { useState } from 'react';

export interface MediaItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSizeMb: number;
  mimeType: string;
  createdAt: string;
  type: 'IMAGE' | 'VIDEO';
}

const INITIAL_MEDIA: MediaItem[] = [
  { id: '1', fileName: 'summer_promo_banner.jpg', fileUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500', fileSizeMb: 1.2, mimeType: 'image/jpeg', createdAt: '2026-07-28', type: 'IMAGE' },
  { id: '2', fileName: 'product_demo_reel.mp4', fileUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=500', fileSizeMb: 8.5, mimeType: 'video/mp4', createdAt: '2026-07-27', type: 'VIDEO' },
  { id: '3', fileName: 'store_announcement.png', fileUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500', fileSizeMb: 2.4, mimeType: 'image/png', createdAt: '2026-07-25', type: 'IMAGE' }
];

export const MediaLibrary: React.FC = () => {
  const [mediaList, setMediaList] = useState<MediaItem[]>(INITIAL_MEDIA);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');

  // Storage Stats Calculation
  const totalStorageMb = 5000;
  const usedStorageMb = mediaList.reduce((acc, item) => acc + item.fileSizeMb, 0) + 2100; // include existing S3 usage
  const usedPercentage = Math.round((usedStorageMb / totalStorageMb) * 100);

  // Search & Pagination Filter
  const filteredMedia = mediaList.filter(item => 
    item.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          
          const newMedia: MediaItem = {
            id: Date.now().toString(),
            fileName: file.name,
            fileUrl: file.type.startsWith('video') 
              ? 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=500'
              : URL.createObjectURL(file),
            fileSizeMb: Number((file.size / (1024 * 1024)).toFixed(1)) || 1.5,
            mimeType: file.type || 'image/jpeg',
            createdAt: new Date().toISOString().split('T')[0],
            type: file.type.startsWith('video') ? 'VIDEO' : 'IMAGE'
          };
          setMediaList(prevList => [newMedia, ...prevList]);
          return 0;
        }
        return prev + 30;
      });
    }, 300);
  };

  const handleDelete = (id: string) => {
    setMediaList(prev => prev.filter(m => m.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  const handleRename = (id: string) => {
    if (!newFileName.trim()) return;
    setMediaList(prev => prev.map(m => m.id === id ? { ...m, fileName: newFileName } : m));
    setEditingId(null);
    setNewFileName('');
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
            <span>S3 Media Storage</span>
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
            onChange={handleSimulatedUpload} 
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

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-emerald-500/30 space-y-2 animate-pulse">
          <div className="flex justify-between text-xs font-medium text-white">
            <span>Uploading asset to S3 Storage...</span>
            <span className="text-emerald-400">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      )}

      {/* Media Grid Display */}
      {filteredMedia.length === 0 ? (
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
                <img 
                  src={item.fileUrl} 
                  alt={item.fileName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-zinc-950/80 backdrop-blur-md text-zinc-300 text-[10px] font-mono border border-zinc-800">
                  {item.type}
                </span>
                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-zinc-950/80 backdrop-blur-md text-zinc-300 text-[10px]">
                  {item.fileSizeMb} MB
                </span>
              </div>

              {/* Item Info & Actions */}
              <div className="p-4 space-y-3">
                {editingId === item.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-xs text-white"
                      placeholder={item.fileName}
                    />
                    <button 
                      onClick={() => handleRename(item.id)}
                      className="px-2 py-1 bg-emerald-500 text-zinc-950 font-bold text-xs rounded"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-white truncate" title={item.fileName}>{item.fileName}</div>
                    <button 
                      onClick={() => { setEditingId(item.id); setNewFileName(item.fileName); }}
                      className="text-zinc-500 hover:text-zinc-300 text-xs"
                    >
                      ✏️
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/60">
                  <span>Uploaded {item.createdAt}</span>
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
              <img src={selectedItem.fileUrl} alt={selectedItem.fileName} className="max-h-full object-contain" />
            </div>

            <div className="flex justify-between items-center text-xs text-zinc-400">
              <div>Type: <span className="text-white font-medium">{selectedItem.mimeType}</span></div>
              <div>Size: <span className="text-white font-medium">{selectedItem.fileSizeMb} MB</span></div>
              <div>Date: <span className="text-white font-medium">{selectedItem.createdAt}</span></div>
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
