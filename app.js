const STORAGE = {
  lead: "dm7_lead",
  pageIndex: "dm7_page_index",
  notesPrefix: "dm7_note_",
  checklist: "dm7_checklist",
  leadGoogleForms: "lead_google_forms_enviado"
};

let pages = [];
let current = Number(localStorage.getItem(STORAGE.pageIndex) || 0);
let envioLeadGoogleFormsEmAndamento = false;

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
   INTEGRAÇÃO COM GOOGLE FORMS
   Captação de leads - Desafio Metabólico 7 Dias
   ========================================================= */

const GOOGLE_FORMS_LEADS_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdL8vuOWKoP2QGHPVxhD3bwy8uvNYkhvZhXMMR5Iz7CscmcNw/formResponse";

const GOOGLE_FORMS_FIELDS = {
  nome: "entry.92755155",
  email: "entry.1477825075",
  whatsapp: "entry.912288515",
  objetivo: "entry.1446689491",
  dataEntrada: "entry.225186440",
  origem: "entry.1004319405"
};

function normalizarTextoLead(valor) {
  return String(valor || "").trim();
}

function obterDataHoraBrasil() {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function montarChaveLead(lead) {
  return [
    normalizarTextoLead(lead.nome).toLowerCase(),
    normalizarTextoLead(lead.email).toLowerCase(),
    normalizarTextoLead(lead.whatsapp)
  ].join("|");
}

function normalizarLeadFormulario(data) {
  return {
    nome:
      normalizarTextoLead(data.nome) ||
      normalizarTextoLead(data.name) ||
      normalizarTextoLead(data.nomeCompleto) ||
      normalizarTextoLead(data.fullName) ||
      normalizarTextoLead(data.participante),

    email:
      normalizarTextoLead(data.email) ||
      normalizarTextoLead(data.eMail) ||
      normalizarTextoLead(data.mail),

    whatsapp:
      normalizarTextoLead(data.whatsapp) ||
      normalizarTextoLead(data.WhatsApp) ||
      normalizarTextoLead(data.telefone) ||
      normalizarTextoLead(data.celular) ||
      normalizarTextoLead(data.phone),

    objetivo:
      normalizarTextoLead(data.objetivo) ||
      normalizarTextoLead(data.meta) ||
      normalizarTextoLead(data.goal) ||
      "Não informado",

    createdAt: data.createdAt || new Date().toISOString()
  };
}

async function enviarLeadParaGoogleForms(leadData) {
  if (envioLeadGoogleFormsEmAndamento) {
    console.log("Envio de lead já em andamento. Bloqueando duplicidade.");
    return;
  }

  const leadNormalizado = normalizarLeadFormulario(leadData);

  const nome = leadNormalizado.nome;
  const email = leadNormalizado.email;
  const whatsapp = leadNormalizado.whatsapp;
  const objetivo = leadNormalizado.objetivo || "Não informado";

  if (!nome || (!email && !whatsapp)) {
    console.warn("Lead incompleto. Envio ao Google Forms cancelado.");
    return;
  }

  const chaveLead = montarChaveLead({ nome, email, whatsapp });
  const chaveJaEnviada = localStorage.getItem(STORAGE.leadGoogleForms);

  if (chaveJaEnviada === chaveLead) {
    console.log("Lead já enviado anteriormente. Evitando duplicidade.");
    return;
  }

  envioLeadGoogleFormsEmAndamento = true;

  /*
    Marcamos como enviado antes do fetch porque o Google Forms usa no-cors.
    Isso evita duplicidade causada por duplo clique, recarregamento rápido ou execução repetida.
  */
  localStorage.setItem(STORAGE.leadGoogleForms, chaveLead);

  const formData = new FormData();

  formData.append(GOOGLE_FORMS_FIELDS.nome, nome);
  formData.append(GOOGLE_FORMS_FIELDS.email, email);
  formData.append(GOOGLE_FORMS_FIELDS.whatsapp, whatsapp);
  formData.append(GOOGLE_FORMS_FIELDS.objetivo, objetivo);
  formData.append(GOOGLE_FORMS_FIELDS.dataEntrada, obterDataHoraBrasil());
  formData.append(
    GOOGLE_FORMS_FIELDS.origem,
    "App Desafio Metabólico 7 Dias - GitHub Pages"
  );

  try {
    await fetch(GOOGLE_FORMS_LEADS_URL, {
      method: "POST",
      mode: "no-cors",
      body: formData
    });

    console.log("Lead enviado com sucesso para Google Forms.");
  } catch (error) {
    console.error("Erro ao enviar lead para Google Forms:", error);

    /*
      Se houver falha real de rede, libera nova tentativa.
    */
    localStorage.removeItem(STORAGE.leadGoogleForms);
  } finally {
    setTimeout(function () {
      envioLeadGoogleFormsEmAndamento = false;
    }, 3000);
  }
}

/* =========================================================
   DADOS DO PARTICIPANTE
   ========================================================= */

function lead() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.lead) || "null");
  } catch {
    return null;
  }
}

