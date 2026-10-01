/* pipyscox · core/automations.js
   Motor de automações por fase */
'use strict';
/* ===================== Automações ===================== */
const TRIG={enter:'Quando o card entrar nesta fase',leave:'Quando o card sair desta fase',complete:'Quando os campos obrigatórios desta fase forem preenchidos'};
const ACTS={addTag:'Aplicar tag',removeTag:'Remover tag',setField:'Preencher campo',move:'Mover para a fase',comment:'Adicionar comentário'};
function convertVal(f,raw){raw=raw==null?'':String(raw).trim();if(raw==='')return undefined;
  switch(f.type){
    case'date':{if(/^hoje$/i.test(raw))return todayLocal();const m=raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(m)return`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;if(/^\d{4}-\d{2}-\d{2}/.test(raw))return raw.slice(0,10);return undefined}
    case'checkbox':return/^(sim|s|true|1|x|marcado|ok)$/i.test(raw);
    case'number':case'currency':{const n=parseFloat(raw.replace(/[R$\s]/g,'').replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.'));return isNaN(n)?undefined:String(n)}
    case'select':return(f.options||[]).find(o=>norm(o.label)===norm(raw))?.id;
    case'tag':{const ids=raw.split(/[,;|]/).map(x=>(f.options||[]).find(o=>norm(o.label)===norm(x))?.id).filter(Boolean);return ids.length?ids:undefined}
    case'cpf':return maskCPF(raw);case'phone':return maskPhone(raw);
    case'file':case'time':case'phasetag':return undefined;
    default:return raw}}
function runAuto(pipe,card,phaseId,trigger,depth=0){
  if(depth>6)return;const ph=phaseOf(pipe,phaseId);if(!ph)return;
  ph.automations.filter(a=>a.trigger===trigger).forEach(a=>applyAuto(pipe,card,a,depth));
}
function applyAuto(pipe,card,a,depth){
  const{f}=a.fieldId?findField(pipe,a.fieldId):{};
  if(a.action==='addTag'&&f){let v=Array.isArray(card.values[f.id])?card.values[f.id]:[];if(!v.includes(a.optId)){v=f.multiple?[...v,a.optId]:[a.optId];card.values[f.id]=v;logCard(card,'Automação aplicou tag',`${f.label}: ${optLabel(f,a.optId)}`,'Automação')}}
  else if(a.action==='removeTag'&&f){const v=Array.isArray(card.values[f.id])?card.values[f.id]:[];if(v.includes(a.optId)){card.values[f.id]=v.filter(x=>x!==a.optId);logCard(card,'Automação removeu tag',`${f.label}: ${optLabel(f,a.optId)}`,'Automação')}}
  else if(a.action==='setField'&&f){const val=f.type==='resp'?a.value:convertVal(f,a.value);if(val!==undefined){card.values[f.id]=val;logCard(card,'Automação preencheu campo',`${f.label}: ${textVal(pipe,card,f)}`,'Automação')}}
  else if(a.action==='comment'&&a.text){card.comments.push({id:uid(),by:'Automação',at:nowISO(),text:a.text,auto:true})}
  else if(a.action==='move'&&a.phaseId){setTimeout(()=>{if(moveCard(pipe,card,a.phaseId,{auto:true,depth:depth+1})){refreshAfterChange()}},0)}
}
function checkComplete(pipe,card){
  if(S.openCard?.draft)return;const ph=phaseOf(pipe,card.phaseId);if(!ph)return;
  const rules=ph.automations.filter(a=>a.trigger==='complete');if(!rules.length)return;
  const req=ph.fields.filter(f=>f.required);if(!req.length)return;
  if(blockers(pipe,card).length)return;
  const key=ph.id+'@'+card.phaseEnteredAt;if(card._done===key)return;card._done=key;
  rules.forEach(a=>applyAuto(pipe,card,a,0));save();
}
function describeAuto(pipe,a){
  const{f}=a.fieldId?findField(pipe,a.fieldId):{};const miss='<span class="req">(campo removido)</span>';let act='';
  if(a.action==='addTag'||a.action==='removeTag')act=`${ACTS[a.action]} <b>${f?esc(optLabel(f,a.optId)||'?'):miss}</b>${f?` em ${esc(f.label)}`:''}`;
  else if(a.action==='setField')act=`Preencher <b>${f?esc(f.label):miss}</b> com <b>${esc(f&&f.type==='select'?optLabel(f,a.value):a.value)}</b>`;
  else if(a.action==='move')act=`Mover para <b>${esc(phaseOf(pipe,a.phaseId)?.name||'(fase removida)')}</b>`;
  else if(a.action==='comment')act=`Comentar: <i>${esc(a.text)}</i>`;
  return`<span class="muted">${esc(TRIG[a.trigger])}</span> → ${act}`;
}
