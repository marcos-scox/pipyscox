/* pipyscox · views/board.js
   Quadro kanban e filtros */
'use strict';
/* ===================== Quadro (kanban) + filtros ===================== */
function timeBadge(since){const ms=Date.now()-new Date(since),d=ms/864e5;return`<span class="time-b ${d>7?'late':d>3?'warn':''}" data-since="${since}" title="Tempo na fase atual">${ic('clock')}<span class="tv">${fmtDur(ms)}</span></span>`}
function miniCard(pipe,c,preview){
  const ph=phaseOf(pipe,c.phaseId);let rows='';const passed=passedPhaseIds(c);let resp='';
  pipe.phases.filter(p=>passed.includes(p.id)).forEach(p=>p.fields.forEach(f=>{const v=c.values[f.id];
    if(f.type==='resp'&&v){resp=v}
    if(!f.showOnCard||f.type==='time')return;
    if(f.type==='phasetag'){const ch=phaseTagChips(pipe,c,f);if(ch)rows+=`<div class="mc-row">${ch}</div>`;return}
    if(isEmptyVal(f,v))return;
    const row=(icon,txt)=>rows+=`<div class="mc-row">${icon?ic(icon):''}<span class="k">${esc(f.label)}:</span> ${txt}</div>`;
    switch(f.type){
      case'text':row('',esc(String(v).slice(0,80))+(String(v).length>80?'…':''));break;
      case'date':row('cal',fmtDate(v));break;
      case'tag':rows+=`<div class="mc-row">${tagChips(f,v)}</div>`;break;
      case'file':rows+=`<div class="mc-row">${ic('clip')} ${v.length} arquivo${v.length>1?'s':''}</div>`;break;
      case'checkbox':rows+=`<div class="mc-row" style="color:var(--success)">${ic('chkb')} ${esc(f.label)}</div>`;break;
      case'select':rows+=`<div class="mc-row"><span class="k">${esc(f.label)}:</span> <span class="chip soft">${esc(optLabel(f,v))}</span></div>`;break;
      case'currency':row('',fmtMoney(v));break;
      case'cpf':{const d=digits(v);row('',`***.${d.slice(3,6)}.${d.slice(6,9)}-**`);break}
      case'resp':break;
      default:row('',esc(String(v)))}
  }));
  const nC=c.comments.length,nF=cardFiles(pipe,c);
  return`<div class="kcard" ${preview?'':`draggable="true" data-card="${c.id}" data-act="openCard" data-id="${c.id}"`} style="border-left-color:${ph?.color||'var(--border)'}">${preview?'':`<button class="icon-btn kdel" data-act="cardDel" data-p="${pipe.id}" data-id="${c.id}" title="Excluir card">${ic('trash')}</button>`}<div class="t">${esc(c.title)}</div>${rows}
  <div class="kfoot">${resp?`<span class="avatar xs" title="Responsável: ${esc(resp)}">${esc(initials(resp))}</span>`:''}<span>${fmtDate(c.createdAt)}</span>${nC?`<span class="ic2" title="${nC} comentário(s)">${ic('chat')}${nC}</span>`:''}${nF?`<span class="ic2" title="${nF} arquivo(s)">${ic('clip')}${nF}</span>`:''}${timeBadge(c.phaseEnteredAt)}</div></div>`;
}
const bf=()=>S.boardF[S.route.id]||(S.boardF[S.route.id]={q:'',tag:'',resp:'',stale:false});
function cardMatch(pipe,c,F){
  if(F.stale&&Date.now()-new Date(c.phaseEnteredAt)<=7*864e5)return false;
  if(F.resp){const rf=allFields(pipe).filter(({f})=>f.type==='resp');
    if(F.resp==='__none'){if(rf.some(({f})=>c.values[f.id]))return false}else if(!rf.some(({f})=>c.values[f.id]===F.resp))return false}
  if(F.tag){const[a,b]=F.tag.split(':');if(a==='ph'){if(!passedPhaseIds(c).includes(b))return false}else{const v=c.values[a];if(!Array.isArray(v)||!v.includes(b))return false}}
  if(F.q){const q=norm(F.q);const hay=norm([c.title,...allFields(pipe).map(({f})=>textVal(pipe,c,f)),...c.comments.map(x=>x.text)].join(' '));if(!hay.includes(q))return false}
  return true}
