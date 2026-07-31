export interface ApiClientOptions {
  baseUrl?: string;
  /** Supplies the current Supabase session's access token, if any. Injected by the
   * consuming app (web/mobile) so this package never depends on a specific auth client. */
  getAuthToken?: () => Promise<string | null | undefined>;
}

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export class ApiClient {
  private baseUrl: string;
  private getAuthToken?: () => Promise<string | null | undefined>;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? '/api/v1';
    this.getAuthToken = options.getAuthToken;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.getAuthToken?.();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiError(body?.error || `Request to ${path} failed with status ${res.status}`, res.status, body);
    }
    return body as T;
  }

  getStatus() {
    return this.request<{ status: string }>('/health');
  }

  // --- Billing ---------------------------------------------------------------

  initializeCheckout(planSlug: string) {
    return this.request<{ authorizationUrl: string; reference: string }>('/billing/initialize', {
      method: 'POST',
      body: JSON.stringify({ planSlug }),
    });
  }

  verifyPayment(reference: string) {
    return this.request<{ paystackStatus: string; paymentStatus: string; message: string }>(
      `/billing/verify?reference=${encodeURIComponent(reference)}`,
    );
  }

  getSubscription() {
    return this.request<{ plan: any; subscription: any; smartPrompts: { renewalSavings: boolean; expiryWarning: boolean } }>(
      '/billing/subscription',
    );
  }

  cancelSubscription() {
    return this.request<{ ok: boolean; message: string }>('/billing/cancel', { method: 'POST' });
  }

  getPaymentHistory() {
    return this.request<{ payments: any[] }>('/billing/payments');
  }

  getInvoices() {
    return this.request<{ invoices: any[] }>('/billing/invoices');
  }

  getSubscriptionHistory() {
    return this.request<{ subscriptions: any[] }>('/billing/subscriptions/history');
  }

  /** Resolves `{allowed:true}` or throws `ApiError` (status 403, body carries the subscription error) if the Free plan's quota is exhausted. */
  checkScheduleAllowed() {
    return this.request<{ allowed: true }>('/billing/schedule-check', { method: 'POST' });
  }

  // --- Referrals ---------------------------------------------------------------

  getReferralCode() {
    return this.request<{ code: string }>('/referrals/code');
  }

  inviteReferral(email?: string) {
    return this.request<{ ok: boolean }>('/referrals/invite', { method: 'POST', body: JSON.stringify({ email }) });
  }

  attributeReferral(code: string) {
    return this.request<{ ok: boolean }>('/referrals/attribute', { method: 'POST', body: JSON.stringify({ code }) });
  }

  getReferralDashboard() {
    return this.request<{ code: string; invites: number; conversions: number; rewards: any[]; history: any[] }>(
      '/referrals/dashboard',
    );
  }

  // --- Admin ---------------------------------------------------------------

  adminGetDashboard() {
    return this.request<{
      activeSubscriptions: number;
      weeklyRevenueNaira: number;
      monthlyRevenueNaira: number;
      expiredSubscriptions: number;
      freeUsers: number;
      paidUsers: number;
    }>('/admin/dashboard');
  }

  adminSearchSubscriptions(search = '') {
    return this.request<{ subscriptions: any[] }>(`/admin/subscriptions?search=${encodeURIComponent(search)}`);
  }

  adminGetSubscriptionDetail(id: string) {
    return this.request<{ subscription: any; payments: any[]; invoices: any[]; referralRewards: any[] }>(
      `/admin/subscriptions/${encodeURIComponent(id)}`,
    );
  }

  adminCancelSubscription(id: string) {
    return this.request<{ subscription: any }>(`/admin/subscriptions/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
    });
  }

  adminExtendSubscription(id: string, days: number) {
    return this.request<{ subscription: any }>(`/admin/subscriptions/${encodeURIComponent(id)}/extend`, {
      method: 'POST',
      body: JSON.stringify({ days }),
    });
  }

  adminActivateSubscription(email: string, planSlug: string) {
    return this.request<{ subscription: any }>('/admin/subscriptions/activate', {
      method: 'POST',
      body: JSON.stringify({ email, planSlug }),
    });
  }

  adminListPayments() {
    return this.request<{ payments: any[] }>('/admin/payments');
  }

  adminListInvoices() {
    return this.request<{ invoices: any[] }>('/admin/invoices');
  }

  adminListWebhookLogs() {
    return this.request<{ webhookLogs: any[] }>('/admin/webhook-logs');
  }

  adminListReferralRewards() {
    return this.request<{ referralRewards: any[] }>('/admin/referral-rewards');
  }

  // --- Notifications ---------------------------------------------------------------

  getNotifications() {
    return this.request<{ notifications: any[] }>('/notifications');
  }

  markNotificationRead(id: string) {
    return this.request<{ ok: boolean }>(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
  }

  markAllNotificationsRead() {
    return this.request<{ ok: boolean }>('/notifications/read-all', { method: 'POST' });
  }
}
