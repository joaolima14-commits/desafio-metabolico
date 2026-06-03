
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
