import { customFetch } from "@workspace/api-client-react";

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  phone: string;
  email: string;
  state: string;
  category: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  user?: { id: string; phone: string; email?: string; role: string; isActive: boolean };
  profile?: { firstName: string; lastName: string; businessName?: string; state: string; country: string };
}

interface Enterprise {
  id: string;
  userId: string;
  companyName: string;
  cacRegNumber: string;
  nepcLicenseNumber: string;
  companyType: string;
  state: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user?: { id: string; phone: string; email?: string; role: string; isActive: boolean };
  profile?: { firstName: string; lastName: string; businessName?: string; state: string; country: string };
}

interface Order {
  id: string;
  buyer: { id: string; name: string; phone: string };
  vendor: { id: string; name: string; phone: string };
  commodity: string;
  quantity: number;
  unit: string;
  total: number;
  currency: string;
  status: string;
  date: string;
  platform: string;
  escrowRef: string;
  timeline: { event: string; date: string; completed: boolean }[];
}

interface PaymentTransaction {
  reference: string;
  userId: string;
  type: string;
  amount: number;
  currency: string;
  provider: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  createdAt: string;
  user?: { id: string; phone: string; businessName?: string };
}

interface PendingPayout {
  id: string;
  vendor: { id: string; businessName: string };
  amount: number;
  currency: string;
  bankName: string;
  accountNumber: string;
  status: string;
  createdAt: string;
}

export const adminApi = {
  vendors: {
    list: (params?: { approvalStatus?: string; page?: number; limit?: number }) =>
      customFetch<PaginatedResponse<Vendor>>(`/api/v1/admin/vendors?${new URLSearchParams(params as Record<string, string>).toString()}`),

    approve: (id: string) =>
      customFetch<{ message: string }>(`/api/v1/admin/vendors/${id}/approve`, { method: "PATCH" }),

    reject: (id: string, reason: string) =>
      customFetch<Vendor>(`/api/v1/admin/vendors/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      }),
  },

  enterprises: {
    list: (params?: { approvalStatus?: string; page?: number; limit?: number }) =>
      customFetch<PaginatedResponse<Enterprise>>(`/api/v1/admin/enterprises?${new URLSearchParams(params as Record<string, string>).toString()}`),

    approve: (id: string) =>
      customFetch<{ message: string }>(`/api/v1/admin/enterprises/${id}/approve`, { method: "PATCH" }),

    reject: (id: string, reason: string) =>
      customFetch<Enterprise>(`/api/v1/admin/enterprises/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      }),
  },

  orders: {
    list: (params?: { status?: string; page?: number; limit?: number }) =>
      customFetch<PaginatedResponse<Order>>(`/api/v1/admin/orders?${new URLSearchParams(params as Record<string, string>).toString()}`),

    get: (id: string) =>
      customFetch<Order>(`/api/v1/admin/orders/${id}`),

    updateStatus: (id: string, status: string) =>
      customFetch<{ message: string }>(`/api/v1/admin/orders/seed/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),

    resolveDispute: (escrowId: string, body: { decision: string; notes: string }) =>
      customFetch<{ message: string }>(`/api/v1/admin/escrow/${escrowId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  },

  payments: {
    list: (params?: { status?: string; type?: string; provider?: string; page?: number; limit?: number }) =>
      customFetch<PaginatedResponse<PaymentTransaction>>(`/api/v1/admin/payments?${new URLSearchParams(params as Record<string, string>).toString()}`),

    pendingPayouts: (params?: { page?: number; limit?: number }) =>
      customFetch<PaginatedResponse<PendingPayout>>(`/api/v1/admin/payments/pending-payouts?${new URLSearchParams(params as Record<string, string>).toString()}`),
  },
};
