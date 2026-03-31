import { backendApi } from "@/lib/api";
import { getAuthToken } from "@/lib/laravel-auth";

export type DashboardStats = {
  totalUsers: number;
  totalLinkedUsers: number;
  totalTickets: number;
  serverCount: number;
};

export type MonthlyGrowth = {
  users: number;
  linkedUsers: number;
  tickets: number;
};

export type TicketStats = {
  month: string;
  total: number;
  avgResponseTime: number;
  categories: { name: string; count: number }[];
};

export type MonthlyStats = {
  month: string;
  newUsers: number;
  discordLinked: number;
  retentionRate: number;
};

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function fetchDashboardData(): Promise<{ stats: DashboardStats; growth: MonthlyGrowth }> {
  const res = await fetch(backendApi("admin/dashboard/stats"), {
    headers: authHeaders(),
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load dashboard stats");
  }
  const data = await res.json();
  return {
    stats: {
      totalUsers: Number(data?.stats?.totalUsers ?? 0),
      totalLinkedUsers: Number(data?.stats?.totalLinkedUsers ?? 0),
      totalTickets: Number(data?.stats?.totalTickets ?? 0),
      serverCount: Number(data?.stats?.serverCount ?? 0),
    },
    growth: {
      users: Number(data?.growth?.users ?? 0),
      linkedUsers: Number(data?.growth?.linkedUsers ?? 0),
      tickets: Number(data?.growth?.tickets ?? 0),
    },
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { stats } = await fetchDashboardData();
  return stats;
}

export async function getMonthlyGrowth(): Promise<MonthlyGrowth> {
  const { growth } = await fetchDashboardData();
  return growth;
}

export async function getTicketStats(): Promise<TicketStats[]> {
  const res = await fetch(backendApi("admin/dashboard/ticket-stats"), {
    headers: authHeaders(),
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load ticket stats");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getMonthlyStats(): Promise<MonthlyStats[]> {
  const res = await fetch(backendApi("admin/dashboard/monthly-stats"), {
    headers: authHeaders(),
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load monthly stats");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
