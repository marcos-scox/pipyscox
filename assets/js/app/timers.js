/* pipyscox · app/timers.js
   Contadores ao vivo, verificação da pasta e backup automático */
'use strict';
/* ===================== Timers ===================== */
setInterval(()=>{document.querySelectorAll('[data-since]').forEach(el=>{const ms=Date.now()-new Date(el.dataset.since);(el.querySelector('.tv')||el).textContent=fmtDur(ms);if(el.classList.contains('time-b')){const d=ms/864e5;el.classList.toggle('late',d>7);el.classList.toggle('warn',d>3&&d<=7)}})},1000);
setInterval(async()=>{
  if(!S.dir||!S.db||S.saveT||S.saving||S.conflict||S.drag||document.hidden)return;
  try{const f=await readFile(DBFILE);if(!S.lastMod||f.lastModified===S.lastMod)return;
    const ae=document.activeElement;if(ae&&ae.matches('input,textarea,select')&&$('#modalRoot').contains(ae))return;
    await loadDb();renderSidebar();
    if(S.openCard&&!S.openCard.draft){if(curCard().card)renderCardModal();else{$('#modalRoot').innerHTML='';S.openCard=null;renderMain()}}
    else if(!$('#modalRoot').innerHTML)renderMain();
    toast('Dados atualizados: a pasta foi alterada em outra janela ou computador.','ok',4000);
  }catch(e){}
},4000);
setInterval(()=>{if(S.db)maybeAutoBackup()},36e5);
