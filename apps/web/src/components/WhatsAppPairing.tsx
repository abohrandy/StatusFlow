import React, { useState } from 'react';

export const WhatsAppPairing: React.FC = () => {
  const [method, setMethod] = useState<'PAIRING_CODE' | 'QR_CODE'>('PAIRING_CODE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerateCode = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setPairingCode('87B9-4K21');
      setLoading(false);
    }, 600);
  };

  const handleSimulatePair = () => {
    setIsConnected(true);
    setPairingCode(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">WhatsApp Account Integration</h2>
        <p className="text-sm text-zinc-400">Connect your WhatsApp account using Baileys multi-device pairing protocol.</p>
      </div>

      {/* Main Status Container */}
      <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
        {/* Status Indicator */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <div>
              <div className="text-xs text-zinc-400 font-medium">Socket Connection State</div>
              <div className="text-sm font-semibold text-white">{isConnected ? 'CONNECTED (+234 812 345 6789)' : 'WAITING FOR PAIRING'}</div>
            </div>
          </div>
          {isConnected && (
            <button 
              onClick={() => setIsConnected(false)}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-all"
            >
              Disconnect Session
            </button>
          )}
        </div>

        {!isConnected && (
          <>
            {/* Pairing Method Selector */}
            <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button
                onClick={() => { setMethod('PAIRING_CODE'); setPairingCode(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  method === 'PAIRING_CODE' ? 'bg-emerald-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                1. Phone Pairing Code (Recommended)
              </button>
              <button
                onClick={() => { setMethod('QR_CODE'); setPairingCode(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  method === 'QR_CODE' ? 'bg-emerald-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                2. QR Code Fallback
              </button>
            </div>

            {/* Method 1: Pairing Code */}
            {method === 'PAIRING_CODE' && (
              <div className="space-y-6">
                {!pairingCode ? (
                  <form onSubmit={handleGenerateCode} className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-zinc-400">WhatsApp Phone Number (with Country Code)</label>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full mt-1.5 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
                        placeholder="+2348123456789"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 font-semibold text-zinc-950 text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {loading ? 'Requesting Code...' : 'Request 8-Digit Pairing Code'}
                    </button>
                  </form>
                ) : (
                  <div className="text-center space-y-4 py-4">
                    <div className="text-xs text-zinc-400">Open WhatsApp on your phone → Linked Devices → Link with Phone Number</div>
                    <div className="p-6 rounded-2xl bg-zinc-950 border border-emerald-500/30 text-3xl font-mono tracking-widest text-emerald-400 font-bold">
                      {pairingCode}
                    </div>
                    <button
                      onClick={handleSimulatePair}
                      className="px-6 py-2.5 bg-emerald-500 text-zinc-950 font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                    >
                      Simulate Pairing Complete
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Method 2: QR Code Fallback */}
            {method === 'QR_CODE' && (
              <div className="text-center space-y-4 py-4">
                <div className="text-xs text-zinc-400">Open WhatsApp on your phone → Linked Devices → Scan QR Code</div>
                <div className="w-48 h-48 mx-auto bg-white p-2 rounded-2xl flex items-center justify-center border-4 border-emerald-500/20 shadow-xl">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=STATUSFLOW-MOCK-SESSION"
                    alt="WhatsApp QR Code"
                    className="w-full h-full"
                  />
                </div>
                <button
                  onClick={handleSimulatePair}
                  className="px-6 py-2.5 bg-emerald-500 text-zinc-950 font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                >
                  Simulate QR Scan Complete
                </button>
              </div>
            )}
          </>
        )}

        {/* Live Socket Logs */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
          <div className="text-xs font-semibold text-zinc-400">Live Socket Event Logs</div>
          <div className="font-mono text-[11px] text-zinc-500 space-y-1">
            <div>[09:58:12] INFO: Baileys WebSocket instance started.</div>
            <div>[09:58:14] INFO: Multi-device auth keys loaded from encrypted store.</div>
            {isConnected && <div className="text-emerald-400">[09:58:20] SUCCESS: Socket connected (state: CONNECTED)</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
