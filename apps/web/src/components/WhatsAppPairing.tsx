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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not request a pairing code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try { await apiClient.disconnectWhatsApp(); } finally { setIsConnected(false); setSessionId(null); }
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
            <label className="text-xs font-medium text-zinc-400">WhatsApp Phone Number (with Country Code)
              <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full mt-1.5 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm" placeholder="+2348123456789" required />
            </label>
            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-500 font-semibold text-zinc-950 text-sm rounded-xl">{loading ? 'Requesting Code...' : 'Request 8-Digit Pairing Code'}</button>
          </form> : method === 'PAIRING_CODE' ? <div className="text-center space-y-4 py-4">
            <div className="text-xs text-zinc-400">Open WhatsApp → Linked Devices → Link with Phone Number</div>
            <div className="p-6 rounded-2xl bg-zinc-950 border border-emerald-500/30 text-3xl font-mono tracking-widest text-emerald-400 font-bold">{pairingCode}</div>
            <div className="text-xs text-amber-400">Waiting for WhatsApp to confirm the pairing...</div>
          </div> : !qrCode ? <form onSubmit={handleGenerateCode} className="space-y-4"><button type="submit" disabled={loading} className="w-full py-3 bg-emerald-500 font-semibold text-zinc-950 text-sm rounded-xl">{loading ? 'Generating QR Code...' : 'Generate Real WhatsApp QR Code'}</button></form> : <div className="text-center space-y-4 py-4"><div className="text-xs text-zinc-400">Open WhatsApp → Linked Devices → Link a device, then scan this QR code.</div><img src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrCode)}`} alt="WhatsApp pairing QR code" className="w-60 h-60 mx-auto bg-white p-2 rounded-xl" /><div className="text-xs text-amber-400">Waiting for WhatsApp to confirm the pairing...</div></div>}
        </div>}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2"><div className="text-xs font-semibold text-zinc-400">Live Socket Event Logs</div><div className="font-mono text-[11px] text-zinc-500">INFO: Baileys WebSocket instance ready.</div>{isConnected && <div className="font-mono text-[11px] text-emerald-400">SUCCESS: Socket connected (state: CONNECTED)</div>}</div>
      </div>
    </div>
  );
};