function viewPipe(){
  const p=pipeById(S.route.id);const F=bf();
  crumbs([{t:'Home',attrs:'data-v="home"'},{t:p.name}]);
  const tagOpts=allFields(p).filter(({f})=>f.type==='tag').flatMap(({f})=>f.options.map(o=>`<option value="${f.id}:${o.id}" ${F.tag===f.id+':'+o.id?'selected':''}>${esc(f.label)}: ${esc(o.label)}</option>`)).join('')+p.phases.map(ph=>`<option value="ph:${ph.id}" ${F.tag==='ph:'+ph.id?'selected':''}>Passou por: ${esc(ph.name)}</option>`).join('');
  const hasResp=allFields(p).some(({f})=>f.type==='resp');
  const respNames=[...new Set([...people(),...p.cards.flatMap(c=>allFields(p).filter(({f})=>f.type==='resp').map(({f})=>c.values[f.id]).filter(Boolean))])];
  $('#content').innerHTML=`<div class="page-head">
    <span style="width:14px;height:14px;border-radius:4px;background:${p.color}"></span>
    <input class="title-in" style="width:auto;max-width:100%;flex:0 1 auto" size="${Math.max(8,p.name.length+2)}" data-in="pipeName" value="${esc(p.name)}" title="Clique para renomear">
    <div class="sp"></div>
    <button class="btn ghost" data-act="pipeMenu">${ic('dots')} Opções</button>
    <button class="btn ghost" data-act="go" data-v="report" data-id="${p.id}">${ic('chart')} Relatórios</button>
    ${p.form.enabled?`<label class="btn ghost" style="cursor:pointer" title="Importar arquivos de resposta do formulário externo">${ic('form')} Importar respostas<input type="file" accept=".json" multiple hidden data-ch="formImport"></label>`:''}
    <button class="btn ghost" data-act="go" data-v="phase" data-id="${p.id}" data-ph="${p.phases[0]?.id||''}" ${p.phases.length?'':'disabled'}>${ic('layout')} Configurar cards</button>
    <button class="btn ghost" data-act="newPhase">${ic('plus')} Nova fase</button>
    <button class="btn primary" data-act="newCard" data-ph="${p.phases[0]?.id||''}" ${p.phases.length?'':'disabled'}>${ic('plus')} Novo card</button></div>
  <div class="filters">
    <label class="search">${ic('search')}<input data-in="bfQ" value="${esc(F.q)}" placeholder="Filtrar cards deste quadro..." id="bfQ"></label>
    <select class="input" data-ch="bfTag"><option value="">Todas as tags</option>${tagOpts}</select>
    ${hasResp?`<select class="input" data-ch="bfResp"><option value="">Todos os responsáveis</option><option value="__none" ${F.resp==='__none'?'selected':''}>Sem responsável</option>${respNames.map(n=>`<option ${F.resp===n?'selected':''}>${esc(n)}</option>`).join('')}</select>`:''}
    <label class="chk"><input type="checkbox" data-ch="bfStale" ${F.stale?'checked':''}> Parados há +7 dias</label>
    <button class="btn ghost sm" data-act="bfClear">${ic('x')} Limpar</button>
    <span class="muted" id="bfCount" style="font-size:13px"></span>
  </div>
  <div class="board" id="board"></div>`;
  renderBoard();
}
function renderBoard(){
  const p=pipeById(S.route.id);const F=bf();const el=$('#board');if(!el)return;
  const active=F.q||F.tag||F.resp||F.stale;let shown=0;
  const cols=p.phases.map(ph=>{const all=p.cards.filter(c=>c.phaseId===ph.id);const cs=all.filter(c=>cardMatch(p,c,F));shown+=cs.length;return`<div class="col" data-col="${ph.id}">
    <div class="col-head" draggable="true" data-phdrag="${ph.id}" style="border-top-color:${ph.color}"><span class="col-name" title="${esc(ph.name)}">${esc(ph.name)}</span>${ph.automations.length?`<span title="${ph.automations.length} automação(ões)" style="color:var(--warning);display:flex">${ic('zap')}</span>`:''}<span class="col-count">${active?cs.length+'/':''}${all.length}</span>
      <button class="icon-btn" data-act="phaseMenu" data-ph="${ph.id}" title="Opções da fase">${ic('dots')}</button></div>
    <div class="col-body">${cs.map(c=>miniCard(p,c)).join('')}</div>
    <div class="col-foot"><button class="add-card" data-act="newCard" data-ph="${ph.id}">${ic('plus')} Novo card</button></div></div>`}).join('');
  el.innerHTML=cols+`<div class="col ghost" data-act="newPhase">${ic('plus')}<div style="margin-top:6px">Nova fase</div></div>`;
  const cnt=$('#bfCount');if(cnt)cnt.textContent=active?`${shown} de ${p.cards.length} cards`:'';
}
function phaseMenuHtml(ph){return`<button class="it" data-act="phRename" data-ph="${ph.id}">${ic('edit')} Renomear fase</button>
  <div class="sec"><small>Cor da fase</small><div class="swatches">${COLORS.map(c=>`<button class="sw ${c===ph.color?'on':''}" style="background:${c}" data-act="phColor" data-ph="${ph.id}" data-c="${c}"></button>`).join('')}<input type="color" class="sw" value="${ph.color}" data-ch="phColorCustom" data-ph="${ph.id}" title="Cor personalizada"></div></div>
  <button class="it" data-act="go" data-v="phase" data-id="${S.route.id}" data-ph="${ph.id}">${ic('layout')} Configurar card e automações</button>
  <button class="it" data-act="phMove" data-ph="${ph.id}" data-d="-1">${ic('left')} Mover para a esquerda</button>
  <button class="it" data-act="phMove" data-ph="${ph.id}" data-d="1">${ic('right')} Mover para a direita</button>
  <button class="it danger" data-act="phDelete" data-ph="${ph.id}">${ic('trash')} Excluir fase</button>`}
