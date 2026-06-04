const STORAGE = {
  started: "dm7_started_v2",
  pageIndex: "dm7_page_index",
  notesPrefix: "dm7_note_",
  checklist: "dm7_checklist"
};

let pages = [];
let current = Number(localStorage.getItem(STORAGE.pageIndex) || 0);

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const checklistItems = [
  "Bebi água ao longo do dia",
  "Consumi proteína nas principais refeições",
  "Evitei beliscos fora do planejamento",
  "Reduzi açúcar, álcool e bebidas calóricas",
  "Incluí vegetais ou frutas",
  "Fiz caminhada, treino ou movimento",
  "Observei fome e saciedade",
  "Não compensei com restrição extrema",
  "Planejei a próxima refeição/dia",
  "Retomei após eventual deslize"
];

/* =========================================================
   ENTRADA DO APP
   Produto pago entregue pela Kiwify.
   Sem cadastro interno obrigatório.
   ========================================================= */

function initStartScreen() {
  const alreadyStarted = localStorage.getItem(STORAGE.started);

  if (alreadyStarted === "yes") {
    showApp();
    return;
  }

  const startBtn = $("#startBtn");

  if (startBtn) {
    startBtn.addEventListener("click", function () {
      localStorage.setItem(STORAGE.started, "yes");
      showApp();
    });
  }
}

function showApp() {
  const leadPage = $("#leadPage");
  const appPage = $("#appPage");

  if (leadPage) leadPage.classList.add("hidden");
  if (appPage) appPage.classList.remove("hidden");

  renderList();
  renderPage(current);
  renderChecklist();
}

/* =========================================================
   RENDERIZAÇÃO DAS PÁGINAS
   ========================================================= */

function renderList() {
  const box = $("#pageList");
  if (!box) return;

  box.innerHTML = pages
    .map(
      (p, i) => `
        <button class="page-item ${i === current ? "active" : ""}" data-index="${i}">
          <span class="num">${String(i + 1).padStart(2, "0")}</span>
          <span class="page-item-title">${p.title}</span>
        </button>
      `
    )
    .join("");

  $$(".page-item").forEach((btn) => {
    btn.addEventListener("click", function () {
      renderPage(Number(btn.dataset.index));
    });
  });
}

