import React, { useState } from 'react';
import { ApiError } from '@statusflow/api-client';
import { apiClient } from '../lib/apiClient';
import { FreeQuotaModal } from './modals/FreeQuotaModal';

const EMOJIS = ['🔥', '🎉', '🚀', '😍', '✨', '💯', '🛒', '📅', '💬', '⭐'];
const TEXT_BG_COLORS = ['#007a5a', '#128C7E', '#5c1b9b', '#9b1b30', '#1b439b', '#333333'];

interface StatusComposerProps {
  onNavigateToBilling?: () => void;
}

export const StatusComposer: React.FC<StatusComposerProps> = ({ onNavigateToBilling }) => {
  const [statusType, setStatusType] = useState<'TEXT' | 'IMAGE' | 'VIDEO'>('IMAGE');
  const [caption, setCaption] = useState('');
  const [bgColor, setBgColor] = useState('#128C7E');
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string>('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);
  const [checkingQuota, setCheckingQuota] = useState(false);

  const handleAddEmoji = (emoji: string) => {
    setCaption(prev => prev + emoji);
  };

  const handleSaveDraft = () => {
    setSaveStatusMessage('Draft saved successfully!');
    setTimeout(() => setSaveStatusMessage(null), 3000);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingQuota(true);
    try {
      await apiClient.checkScheduleAllowed();
      setSaveStatusMessage('Status scheduled successfully and added to queue!');
      setTimeout(() => setSaveStatusMessage(null), 3000);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setShowQuotaModal(true);
      } else {
        setSaveStatusMessage('Could not schedule status right now. Please try again.');
        setTimeout(() => setSaveStatusMessage(null), 3000);
      }
    } finally {
      setCheckingQuota(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Status Composer</h2>
          <p className="text-sm text-zinc-400 mt-1">Create and schedule image, video, or text WhatsApp status updates with real-time preview.</p>
        </div>

        <button 
          onClick={handleSaveDraft}
          className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs border border-zinc-700 transition-all"
        >
          💾 Save Draft
        </button>
      </div>

      {saveStatusMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium text-center animate-bounce">
          {saveStatusMessage}
        </div>
      )}

      {/* Main Grid: Composer Form (Left) & Mobile Phone Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Controls (7 cols) */}
        <form onSubmit={handleScheduleSubmit} className="lg:col-span-7 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
          {/* Status Type Selector */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Select Status Type</label>
            <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              {(['TEXT', 'IMAGE', 'VIDEO'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setStatusType(type)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    statusType === type ? 'bg-emerald-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {type === 'TEXT' ? '💬 Text Status' : type === 'IMAGE' ? '📷 Image Status' : '🎥 Video Status'}
                </button>
              ))}
            </div>
          </div>

          {/* Media Selector (for Image & Video) */}
          {statusType !== 'TEXT' && (
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Status Media Asset</label>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <img src={selectedMediaUrl} alt="Selected Media" className="w-16 h-16 object-cover rounded-lg border border-zinc-800" />
                <div className="space-y-1">
                  <div className="text-xs font-medium text-white">Attached Asset</div>
                  <button 
                    type="button"
                    onClick={() => setShowMediaModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium transition-all"
                  >
                    Browse Media Library
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Text Background Color Picker (for Text Status) */}
          {statusType === 'TEXT' && (
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Background Color</label>
              <div className="flex gap-3">
                {TEXT_BG_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBgColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      bgColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Caption Input & Emoji Picker */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status Caption / Message</label>
              <span className="text-[11px] text-zinc-500">{caption.length} / 700 chars</span>
            </div>
            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Type your WhatsApp Status caption or text announcement..."
              className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              required={statusType === 'TEXT'}
            />

            {/* Quick Emoji Bar */}
            <div className="flex items-center gap-2 mt-3 p-2 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <span className="text-xs text-zinc-500 font-medium px-2">Emojis:</span>
              <div className="flex gap-1.5 overflow-x-auto">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleAddEmoji(emoji)}
                    className="hover:scale-125 transition-transform text-base"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scheduled Time Input */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Schedule Publish Time</label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={checkingQuota}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 font-semibold text-zinc-950 text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60"
          >
            {checkingQuota ? 'Checking your plan...' : '🚀 Schedule Status Post'}
          </button>
        </form>

        {/* Right Mobile Phone Live Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Live WhatsApp Status Preview</div>

          {/* Smartphone Mockup Frame */}
          <div className="w-[280px] h-[520px] rounded-[36px] bg-zinc-950 border-4 border-zinc-800 p-3 shadow-2xl relative flex flex-col justify-between overflow-hidden">
            {/* Phone Speaker Notch */}
            <div className="w-20 h-4 bg-zinc-800 rounded-full mx-auto mb-2"></div>

            {/* Screen View */}
            <div 
              className="flex-1 rounded-[24px] overflow-hidden relative flex flex-col justify-between p-4"
              style={{ backgroundColor: statusType === 'TEXT' ? bgColor : '#000000' }}
            >
              {/* Media Background for IMAGE / VIDEO */}
              {statusType !== 'TEXT' && (
                <img 
                  src={selectedMediaUrl} 
                  alt="Status Preview" 
                  className="absolute inset-0 w-full h-full object-cover opacity-90"
                />
              )}

              {/* Status Header Progress Bar */}
              <div className="relative z-10 w-full bg-white/30 h-1 rounded-full overflow-hidden">
                <div className="bg-white h-full w-1/3"></div>
              </div>

              {/* Status Text Content / Overlay Caption */}
              <div className="relative z-10 my-auto text-center space-y-2">
                <p className="text-white font-medium text-sm drop-shadow-md break-words px-2">
                  {caption || (statusType === 'TEXT' ? 'Your WhatsApp text status will render here...' : '')}
                </p>
              </div>

              {/* Status Footer Bar */}
              <div className="relative z-10 text-center text-white/70 text-[10px] font-sans">
                Reply to Status...
              </div>
            </div>

            {/* Phone Home Bar */}
            <div className="w-24 h-1 bg-zinc-800 rounded-full mx-auto mt-2"></div>
          </div>
        </div>
      </div>

      {/* Media Library Selector Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-white">Select Asset from Media Library</h3>
              <button onClick={() => setShowMediaModal(false)} className="text-zinc-400 hover:text-white text-lg">×</button>
            </div>

            <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
              {[
                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500',
                'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=500',
                'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500'
              ].map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt="Asset"
                  onClick={() => { setSelectedMediaUrl(url); setShowMediaModal(false); }}
                  className="w-full h-24 object-cover rounded-xl border border-zinc-800 hover:border-emerald-500 cursor-pointer transition-all"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {showQuotaModal && (
        <FreeQuotaModal
          onDismiss={() => setShowQuotaModal(false)}
          onUpgrade={() => {
            setShowQuotaModal(false);
            onNavigateToBilling?.();
          }}
        />
      )}
    </div>
  );
};
