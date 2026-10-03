import { expect, test } from "@playwright/test";
import { CHECKOUT_POLICY } from "../src/jev/policy";
import { decideChoice, decideNoul, decideScore } from "../src/jev/verdict";

const noulRule = CHECKOUT_POLICY.paymentConfirmed;
const choiceRule = CHECKOUT_POLICY.outcome;
const scoreRule = CHECKOUT_POLICY.confirmationQuality;

test.describe("Noul — probabilidade de sim", () => {
  test("no limiar de aprovação a decisão passa", () => {
    const gate = decideNoul("payment_confirmed", { type: "noul", noul: noulRule.passAt }, noulRule);
    expect(gate.outcome).toBe("pass");
    expect(gate.passed).toBe(true);
  });

  test("logo abaixo do limiar fica incerto e não libera", () => {
    const gate = decideNoul("payment_confirmed", { type: "noul", noul: 0.799 }, noulRule);
    expect(gate.outcome).toBe("uncertain");
    expect(gate.passed).toBe(false);
  });

  test("probabilidade baixa reprova como não", () => {
    const gate = decideNoul("payment_confirmed", { type: "noul", noul: noulRule.failAt }, noulRule);
    expect(gate.outcome).toBe("fail");
    expect(gate.passed).toBe(false);
  });
});

test.describe("Choice — uma opção e a confiança", () => {
  test("a opção esperada com confiança suficiente passa", () => {
    const gate = decideChoice(
      "outcome",
      {
        type: "choice",
        choice: "success",
        probabilities: { success: 0.86, validation_error: 0.14 },
        confidence: choiceRule.minConfidence,
      },
      choiceRule,
    );
    expect(gate.passed).toBe(true);
    expect(gate.detail.choice).toBe("success");
  });

  test("outra opção reprova mesmo com confiança alta", () => {
    const gate = decideChoice(
      "outcome",
      {
        type: "choice",
        choice: "validation_error",
        probabilities: { validation_error: 0.9, success: 0.1 },
        confidence: 0.8,
      },
      choiceRule,
    );
    expect(gate.outcome).toBe("fail");
    expect(gate.passed).toBe(false);
  });

  test("a opção certa com confiança baixa não libera", () => {
    const gate = decideChoice(
      "outcome",
      {
        type: "choice",
        choice: "success",
        probabilities: { success: 0.55, pending: 0.45 },
        confidence: 0.1,
      },
      choiceRule,
    );
    expect(gate.outcome).toBe("low_confidence");
    expect(gate.passed).toBe(false);
  });
});

test.describe("Score — nota ponderada na rubrica", () => {
  test("nota no nível mínimo passa quando a confiança basta", () => {
    const gate = decideScore(
      "confirmation_quality",
      {
        type: "score",
        score: scoreRule.minScore,
        legend: { "2": "recibo visível" },
        probabilities: { "2": 1 },
        confidence: scoreRule.minConfidence,
      },
      scoreRule,
    );
    expect(gate.passed).toBe(true);
  });

  test("nota abaixo do nível mínimo reprova", () => {
    const gate = decideScore(
      "confirmation_quality",
      {
        type: "score",
        score: 1.999,
        legend: {},
        probabilities: {},
        confidence: 0.9,
      },
      scoreRule,
    );
    expect(gate.outcome).toBe("fail");
    expect(gate.passed).toBe(false);
  });

  test("nota alta com confiança baixa não libera", () => {
    const gate = decideScore(
      "confirmation_quality",
      {
        type: "score",
        score: 2.4,
        legend: {},
        probabilities: {},
        confidence: 0.49,
      },
      scoreRule,
    );
    expect(gate.outcome).toBe("low_confidence");
    expect(gate.passed).toBe(false);
  });
});
