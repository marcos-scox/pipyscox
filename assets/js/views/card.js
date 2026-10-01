/* pipyscox · views/card.js
   Modal do card: campos, comentários e atividades */
'use strict';
/* ===================== Card: campos, comentários, atividades ===================== */
function fieldInput(pipe,card,ph,f){
  const v=card.values[f.id];const d=`data-f="${f.id}"`;const req=f.required?' <b class="req">*</b>':'';
  const lab=`<span class="fl">${esc(f.label)}${req}</span>`;const err=validField(f,v);const bad=err?' bad':'';const errH=`<small class="ferr" data-err="${f.id}">${esc(err)}</small>`;
  const inp=(type,extra='')=>`<label class="f">${lab}<input type="${type}" class="input${bad}" data-in="fv" ${d} value="${esc(v??'')}" ${extra}>${errH}</label>`;
  switch(f.type){
    case'text':return`<label class="f">${lab}${f.multiline?`<textarea class="input" data-in="fv" ${d} placeholder="${esc(f.placeholder||'')}">${esc(v||'')}</textarea>`:`<input class="input" data-in="fv" ${d} value="${esc(v||'')}" placeholder="${esc(f.placeholder||'')}">`}</label>`;
    case'number':return inp('number','step="any"');
    case'currency':return`<label class="f">${lab}<div class="money"><span>R$</span><input type="number" step="0.01" min="0" class="input${bad}" data-in="fv" ${d} value="${esc(v??'')}" placeholder="0,00"></div>${errH}</label>`;
    case'email':return inp('email','placeholder="nome@empresa.com.br"');
    case'phone':return inp('tel','placeholder="(98) 99999-9999"');
    case'cpf':return inp('text','inputmode="numeric" placeholder="000.000.000-00"');
    case'date':return`<label class="f">${lab}<input type="date" class="input" data-in="fv" ${d} value="${esc(v||'')}"></label>`;
    case'select':return`<label class="f">${lab}<select class="input" data-ch="fsel" ${d}><option value="">Selecione...</option>${(f.options||[]).map(o=>`<option value="${o.id}" ${v===o.id?'selected':''}>${esc(o.label)}</option>`).join('')}</select></label>`;
    case'resp':{const list=people();if(v&&!list.includes(v))list.push(v);return`<label class="f">${lab}<select class="input" data-ch="fsel" ${d}><option value="">Sem responsável</option>${list.map(n=>`<option ${v===n?'selected':''}>${esc(n)}</option>`).join('')}</select></label>`}
    case'checkbox':return`<label class="chk" style="margin-bottom:16px"><input type="checkbox" data-ch="fchk" ${d} ${v?'checked':''}> ${esc(f.label)}${req}</label>`;
    case'tag':{const sel=Array.isArray(v)?v:[];return`<div style="margin-bottom:14px">${lab}<div class="tagsel">${(f.options||[]).map(o=>`<button class="${sel.includes(o.id)?'on':''}" style="${sel.includes(o.id)?'background:'+o.color:''}" data-act="tagToggle" ${d} data-o="${o.id}"><span class="dt" style="background:${o.color}"></span>${esc(o.label)}</button>`).join('')||'<span class="muted">Sem opções — configure na fase.</span>'}</div></div>`}
    case'file':{const list=Array.isArray(v)?v:[];return`<div style="margin-bottom:14px">${lab}
      <div class="files">${list.map((x,i)=>`<div class="file">${ic('clip')}<span class="nm" title="${esc(x.path)}">${esc(x.name)}</span><span class="muted">${fmtSize(x.size||0)}</span><button class="icon-btn" data-act="fileDl" ${d} data-i="${i}" title="Baixar">${ic('down')}</button><button class="icon-btn" data-act="fileRm" ${d} data-i="${i}" title="Remover">${ic('trash')}</button></div>`).join('')}</div>
      <label class="btn ghost sm" style="cursor:pointer">${ic('up')} Anexar arquivo<input type="file" multiple hidden data-ch="fileAdd" ${d} ${f.accept?`accept="${esc(f.accept)}"`:''}></label></div>`}
    case'time':{const ms=timeInPhase(card,ph.id);const prev=ms-(ph.id===card.phaseId?Date.now()-new Date(card.phaseEnteredAt):0);return`<div style="margin-bottom:14px"><span class="fl">${esc(f.label)}</span><div class="timebox">${ic('clock')} ${ph.id===card.phaseId?'Há <b>'+tick(card.phaseEnteredAt)+'</b> nesta fase'+(prev>1000?` <span class="muted">(+ ${fmtDur(prev)} em passagens anteriores)</span>`:''):ms?'Ficou <b>'+fmtDur(ms)+'</b> nesta fase':'Ainda não passou por esta fase'}</div></div>`}
    case'phasetag':return`<div style="margin-bottom:14px"><span class="fl">${esc(f.label)} <span class="muted" style="font-weight:400">· automático</span></span><div class="tagsel">${phaseTagChips(pipe,card,f)||'<span class="muted">Nenhuma fase ainda.</span>'}</div></div>`;
  }return'';
}
function renderCardModal(){
  if(!S.openCard)return;const{pipe,card}=curCard();if(!pipe||!card){$('#modalRoot').innerHTML='';S.openCard=null;renderMain();return}
  const scroll=$('#modalRoot .overlay')?.scrollTop||0;
  if(S.openCard.draft){const ph=phaseOf(pipe,card.phaseId);const fl=ph.fields.filter(f=>f.type!=='time'&&f.type!=='phasetag');
    const html=`<div class="modal-h"><h3>Novo card</h3><span class="chip" style="background:${ph.color}">${esc(ph.name)}</span><button class="icon-btn" data-act="closeModal">${ic('x')}</button></div>
    <div class="modal-b"><label class="f"><span>Título do card <b class="req">*</b></span><input class="input" data-in="cardTitle" id="draftTitle" value="${esc(card.title)}" placeholder="Ex.: nome da pessoa ou do processo"></label>
    ${fl.map(f=>fieldInput(pipe,card,ph,f)).join('')||`<div class="muted" style="font-size:13px">Esta fase não tem campos configurados. <a data-act="cfgFromCard" data-ph="${ph.id}" style="cursor:pointer">Configurar campos</a></div>`}</div>
    <div class="modal-f"><button class="btn ghost" data-act="closeModal">Cancelar</button><button class="btn primary" data-act="createCard">${ic('check')} Criar card</button></div>`;
    if($('#modalRoot .modal.draft'))$('#modalRoot .modal').innerHTML=html;else{openModal(html,'draft',true);$('#draftTitle').focus()}
    $('#modalRoot .overlay').scrollTop=scroll;return}
  const passed=passedPhaseIds(card);const tab=S.cardTab;
  let body='';
  if(tab==='fields'){body=pipe.phases.filter(p=>p.fields.length&&passed.includes(p.id)).map(p=>`<section class="fsec ${p.id===card.phaseId?'cur':''}"><div class="fsec-h"><span class="dot" style="background:${p.color}"></span>${esc(p.name)} ${p.id===card.phaseId?'<span class="pill">fase atual</span>':''}<span style="flex:1"></span><button class="icon-btn" title="Configurar campos" data-act="cfgFromCard" data-ph="${p.id}">${ic('layout')}</button></div>${p.fields.map(f=>fieldInput(pipe,card,p,f)).join('')}</section>`).join('')
    ||`<div class="empty">${ic('layout')}<div>Nenhum campo configurado nesta fase.</div><button class="btn ghost" style="margin-top:12px" data-act="cfgFromCard" data-ph="${card.phaseId}">Configurar campos</button></div>`}
  else if(tab==='comments'){body=`<div style="margin-bottom:18px"><textarea class="input" id="cmIn" placeholder="Escreva um comentário... (Ctrl+Enter para enviar)" style="min-height:70px"></textarea><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn primary sm" data-act="addComment">${ic('chat')} Comentar</button></div></div>`+
    (card.comments.slice().reverse().map(c=>`<div class="cmt ${c.auto?'auto':''}"><span class="avatar sm" style="${c.auto?'background:var(--warning)':''}">${c.auto?ic('zap'):esc(initials(c.by))}</span><div class="bx"><div class="meta"><b>${esc(c.by)}</b><span>${fmtDateTime(c.at)}</span><span style="flex:1"></span>${c.by===S.user&&!c.auto?`<button class="icon-btn" style="padding:2px" data-act="rmComment" data-id="${c.id}" title="Apagar comentário">${ic('trash')}</button>`:''}</div><div class="tx">${esc(c.text)}</div></div></div>`).join('')||'<div class="muted">Nenhum comentário ainda.</div>')}
  else{body=card.log.length?`<ul class="hist">${card.log.slice().reverse().map(l=>`<li style="--c:${l.by==='Automação'?'var(--warning)':'var(--primary-2)'}"><b>${esc(l.action)}</b>${l.detail?` <span style="color:var(--text-2)">· ${esc(l.detail)}</span>`:''}<div class="muted">${esc(l.by)} · ${fmtDateTime(l.at)}</div></li>`).join('')}</ul>`:'<div class="muted">Sem atividades registradas.</div>'}
  const hist=card.history.slice().reverse().map(h=>{const ph=phaseOf(pipe,h.phaseId);const dur=(h.leftAt?new Date(h.leftAt):new Date())-new Date(h.enteredAt);return`<li style="--c:${ph?.color||'#888'}"><b>${esc(ph?.name||'Fase removida')}</b><div class="muted">${fmtDateTime(h.enteredAt)} · ${h.leftAt?fmtDur(dur):tick(h.enteredAt)+' (atual)'}</div></li>`}).join('');
  const html=`<div class="modal-h"><span class="muted" style="font-size:13px">${esc(pipe.name)}</span><span style="flex:1"></span><button class="icon-btn" data-act="cardDelete" title="Excluir card" style="color:var(--danger)">${ic('trash')}</button><button class="icon-btn" data-act="closeModal">${ic('x')}</button></div>
  <div class="card-modal"><div class="l"><input class="title-in" data-in="cardTitle" value="${esc(card.title)}">
    <div class="ctabs"><button class="ctab ${tab==='fields'?'on':''}" data-act="cardTab" data-t="fields">${ic('layout')} Campos</button><button class="ctab ${tab==='comments'?'on':''}" data-act="cardTab" data-t="comments">${ic('chat')} Comentários ${card.comments.length?`<span class="badge">${card.comments.length}</span>`:''}</button><button class="ctab ${tab==='log'?'on':''}" data-act="cardTab" data-t="log">${ic('act')} Atividades</button></div>${body}</div>
  <div class="r"><label class="f"><span>Mover para a fase</span><select class="input" data-ch="cardMove">${pipe.phases.map(p=>`<option value="${p.id}" ${p.id===card.phaseId?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>
    <div class="kv"><span>Criado em</span><span>${fmtDateTime(card.createdAt)}</span></div>
    <div class="kv"><span>Na fase atual há</span>${tick(card.phaseEnteredAt)}</div>
    <div class="kv"><span>Tempo total</span>${tick(card.createdAt)}</div>
    <div class="kv" style="border:0;margin-bottom:14px"><span>Arquivos</span><span>${cardFiles(pipe,card)}</span></div>
    <div style="font-weight:600;margin-bottom:10px">Histórico de fases</div><ul class="hist">${hist}</ul>
    <button class="btn ghost sm" style="margin-top:16px;color:var(--danger)" data-act="cardDelete">${ic('trash')} Excluir card</button></div></div>`;
  if($('#modalRoot .card-modal'))$('#modalRoot .modal').innerHTML=html;else openModal(html,'lg',true);
  $('#modalRoot .overlay').scrollTop=scroll;
}
function openCard(pipeId,cardId){S.openCard={pipeId,cardId};S.cardTab='fields';$('#modalRoot').innerHTML='';renderCardModal()}
const curCard=()=>{const p=pipeById(S.openCard.pipeId);return{pipe:p,card:S.openCard.draft?S.draftCard:p?.cards.find(c=>c.id===S.openCard.cardId)}};
async function deleteCardFlow(pipe,card){
  if(!await confirmBox('Excluir card',`Enviar o card <b>${esc(card.title)}</b> para a <b>Lixeira</b>?<br><br>Ele pode ser restaurado em até ${TRASH_DAYS} dias. Depois disso, ele e seus anexos são apagados da pasta.`,'Enviar para a lixeira',true))return false;
  trashCard(pipe,card);toast(`Card <b>${esc(card.title)}</b> enviado para a lixeira. <a data-act="undoTrash" style="cursor:pointer">Desfazer</a>`,'ok',6000);renderSidebar();return true}
