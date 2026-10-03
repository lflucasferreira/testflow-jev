import { expectChoice, expectNoul, expectScore } from "./client";
import { CHECKOUT_POLICY } from "./policy";
import type {
  Answer,
  ChoiceAnswer,
  GateResult,
  NoulAnswer,
  ScoreAnswer,
  SystemOneResponse,
  Verdict,
} from "./types";

const numberFormat = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function decideNoul(
  id: string,
  answer: NoulAnswer,
  rule: { passAt: number; failAt: number },
): GateResult {
  const probability = answer.noul;
  const detail = { noul: probability };

  if (probability >= rule.passAt) {
    return {
      id,
      type: "noul",
      passed: true,
      outcome: "pass",
      detail,
      summary: `${id}: passou (P(sim)=${formatNumber(probability)} >= ${formatNumber(rule.passAt)})`,
    };
  }

  if (probability <= rule.failAt) {
    return {
      id,
      type: "noul",
      passed: false,
      outcome: "fail",
      detail,
      summary: `${id}: reprovou (P(sim)=${formatNumber(probability)} <= ${formatNumber(rule.failAt)})`,
    };
  }

  return {
    id,
    type: "noul",
    passed: false,
    outcome: "uncertain",
    detail,
    summary: `${id}: incerto (P(sim)=${formatNumber(probability)} entre ${formatNumber(rule.failAt)} e ${formatNumber(rule.passAt)})`,
  };
}

export function decideChoice(
  id: string,
  answer: ChoiceAnswer,
  rule: { expected: string; minConfidence: number },
): GateResult {
  const detail = { choice: answer.choice, confidence: answer.confidence };

  if (answer.choice !== rule.expected) {
    return {
      id,
      type: "choice",
      passed: false,
      outcome: "fail",
      detail,
      summary: `${id}: reprovou — Jev escolheu ${answer.choice} (confiança ${formatNumber(answer.confidence)}); o teste esperava ${rule.expected}`,
    };
  }

  if (answer.confidence < rule.minConfidence) {
    return {
      id,
      type: "choice",
      passed: false,
      outcome: "low_confidence",
      detail,
      summary: `${id}: reprovou — Jev escolheu ${answer.choice}, mas a confiança ${formatNumber(answer.confidence)} está abaixo de ${formatNumber(rule.minConfidence)}`,
    };
  }

  return {
    id,
    type: "choice",
    passed: true,
    outcome: "pass",
    detail,
    summary: `${id}: passou — ${answer.choice} (confiança ${formatNumber(answer.confidence)} >= ${formatNumber(rule.minConfidence)})`,
  };
}

export function decideScore(
  id: string,
  answer: ScoreAnswer,
  rule: { minScore: number; minConfidence: number },
): GateResult {
  const detail = { score: answer.score, confidence: answer.confidence };

  if (answer.score < rule.minScore) {
    return {
      id,
      type: "score",
      passed: false,
      outcome: "fail",
      detail,
      summary: `${id}: reprovou — nota ${formatNumber(answer.score)} < ${formatNumber(rule.minScore)}`,
    };
  }

  if (answer.confidence < rule.minConfidence) {
    return {
      id,
      type: "score",
      passed: false,
      outcome: "low_confidence",
      detail,
      summary: `${id}: reprovou — nota ${formatNumber(answer.score)}, mas a confiança ${formatNumber(answer.confidence)} está abaixo de ${formatNumber(rule.minConfidence)}`,
    };
  }

  return {
    id,
    type: "score",
    passed: true,
    outcome: "pass",
    detail,
    summary: `${id}: passou — nota ${formatNumber(answer.score)} >= ${formatNumber(rule.minScore)} (confiança ${formatNumber(answer.confidence)})`,
  };
}

export function releaseVerdict(answers: Record<string, Answer>): Verdict {
  const gates = [
    decideNoul(
      "payment_confirmed",
      expectNoul(answers.payment_confirmed, "payment_confirmed"),
      CHECKOUT_POLICY.paymentConfirmed,
    ),
    decideChoice("outcome", expectChoice(answers.outcome, "outcome"), CHECKOUT_POLICY.outcome),
    decideScore(
      "confirmation_quality",
      expectScore(answers.confirmation_quality, "confirmation_quality"),
      CHECKOUT_POLICY.confirmationQuality,
    ),
  ];

  return {
    passed: gates.every((gate) => gate.passed),
    gates,
    summary: gates.map((gate) => gate.summary).join("\n"),
  };
}

export function formatRun(response: SystemOneResponse, verdict: Verdict): string {
  const decision = verdict.passed ? "PASSOU" : "REPROVOU";
  return [
    `modelo ${response.model} · ${response.usage.input_tokens} tokens de entrada`,
    verdict.summary,
    `veredito: ${decision}`,
  ].join("\n");
}