function setLead(data) {
  const leadNormalizado = normalizarLeadFormulario(data);
  localStorage.setItem(STORAGE.lead, JSON.stringify(leadNormalizado));
}

function showToast(msg) {
  const t = $("#toast");
  if (!t) return;

  t.textContent = msg;
  t.classList.add("show");

  setTimeout(() => t.classList.remove("show"), 2200);
}

function initLead() {
  const existing = lead();

  if (existing) {
    /*
      Se o lead já existe neste aparelho, mostra o app.
      Também tenta enviar ao Google Forms apenas se ainda não tiver sido enviado.
    */
    enviarLeadParaGoogleForms(existing);
    showApp();
    return;
  }

  const leadForm = $("#leadForm");

  if (!leadForm) {
    console.warn("Formulário de lead não encontrado.");
    showApp();
    return;
  }

  leadForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const leadNormalizado = normalizarLeadFormulario(data);

    setLead(leadNormalizado);
    enviarLeadParaGoogleForms(leadNormalizado);
    showApp();
  });
}

/* =========================================================
   APP PRINCIPAL
   ========================================================= */

function showApp() {
  const leadPage = $("#leadPage");
  const appPage = $("#appPage");

  if (leadPage) leadPage.classList.add("hidden");
  if (appPage) appPage.classList.remove("hidden");

  const l = lead();

  if (l) {
    const leadName = $("#leadName");
    const leadContact = $("#leadContact");
    const leadGoal = $("#leadGoal");

    if (leadName) leadName.textContent = l.nome || "Participante";
    if (leadContact) {
      leadContact.textContent = [l.email, l.whatsapp].filter(Boolean).join(" · ");
    }
    if (leadGoal) leadGoal.textContent = l.objetivo || "Objetivo não informado";
  }

  renderList();
  renderPage(current);
  renderChecklist();
}

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

  $$(".page-item").forEach((btn) =>
    btn.addEventListener("click", () => renderPage(Number(btn.dataset.index)))
  );
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

  if (pageTitle) pageTitle.textContent = p.title;
  if (pageCounter) pageCounter.textContent = `Página ${current + 1} de ${pages.length}`;

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

  if (prevBtn) prevBtn.disabled = current === 0;
  if (nextBtn) nextBtn.disabled = current === pages.length - 1;

  renderList();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function saveNote() {
  const p = pages[current];
  const noteText = $("#noteText");

  if (!p || !noteText) return;

  localStorage.setItem(STORAGE.notesPrefix + p.slug, noteText.value);
  showToast("Anotação salva.");
}

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

  $$("[data-check]").forEach((ch) =>
    ch.addEventListener("change", () => {
      data[ch.dataset.check] = ch.checked;
      localStorage.setItem(STORAGE.checklist, JSON.stringify(data));
    })
  );
}

/* =========================================================
   EXPORTAÇÃO / RESUMO
   ========================================================= */

