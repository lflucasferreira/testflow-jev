export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type NoulQuestion = {
  type: "noul";
  instructions: string | JsonValue[] | { [key: string]: JsonValue };
  criteria?: {
    true?: string;
    false?: string;
  };
};

export type ChoiceQuestion = {
  type: "choice";
  instructions: string | JsonValue[] | { [key: string]: JsonValue };
  criteria: Record<string, string | null>;
};

export type ScoreQuestion = {
  type: "score";
  instructions: string | JsonValue[] | { [key: string]: JsonValue };
  criteria: string[];
};

export type Question = NoulQuestion | ChoiceQuestion | ScoreQuestion;

export type NoulAnswer = {
  type: "noul";
  noul: number;
};

export type ChoiceAnswer = {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
};

export type ScoreAnswer = {
  type: "score";
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
  confidence: number;
};

export type Answer = NoulAnswer | ChoiceAnswer | ScoreAnswer;

export type SystemOneResponse = {
  model: string;
  answers: Record<string, Answer>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
};

export type CheckoutState = {
  heading: string;
  status: string;
  alerts: string[];
  receipt: string | null;
  visibleText: string;
};

export type GateOutcome = "pass" | "fail" | "uncertain" | "low_confidence";

export type GateResult = {
  id: string;
  type: "noul" | "choice" | "score";
  passed: boolean;
  outcome: GateOutcome;
  summary: string;
  detail: {
    noul?: number;
    choice?: string;
    score?: number;
    confidence?: number;
  };
};

export type Verdict = {
  passed: boolean;
  summary: string;
  gates: GateResult[];
};
