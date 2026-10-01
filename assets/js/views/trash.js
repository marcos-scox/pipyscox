/* pipyscox · views/trash.js
   Tela da lixeira */
'use strict';
/* ===================== Lixeira ===================== */
function viewTrash(){
  crumbs([{t:'Home',attrs:'data-v="home"'},{t:'Lixeira'}]);const T=S.db.trash.slice().sort((a,b)=>new Date(b.deletedAt)-new Date(a.deletedAt));
  $('#content').innerHTML=`<div class="page-head"><h1 class="page">Lixeira</h1><div class="sp"></div>${T.length?`<button class="btn ghost" style="color:var(--danger)" data-act="trashEmpty">${ic('trash')} Esvaziar lixeira</button>`:''}</div>
  <p class="muted" style="margin:-6px 0 16px">Cards e pipys excluídos ficam aqui por ${TRASH_DAYS} dias e podem ser restaurados. Depois disso, eles e seus anexos são apagados da pasta definitivamente.</p>
  <div class="panel">${T.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Item</th><th>Tipo</th><th>Pipy</th><th>Excluído em</th><th>Por</th><th>Expira em</th><th></th></tr></thead><tbody>
  ${T.map(t=>`<tr><td><b>${esc(t.kind==='pipe'?t.item.name:t.item.title)}</b>${t.kind==='pipe'?` <span class="muted">(${t.item.cards.length} cards)</span>`:''}</td><td><span class="chip soft">${t.kind==='pipe'?'Pipy':'Card'}</span></td><td>${esc(t.pipeName)}</td><td>${fmtDateTime(t.deletedAt)}</td><td>${esc(t.by||'-')}</td><td>${daysLeft(t)} dia(s)</td>
  <td style="white-space:nowrap"><button class="btn ghost sm" data-act="trashRestore" data-id="${t.id}">${ic('refresh')} Restaurar</button> <button class="icon-btn" data-act="trashPurge" data-id="${t.id}" title="Excluir definitivamente" style="color:var(--danger)">${ic('trash')}</button></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty">${ic('bin')}<div>A lixeira está vazia.</div></div>`}</div>`;
}
