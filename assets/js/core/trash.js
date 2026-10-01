/* pipyscox · core/trash.js
   Lixeira com retenção de 30 dias */
'use strict';
/* ===================== Lixeira ===================== */
function trashCard(pipe,card){pipe.cards=pipe.cards.filter(c=>c!==card);logCard(card,'Enviou para a lixeira');
  S.db.trash.push({id:uid(),kind:'card',pipeId:pipe.id,pipeName:pipe.name,item:card,deletedAt:nowISO(),by:S.user});save()}
function trashPipe(pipe){S.db.pipes=S.db.pipes.filter(p=>p!==pipe);S.db.trash.push({id:uid(),kind:'pipe',pipeId:pipe.id,pipeName:pipe.name,item:pipe,deletedAt:nowISO(),by:S.user});save()}
function restoreTrash(t){
  if(t.kind==='pipe'){if(pipeById(t.item.id)){toast('Esse pipy já existe.','warn');return false}S.db.pipes.push(normPipe(t.item))}
  else{const p=pipeById(t.pipeId);if(!p){toast(`O pipy <b>${esc(t.pipeName)}</b> também está na lixeira ou foi apagado. Restaure o pipy primeiro.`,'warn',5000);return false}
    const c=normCard(t.item);if(!phaseOf(p,c.phaseId)&&p.phases[0]){const now=nowISO();const cur=c.history.find(h=>!h.leftAt);if(cur)cur.leftAt=now;c.phaseId=p.phases[0].id;c.phaseEnteredAt=now;c.history.push({phaseId:c.phaseId,enteredAt:now,leftAt:null})}
    logCard(c,'Restaurou da lixeira');p.cards.push(c)}
  S.db.trash=S.db.trash.filter(x=>x!==t);save();return true}
async function purgeTrash(t){await removePath(t.kind==='pipe'?`arquivos/${t.item.id}`:`arquivos/${t.pipeId}/${t.item.id}`);S.db.trash=S.db.trash.filter(x=>x!==t)}
async function autoPurge(){const lim=Date.now()-TRASH_DAYS*864e5;const old=S.db.trash.filter(t=>new Date(t.deletedAt)<lim);for(const t of old)await purgeTrash(t);if(old.length){save();toast(`${old.length} item(ns) com mais de ${TRASH_DAYS} dias foram removidos da lixeira.`,'ok',4000)}}
const daysLeft=t=>Math.max(0,Math.ceil(TRASH_DAYS-(Date.now()-new Date(t.deletedAt))/864e5));
