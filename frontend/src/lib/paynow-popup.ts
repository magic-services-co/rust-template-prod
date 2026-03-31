import { backendApi } from "@/lib/api";
import { getAuthToken } from "@/lib/laravel-auth";

/**
 * Utility function to open PayNow.js checkout popup
 * @param checkoutUrl - The checkout URL from PayNow
 * @param productIds - Optional array of product IDs being purchased (for role assignment)
 * @param checkoutToken - Optional token from API (avoids parsing URL)
 */
export function openPayNowPopup(checkoutUrl: string, productIds?: string[], checkoutToken?: string): void {
  if (typeof window === "undefined") {
    console.error("PayNow popup can only be opened in the browser");
    return;
  }

  const PayNow = (window as unknown as { PayNow?: { checkout?: { on: (event: string, fn: (e?: unknown) => void) => void; open: (opts: { token: string }) => void; close: () => void } } }).PayNow;

  if (!PayNow?.checkout) {
    console.warn("PayNow.js checkout not loaded; redirecting to URL.");
    window.location.href = checkoutUrl;
    return;
  }

  try {
    const url = new URL(checkoutUrl);
    const token = checkoutToken ?? url.searchParams.get("t");

    if (!token) {
      console.error("No token found in checkout URL");
      window.location.href = checkoutUrl;
      return;
    }

    PayNow.checkout.on("completed", async (event: unknown) => {
      console.log("Payment successful!", event);
      PayNow.checkout!.close();

      if (productIds && productIds.length > 0) {
        try {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          const authToken = getAuthToken();
          if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
          const response = await fetch(backendApi("store/assign-purchase-roles"), {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify({ productIds }),
          });
          if (!response.ok) {
            console.error("Failed to assign purchase roles:", await response.text());
          } else {
            console.log("Purchase roles assigned successfully");
          }
        } catch (error) {
          console.error("Error assigning purchase roles:", error);
        }
      }

      const returnUrl = url.searchParams.get("return_url");
      if (returnUrl) {
        try {
          window.location.href = decodeURIComponent(returnUrl);
        } catch {
          window.location.href = "/store?success=true";
        }
      } else {
        window.location.href = "/store?success=true";
      }
    });

    PayNow.checkout.on("ready", () => {
      console.log("Checkout loaded and ready");
    });

    PayNow.checkout.on("closed", () => {
      console.log("User closed the checkout");
    });

    PayNow.checkout.open({ token });
  } catch (error) {
    console.error("Error opening PayNow popup:", error);
    window.location.href = checkoutUrl;
  }
}
