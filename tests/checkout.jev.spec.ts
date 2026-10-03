import { expect, test, type Page } from "@playwright/test";
import { captureCheckout } from "../src/capture";
import { evaluateCheckout } from "../src/jev/checkout";
import { formatRun, releaseVerdict } from "../src/jev/verdict";
import type { Verdict } from "../src/jev/types";

async function judgeCheckout(page: Page, email: string, card: string): Promise<Verdict> {
  await page.goto("/");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Final do cartão").fill(card);
  await page.getByRole("button", { name: "Pagar" }).click();

  const state = await captureCheckout(page);
  const response = await evaluateCheckout(state);
  const verdict = releaseVerdict(response.answers);
  const report = formatRun(response, verdict);

  console.log(`\n${report}\n`);
  await test.info().attach("jev-verdict.txt", {
    body: Buffer.from(report),
    contentType: "text/plain",
  });
  await test.info().attach("jev-response.json", {
    body: Buffer.from(JSON.stringify({ state, response }, null, 2)),
    contentType: "application/json",
  });

  return verdict;
}

function gate(verdict: Verdict, id: string) {
  const found = verdict.gates.find((item) => item.id === id);
  expect(found, `gate ${id}`).toBeDefined();
  return found!;
}

test.describe("checkout julgado pelo Jev", () => {
  test("pagamento confirmado passa em Noul, Choice e Score", async ({ page }) => {
    const verdict = await judgeCheckout(page, "ana@example.com", "4242");

    expect(gate(verdict, "payment_confirmed").outcome).toBe("pass");
    expect(gate(verdict, "outcome").detail.choice).toBe("success");
    expect(gate(verdict, "outcome").outcome).toBe("pass");
    expect(gate(verdict, "confirmation_quality").outcome).toBe("pass");
    expect(verdict.passed, verdict.summary).toBe(true);
  });

  test("e-mail inválido reprova nos três tipos", async ({ page }) => {
    const verdict = await judgeCheckout(page, "ana", "4242");

    expect(gate(verdict, "payment_confirmed").outcome).toBe("fail");
    expect(gate(verdict, "outcome").detail.choice).toBe("validation_error");
    expect(gate(verdict, "outcome").passed).toBe(false);
    expect(gate(verdict, "confirmation_quality").passed).toBe(false);
    expect((gate(verdict, "confirmation_quality").detail.score ?? 0) < 2).toBe(true);
    expect(verdict.passed, verdict.summary).toBe(false);
  });

  test("pagamento pendente não libera", async ({ page }) => {
    const verdict = await judgeCheckout(page, "ana@example.com", "0000");

    expect(gate(verdict, "payment_confirmed").outcome).toBe("uncertain");
    expect(gate(verdict, "outcome").detail.choice).toBe("pending");
    expect(gate(verdict, "outcome").passed).toBe(false);
    expect((gate(verdict, "confirmation_quality").detail.score ?? 99) < 2).toBe(true);
    expect(verdict.passed, verdict.summary).toBe(false);
  });
});
