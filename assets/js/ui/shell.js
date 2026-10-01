/* pipyscox · ui/shell.js
   Tela da pasta, usuário, menu lateral e roteamento */
'use strict';
/* ===================== Pasta / usuário ===================== */
function showGate(mode,name){
  const g=$('#gate');g.classList.remove('hidden');let body='';
  if(mode==='unsupported')body=`<h2>Use o pipyscox no celular</h2><p>Este navegador não permite escolher uma pasta do aparelho. Você pode usar o modo local para salvar os dados neste celular ou abrir no Chrome/Edge do computador para trabalhar com uma pasta compartilhada.</p><div class="row" style="justify-content:center;flex-wrap:wrap"><button class="btn primary" data-act="useLocalStore">${ic('save')} Salvar neste celular</button></div>`;
  else if(mode==='reconnect')body=`<h2>Bem-vindo de volta</h2><p>Por segurança, o navegador pede confirmação para acessar a pasta <b>${esc(name)}</b> novamente.</p><div class="row" style="justify-content:center;flex-wrap:wrap"><button class="btn primary" data-act="gateReconnect">${ic('folder')} Reconectar à pasta</button><button class="btn ghost" data-act="gateChoose">Escolher outra pasta</button></div>`;
  else body=`<h2>Escolha a pasta de dados</h2><p>Todos os pipys, cards e arquivos ficam salvos nessa pasta. Você escolhe uma vez e pode trocar depois em Configurações. Se a pasta já tiver dados do pipyscox, eles são carregados automaticamente.</p><button class="btn primary" data-act="gateChoose">${ic('folder')} Escolher pasta</button>`;
  g.innerHTML=`<div class="box"><div style="color:var(--text);display:flex;justify-content:center">${LOGO.replace('class="brand-logo"','style="width:64px;height:64px"')}</div><div style="font-size:15px;margin-top:6px"><b>pipy</b><span style="color:var(--info)">scox</span></div>${body}</div>`;
}
const hideGate=()=>$('#gate').classList.add('hidden');
async function pickFolder(){try{return await window.showDirectoryPicker({mode:'readwrite',id:'pipyscox'})}catch(e){if(e.name!=='AbortError')toast('Erro ao abrir a pasta: '+esc(e.message),'err');return null}}
async function openDir(h){
  if(!await verifyPerm(h,true)){toast('Permissão de escrita negada para a pasta.','err');return false}
  S.dir=h;await loadDb();await kvSet('dir',h);hideGate();renderAll();setSaveState('ok');
  if(!S.user)await askUser();else ensurePerson(S.user);
  await autoPurge();maybeAutoBackup();return true;
}
function ensurePerson(n){if(n&&!S.db.settings.people.includes(n)){S.db.settings.people.push(n);save()}}
async function askUser(cur){const n=await promptBox('Quem está usando?','Seu nome',cur||'',{noCancel:!cur,placeholder:'Ex.: Marcos',html:'<p class="muted" style="margin:0 0 14px;font-size:13px">O nome aparece no histórico de atividades e nos comentários dos cards. Fica salvo só neste navegador.</p>'});
  if(!n)return;S.user=n;try{localStorage.setItem('pipyscox-user',n)}catch(e){}ensurePerson(n);renderAvatar();if(S.route.v==='config')renderMain()}
function renderAvatar(){const a=$('#avatar');a.textContent=initials(S.user);a.title=(S.user||'Usuário')+' · clique para trocar'}

/* ===================== Sidebar / cabeçalho ===================== */
function renderAll(){renderSidebar();renderMain();renderTheme();renderAvatar()}
function renderSidebar(){
  const r=S.route;const act=v=>r.v===v?'active':'';
  const pipes=S.db.pipes.map(p=>`<button class="nav-item ${['pipe','phase','report'].includes(r.v)&&r.id===p.id?'active':''}" data-act="go" data-v="pipe" data-id="${p.id}" title="${esc(p.name)}"><span class="dot" style="background:${p.color}"></span><span class="lbl">${esc(p.name)}</span><span class="badge">${p.cards.length}</span></button>`).join('');
  $('#sidebar').innerHTML=`<div class="brand">${LOGO}<div><b>pipy</b><span>scox</span></div></div>
  <nav class="nav">
    <button class="nav-item ${act('home')}" data-act="go" data-v="home" title="Dashboard">${ic('dash')}<span class="lbl">Dashboard</span></button>
    <div class="nav-title">Fluxos criados</div>${pipes}
    <button class="nav-item" data-act="newPipe" title="Novo pipy">${ic('plus')}<span class="lbl">Novo pipy</span><span class="badge new">NOVO</span></button>
    <div class="nav-title">Dados</div>
    <button class="nav-item ${act('data')}" data-act="go" data-v="data" title="Dados salvos">${ic('db')}<span class="lbl">Dados salvos</span></button>
    <button class="nav-item ${act('trash')}" data-act="go" data-v="trash" title="Lixeira">${ic('bin')}<span class="lbl">Lixeira</span>${S.db.trash.length?`<span class="badge">${S.db.trash.length}</span>`:''}</button>
    <div class="nav-title">Sistema</div>
    <button class="nav-item ${act('config')}" data-act="go" data-v="config" title="Configurações">${ic('cog')}<span class="lbl">Configurações</span></button>
  </nav>
  <div class="side-foot" data-act="go" data-v="config" title="Pasta: ${esc(S.dir?.name)}"><span class="st"></span>${ic('folder')}<span class="txt">${esc(S.dir?.name||'')}</span></div>`;
}
function renderTheme(){document.documentElement.dataset.theme=S.theme;$('#themeBtn').innerHTML=ic(S.theme==='dark'?'moon':'sun')}
function crumbs(items){$('#crumbs').innerHTML=items.map((it,i)=>i<items.length-1?`<a data-act="go" ${it.attrs}>${esc(it.t)}</a><span>/</span>`:`<span>${esc(it.t)}</span>`).join('')}
function renderMain(){
  closePop();const v=S.route.v;
  if(['pipe','phase','report'].includes(v)&&!pipeById(S.route.id))S.route={v:'home'};
  if(S.route.v==='phase'){const p=pipeById(S.route.id);if(!phaseOf(p,S.route.ph))S.route={v:'pipe',id:p.id}}
  ({home:viewHome,pipe:viewPipe,phase:viewPhase,report:viewReport,data:viewData,trash:viewTrash,config:viewConfig})[S.route.v]();
  renderSidebar();
}
function go(route){S.route=route;S.selField=null;S.ad=null;document.body.classList.remove('mnav');renderMain();$('#content').scrollTop=0}
function refreshAfterChange(){if(S.openCard&&!S.openCard.draft)renderCardModal();else if(!S.openCard)renderMain()}
