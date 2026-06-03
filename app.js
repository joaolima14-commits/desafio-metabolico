
const STORAGE = {
  lead: 'dm7_lead',
  pageIndex: 'dm7_page_index',
  notesPrefix: 'dm7_note_',
  checklist: 'dm7_checklist',
};

let pages = [];
let current = Number(localStorage.getItem(STORAGE.pageIndex) || 0);

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const checklistItems = [
  'Bebi água ao longo do dia',
  'Consumi proteína nas principais refeições',
  'Evitei beliscos fora do planejamento',
  'Reduzi açúcar, álcool e bebidas calóricas',
  'Incluí vegetais ou frutas',
  'Fiz caminhada, treino ou movimento',
  'Observei fome e saciedade',
  'Não compensei com restrição extrema',
  'Planejei a próxima refeição/dia',
  'Retomei após eventual deslize'
];

function lead(){
  try { return JSON.parse(localStorage.getItem(STORAGE.lead) || 'null'); }
  catch { return null; }
}

function setLead(data){ localStorage.setItem(STORAGE.lead, JSON.stringify(data)); }

function showToast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}

function initLead(){
  const existing = lead();
  if(existing){ showApp(); return; }
  $('#leadForm').addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    data.createdAt = new Date().toISOString();
    setLead(data);
    showApp();
  });
}

function showApp(){
  $('#leadPage').classList.add('hidden');
  $('#appPage').classList.remove('hidden');
  const l = lead();
  if(l){
    $('#leadName').textContent = l.nome || 'Participante';
    $('#leadContact').textContent = [l.email, l.whatsapp].filter(Boolean).join(' · ');
    $('#leadGoal').textContent = l.objetivo || 'Objetivo não informado';
  }
  renderList();
  renderPage(current);
  renderChecklist();
}

function renderList(){
  const box = $('#pageList');
  box.innerHTML = pages.map((p,i)=>`
    <button class="page-item ${i===current?'active':''}" data-index="${i}">
      <span class="num">${String(i+1).padStart(2,'0')}</span>
      <span class="page-item-title">${p.title}</span>
    </button>
  `).join('');
  $$('.page-item').forEach(btn=>btn.addEventListener('click',()=>renderPage(Number(btn.dataset.index))));
}

function renderPage(i){
  if(i<0 || i>=pages.length) return;
  current = i;
  localStorage.setItem(STORAGE.pageIndex, current);
  const p = pages[current];
  $('#pageTitle').textContent = p.title;
  $('#pageCounter').textContent = `Página ${current+1} de ${pages.length}`;
  $('#pageImg').src = p.image;
  $('#pageImg').alt = p.title;
  $('#noteText').value = localStorage.getItem(STORAGE.notesPrefix+p.slug) || '';
  $('#progressBar').style.width = `${((current+1)/pages.length)*100}%`;
  $('#prevBtn').disabled = current===0;
  $('#nextBtn').disabled = current===pages.length-1;
  renderList();
  window.scrollTo({top:0,behavior:'smooth'});
}

function saveNote(){
  const p = pages[current];
  localStorage.setItem(STORAGE.notesPrefix+p.slug, $('#noteText').value);
  showToast('Anotação salva.');
}

function renderChecklist(){
  let data = {};
  try { data = JSON.parse(localStorage.getItem(STORAGE.checklist) || '{}'); } catch {}
  const box = $('#checkGrid');
  box.innerHTML = checklistItems.map((item,idx)=>`
    <label class="check-item"><input type="checkbox" data-check="${idx}" ${data[idx]?'checked':''}> ${item}</label>
  `).join('');
  $$('[data-check]').forEach(ch=>ch.addEventListener('change',()=>{
    data[ch.dataset.check]=ch.checked;
    localStorage.setItem(STORAGE.checklist, JSON.stringify(data));
  }));
}

function buildExport(){
  const l = lead() || {};
  const noteLines = pages.map((p,i)=>{
    const n = localStorage.getItem(STORAGE.notesPrefix+p.slug) || '';
    return n.trim()?`\n${i+1}. ${p.title}\n${n}`:'';
  }).filter(Boolean).join('\n');
  let checks = {};
  try { checks = JSON.parse(localStorage.getItem(STORAGE.checklist) || '{}'); } catch {}
  const checked = checklistItems.filter((_,i)=>checks[i]).join('\n- ');
  return `DESAFIO METABÓLICO 7 DIAS\n\nNome: ${l.nome||''}\nE-mail: ${l.email||''}\nWhatsApp: ${l.whatsapp||''}\nObjetivo: ${l.objetivo||''}\n\nChecklist marcado:\n- ${checked || 'Nenhum item marcado'}\n\nAnotações:${noteLines || '\nSem anotações.'}`;
}

function openExportModal(){
  $('#exportText').textContent = buildExport();
  $('#exportModal').classList.remove('hidden');
}
function closeExportModal(){ $('#exportModal').classList.add('hidden'); }

function whatsappLink(){
  const l = lead() || {};
  const txt = `Olá, Dr. João. Finalizei/estou realizando o Desafio Metabólico 7 Dias.\n\nNome: ${l.nome||''}\nObjetivo: ${l.objetivo||''}\n\nGostaria de dar o próximo passo e fazer uma avaliação individual.`;
  return `https://wa.me/5524999922539?text=${encodeURIComponent(txt)}`;
}

async function copyExport(){
  const txt = buildExport();
  try { await navigator.clipboard.writeText(txt); showToast('Resumo copiado.'); }
  catch { showToast('Não foi possível copiar automaticamente.'); }
}

