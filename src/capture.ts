import type { Page } from "@playwright/test";
import type { CheckoutState } from "./jev/types";

export async function captureCheckout(page: Page): Promise<CheckoutState> {
  return page.locator("main").evaluate((main) => {
    const read = (id: string) => {
      const element = main.querySelector(`#${id}`);
      if (!(element instanceof HTMLElement) || element.hidden) return "";
      return (element.textContent ?? "").replace(/\s+/g, " ").trim();
    };

    const alertText = read("alert");
    const receipt = read("receipt");
    const visibleText = main instanceof HTMLElement ? main.innerText : "";

    return {
      heading: read("heading"),
      status: read("status"),
      alerts: alertText ? [alertText] : [],
      receipt: receipt || null,
      visibleText: visibleText.replace(/\s+/g, " ").trim(),
    };
  });
}
