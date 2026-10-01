/* pipyscox · app/actions.js
   Ações de clique */
'use strict';
/* ===================== Ações (cliques) ===================== */
let lastTrashed=null;
const A={
  toggleSide(){if(innerWidth<=900)document.body.classList.toggle('mnav');else document.body.classList.toggle('collapsed')},
  toggleTheme(){A.setTheme({dataset:{t:S.theme==='dark'?'light':'dark'}})},
  setTheme(el){S.theme=el.dataset.t;try{localStorage.setItem('pipyscox-theme',S.theme)}catch(e){}renderTheme();if(S.route.v==='config')renderMain()},
  changeUser(){if(S.db)askUser(S.user)},
  go(el){const d=el.dataset;go({v:d.v,id:d.id,ph:d.ph})},
  async newPipe(){const n=await promptBox('Novo pipy','Nome do pipy','');if(!n)return;const p=createPipe(n);go({v:'pipe',id:p.id});toast('Pipy criado. Configure os campos dos cards em <b>Configurar cards</b>.')},
  examplePipe(){const p=createPipe('Admissão de colaboradores (exemplo)',true);go({v:'pipe',id:p.id})},
  pipeMenu(el){const p=pipeById(S.route.id);openPop(el,`<div class="sec" style="border-top:0;margin-top:0"><small>Cor do pipy</small><div class="swatches">${COLORS.map(c=>`<button class="sw ${c===p.color?'on':''}" style="background:${c}" data-act="pipeColor" data-c="${c}"></button>`).join('')}</div></div>
    <button class="it" data-act="openForm">${ic('form')} Formulário externo ${p.form.enabled?'<span class="badge new">ATIVO</span>':'<span class="badge">opcional</span>'}</button>
    <label class="it" style="display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:5px;cursor:pointer;color:var(--text-2)">${ic('csv')} Importar cards de CSV<input type="file" accept=".csv,.txt" hidden data-ch="csvImport"></label>
    <button class="it" data-act="go" data-v="report" data-id="${p.id}">${ic('chart')} Relatórios</button>
    <button class="it" data-act="pipeDup">${ic('layout')} Duplicar estrutura (sem cards)</button>
    <button class="it danger" data-act="pipeDelete">${ic('trash')} Excluir pipy</button>`)},
  pipeColor(el){pipeById(S.route.id).color=el.dataset.c;save();renderMain()},
  pipeDup(){const p=pipeById(S.route.id);const n=JSON.parse(JSON.stringify(p));const map={};n.id=uid();n.name=p.name+' (cópia)';n.cards=[];n.imported=[];n.createdAt=nowISO();
    n.phases.forEach(ph=>{const o=ph.id;ph.id=uid();map[o]=ph.id;ph.fields.forEach(f=>{const of=f.id;f.id=uid();map[of]=f.id})});
    n.phases.forEach(ph=>ph.automations.forEach(a=>{a.id=uid();if(a.fieldId)a.fieldId=map[a.fieldId]||a.fieldId;if(a.phaseId)a.phaseId=map[a.phaseId]||a.phaseId}));n.form.phaseId=map[n.form.phaseId]||'';
    S.db.pipes.push(n);save();go({v:'pipe',id:n.id})},
  async pipeDelete(){closePop();const p=pipeById(S.route.id);if(!await confirmBox('Excluir pipy',`Enviar <b>${esc(p.name)}</b> (com ${p.cards.length} card(s)) para a <b>Lixeira</b>? Você pode restaurá-lo em até ${TRASH_DAYS} dias.`,'Enviar para a lixeira',true))return;
    trashPipe(p);go({v:'home'});toast(`Pipy <b>${esc(p.name)}</b> enviado para a lixeira.`)},
  openForm(){closePop();formModal()},
  closeForm(){$('#modalRoot').innerHTML='';renderMain()},
  formDownload(){const p=pipeById(S.route.id);if(!p.form.phaseId)p.form.phaseId=p.phases[0]?.id;save();downloadBlob(new Blob([genFormHtml(p)],{type:'text/html'}),`formulario-${norm(p.name).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'pipy'}.html`);toast('Formulário baixado. Envie o arquivo HTML para quem vai preencher.')},
  async newPhase(){const p=pipeById(S.route.id);const n=await promptBox('Nova fase','Nome da fase','');if(!n)return;p.phases.push({id:uid(),name:n,color:COLORS[p.phases.length%COLORS.length],fields:[],automations:[]});save();renderMain()},
  phaseMenu(el){const p=pipeById(S.route.id);openPop(el,phaseMenuHtml(phaseOf(p,el.dataset.ph)))},
  async phRename(el){closePop();const p=pipeById(S.route.id),ph=phaseOf(p,el.dataset.ph);const n=await promptBox('Renomear fase','Nome da fase',ph.name);if(!n)return;ph.name=n;save();renderMain()},
  phColor(el){const p=pipeById(S.route.id),ph=phaseOf(p,el.dataset.ph);ph.color=el.dataset.c;save();renderMain()},
  phMove(el){const p=pipeById(S.route.id);const i=p.phases.findIndex(x=>x.id===el.dataset.ph);const j=i+ +el.dataset.d;if(j<0||j>=p.phases.length)return closePop();[p.phases[i],p.phases[j]]=[p.phases[j],p.phases[i]];save();renderMain()},
  async phDelete(el){closePop();const p=pipeById(S.route.id),ph=phaseOf(p,el.dataset.ph);const n=p.cards.filter(c=>c.phaseId===ph.id).length;
    if(n){toast(`A fase <b>${esc(ph.name)}</b> tem ${n} card(s). Mova-os para outra fase antes de excluir.`,'warn',5000);return}
    if(!await confirmBox('Excluir fase',`Excluir a fase <b>${esc(ph.name)}</b>, seus ${ph.fields.length} campo(s) e ${ph.automations.length} automação(ões)? Valores desses campos nos cards serão perdidos.`,'Excluir',true))return;
    const ids=ph.fields.map(f=>f.id);p.cards.forEach(c=>ids.forEach(id=>delete c.values[id]));p.phases=p.phases.filter(x=>x!==ph);save();renderMain()},
  newCard(el){const p=pipeById(S.route.id);const phId=el.dataset.ph||p.phases[0]?.id;if(!phId)return;
    const now=nowISO();const c=normCard({id:uid(),title:'',phaseId:phId,createdAt:now,phaseEnteredAt:now,history:[{phaseId:phId,enteredAt:now,leftAt:null}],values:{}});autoFill(p,c,phId);
    S.draftCard=c;S.openCard={pipeId:p.id,cardId:c.id,draft:true};$('#modalRoot').innerHTML='';renderCardModal()},
  createCard(){const{pipe,card}=curCard();card.title=(card.title||'').trim();
    if(!card.title){toast('Informe o título do card.','warn');$('#draftTitle')?.focus();return}
    const bl=blockers(pipe,card);if(bl.length){toast(`Resolva antes de criar: <b>${bl.map(esc).join(', ')}</b>`,'warn',5000);return}
    const now=nowISO();card.createdAt=card.phaseEnteredAt=card.history[0].enteredAt=now;logCard(card,'Criou o card',`Fase ${phaseOf(pipe,card.phaseId).name}`);
    pipe.cards.push(card);S.draftCard=null;S.openCard=null;$('#modalRoot').innerHTML='';runAuto(pipe,card,card.phaseId,'enter');save();renderMain();
    const el=document.querySelector(`[data-card="${card.id}"]`);if(el){el.scrollIntoView({block:'nearest'});el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),1600)}toast('Card criado.')},
  openCard(el){openCard(S.route.id,el.dataset.id)},
  openCardAny(el){openCard(el.dataset.p,el.dataset.id)},
  closeModal(){closeModal()},
  cardTab(el){S.cardTab=el.dataset.t;renderCardModal();if(S.cardTab==='comments')$('#cmIn')?.focus()},
  cfgFromCard(el){const p=S.openCard.pipeId;closeModal();go({v:'phase',id:p,ph:el.dataset.ph})},
  tagToggle(el){const{pipe,card}=curCard();const{f}=findField(pipe,el.dataset.f);let v=Array.isArray(card.values[f.id])?card.values[f.id]:[];const o=el.dataset.o;const on=!v.includes(o);
    v=on?(f.multiple?[...v,o]:[o]):v.filter(x=>x!==o);card.values[f.id]=v;card.updatedAt=nowISO();
    if(!S.openCard.draft){logCard(card,on?'Aplicou tag':'Removeu tag',`${f.label}: ${optLabel(f,o)}`);save();checkComplete(pipe,card)}renderCardModal()},
  async fileDl(el){const{card}=curCard();const x=card.values[el.dataset.f][+el.dataset.i];try{const f=await readFile(x.path);downloadBlob(f,x.name)}catch(e){toast('Arquivo não encontrado na pasta: '+esc(x.path),'err',5000)}},
  async fileRm(el){const{pipe,card}=curCard();const list=card.values[el.dataset.f];const x=list[+el.dataset.i];if(!await confirmBox('Remover arquivo',`Remover <b>${esc(x.name)}</b> do card e da pasta?`,'Remover',true)){renderCardModal();return}
    await removePath(x.path);list.splice(+el.dataset.i,1);if(!S.openCard.draft){logCard(card,'Removeu anexo',x.name);save()}$('#modalRoot').innerHTML='';renderCardModal()},
  async cardDelete(){const{pipe,card}=curCard();if(await deleteCardFlow(pipe,card)){S.openCard=null;$('#modalRoot').innerHTML='';lastTrashed=card.id;renderMain()}else renderCardModal()},
  async cardDel(el){const pipe=pipeById(el.dataset.p||S.route.id);const card=pipe?.cards.find(c=>c.id===el.dataset.id);if(!card)return;if(await deleteCardFlow(pipe,card)){lastTrashed=card.id;renderMain()}},
  undoTrash(el){const t=S.db.trash.find(x=>x.kind==='card'&&x.item.id===lastTrashed);if(t&&restoreTrash(t)){renderMain();toast('Card restaurado.')}el.closest('.toast')?.remove()},
  addComment(){const{card}=curCard();const t=$('#cmIn').value.trim();if(!t)return;card.comments.push({id:uid(),by:S.user,at:nowISO(),text:t});logCard(card,'Comentou',t.slice(0,80));save();renderCardModal();$('#cmIn')?.focus()},
  rmComment(el){const{card}=curCard();card.comments=card.comments.filter(c=>c.id!==el.dataset.id);logCard(card,'Apagou um comentário');save();renderCardModal()},
  addField(el){const{ph}=phaseCtx();const it=PALETTE.find(x=>x.k===el.dataset.t);const f=newField(it.t,it.preset);ph.fields.push(f);S.selField=f.id;save();renderFbAll();renderAutoPanel()},
  selField(el,e){if(e.target.closest('[data-act="rmField"]'))return;S.selField=el.dataset.id;renderFbList();renderFbProps()},
  async rmField(el,e){e.stopPropagation();const{p,ph}=phaseCtx();const f=ph.fields.find(x=>x.id===el.dataset.id);const used=p.cards.filter(c=>!isEmptyVal(f,c.values[f.id])&&!['time','phasetag'].includes(f.type)).length;
    if(used&&!await confirmBox('Remover campo',`O campo <b>${esc(f.label)}</b> tem valores em ${used} card(s). Remover mesmo assim?`,'Remover',true))return;
    ph.fields=ph.fields.filter(x=>x!==f);p.cards.forEach(c=>{if(f.type==='file'&&Array.isArray(c.values[f.id]))c.values[f.id].forEach(x=>removePath(x.path));delete c.values[f.id]});if(S.selField===f.id)S.selField=null;save();renderFbAll();renderAutoPanel()},
  optAdd(){const f=selF();f.options.push(f.type==='tag'?{id:uid(),label:'Nova tag',color:COLORS[f.options.length%COLORS.length]}:{id:uid(),label:'Nova opção'});save();renderFbProps();renderFbMini()},
  optRm(el){const f=selF();f.options=f.options.filter(o=>o.id!==el.dataset.o);save();renderFbProps();renderFbMini()},
  adAdd(){const{ph}=phaseCtx();const a=S.ad;
    const need={addTag:a.fieldId&&a.optId,removeTag:a.fieldId&&a.optId,setField:a.fieldId&&String(a.value).trim(),move:a.phaseId,comment:a.text.trim()}[a.action];
    if(!need){toast('Complete os dados da automação.','warn');return}
    ph.automations.push({id:uid(),trigger:a.trigger,action:a.action,fieldId:a.fieldId,optId:a.optId,value:a.value,phaseId:a.phaseId,text:a.text});S.ad=null;save();renderAutoPanel();renderFbAll();toast('Automação adicionada.')},
  adRm(el){const{ph}=phaseCtx();ph.automations=ph.automations.filter(a=>a.id!==el.dataset.id);save();renderAutoPanel();renderFbAll()},
  bfClear(){S.boardF[S.route.id]={q:'',tag:'',resp:'',stale:false};renderMain()},
  printReport(){window.print()},
  exportCsv(){exportCsv()},
  trashRestore(el){const t=S.db.trash.find(x=>x.id===el.dataset.id);if(t&&restoreTrash(t)){toast(`${t.kind==='pipe'?'Pipy':'Card'} restaurado.`);renderMain()}},
  async trashPurge(el){const t=S.db.trash.find(x=>x.id===el.dataset.id);if(!t)return;if(!await confirmBox('Excluir definitivamente',`Apagar <b>${esc(t.kind==='pipe'?t.item.name:t.item.title)}</b> e seus anexos da pasta? Isso não pode ser desfeito.`,'Excluir definitivamente',true))return;await purgeTrash(t);save();renderMain()},
  async trashEmpty(){if(!await confirmBox('Esvaziar lixeira',`Apagar definitivamente os ${S.db.trash.length} item(ns) da lixeira e seus anexos?`,'Esvaziar',true))return;for(const t of S.db.trash.slice())await purgeTrash(t);save();renderMain()},
  personAdd(){const n=$('#personIn').value.trim();if(!n)return;ensurePerson(n);renderMain()},
  personRm(el){S.db.settings.people=S.db.settings.people.filter(x=>x!==el.dataset.n);save();renderMain()},
  async zipDownload(){toast('Gerando ZIP...','ok',1500);try{downloadBlob(await buildBackupZip(),`pipyscox-${stamp()}.zip`)}catch(e){toast('Erro ao gerar ZIP: '+esc(e.message),'err')}},
  async backupFolder(){try{await backupToFolder();loadBackups()}catch(e){toast('Erro no backup: '+esc(e.message),'err')}},
  async bkDl(el){downloadBlob(await readFile('backups/'+el.dataset.n),el.dataset.n)},
  async bkRm(el){if(!await confirmBox('Excluir backup',`Excluir <b>${esc(el.dataset.n)}</b>?`,'Excluir',true)){renderMain();return}await removePath('backups/'+el.dataset.n);renderMain()},
  async bkRestore(el){if(!await confirmBox('Restaurar backup',`Restaurar <b>${esc(el.dataset.n)}</b>? Os dados atuais serão substituídos (um backup deles será criado antes).`,'Restaurar',true)){renderMain();return}
    try{const f=await readFile('backups/'+el.dataset.n);await restoreZip(await f.arrayBuffer())}catch(e){toast('Erro ao restaurar: '+esc(e.message),'err',6000)}},
  async changeFolder(){const h=await pickFolder();if(!h)return;if(!await verifyPerm(h,true))return;
    if(await h.isSameEntry?.(S.dir)){toast('Essa já é a pasta atual.','warn');return}
    let has=false;try{await h.getFileHandle(DBFILE);has=true}catch(e){}
    if(!has&&S.db.pipes.length&&await confirmBox('Pasta vazia',`A pasta <b>${esc(h.name)}</b> ainda não tem dados do pipyscox. Copiar os dados atuais (incluindo arquivos) para ela?`,'Copiar dados')){
      await flush();const all=await walk(S.dir);for(const e of all){if(e.path.startsWith('backups/'))continue;await writeFile(e.path,await e.handle.getFile(),h)}}
    await openDir(h);S.route={v:'config'};renderAll();toast('Pasta alterada para <b>'+esc(h.name)+'</b>')},
  async reloadData(){await loadDb();renderAll();toast('Dados recarregados da pasta.')},
  async conflictReload(){$('#modalRoot').innerHTML='';S.openCard=null;await loadDb();renderAll();setSaveState('ok');toast('Dados recarregados da pasta.')},
  async conflictOverwrite(){$('#modalRoot').innerHTML='';try{const n=await backupToFolder(true,'backup',true);await flush(true);toast(`Suas alterações foram gravadas. A versão externa ficou salva em <b>backups/${esc(n)}</b>.`,'ok',6000)}catch(e){toast('Erro: '+esc(e.message),'err')}},
  async gateChoose(){const h=await pickFolder();if(h)await openDir(h)},
  async gateReconnect(){const h=await kvGet('dir');if(h&&await verifyPerm(h,true))await openDir(h);else toast('Permissão não concedida.','warn')}
};
