import {
  LegalDocumentType,
  IngestionStatus,
  RetrievedCitation,
  RagAnswerResult,
  RagQueryOptions,
  SystemHealthResponse,
} from '@legal-rag/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('legal_rag_token');
}

export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('legal_rag_token', token);
  }
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('legal_rag_token');
    localStorage.removeItem('legal_rag_user');
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiError(
        res.status,
        data.code || 'API_ERROR',
        data.message || `Lỗi máy chủ (${res.status})`,
        data.details,
      );
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, 'NETWORK_ERROR', err.message || 'Không thể kết nối đến máy chủ API');
  }
}

export const api = {
  // Auth
  auth: {
    async login(email: string, password: string) {
      const res = await request<{ accessToken: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(res.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('legal_rag_user', JSON.stringify(res.user));
      }
      return res;
    },
    async getProfile() {
      return request<any>('/auth/me');
    },
    logout() {
      clearToken();
    },
  },

  // Documents
  documents: {
    async list(params: {
      search?: string;
      documentType?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}) {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.documentType) query.set('documentType', params.documentType);
      if (params.status) query.set('status', params.status);
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));

      const qs = query.toString();
      return request<{
        data: any[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>(`/documents${qs ? `?${qs}` : ''}`);
    },

    async getById(id: string) {
      return request<any>(`/documents/${id}`);
    },

    async getStructure(id: string) {
      return request<any>(`/documents/${id}/structure`);
    },

    async getVersions(id: string) {
      return request<any[]>(`/documents/${id}/versions`);
    },

    async uploadFile(formData: FormData) {
      return request<any>('/documents/upload', {
        method: 'POST',
        body: formData,
      });
    },

    async ingestUrl(data: {
      url: string;
      title?: string;
      documentNumber?: string;
      documentType?: LegalDocumentType;
      issuingAuthority?: string;
    }) {
      return request<any>('/documents/url', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async createManual(data: {
      title: string;
      content: string;
      documentNumber?: string;
      documentType: LegalDocumentType;
      issuingAuthority?: string;
      publishedAt?: string;
      effectiveAt?: string;
    }) {
      return request<any>('/documents/text', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async reindex(id: string) {
      return request<any>(`/documents/${id}/reindex`, {
        method: 'POST',
      });
    },

    async delete(id: string) {
      return request<any>(`/documents/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // RAG
  rag: {
    async query(options: {
      question: string;
      topK?: number;
      similarityThreshold?: number;
      documentIds?: string[];
      documentTypes?: LegalDocumentType[];
    }): Promise<RagAnswerResult> {
      return request<RagAnswerResult>('/rag/query', {
        method: 'POST',
        body: JSON.stringify(options),
      });
    },
  },

  // Chat
  chat: {
    async listSessions() {
      return request<any[]>('/chat/sessions');
    },

    async createSession(title?: string) {
      return request<any>('/chat/sessions', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
    },

    async getSession(id: string) {
      return request<any>(`/chat/sessions/${id}`);
    },

    async sendMessage(
      sessionId: string,
      data: {
        content: string;
        topK?: number;
        similarityThreshold?: number;
      },
    ) {
      return request<any>(`/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async deleteSession(sessionId: string) {
      return request<any>(`/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });
    },
  },

  // Health
  health: {
    async get() {
      return request<SystemHealthResponse>('/health');
    },
  },

  // Settings
  settings: {
    async get() {
      return request<any>('/settings');
    },
    async update(data: any) {
      return request<any>('/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  },
};
