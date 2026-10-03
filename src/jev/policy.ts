import type { ChoiceQuestion, NoulQuestion, ScoreQuestion } from "./types";

/**
 * As três perguntas saem no mesmo POST /v1/systemone.
 * A chave é só o id da resposta; o modelo não a usa na inferência.
 */
export const CHECKOUT_QUESTIONS = {
  payment_confirmed: {
    type: "noul",
    instructions:
      "O pagamento deste checkout foi confirmado? Use `status`, `alerts` e `receipt`.",
    criteria: {
      true: "Há confirmação explícita de pagamento e um recibo, sem alerta de erro.",
      false: "O pagamento não foi confirmado, os dados foram recusados, ou a cobrança segue pendente.",
    },
  } satisfies NoulQuestion,

  outcome: {
    type: "choice",
    instructions:
      "Qual é o desfecho visível deste checkout? Use `status`, `alerts` e `receipt`.",
    criteria: {
      success: "Pagamento confirmado, com recibo e sem alerta.",
      validation_error: "Os dados do formulário foram recusados.",
      pending: "A cobrança não foi concluída e o pagamento segue pendente.",
      broken: "A página não mostra um desfecho reconhecível.",
    },
  } satisfies ChoiceQuestion,

  confirmation_quality: {
    type: "score",
    instructions:
      "Quão completa está a confirmação do pagamento? Use `status`, `alerts` e `receipt`. Os níveis vão do pior para o melhor.",
    criteria: [
      "Não há confirmação.",
      "Há um indício, mas falta recibo ou a cobrança não foi concluída.",
      "A confirmação e o recibo estão visíveis.",
      "A confirmação traz recibo, valor e o e-mail de quem pagou.",
    ],
  } satisfies ScoreQuestion,
};

export const CHECKOUT_POLICY = {
  paymentConfirmed: { passAt: 0.8, failAt: 0.2 },
  outcome: { expected: "success", minConfidence: 0.6 },
  confirmationQuality: { minScore: 2, minConfidence: 0.5 },
} as const;
