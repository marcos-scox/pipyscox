/* pipyscox · core/model.js
   Modelo de dados: pipys, fases, campos, cards e validações */
'use strict';
/* ===================== Modelo ===================== */
const pipeById=id=>S.db.pipes.find(p=>p.id===id);
const phaseOf=(pipe,id)=>pipe.phases.find(p=>p.id===id);
const allFields=pipe=>pipe.phases.flatMap(ph=>ph.fields.map(f=>({ph,f})));
function findField(pipe,fid){for(const ph of pipe.phases)for(const f of ph.fields)if(f.id===fid)return{ph,f};return{}}
function people(){return[...new Set(S.db.settings.people.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
function cardFiles(pipe,c){let n=0;pipe.phases.forEach(ph=>ph.fields.forEach(f=>{if(f.type==='file'&&Array.isArray(c.values[f.id]))n+=c.values[f.id].length}));return n}
function timeInPhase(card,phaseId){let t=0;card.history.forEach(h=>{if(h.phaseId===phaseId)t+=(h.leftAt?new Date(h.leftAt):new Date())-new Date(h.enteredAt)});return t}
function passedPhaseIds(card){const seen=[];card.history.forEach(h=>{if(!seen.includes(h.phaseId))seen.push(h.phaseId)});if(!seen.includes(card.phaseId))seen.push(card.phaseId);return seen}
function phaseTagChips(pipe,card,f){return passedPhaseIds(card).filter(id=>f.includeCurrent!==false||id!==card.phaseId).map(id=>phaseOf(pipe,id)).filter(Boolean).map(ph=>`<span class="chip" style="background:${ph.color}">${esc(ph.name)}</span>`).join('')}
function isEmptyVal(f,v){if(f.type==='time'||f.type==='phasetag')return false;if(f.type==='tag'||f.type==='file')return!Array.isArray(v)||!v.length;if(f.type==='checkbox')return!v;return v==null||String(v).trim()===''}
function validField(f,v){if(v==null||String(v).trim()==='')return'';
  if(f.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()))return'E-mail inválido';
  if(f.type==='cpf'&&!validCPF(v))return'CPF inválido';
  if(f.type==='phone'){const n=digits(v).length;if(n<10||n>11)return'Telefone incompleto'}
  if((f.type==='number'||f.type==='currency')&&isNaN(parseFloat(v)))return'Número inválido';return''}
function optLabel(f,id){return(f.options||[]).find(o=>o.id===id)?.label||''}
function textVal(pipe,card,f){const v=card.values[f.id];if(f.type==='phasetag')return passedPhaseIds(card).map(id=>phaseOf(pipe,id)?.name).filter(Boolean).join(', ');if(f.type==='time')return'';if(isEmptyVal(f,v))return'';
  switch(f.type){case'date':return fmtDate(v);case'currency':return fmtMoney(v);case'checkbox':return'Sim';case'select':return optLabel(f,v);
    case'tag':return v.map(id=>optLabel(f,id)).filter(Boolean).join(', ');case'file':return v.map(x=>x.name).join(', ');default:return String(v)}}
function tagChips(f,v){if(!Array.isArray(v))return'';return v.map(id=>{const o=(f.options||[]).find(x=>x.id===id);return o?`<span class="chip" style="background:${o.color}">${esc(o.label)}</span>`:''}).join('')}
function newField(type,preset){const f={id:uid(),type,label:FT[type].label,required:false,showOnCard:!['file','cpf','email','phone'].includes(type)};
  if(type==='text'){f.multiline=false;f.placeholder=''}if(type==='date')f.autoFill=true;
  if(type==='tag'){f.multiple=true;f.options=[{id:uid(),label:'Prioridade',color:'#e05555'},{id:uid(),label:'Normal',color:'#3399ff'}]}
  if(type==='select'){f.options=[{id:uid(),label:'Opção 1'},{id:uid(),label:'Opção 2'}]}
  if(type==='checkbox')f.label='Confirmado';if(type==='file')f.accept='';if(type==='phasetag'){f.includeCurrent=true;f.label='Fases percorridas'}
  return Object.assign(f,preset||{})}
function autoFill(pipe,card,phaseId){const ph=phaseOf(pipe,phaseId);if(!ph)return;ph.fields.forEach(f=>{if(f.type==='date'&&f.autoFill&&!card.values[f.id])card.values[f.id]=todayLocal()})}
function blockers(pipe,card){const ph=phaseOf(pipe,card.phaseId);if(!ph)return[];const out=[];ph.fields.forEach(f=>{const v=card.values[f.id];if(f.required&&isEmptyVal(f,v))out.push(f.label);else{const e=validField(f,v);if(e)out.push(f.label+' ('+e.toLowerCase()+')')}});return out}
function logCard(card,action,detail='',by){card.log=card.log||[];const at=nowISO();by=by||S.user||'Usuário';
  const last=card.log[card.log.length-1];
  if(last&&last.action===action&&last.detail===detail&&last.by===by&&Date.now()-new Date(last.at)<120000){last.at=at;return}
  card.log.push({at,by,action,detail});if(card.log.length>500)card.log.splice(0,card.log.length-500)}
function moveCard(pipe,card,toId,opt={}){
  if(card.phaseId===toId||!phaseOf(pipe,toId))return false;
  const bl=blockers(pipe,card);
  if(bl.length){if(opt.auto)logCard(card,'Automação não moveu o card',`Pendências: ${bl.join(', ')}`,'Automação');else toast(`Resolva antes de mover: <b>${bl.map(esc).join(', ')}</b>`,'warn',5000);return false}
  const from=card.phaseId,depth=opt.depth||0;
  runAuto(pipe,card,from,'leave',depth);
  const now=nowISO();const cur=card.history.find(h=>!h.leftAt);if(cur)cur.leftAt=now;
  card.history.push({phaseId:toId,enteredAt:now,leftAt:null});card.phaseId=toId;card.phaseEnteredAt=now;card.updatedAt=now;
  logCard(card,'Moveu o card',`${phaseOf(pipe,from)?.name||'?'} → ${phaseOf(pipe,toId).name}`,opt.auto?'Automação':undefined);
  autoFill(pipe,card,toId);runAuto(pipe,card,toId,'enter',depth);save();return true;
}