function buildExport() {
  const l = lead() || {};

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

  return `DESAFIO METABÓLICO 7 DIAS

Nome: ${l.nome || ""}
E-mail: ${l.email || ""}
WhatsApp: ${l.whatsapp || ""}
Objetivo: ${l.objetivo || ""}

Checklist marcado:
- ${checked || "Nenhum item marcado"}

Anotações:${noteLines || "\nSem anotações."}`;
}

function openExportModal() {
  const exportText = $("#exportText");
  const exportModal = $("#exportModal");

  if (exportText) exportText.textContent = buildExport();
  if (exportModal) exportModal.classList.remove("hidden");
}

function closeExportModal() {
  const exportModal = $("#exportModal");
  if (exportModal) exportModal.classList.add("hidden");
}

async function copyExport() {
  const txt = buildExport();

  try {
    await navigator.clipboard.writeText(txt);
    showToast("Resumo copiado.");
  } catch {
    showToast("Não foi possível copiar automaticamente.");
  }
}

/* =========================================================
   WHATSAPP
   ========================================================= */

function whatsappLink() {
  const l = lead() || {};

  const txt = `Olá, Dr. João. Finalizei/estou realizando o Desafio Metabólico 7 Dias.

Nome: ${l.nome || ""}
Objetivo: ${l.objetivo || ""}

Gostaria de dar o próximo passo e fazer uma avaliação individual.`;

  return `https://wa.me/5524999922539?text=${encodeURIComponent(txt)}`;
}

/* =========================================================
   LIMPEZA DOS DADOS DO APP
   ========================================================= */

function limparDadosDoApp() {
  const chavesParaRemover = [
    STORAGE.lead,
    STORAGE.pageIndex,
    STORAGE.checklist,
    STORAGE.leadGoogleForms
  ];

  chavesParaRemover.forEach((chave) => localStorage.removeItem(chave));

  pages.forEach((p) => {
    localStorage.removeItem(STORAGE.notesPrefix + p.slug);
  });
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

async function init() {
  try {
    const res = await fetch("pages.json");
    pages = await res.json();
  } catch (error) {
    console.error("Erro ao carregar pages.json:", error);
    showToast("Erro ao carregar páginas.");
    return;
  }

  initLead();

  const prevBtn = $("#prevBtn");
  const nextBtn = $("#nextBtn");
  const saveNoteBtn = $("#saveNoteBtn");
  const noteText = $("#noteText");
  const restartBtn = $("#restartBtn");
  const exportBtn = $("#exportBtn");
  const closeExport = $("#closeExport");
  const copyExportBtn = $("#copyExport");
  const clearData = $("#clearData");
  const whatsappBtn = $("#whatsappBtn");
  const openFull = $("#openFull");

  if (prevBtn) prevBtn.addEventListener("click", () => renderPage(current - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => renderPage(current + 1));

  if (saveNoteBtn) saveNoteBtn.addEventListener("click", saveNote);

  if (noteText) {
    noteText.addEventListener("input", () => {
      const p = pages[current];
      if (!p) return;
      localStorage.setItem(STORAGE.notesPrefix + p.slug, noteText.value);
    });
  }

  if (restartBtn) restartBtn.addEventListener("click", () => renderPage(0));
  if (exportBtn) exportBtn.addEventListener("click", openExportModal);
  if (closeExport) closeExport.addEventListener("click", closeExportModal);
  if (copyExportBtn) copyExportBtn.addEventListener("click", copyExport);

  if (clearData) {
    clearData.addEventListener("click", () => {
      if (confirm("Deseja apagar dados, anotações e checklist deste aparelho?")) {
        limparDadosDoApp();
        location.reload();
      }
    });
  }

  if (whatsappBtn) {
    whatsappBtn.addEventListener("click", (e) => {
      e.currentTarget.href = whatsappLink();
    });
  }

  if (openFull) {
    openFull.addEventListener("click", () => {
      if (!pages[current]) return;
      window.open(pages[current].image, "_blank");
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") renderPage(current + 1);
    if (e.key === "ArrowLeft") renderPage(current - 1);
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
