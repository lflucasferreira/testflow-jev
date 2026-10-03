const form = document.querySelector("#checkout");
const email = document.querySelector("#email");
const card = document.querySelector("#card");
const status = document.querySelector("#status");
const receipt = document.querySelector("#receipt");
const alertBox = document.querySelector("#alert");

function hide(element) {
  element.hidden = true;
  element.textContent = "";
}

function show(element, text) {
  element.hidden = false;
  element.textContent = text;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  hide(status);
  hide(receipt);
  hide(alertBox);

  const emailValue = email.value.trim();
  const cardValue = card.value.trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);

  if (!emailOk) {
    show(alertBox, "Informe um e-mail válido.");
    return;
  }

  if (!/^\d{4}$/.test(cardValue)) {
    show(alertBox, "Informe os 4 últimos dígitos do cartão.");
    return;
  }

  if (cardValue === "0000") {
    show(status, "Pagamento pendente. Nenhuma cobrança foi concluída.");
    return;
  }

  if (cardValue !== "4242") {
    show(alertBox, "Cartão recusado. Confira os dados e tente de novo.");
    return;
  }

  show(status, "Pagamento confirmado");
  show(receipt, `Recibo 1042 · R$ 86,00 · ${emailValue}`);
});
