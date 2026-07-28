export type PlanTier = 'STARTER' | 'PRO' | 'AGENCY';

export interface User {
  id: string;
  email: string;
  planTier: PlanTier;
  createdAt: string;
}

export type WhatsAppSessionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';

export interface WhatsAppSession {
  id: string;
  userId: string;
  phoneNumber?: string;
  status: WhatsAppSessionStatus;
  lastActive: string;
}

export type PostStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type MediaType = 'IMAGE' | 'VIDEO' | 'TEXT';

export interface ScheduledPost {
  id: string;
  userId: string;
  sessionId: string;
  mediaUrl?: string;
  mediaType: MediaType;
  caption?: string;
  scheduledAt: string;
  status: PostStatus;
  errorMessage?: string;
}
