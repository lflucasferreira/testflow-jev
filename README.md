# Testflow Jev

Exemplo de teste de software em que o Playwright conduz o checkout e o [Jev](https://typesafe.ai/) (modelo System One da TypeSafe) decide se o caso passou.

O Jev não gera texto. Um único `POST https://api.typesafe.ai/v1/systemone` recebe o estado da página e devolve três respostas tipadas. O teste transforma cada uma em passou ou reprovou.

| Tipo | O que volta | Decisão neste checkout |
| --- | --- | --- |
| **Noul** | Probabilidade de 0 a 1 de que a afirmação é verdadeira | `payment_confirmed` passa se P(sim) ≥ 0,80. Em ≤ 0,20 reprova. No meio fica incerto e não libera. |
| **Choice** | Uma opção do conjunto, a probabilidade de cada opção e a confiança | `outcome` passa só se a opção é `success` e a confiança é ≥ 0,60. |
| **Score** | Nota ponderada entre níveis ordenados (o primeiro nível vale 0), a distribuição e a confiança | `confirmation_quality` passa se a nota é ≥ 2 e a confiança é ≥ 0,50. |

O veredito do caso é a combinação dos três. Um tipo incerto ou com confiança baixa segura a liberação.

## Como rodar

```bash
npm install
npx playwright install chromium
npm test
```

`npm test` sobe o checkout em `http://127.0.0.1:4173` e um substituto local em `http://127.0.0.1:4174`. Esse substituto fala o mesmo contrato (`state`, `model`, `questions` → `answers`) para a suíte rodar sem chave. Ele não é o Jev.

Para julgar a página com o modelo:

```bash
TYPESAFE_API_KEY=sua-chave npm run test:live
```

A chave fica em [console.typesafe.ai/keys](https://console.typesafe.ai/keys). O modo ao vivo não é determinístico: os limiares daqui são a política do exemplo, e num produto real eles se ajustam com casos rotulados.

## O que a suíte cobre

- `tests/verdict.spec.ts` — os limiares de cada tipo, inclusive incerteza e confiança baixa.
- `tests/checkout.jev.spec.ts` — preenche o checkout e manda o estado visível ao Jev.
  - `4242` confirma o pagamento e os três tipos passam.
  - e-mail inválido reprova nos três.
  - `0000` deixa o pagamento pendente: o Noul fica incerto, o Choice não é `success` e o Score fica abaixo de 2.

O teste não afirma o texto do DOM. Quem libera ou reprova é a resposta do Jev.
