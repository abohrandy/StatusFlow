export interface ApiClientOptions {
  baseUrl?: string;
  /** Supplies the current Supabase session's access token, if any. Injected by the
   * consuming app (web/mobile) so this package never depends on a specific auth client. */
  getAuthToken?: () => Promise<string | null | undefined>;
}

export interface StatusPost {
  id: string;
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO';
  caption: string | null;
  mediaUrl: string | null;
  scheduledAt: string;
  status: 'DRAFT' | 'SCHEDULED' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  errorMessage: string | null;
  createdAt: string;
}

export interface CreateStatusPostInput {
  mediaType: StatusPost['mediaType'];
  scheduledAt: string;
  caption?: string;
  mediaUrl?: string;
}

export interface MediaFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
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

  /** Like `request`, but for multipart bodies — omits the JSON Content-Type so `fetch` can set its own boundary. */
  private async requestFormData<T>(path: string, formData: FormData, init: RequestInit = {}): Promise<T> {
    const token = await this.getAuthToken?.();
    const headers: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${this.baseUrl}${path}`, { ...init, method: init.method ?? 'POST', headers, body: formData });
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

  // --- Posts ---------------------------------------------------------------

  createStatusPost(payload: CreateStatusPostInput) {
    return this.request<{ post: StatusPost }>('/posts', { method: 'POST', body: JSON.stringify(payload) });
  }

  listScheduledPosts() {
    return this.request<{ posts: StatusPost[] }>('/posts');
  }

  listPostHistory() {
    return this.request<{ posts: StatusPost[] }>('/posts/history');
  }

  /** Only succeeds while the post is still DRAFT/SCHEDULED/QUEUED — throws `ApiError` (404) once it's sending or resolved. */
  cancelStatusPost(id: string) {
    return this.request<{ post: StatusPost }>(`/posts/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
  }

  // --- Media ---------------------------------------------------------------

  uploadMedia(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.requestFormData<{ media: MediaFile }>('/media', formData);
  }

  listMedia() {
    return this.request<{ media: MediaFile[] }>('/media');
  }

  deleteMedia(id: string) {
    return this.request<{ ok: boolean }>(`/media/${encodeURIComponent(id)}`, { method: 'DELETE' });
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

  adminListUsers() {
    return this.request<{ users: Array<{
      id: string;
      email: string;
      role: string;
      plan: string;
      sessions: number;
      postsCount: number;
      status: string;
    }> }>('/admin/users');
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

  // --- WhatsApp ---------------------------------------------------------------

  whatsappStatus() {
    return this.request<{ connected: boolean; status: string; phoneNumber: string | null; lastActive: string | null; sessionId: string | null }>('/whatsapp/status');
  }

  /** Throws `ApiError` (status 403) with a Free-trial-abuse or account-limit message if blocked. */
  requestWhatsAppPairing(phoneNumber: string, method: 'PAIRING_CODE' | 'QR_CODE' = 'PAIRING_CODE') {
    return this.request<{ sessionId: string; pairingCode?: string; qrCode?: string }>('/whatsapp/pairing/request', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, method }),
    });
  }

  confirmWhatsAppPairing(sessionId: string) {
    return this.request<{ connected: boolean; phoneNumber: string | null }>('/whatsapp/pairing/confirm', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  disconnectWhatsApp() {
    return this.request<{ ok: boolean }>('/whatsapp/disconnect', { method: 'POST' });
  }

  // --- Profile ---------------------------------------------------------------

  getProfile() {
    return this.request<{ onboarded: boolean; fullName: string | null; companyName: string | null }>('/profile');
  }

  saveProfile(fullName: string, companyName: string) {
    return this.request<{ fullName: string; companyName: string }>('/profile', {
      method: 'PUT',
      body: JSON.stringify({ fullName, companyName }),
    });
  }
}
