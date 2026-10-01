/* pipyscox · views/data.js
   Dados salvos e exportação CSV */
'use strict';
/* ===================== Dados salvos ===================== */
function dataRows(){const F=S.dataF;const rows=[];
  S.db.pipes.forEach(p=>{if(F.pipe&&p.id!==F.pipe)return;p.cards.forEach(c=>{if(F.phase&&c.phaseId!==F.phase)return;if(F.q&&!cardMatch(p,c,{q:F.q}))return;rows.push({p,c})})});return rows}
const dataFields=pipe=>pipe?pipe.phases.flatMap(ph=>ph.fields.filter(f=>!['time','phasetag'].includes(f.type))):[];
function viewData(){
  crumbs([{t:'Home',attrs:'data-v="home"'},{t:'Dados salvos'}]);
  const F=S.dataF;const rows=dataRows();const pipe=F.pipe?pipeById(F.pipe):null;
  const allCards=S.db.pipes.reduce((a,p)=>a+p.cards.length,0);const allFiles=S.db.pipes.reduce((a,p)=>a+p.cards.reduce((b,c)=>b+cardFiles(p,c),0),0);
  $('#content').innerHTML=`<div class="page-head"><h1 class="page">Dados salvos</h1><div class="sp"></div><button class="btn ghost" data-act="exportCsv">${ic('csv')} Exportar CSV</button><button class="btn primary" data-act="zipDownload">${ic('down')} Baixar tudo (ZIP)</button></div>
  <div class="stat-row"><div class="stat" style="border-left-color:var(--primary)"><b>${S.db.pipes.length}</b><span class="muted">pipys</span></div><div class="stat" style="border-left-color:var(--info)"><b>${allCards}</b><span class="muted">cards</span></div><div class="stat" style="border-left-color:var(--warning)"><b>${allFiles}</b><span class="muted">arquivos</span></div><div class="stat" style="border-left-color:var(--success)"><b style="font-size:15px;padding:5px 0">${esc(S.dir.name)}</b><span class="muted">pasta de dados</span></div></div>
  <div class="panel"><div class="panel-h wrap">
    <select class="input" style="width:auto" data-ch="dfPipe"><option value="">Todos os pipys</option>${S.db.pipes.map(p=>`<option value="${p.id}" ${p.id===F.pipe?'selected':''}>${esc(p.name)}</option>`).join('')}</select>
    ${pipe?`<select class="input" style="width:auto" data-ch="dfPhase"><option value="">Todas as fases</option>${pipe.phases.map(p=>`<option value="${p.id}" ${p.id===F.phase?'selected':''}>${esc(p.name)}</option>`).join('')}</select>`:''}
    <input class="input" style="flex:1;min-width:180px" placeholder="Filtrar por título, valor, tag ou comentário..." data-in="dfQ" value="${esc(F.q)}" id="dfQ">
    <span class="muted" id="dfCount">${rows.length} registro${rows.length===1?'':'s'}</span></div>
    <div class="tbl-wrap" id="dataTbl">${dataTable(rows,pipe)}</div></div>`;
}
function cellVal(pipe,c,f){const v=c.values[f.id];if(isEmptyVal(f,v))return'';if(f.type==='tag')return tagChips(f,v);if(f.type==='file')return v.length+' arq.';if(f.type==='checkbox')return'✓';return esc(textVal(pipe,c,f).slice(0,60))}
function dataTable(rows,pipe){if(!rows.length)return`<div class="empty">${ic('db')}<div>Nenhum registro encontrado.</div></div>`;
  const fields=dataFields(pipe);
  return`<table class="tbl click"><thead><tr><th>Título</th>${pipe?'':'<th>Pipy</th>'}<th>Fase</th><th>Criado em</th><th>Tempo na fase</th>${fields.map(f=>`<th>${esc(f.label)}</th>`).join('')}${pipe?'':'<th>Arquivos</th>'}<th></th></tr></thead><tbody>
  ${rows.map(({p,c})=>{const ph=phaseOf(p,c.phaseId);return`<tr data-act="openCardAny" data-p="${p.id}" data-id="${c.id}"><td><b>${esc(c.title)}</b></td>${pipe?'':`<td>${esc(p.name)}</td>`}<td><span class="chip" style="background:${ph?.color}">${esc(ph?.name||'-')}</span></td><td>${fmtDate(c.createdAt)}</td><td>${tick(c.phaseEnteredAt)}</td>${fields.map(f=>`<td>${cellVal(p,c,f)}</td>`).join('')}${pipe?'':`<td>${cardFiles(p,c)||''}</td>`}<td style="width:1%"><button class="icon-btn" data-act="cardDel" data-p="${p.id}" data-id="${c.id}" title="Excluir card">${ic('trash')}</button></td></tr>`}).join('')}</tbody></table>`}
function exportCsv(){const F=S.dataF;const rows=dataRows();const pipe=F.pipe?pipeById(F.pipe):null;const fields=dataFields(pipe);
  const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const head=['Título','Pipy','Fase','Criado em','Entrou na fase em','Tempo na fase','Fases percorridas',...fields.map(f=>f.label),'Arquivos','Comentários'];
  const lines=[head.map(q).join(';')];
  rows.forEach(({p,c})=>{const ph=phaseOf(p,c.phaseId);lines.push([c.title,p.name,ph?.name,fmtDateTime(c.createdAt),fmtDateTime(c.phaseEnteredAt),fmtDur(Date.now()-new Date(c.phaseEnteredAt)),passedPhaseIds(c).map(id=>phaseOf(p,id)?.name).filter(Boolean).join(' > '),...fields.map(f=>textVal(p,c,f)),cardFiles(p,c),c.comments.length].map(q).join(';'))});
  downloadBlob(new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),`pipyscox-dados-${stamp()}.csv`)}