function renderPage(i) {
  if (i < 0 || i >= pages.length) return;

  current = i;
  localStorage.setItem(STORAGE.pageIndex, current);

  const p = pages[current];

  const pageTitle = $("#pageTitle");
  const pageCounter = $("#pageCounter");
  const pageImg = $("#pageImg");
  const noteText = $("#noteText");
  const progressBar = $("#progressBar");

  const prevBtn = $("#prevBtn");
  const nextBtn = $("#nextBtn");
  const prevBtnBottom = $("#prevBtnBottom");
  const nextBtnBottom = $("#nextBtnBottom");

  if (pageTitle) pageTitle.textContent = p.title;

  if (pageCounter) {
    pageCounter.textContent = `Página ${current + 1} de ${pages.length}`;
  }

  if (pageImg) {
    pageImg.src = p.image;
    pageImg.alt = p.title;
  }

  if (noteText) {
    noteText.value = localStorage.getItem(STORAGE.notesPrefix + p.slug) || "";
  }

  if (progressBar) {
    progressBar.style.width = `${((current + 1) / pages.length) * 100}%`;
  }

  const isFirst = current === 0;
  const isLast = current === pages.length - 1;

  if (prevBtn) prevBtn.disabled = isFirst;
  if (nextBtn) nextBtn.disabled = isLast;
  if (prevBtnBottom) prevBtnBottom.disabled = isFirst;
  if (nextBtnBottom) nextBtnBottom.disabled = isLast;

  renderList();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* =========================================================
   ANOTAÇÕES
   ========================================================= */

function saveNote() {
  const p = pages[current];
  const noteText = $("#noteText");

  if (!p || !noteText) return;

  localStorage.setItem(STORAGE.notesPrefix + p.slug, noteText.value);
  showToast("Anotação salva neste aparelho.");
}

/* =========================================================
   CHECKLIST
   ========================================================= */

function renderChecklist() {
  let data = {};

  try {
    data = JSON.parse(localStorage.getItem(STORAGE.checklist) || "{}");
  } catch {
    data = {};
  }

  const box = $("#checkGrid");
  if (!box) return;

  box.innerHTML = checklistItems
    .map(
      (item, idx) => `
        <label class="check-item">
          <input type="checkbox" data-check="${idx}" ${data[idx] ? "checked" : ""}>
          ${item}
        </label>
      `
    )
    .join("");

  $$("[data-check]").forEach((ch) => {
    ch.addEventListener("change", function () {
      data[ch.dataset.check] = ch.checked;
      localStorage.setItem(STORAGE.checklist, JSON.stringify(data));
    });
  });
}

/* =========================================================
   EVOLUÇÃO / EXPORTAÇÃO
   ========================================================= */

function buildExport() {
  const noteLines = pages
    .map((p, i) => {
      const n = localStorage.getItem(STORAGE.notesPrefix + p.slug) || "";
      return n.trim() ? `\n${i + 1}. ${p.title}\n${n}` : "";
    })
    .filter(Boolean)
    .join("\n");

  let checks = {};

  try {
    checks = JSON.parse(localStorage.getItem(STORAGE.checklist) || "{}");
  } catch {
    checks = {};
  }

  const checked = checklistItems.filter((_, i) => checks[i]).join("\n- ");

  return `MINHA EVOLUÇÃO — DESAFIO METABÓLICO 7 DIAS

Checklist marcado:
- ${checked || "Nenhum item marcado"}

Anotações salvas:
${noteLines || "Sem anotações."}

Observação:
Essas informações foram registradas pela própria participante durante o desafio e servem para ajudar na organização da rotina alimentar.

Próximo passo:
Se desejar transformar o desafio em uma estratégia individualizada, entre em contato com o Dr. João Pedro Guimarães de Lima para avaliação médica.`;
}

function openExportModal() {
  const exportText = $("#exportText");
  const exportModal = $("#exportModal");

  if (exportText) exportText.textContent = buildExport();
  if (exportModal) exportModal.classList.remove("hidden");
}

function closeExportModal() {
  const exportModal = $("#exportModal");

  if (exportModal) {
    exportModal.classList.add("hidden");
  }
}

async function copyExport() {
  const txt = buildExport();

  try {
    await navigator.clipboard.writeText(txt);
    showToast("Evolução copiada.");
  } catch {
    showToast("Não foi possível copiar automaticamente.");
  }
}

/* =========================================================
   WHATSAPP — CTA DO ACOMPANHAMENTO
   ========================================================= */

function whatsappLink() {
  const txt = `Olá, Dr. João. Acessei o Desafio Metabólico 7 Dias e gostaria de iniciar um acompanhamento individual.

Quero entender como funciona a avaliação médica personalizada, com análise de exames, composição corporal, rotina alimentar e estratégia para o meu objetivo.`;

  return `https://wa.me/5524999922539?text=${encodeURIComponent(txt)}`;
}

function configurarBotoesWhatsapp() {
  const whatsappBtn = $("#whatsappBtn");
  const whatsappBtnSide = $("#whatsappBtnSide");

  if (whatsappBtn) {
    whatsappBtn.href = whatsappLink();
    whatsappBtn.textContent = "Iniciar acompanhamento";
  }

  if (whatsappBtnSide) {
    whatsappBtnSide.href = whatsappLink();
    whatsappBtnSide.textContent = "Quero iniciar acompanhamento";
  }
}

/* =========================================================
   LIMPEZA LOCAL
   ========================================================= */

function limparDadosDoApp() {
  const chavesParaRemover = [
    STORAGE.started,
    STORAGE.pageIndex,
    STORAGE.checklist
  ];

  chavesParaRemover.forEach((chave) => localStorage.removeItem(chave));

  pages.forEach((p) => {
    localStorage.removeItem(STORAGE.notesPrefix + p.slug);
  });
}

/* =========================================================
   TOAST
   ========================================================= */

function showToast(msg) {
  const t = $("#toast");
  if (!t) return;

  t.textContent = msg;
  t.classList.add("show");

  setTimeout(function () {
    t.classList.remove("show");
  }, 2200);
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

async function init() {
  try {
    const res = await fetch("pages.json?v=20260604-evolucao-premium-v1");
    pages = await res.json();
  } catch (error) {
    console.error("Erro ao carregar pages.json:", error);
    showToast("Erro ao carregar páginas.");
    return;
  }

  configurarBotoesWhatsapp();
  initStartScreen();

  const prevBtn = $("#prevBtn");
  const nextBtn = $("#nextBtn");
  const prevBtnBottom = $("#prevBtnBottom");
  const nextBtnBottom = $("#nextBtnBottom");

  const saveNoteBtn = $("#saveNoteBtn");
  const noteText = $("#noteText");

  const restartBtn = $("#restartBtn");
  const exportBtn = $("#exportBtn");
  const closeExport = $("#closeExport");
  const copyExportBtn = $("#copyExport");
  const clearData = $("#clearData");
  const openFull = $("#openFull");

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      renderPage(current - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      renderPage(current + 1);
    });
  }

  if (prevBtnBottom) {
    prevBtnBottom.addEventListener("click", function () {
      renderPage(current - 1);
    });
  }

  if (nextBtnBottom) {
    nextBtnBottom.addEventListener("click", function () {
      renderPage(current + 1);
    });
  }

  if (saveNoteBtn) {
    saveNoteBtn.addEventListener("click", saveNote);
  }

  if (noteText) {
    noteText.addEventListener("input", function () {
      const p = pages[current];
      if (!p) return;

      localStorage.setItem(STORAGE.notesPrefix + p.slug, noteText.value);
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", function () {
      renderPage(0);
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", openExportModal);
  }

  if (closeExport) {
    closeExport.addEventListener("click", closeExportModal);
  }

  if (copyExportBtn) {
    copyExportBtn.addEventListener("click", copyExport);
  }

  if (clearData) {
    clearData.addEventListener("click", function () {
      if (confirm("Deseja apagar sua evolução, anotações e checklist deste aparelho?")) {
        limparDadosDoApp();
        location.reload();
      }
    });
  }

  if (openFull) {
    openFull.addEventListener("click", function () {
      if (!pages[current]) return;
      window.open(pages[current].image, "_blank");
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") renderPage(current + 1);
    if (e.key === "ArrowLeft") renderPage(current - 1);
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
}

init();
