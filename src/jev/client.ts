import type { Answer, ChoiceAnswer, NoulAnswer, Question, ScoreAnswer, SystemOneResponse } from "./types";

const MOCK_BASE_URL = "http://127.0.0.1:4174";
const LIVE_BASE_URL = "https://api.typesafe.ai";

export type JevConfig = {
  mode: "mock" | "live";
  baseUrl: string;
  apiKey: string;
  model: string;
};

export function jevConfig(): JevConfig {
  const mode = process.env.JEV_MODE === "live" ? "live" : "mock";
  const baseUrl = (process.env.JEV_BASE_URL ?? (mode === "live" ? LIVE_BASE_URL : MOCK_BASE_URL)).replace(/\/$/, "");
  const apiKey = process.env.TYPESAFE_API_KEY || (mode === "live" ? "" : "mock-key");

  if (mode === "live" && !process.env.TYPESAFE_API_KEY) {
    throw new Error(
      "JEV_MODE=live exige TYPESAFE_API_KEY. Crie uma chave em https://console.typesafe.ai/keys",
    );
  }

  return {
    mode,
    baseUrl,
    apiKey,
    model: process.env.JEV_MODEL ?? "jev-latest",
  };
}

export async function evaluate(
  state: unknown,
  questions: Record<string, Question>,
): Promise<SystemOneResponse> {
  const config = jevConfig();
  const response = await fetch(`${config.baseUrl}/v1/systemone`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.apiKey}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      state,
      model: config.model,
      questions,
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Jev respondeu HTTP ${response.status}: ${body.slice(0, 500)}`);
  }

  const parsed = JSON.parse(body) as SystemOneResponse;
  if (!parsed.answers || typeof parsed.answers !== "object") {
    throw new Error("A resposta do Jev não trouxe answers.");
  }
  return parsed;
}

export function expectNoul(answer: Answer | undefined, id: string): NoulAnswer {
  if (!answer || answer.type !== "noul" || typeof answer.noul !== "number") {
    throw new Error(`A resposta "${id}" não é um Noul.`);
  }
  return answer;
}

export function expectChoice(answer: Answer | undefined, id: string): ChoiceAnswer {
  if (!answer || answer.type !== "choice" || typeof answer.choice !== "string") {
    throw new Error(`A resposta "${id}" não é um Choice.`);
  }
  return answer;
}

export function expectScore(answer: Answer | undefined, id: string): ScoreAnswer {
  if (!answer || answer.type !== "score" || typeof answer.score !== "number") {
    throw new Error(`A resposta "${id}" não é um Score.`);
  }
  return answer;
}
