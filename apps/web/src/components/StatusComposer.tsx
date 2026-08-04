import React, { useEffect, useState } from 'react';
import { ApiError, type MediaFile, type RecurrenceType, type RecurringSeries } from '@statusflow/api-client';
import { apiClient } from '../lib/apiClient';
import { FreeQuotaModal } from './modals/FreeQuotaModal';

const EMOJIS = ['🔥', '🎉', '🚀', '😍', '✨', '💯', '🛒', '📅', '💬', '⭐'];
const TEXT_BG_COLORS = ['#007a5a', '#128C7E', '#5c1b9b', '#9b1b30', '#1b439b', '#333333'];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const INTERVAL_PRESETS = [
  { label: 'Daily', days: 1 },
  { label: 'Every 3 days', days: 3 },
  { label: 'Weekly', days: 7 },
  { label: 'Every 2 weeks', days: 14 },
];

interface StatusComposerProps {
  onNavigateToBilling?: () => void;
}

export const StatusComposer: React.FC<StatusComposerProps> = ({ onNavigateToBilling }) => {
  const [statusType, setStatusType] = useState<'TEXT' | 'IMAGE' | 'VIDEO'>('IMAGE');
  const [caption, setCaption] = useState('');
  const [bgColor, setBgColor] = useState('#128C7E');
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);
  const [checkingQuota, setCheckingQuota] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState<MediaFile[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [postMode, setPostMode] = useState<'ONCE' | 'RECURRING'>('ONCE');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('INTERVAL');
  const [intervalDays, setIntervalDays] = useState(1);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [recurStartAt, setRecurStartAt] = useState('');
  const [recurEndAt, setRecurEndAt] = useState('');
  const [activeSeries, setActiveSeries] = useState<RecurringSeries[]>([]);

  const refreshSeries = () => {
    apiClient.listRecurringSeries().then(({ series }) => setActiveSeries(series.filter(s => s.status === 'ACTIVE'))).catch(() => {});
  };

  useEffect(() => {
    apiClient.listMedia().then(({ media }) => setMediaLibrary(media ?? [])).catch(() => setMediaLibrary([]));
    refreshSeries();
  }, []);

  const selectedMedia = mediaLibrary.find(m => m.fileUrl === selectedMediaUrl);
  const selectedIsVideo = selectedMedia?.mimeType.startsWith('video') ?? false;

  const handleUploadInModal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      const { media } = await apiClient.uploadMedia(file);
      setMediaLibrary(prev => [media, ...prev]);
      setSelectedMediaUrl(media.fileUrl);
      setShowMediaModal(false);
    } catch (err) {
      setSaveStatusMessage(err instanceof ApiError ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setCaption(prev => prev + emoji);
  };

  const handleSaveDraft = () => {
    // There's no draft-persistence endpoint yet — POST /posts requires a future scheduledAt
    // and always enqueues a publish job, so a draft can't actually be saved server-side.
    // Say so rather than claiming success for something that didn't happen.
    setSaveStatusMessage("Draft saving isn't available yet — schedule the post below to save it, or finish composing before navigating away.");
    setTimeout(() => setSaveStatusMessage(null), 4000);
  };

  const submitOnce = async (scheduledAtIso: string, successMessage: string) => {
    await apiClient.createStatusPost({
      mediaType: statusType,
      caption: caption || undefined,
      mediaUrl: statusType !== 'TEXT' ? selectedMediaUrl ?? undefined : undefined,
      mediaFileId: statusType !== 'TEXT' ? selectedMedia?.id : undefined,
      scheduledAt: scheduledAtIso,
    });
    setScheduledTime('');
    setCaption('');
    setSaveStatusMessage(successMessage);
    setTimeout(() => setSaveStatusMessage(null), 3000);
  };

  const validateMediaAndRecurrence = (): boolean => {
    if (statusType !== 'TEXT' && !selectedMediaUrl) {
      setSaveStatusMessage('Select or upload a media asset first.');
      setTimeout(() => setSaveStatusMessage(null), 3000);
      return false;
    }
    if (postMode === 'RECURRING' && recurrenceType === 'WEEKDAYS' && weekdays.length === 0) {
      setSaveStatusMessage('Pick at least one weekday for the series to repeat on.');
      setTimeout(() => setSaveStatusMessage(null), 3000);
      return false;
    }
    return true;
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMediaAndRecurrence()) return;

    setCheckingQuota(true);
    try {
      if (postMode === 'ONCE') {
        await submitOnce(new Date(scheduledTime).toISOString(), 'Status scheduled successfully and added to queue!');
      } else {
        await apiClient.createRecurringSeries({
          mediaType: statusType,
          caption: caption || undefined,
          mediaUrl: statusType !== 'TEXT' ? selectedMediaUrl ?? undefined : undefined,
          mediaFileId: statusType !== 'TEXT' ? selectedMedia?.id : undefined,
          recurrenceType,
          intervalDays: recurrenceType === 'INTERVAL' ? intervalDays : undefined,
          weekdays: recurrenceType === 'WEEKDAYS' ? weekdays : undefined,
          startAt: new Date(recurStartAt).toISOString(),
          endAt: new Date(recurEndAt).toISOString(),
        });
        setRecurStartAt('');
        setRecurEndAt('');
        setWeekdays([]);
        setCaption('');
        setSaveStatusMessage('Recurring series created — upcoming posts will appear as they\'re scheduled.');
        setTimeout(() => setSaveStatusMessage(null), 3000);
        refreshSeries();
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setShowQuotaModal(true);
      } else {
        setSaveStatusMessage(err instanceof ApiError ? err.message : 'Could not schedule status right now. Please try again.');
        setTimeout(() => setSaveStatusMessage(null), 3000);
      }
    } finally {
      setCheckingQuota(false);
    }
  };

  const handlePostNow = async () => {
    if (!validateMediaAndRecurrence()) return;
    setCheckingQuota(true);
    try {
      // A few seconds out, not literally "now" — the API rejects a scheduledAt that isn't
      // strictly in the future, and this comfortably clears normal request latency too.
      await submitOnce(new Date(Date.now() + 5_000).toISOString(), 'Posting now — it\'ll go out within a few seconds.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setShowQuotaModal(true);
      } else {
        setSaveStatusMessage(err instanceof ApiError ? err.message : 'Could not post right now. Please try again.');
        setTimeout(() => setSaveStatusMessage(null), 3000);
      }
    } finally {
      setCheckingQuota(false);
    }
  };

  const toggleWeekday = (day: number) => {
    setWeekdays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()));
  };

  const handleCancelSeries = async (id: string) => {
    try {
      await apiClient.cancelRecurringSeries(id);
      refreshSeries();
    } catch (err) {
      setSaveStatusMessage(err instanceof ApiError ? err.message : 'Could not cancel this series. Please try again.');
      setTimeout(() => setSaveStatusMessage(null), 3000);
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
          {/* One-time vs Recurring Mode Toggle */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Posting Mode</label>
            <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              {(['ONCE', 'RECURRING'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPostMode(mode)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    postMode === mode ? 'bg-emerald-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {mode === 'ONCE' ? '1️⃣ One-time' : '🔁 Recurring'}
                </button>
              ))}
            </div>
          </div>

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
                {selectedMediaUrl ? (
                  selectedIsVideo ? (
                    <video src={selectedMediaUrl} muted preload="metadata" className="w-16 h-16 object-cover rounded-lg border border-zinc-800" />
                  ) : (
                    <img src={selectedMediaUrl} alt="Selected Media" className="w-16 h-16 object-cover rounded-lg border border-zinc-800" />
                  )
                ) : (
                  <div className="w-16 h-16 rounded-lg border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 text-xs">None</div>
                )}
                <div className="space-y-1">
                  <div className="text-xs font-medium text-white">{selectedMediaUrl ? 'Attached Asset' : 'No asset selected'}</div>
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

          {postMode === 'ONCE' ? (
            /* Scheduled Time Input */
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
          ) : (
            <div className="space-y-4">
              {/* Recurrence Type */}
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Repeats</label>
                <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                  {(['INTERVAL', 'WEEKDAYS'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRecurrenceType(type)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                        recurrenceType === type ? 'bg-emerald-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {type === 'INTERVAL' ? 'Every N days' : 'Specific weekdays'}
                    </button>
                  ))}
                </div>
              </div>

              {recurrenceType === 'INTERVAL' ? (
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Interval</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {INTERVAL_PRESETS.map(preset => (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => setIntervalDays(preset.days)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          intervalDays === preset.days ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400">Every</span>
                    <input
                      type="number"
                      min={1}
                      value={intervalDays}
                      onChange={(e) => setIntervalDays(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-xs text-zinc-400">day{intervalDays === 1 ? '' : 's'}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">On these days</label>
                  <div className="flex gap-2">
                    {WEEKDAY_LABELS.map((label, day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWeekday(day)}
                        className={`w-10 h-10 rounded-lg text-xs font-semibold transition-all ${
                          weekdays.includes(day) ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {label[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Starts</label>
                  <input
                    type="datetime-local"
                    value={recurStartAt}
                    onChange={(e) => setRecurStartAt(e.target.value)}
                    className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">Also sets the time of day every post fires.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Ends</label>
                  <input
                    type="datetime-local"
                    value={recurEndAt}
                    onChange={(e) => setRecurEndAt(e.target.value)}
                    className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex gap-3">
            {postMode === 'ONCE' && (
              <button
                type="button"
                onClick={handlePostNow}
                disabled={checkingQuota}
                className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-semibold text-white text-sm rounded-xl transition-all disabled:opacity-60"
              >
                {checkingQuota ? 'Working...' : '⚡ Post Now'}
              </button>
            )}
            <button
              type="submit"
              disabled={checkingQuota}
              className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 font-semibold text-zinc-950 text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60"
            >
              {checkingQuota
                ? 'Checking your plan...'
                : postMode === 'ONCE'
                ? '🚀 Schedule Status Post'
                : '🔁 Create Recurring Series'}
            </button>
          </div>
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
              {statusType !== 'TEXT' && selectedMediaUrl && (
                selectedIsVideo ? (
                  <video
                    src={selectedMediaUrl}
                    muted
                    loop
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                  />
                ) : (
                  <img
                    src={selectedMediaUrl}
                    alt="Status Preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                  />
                )
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

      {/* Active Recurring Series */}
      {activeSeries.length > 0 && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h3 className="font-bold text-base text-white">Active Recurring Series</h3>
          <div className="space-y-3">
            {activeSeries.map((series) => (
              <div key={series.id} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                    {series.mediaType}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-white truncate max-w-md">{series.caption || '(no caption)'}</div>
                    <div className="text-xs text-zinc-400 mt-1">
                      {series.recurrenceType === 'INTERVAL'
                        ? `Every ${series.intervalDays} day${series.intervalDays === 1 ? '' : 's'}`
                        : `On ${(series.weekdays ?? []).map(d => WEEKDAY_LABELS[d]).join(', ')}`}
                      {' · '}
                      {new Date(series.startAt).toLocaleDateString()} → {new Date(series.endAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCancelSeries(series.id)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/10 hover:text-red-400 text-zinc-300 text-xs font-medium border border-zinc-700 transition-all self-start sm:self-auto"
                >
                  Cancel Series
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media Library Selector Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-white">Select Asset from Media Library</h3>
              <button onClick={() => setShowMediaModal(false)} className="text-zinc-400 hover:text-white text-lg">×</button>
            </div>

            <label className="w-full px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2">
              {uploadingMedia ? 'Uploading...' : '📤 Upload New Asset'}
              <input type="file" accept="image/*,video/*" onChange={handleUploadInModal} disabled={uploadingMedia} className="hidden" />
            </label>

            {mediaLibrary.length === 0 ? (
              <div className="text-xs text-zinc-500 text-center py-6">
                Your media library is empty — upload an asset above to attach it.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                {mediaLibrary.map((item) => (
                  item.mimeType.startsWith('video') ? (
                    <video
                      key={item.id}
                      src={item.fileUrl}
                      title={item.fileName}
                      muted
                      preload="metadata"
                      onClick={() => { setSelectedMediaUrl(item.fileUrl); setShowMediaModal(false); }}
                      className="w-full h-24 object-cover rounded-xl border border-zinc-800 hover:border-emerald-500 cursor-pointer transition-all"
                    />
                  ) : (
                    <img
                      key={item.id}
                      src={item.fileUrl}
                      alt={item.fileName}
                      title={item.fileName}
                      onClick={() => { setSelectedMediaUrl(item.fileUrl); setShowMediaModal(false); }}
                      className="w-full h-24 object-cover rounded-xl border border-zinc-800 hover:border-emerald-500 cursor-pointer transition-all"
                    />
                  )
                ))}
              </div>
            )}
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
