import { evaluate } from "./client";
import { CHECKOUT_QUESTIONS } from "./policy";
import type { CheckoutState, SystemOneResponse } from "./types";

export async function evaluateCheckout(state: CheckoutState): Promise<SystemOneResponse> {
  return evaluate(state, CHECKOUT_QUESTIONS);
}
