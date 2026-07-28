// StatusFlow Privacy-Preserving Aggregate Analytics Service

export type AnalyticsEvent = 
  | 'account_created'
  | 'whatsapp_connected'
  | 'status_scheduled'
  | 'status_published'
  | 'status_failed'
  | 'subscription_purchased'
  | 'subscription_cancelled'
  | 'draft_saved'
  | 'media_uploaded';

interface EventPayload {
  mediaType?: 'TEXT' | 'IMAGE' | 'VIDEO';
  planTier?: 'FREE' | 'WEEKLY' | 'MONTHLY';
  errorReason?: string;
}

class AnalyticsService {
  private isProduction = process.env.NODE_ENV === 'production';

  public track(event: AnalyticsEvent, payload?: EventPayload): void {
    const timestamp = new Date().toISOString();
    
    // Anonymized Aggregate Telemetry Logging
    const telemetryData = {
      event,
      timestamp,
      payload: payload || {},
    };

    if (this.isProduction) {
      // Dispatch to privacy-preserving telemetry collector
      console.log('[StatusFlow Telemetry]:', JSON.stringify(telemetryData));
    } else {
      console.log(`[Analytics Track]: ${event}`, payload || '');
    }
  }
}

export const analytics = new AnalyticsService();
