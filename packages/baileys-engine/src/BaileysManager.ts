import { EventEmitter } from 'events';

export type SessionState = 'UNINITIALIZED' | 'PAIRING' | 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED';

export interface ConnectionLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export class BaileysManager extends EventEmitter {
  private sessionId: string;
  private state: SessionState = 'UNINITIALIZED';
  private logs: ConnectionLog[] = [];
  private pairingCode: string | null = null;
  private qrCodeUrl: string | null = null;

  constructor(sessionId: string) {
    super();
    this.sessionId = sessionId;
    this.addLog('info', `Initialized Baileys session manager for session ${sessionId}`);
  }

  private addLog(level: 'info' | 'warn' | 'error', message: string) {
    const entry: ConnectionLog = { timestamp: new Date().toISOString(), level, message };
    this.logs.push(entry);
    this.emit('log', entry);
  }

  public async requestPairingCode(phoneNumber: string): Promise<string> {
    this.state = 'PAIRING';
    this.addLog('info', `Requesting 8-digit pairing code for ${phoneNumber}`);
    // Formats generated 8-digit pairing code e.g. "87B9-4K21"
    const mockCode = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    this.pairingCode = mockCode;
    this.emit('pairingCode', mockCode);
    return mockCode;
  }

  public async requestQrCode(): Promise<string> {
    this.state = 'PAIRING';
    this.addLog('info', 'Generating fallback QR Code data string');
    const mockQr = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=STATUSFLOW-PAIRING-SESSION';
    this.qrCodeUrl = mockQr;
    this.emit('qrCode', mockQr);
    return mockQr;
  }

  public simulateConnectionSuccess() {
    this.state = 'CONNECTED';
    this.pairingCode = null;
    this.qrCodeUrl = null;
    this.addLog('info', 'WhatsApp WebSocket connected successfully. Session auth keys encrypted and saved.');
    this.emit('stateChange', this.state);
  }

  public handleDisconnect(reason: string) {
    this.state = 'DISCONNECTED';
    this.addLog('warn', `Socket connection closed: ${reason}. Scheduling auto-reconnect in 5s...`);
    this.emit('stateChange', this.state);
  }

  public getStatus() {
    return {
      sessionId: this.sessionId,
      state: this.state,
      pairingCode: this.pairingCode,
      qrCodeUrl: this.qrCodeUrl,
      logs: this.logs
    };
  }
}
