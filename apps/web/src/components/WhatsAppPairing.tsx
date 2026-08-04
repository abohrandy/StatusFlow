import React, { useEffect, useState } from 'react';
import { ApiError } from '@statusflow/api-client';
import { apiClient } from '../lib/apiClient';

export const WhatsAppPairing: React.FC = () => {
  const [method, setMethod] = useState<'PAIRING_CODE' | 'QR_CODE'>('PAIRING_CODE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.whatsappStatus().then((status) => {
      setIsConnected(status.connected);
      if (status.phoneNumber) setPhoneNumber(status.phoneNumber);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!sessionId || isConnected) return;
    const timer = window.setInterval(() => {
      apiClient.whatsappStatus().then((status) => {
        setIsConnected(status.connected);
        if (!status.connected && sessionId) {
          apiClient.confirmWhatsAppPairing(sessionId).then(() => setIsConnected(true)).catch(() => undefined);
        }
        if (status.connected) setPairingCode(null);
      }).catch(() => undefined);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [sessionId, isConnected]);

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.requestWhatsAppPairing(phoneNumber, method);
      setSessionId(result.sessionId);
      setPairingCode(result.pairingCode ?? null);
      setQrCode(result.qrCode ?? null);
      // Copied immediately — WhatsApp's own code expiry is short, and pasting is faster
      // and less error-prone than reading and typing 8 characters under time pressure.
      if (result.pairingCode) navigator.clipboard?.writeText(result.pairingCode).catch(() => {});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not request a pairing code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try { await apiClient.disconnectWhatsApp(); } finally { setIsConnected(false); setSessionId(null); }
  };

  // A stuck PAIRING session (e.g. an abandoned pairing attempt) still counts against the
  // plan's connected-account limit even though nothing ever actually connected, and there's
  // no Disconnect button in this not-yet-connected state to clear it. disconnectWhatsApp()
  // clears every PAIRING/CONNECTED row for the account, not just "the latest one", so it's
  // safe to call here too.
  const [resetting, setResetting] = useState(false);
  const handleResetStuckSession = async () => {
    setResetting(true);
    try {
      await apiClient.disconnectWhatsApp();
      setSessionId(null);
      setPairingCode(null);
      setQrCode(null);
      setError(null);
    } catch {
      setError('Could not reset the stuck connection. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">WhatsApp Integration</h2>
        <p className="text-sm text-zinc-400">Connect your single WhatsApp account using Baileys pairing protocol.</p>
      </div>
      <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <div><div className="text-xs text-zinc-400 font-medium">Socket Connection State</div><div className="text-sm font-semibold text-white">{isConnected ? 'CONNECTED' : 'WAITING FOR PAIRING'}</div></div>
          </div>
          {isConnected && <button onClick={handleDisconnect} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium">Disconnect Session</button>}
        </div>
        {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>}
        {!isConnected && <div className="space-y-6">
          <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button type="button" onClick={() => { setMethod('PAIRING_CODE'); setPairingCode(null); setQrCode(null); }} className={`flex-1 py-2 text-xs font-semibold rounded-lg ${method === 'PAIRING_CODE' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400'}`}>Phone Pairing Code</button>
            <button type="button" onClick={() => { setMethod('QR_CODE'); setPairingCode(null); setQrCode(null); }} className={`flex-1 py-2 text-xs font-semibold rounded-lg ${method === 'QR_CODE' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400'}`}>QR Code</button>
          </div>
          {method === 'PAIRING_CODE' && !pairingCode ? <form onSubmit={handleGenerateCode} className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-zinc-400">
              <span className="font-semibold text-emerald-400">Before you request a code: </span>
              WhatsApp's code expires quickly. Open WhatsApp on your phone now and navigate to Settings → Linked Devices →
              Link a Device → Link with Phone Number instead, so you're ready to enter it the instant it appears.
            </div>
            <label className="text-xs font-medium text-zinc-400">WhatsApp Phone Number (with Country Code)
              <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full mt-1.5 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm" placeholder="+234" required />
            </label>
            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-500 font-semibold text-zinc-950 text-sm rounded-xl">{loading ? 'Requesting Code...' : 'Request 8-Digit Pairing Code'}</button>
          </form> : method === 'PAIRING_CODE' ? <div className="text-center space-y-4 py-4">
            <div className="text-xs text-zinc-400">Open WhatsApp → Linked Devices → Link with Phone Number</div>
            <div className="p-6 rounded-2xl bg-zinc-950 border border-emerald-500/30 text-3xl font-mono tracking-widest text-emerald-400 font-bold">{pairingCode}</div>
            <div className="text-xs text-emerald-400">Copied to clipboard — paste it into WhatsApp</div>
            <div className="text-xs text-amber-400">Waiting for WhatsApp to confirm the pairing...</div>
            <div className="text-xs text-zinc-500">Codes expire quickly — if WhatsApp says it couldn't link, get a fresh one below rather than retyping the old one.</div>
            <button type="button" onClick={handleGenerateCode} disabled={loading} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2">{loading ? 'Requesting Code...' : 'Get a new code'}</button>
          </div> : !qrCode ? <form onSubmit={handleGenerateCode} className="space-y-4"><button type="submit" disabled={loading} className="w-full py-3 bg-emerald-500 font-semibold text-zinc-950 text-sm rounded-xl">{loading ? 'Generating QR Code...' : 'Generate Real WhatsApp QR Code'}</button></form> : <div className="text-center space-y-4 py-4"><div className="text-xs text-zinc-400">Open WhatsApp → Linked Devices → Link a device, then scan this QR code.</div><img src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrCode)}`} alt="WhatsApp pairing QR code" className="w-60 h-60 mx-auto bg-white p-2 rounded-xl" /><div className="text-xs text-amber-400">Waiting for WhatsApp to confirm the pairing...</div><button type="button" onClick={handleGenerateCode} disabled={loading} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2">{loading ? 'Generating QR Code...' : 'Get a new QR code'}</button></div>}
        </div>}
        {!isConnected && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleResetStuckSession}
              disabled={resetting}
              className="text-xs font-medium text-red-400 hover:text-red-300 underline underline-offset-2 disabled:opacity-50"
            >
              {resetting ? 'Resetting...' : 'Getting a "connected account limit" error even though nothing\'s connected? Reset a stuck connection.'}
            </button>
          </div>
        )}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2"><div className="text-xs font-semibold text-zinc-400">Live Socket Event Logs</div>{sessionId && <div className="font-mono text-[11px] text-zinc-500">INFO: Baileys WebSocket instance ready.</div>}{isConnected && <div className="font-mono text-[11px] text-emerald-400">SUCCESS: Socket connected (state: CONNECTED)</div>}{!sessionId && !isConnected && <div className="font-mono text-[11px] text-zinc-600">No socket activity yet.</div>}</div>
      </div>
    </div>
  );
};
