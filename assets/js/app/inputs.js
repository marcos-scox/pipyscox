/* pipyscox · app/inputs.js
   Inputs, mudanças e atalhos de teclado */
'use strict';
/* ===================== Inputs / changes ===================== */
const I={
  pipeName(el){const p=pipeById(S.route.id);el.size=Math.max(8,el.value.length+2);p.name=el.value.trim()||'Sem nome';save();renderSidebar()},
  phName(el){const{ph}=phaseCtx();ph.name=el.value.trim()||'Sem nome';save();const t=document.querySelector('#phTabs .tab.on .tn');if(t)t.textContent=ph.name},
  fv(el){const{pipe,card}=curCard();const{f}=findField(pipe,el.dataset.f);let v=el.value;
    if(f.type==='cpf'){v=maskCPF(v);el.value=v}if(f.type==='phone'){v=maskPhone(v);el.value=v}
    card.values[f.id]=v;card.updatedAt=nowISO();const err=validField(f,v);el.classList.toggle('bad',!!err);const e=$(`#modalRoot [data-err="${f.id}"]`);if(e)e.textContent=err;
    if(!S.openCard.draft)save()},
  cardTitle(el){const{card}=curCard();if(S.openCard.draft){card.title=el.value;return}card.title=el.value.trim()||'Sem título';save()},
  fProp(el){const f=selF();f[el.dataset.k]=el.value;save();renderFbList();renderFbMini()},
  optName(el){const f=selF();const o=f.options.find(x=>x.id===el.dataset.o);o.label=el.value;save();renderFbMini()},
  adSet(el){S.ad[el.dataset.k]=el.value},
  formSet(el){const p=pipeById(S.route.id);p.form[el.dataset.k]=el.value;save()},
  bfQ(el){bf().q=el.value;renderBoard()},
  dfQ(el){S.dataF.q=el.value;const pipe=S.dataF.pipe?pipeById(S.dataF.pipe):null;const rows=dataRows();$('#dataTbl').innerHTML=dataTable(rows,pipe);$('#dfCount').textContent=rows.length+' registro'+(rows.length===1?'':'s')}
};
const C={
  phColorCustom(el){const p=pipeById(S.route.id),ph=phaseOf(p,el.dataset.ph);ph.color=el.value;save();renderMain()},
  cardMove(el){const{pipe,card}=curCard();moveCard(pipe,card,el.value);renderCardModal()},
  fsel(el){const{pipe,card}=curCard();const{f}=findField(pipe,el.dataset.f);card.values[f.id]=el.value;card.updatedAt=nowISO();if(!S.openCard.draft){logCard(card,'Alterou campo',`${f.label}: ${textVal(pipe,card,f)||'(vazio)'}`);save();checkComplete(pipe,card);renderCardModal()}},
  fchk(el){const{pipe,card}=curCard();const{f}=findField(pipe,el.dataset.f);card.values[f.id]=el.checked;card.updatedAt=nowISO();if(!S.openCard.draft){logCard(card,el.checked?'Marcou':'Desmarcou',f.label);save();checkComplete(pipe,card);renderCardModal()}},
  async fileAdd(el){const{pipe,card}=curCard();const fid=el.dataset.f;const files=[...el.files];if(!files.length)return;const list=Array.isArray(card.values[fid])?card.values[fid]:(card.values[fid]=[]);
    for(const f of files){const safe=f.name.replace(/[\\/:*?"<>|]+/g,'_');const path=`arquivos/${pipe.id}/${card.id}/${Date.now()}-${safe}`;try{await writeFile(path,f);list.push({name:f.name,path,size:f.size,type:f.type,addedAt:nowISO()})}catch(e){toast('Erro ao gravar '+esc(f.name)+': '+esc(e.message),'err')}}
    card.updatedAt=nowISO();if(!S.openCard.draft){logCard(card,'Anexou arquivo(s)',files.map(f=>f.name).join(', '));save();checkComplete(pipe,card)}renderCardModal();toast(files.length+' arquivo(s) salvo(s) na pasta.')},
  fPropB(el){const f=selF();f[el.dataset.k]=el.checked;if(el.dataset.k==='multiple'&&!el.checked){const{p}=phaseCtx();p.cards.forEach(c=>{if(Array.isArray(c.values[f.id]))c.values[f.id]=c.values[f.id].slice(0,1)})}save();renderFbList();renderFbMini();if(el.dataset.k==='required')renderAutoPanel()},
  optColor(el){const f=selF();f.options.find(x=>x.id===el.dataset.o).color=el.value;save();renderFbMini()},
  adSet(el){const k=el.dataset.k;S.ad[k]=el.value;if(k==='action'){S.ad.fieldId='';S.ad.optId='';S.ad.value=''}else if(k==='fieldId'){S.ad.optId='';S.ad.value=''}renderAutoPanel()},
  formSet(el){const p=pipeById(S.route.id);p.form[el.dataset.k]=el.type==='checkbox'?el.checked:el.value;save();formModal()},
  async formImport(el){await importFormResponses([...el.files])},
  async csvImport(el){const f=el.files[0];closePop();if(f)await csvImportFlow(f)},
  bfTag(el){bf().tag=el.value;renderBoard()},
  bfResp(el){bf().resp=el.value;renderBoard()},
  bfStale(el){bf().stale=el.checked;renderBoard()},
  abSet(el){const ab=S.db.settings.autoBackup;const k=el.dataset.k;ab[k]=el.type==='checkbox'?el.checked:(el.type==='number'?Math.max(1,+el.value||1):el.value);save();if(k==='mode'||k==='enabled')renderMain()},
  dfPipe(el){S.dataF.pipe=el.value;S.dataF.phase='';renderMain()},
  dfPhase(el){S.dataF.phase=el.value;renderMain()},
  async zipImport(el){const f=el.files[0];if(!f)return;if(!await confirmBox('Importar ZIP',`Importar <b>${esc(f.name)}</b>? Os dados atuais da pasta serão substituídos (um backup será criado antes).`,'Importar',true)){renderMain();return}
    try{await restoreZip(await f.arrayBuffer())}catch(e){toast('Erro ao importar: '+esc(e.message),'err',6000)}}
};
document.addEventListener('click',e=>{
  if(e.target.matches('[data-overlay]')){if(S.openCard)closeModal();return}
  if(S.pop!==null&&!e.target.closest('.pop')&&!e.target.closest('[data-act="phaseMenu"],[data-act="pipeMenu"]'))closePop();
  const el=e.target.closest('[data-act]');if(!el||el.disabled)return;
  if(el.dataset.act==='phaseMenu'||el.dataset.act==='pipeMenu')S.pop=el.dataset.ph||'pipe';
  const fn=A[el.dataset.act];if(fn){if(el.tagName==='A')e.preventDefault();fn(el,e)}
});
document.addEventListener('input',e=>{const el=e.target.closest('[data-in]');if(el&&I[el.dataset.in])I[el.dataset.in](el,e)});
document.addEventListener('change',e=>{const el=e.target.closest('[data-ch]');if(el&&C[el.dataset.ch]){C[el.dataset.ch](el,e);return}
  const fv=e.target.closest('[data-in="fv"]');if(fv&&S.openCard&&!S.openCard.draft){const{pipe,card}=curCard();const{f}=findField(pipe,fv.dataset.f);if(f){const before=card.phaseId;logCard(card,'Alterou campo',`${f.label}: ${textVal(pipe,card,f)||'(vazio)'}`);save();checkComplete(pipe,card);if(card.phaseId!==before)renderCardModal()}}});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(S.pop!==null)closePop();else if(S.openCard)closeModal()}
  if(e.key==='Enter'&&S.openCard?.draft&&e.target.id==='draftTitle'){e.preventDefault();A.createCard()}
  if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)&&e.target.id==='cmIn'){e.preventDefault();A.addComment()}
  if(e.key==='Enter'&&e.target.id==='personIn'){A.personAdd()}
  if((e.ctrlKey||e.metaKey)&&e.key==='/'){e.preventDefault();$('#gsearch').focus()}
});
$('#gsearch').addEventListener('keydown',e=>{if(e.key==='Enter'&&S.db){S.dataF={pipe:'',phase:'',q:e.target.value};go({v:'data'});e.target.value='';const q=$('#dfQ');if(q){q.focus();q.setSelectionRange(q.value.length,q.value.length)}}});