async function init(){
  const res = await fetch('pages.json');
  pages = await res.json();
  initLead();
  $('#prevBtn').addEventListener('click',()=>renderPage(current-1));
  $('#nextBtn').addEventListener('click',()=>renderPage(current+1));
  $('#saveNoteBtn').addEventListener('click',saveNote);
  $('#noteText').addEventListener('input',()=>{
    const p = pages[current];
    localStorage.setItem(STORAGE.notesPrefix+p.slug, $('#noteText').value);
  });
  $('#restartBtn').addEventListener('click',()=>renderPage(0));
  $('#exportBtn').addEventListener('click',openExportModal);
  $('#closeExport').addEventListener('click',closeExportModal);
  $('#copyExport').addEventListener('click',copyExport);
  $('#clearData').addEventListener('click',()=>{
    if(confirm('Deseja apagar dados, anotações e checklist deste aparelho?')){ localStorage.clear(); location.reload(); }
  });
  $('#whatsappBtn').addEventListener('click',e=>{ e.currentTarget.href = whatsappLink(); });
  $('#openFull').addEventListener('click',()=>window.open(pages[current].image,'_blank'));
  document.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight') renderPage(current+1);
    if(e.key==='ArrowLeft') renderPage(current-1);
  });
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
}

init();
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

async function enviarLeadParaGoogleForms(lead) {
  const nome = normalizarTextoLead(lead.nome);
  const email = normalizarTextoLead(lead.email);
  const whatsapp = normalizarTextoLead(lead.whatsapp);
  const objetivo = normalizarTextoLead(lead.objetivo || "Não informado");

  if (!nome || (!email && !whatsapp)) {
    console.warn("Lead incompleto. Envio ao Google Forms cancelado.");
    return;
  }

  const chaveLead = montarChaveLead({ nome, email, whatsapp });
  const chaveJaEnviada = localStorage.getItem("lead_google_forms_enviado");

  if (chaveJaEnviada === chaveLead) {
    console.log("Lead já enviado anteriormente. Evitando duplicidade.");
    return;
  }

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

    localStorage.setItem("lead_google_forms_enviado", chaveLead);
    console.log("Lead enviado com sucesso para Google Forms.");
  } catch (error) {
    console.error("Erro ao enviar lead para Google Forms:", error);
  }
}

function buscarValorCampoLead(possiveisNomes) {
  const seletores = possiveisNomes
    .map(
      (nome) =>
        `input[name*="${nome}" i], input[id*="${nome}" i], input[placeholder*="${nome}" i], select[name*="${nome}" i], select[id*="${nome}" i], textarea[name*="${nome}" i], textarea[id*="${nome}" i]`
    )
    .join(",");

  const campo = document.querySelector(seletores);
  return campo ? campo.value : "";
}

function buscarLeadNaTela() {
  return {
    nome: buscarValorCampoLead(["nome", "name", "participante"]),
    email: buscarValorCampoLead(["email", "e-mail", "mail"]),
    whatsapp: buscarValorCampoLead(["whatsapp", "telefone", "celular", "phone"]),
    objetivo: buscarValorCampoLead(["objetivo", "meta", "goal"])
  };
}

function buscarLeadNoLocalStorage() {
  const possiveisChaves = [
    "lead",
    "participant",
    "participante",
    "user",
    "usuario",
    "metabolic_lead",
    "desafio_lead",
    "desafioMetabolicoLead"
  ];

  for (const chave of possiveisChaves) {
    try {
      const bruto = localStorage.getItem(chave);
      if (!bruto) continue;

      const dados = JSON.parse(bruto);

      const lead = {
        nome:
          dados.nome ||
          dados.name ||
          dados.nomeCompleto ||
          dados.fullName ||
          dados.participante ||
          "",
        email: dados.email || dados.eMail || dados.mail || "",
        whatsapp:
          dados.whatsapp ||
          dados.WhatsApp ||
          dados.telefone ||
          dados.celular ||
          dados.phone ||
          "",
        objetivo: dados.objetivo || dados.meta || dados.goal || ""
      };

      if (lead.nome && (lead.email || lead.whatsapp)) {
        return lead;
      }
    } catch (error) {
      // Ignora chaves que não são JSON válido.
    }
  }

  return null;
}

function tentarEnviarLeadCapturado() {
  const leadTela = buscarLeadNaTela();

  if (leadTela.nome && (leadTela.email || leadTela.whatsapp)) {
    enviarLeadParaGoogleForms(leadTela);
    return;
  }

  const leadStorage = buscarLeadNoLocalStorage();

  if (leadStorage) {
    enviarLeadParaGoogleForms(leadStorage);
  }
}

/* Captura envio por formulário tradicional */
document.addEventListener(
  "submit",
  function () {
    setTimeout(tentarEnviarLeadCapturado, 300);
  },
  true
);

/* Captura clique em botões de entrada/acesso */
document.addEventListener(
  "click",
  function (event) {
    const elemento = event.target;
    if (!elemento) return;

    const textoBotao = normalizarTextoLead(elemento.innerText).toLowerCase();

    const pareceBotaoDeEntrada =
      textoBotao.includes("entrar") ||
      textoBotao.includes("começar") ||
      textoBotao.includes("comecar") ||
      textoBotao.includes("acessar") ||
      textoBotao.includes("iniciar") ||
      textoBotao.includes("continuar");

    if (pareceBotaoDeEntrada) {
      setTimeout(tentarEnviarLeadCapturado, 500);
    }
  },
  true
);

/* Caso o lead já esteja salvo localmente, tenta enviar uma vez ao abrir */
window.addEventListener("load", function () {
  setTimeout(tentarEnviarLeadCapturado, 1200);
});
