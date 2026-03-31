import { backendApi } from "@/lib/api";
import { getAuthToken } from "@/lib/laravel-auth";

export type GiftcardBalance = {
  balance: number;
  starting_balance: number;
  expires_at?: string | null;
};

export type CheckGiftcardResponse = {
  data: GiftcardBalance[];
};

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function checkGiftcard(cardNumber: string): Promise<CheckGiftcardResponse> {
  const res = await fetch(
    backendApi(`store/giftcard/check?card=${encodeURIComponent(cardNumber.trim())}`),
    {
      headers: authHeaders(),
      credentials: "include",
      cache: "no-store",
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "Failed to check gift card");
  }
  return {
    data: Array.isArray(data?.data) ? data.data : [],
  };
}
