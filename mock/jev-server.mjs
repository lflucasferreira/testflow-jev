import { createServer } from "node:http";

const port = Number(process.env.PORT || 4174);

function round4(value) {
  return Math.round(value * 10000) / 10000;
}

function confidenceFrom(probabilities) {
  const ranked = Object.values(probabilities).sort((left, right) => right - left);
  return round4((ranked[0] ?? 0) - (ranked[1] ?? 0));
}

function profileFor(state) {
  const status = String(state?.status ?? "").toLowerCase();
  const alerts = Array.isArray(state?.alerts) ? state.alerts.filter(Boolean) : [];
  const receipt = state?.receipt ? String(state.receipt) : "";

  if (receipt && alerts.length === 0 && status.includes("confirm")) {
    return { noul: 0.97, choice: "success", score: 2.85 };
  }

  if (alerts.length > 0) {
    return { noul: 0.06, choice: "validation_error", score: 0.2 };
  }

  if (status.includes("pendente") || status.includes("pending")) {
    return { noul: 0.41, choice: "pending", score: 1.15 };
  }

  return { noul: 0.5, choice: "broken", score: 0.4 };
}

function choiceAnswer(criteria, preferred) {
  const keys = Object.keys(criteria ?? {});
  if (keys.length === 0) {
    return { type: "choice", choice: "", probabilities: {}, confidence: 0 };
  }

  const winner = keys.includes(preferred) ? preferred : keys[0];
  const top = keys.length === 1 ? 1 : 0.86;
  const share = (1 - top) / Math.max(keys.length - 1, 1);
  const probabilities = {};
  let assigned = 0;

  for (const key of keys) {
    if (key === winner) continue;
    probabilities[key] = round4(share);
    assigned += probabilities[key];
  }

  probabilities[winner] = round4(1 - assigned);
  return {
    type: "choice",
    choice: winner,
    probabilities,
    confidence: confidenceFrom(probabilities),
  };
}

function scoreAnswer(criteria, target) {
  const levels = Array.isArray(criteria) ? criteria : [];
  const count = levels.length;
  const legend = {};
  const probabilities = {};

  for (let index = 0; index < count; index += 1) {
    legend[String(index)] = levels[index];
    probabilities[String(index)] = 0;
  }

  if (count === 0) {
    return { type: "score", score: 0, legend, probabilities, confidence: 0 };
  }

  const clamped = Math.min(count - 1, Math.max(0, target));
  const lower = Math.floor(clamped);
  const upper = Math.min(count - 1, lower === count - 1 ? lower : lower + 1);
  const fraction = upper === lower ? 0 : clamped - lower;

  if (upper === lower) {
    probabilities[String(lower)] = 1;
  } else {
    probabilities[String(lower)] = round4(1 - fraction);
    probabilities[String(upper)] = round4(1 - probabilities[String(lower)]);
  }

  let score = 0;
  for (const [level, probability] of Object.entries(probabilities)) {
    score += Number(level) * probability;
  }

  return {
    type: "score",
    score: round4(score),
    legend,
    probabilities,
    confidence: confidenceFrom(probabilities),
  };
}

function answerQuestion(question, profile) {
  if (question?.type === "noul") {
    return { type: "noul", noul: profile.noul };
  }

  if (question?.type === "choice") {
    return choiceAnswer(question.criteria, profile.choice);
  }

  if (question?.type === "score") {
    return scoreAnswer(question.criteria, profile.score);
  }

  return null;
}

function send(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");

  if (request.method === "GET" && url.pathname === "/health") {
    send(response, 200, { ok: true });
    return;
  }

  if (request.method !== "POST" || url.pathname !== "/v1/systemone") {
    send(response, 404, { detail: "not found" });
    return;
  }

  const authorization = request.headers.authorization ?? "";
  if (!authorization.startsWith("Bearer ") || authorization.slice("Bearer ".length).trim() === "") {
    send(response, 401, { detail: "missing bearer token" });
    return;
  }

  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    send(response, 422, { detail: "invalid json" });
    return;
  }

  if (body.state === undefined || body.state === null || typeof body.model !== "string") {
    send(response, 422, { detail: "state and model are required" });
    return;
  }

  if (!body.questions || typeof body.questions !== "object" || Array.isArray(body.questions)) {
    send(response, 422, { detail: "questions must be an object" });
    return;
  }

  const profile = profileFor(body.state);
  const answers = {};
  for (const [id, question] of Object.entries(body.questions)) {
    const answer = answerQuestion(question, profile);
    if (!answer) {
      send(response, 422, { detail: `unsupported question: ${id}` });
      return;
    }
    answers[id] = answer;
  }

  send(response, 200, {
    model: "jev-mock-1.0",
    answers,
    usage: {
      input_tokens: Math.max(1, Math.ceil(JSON.stringify(body).length / 4)),
      output_tokens: 16 * Object.keys(answers).length,
    },
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`jev mock em http://127.0.0.1:${port}`);
});
