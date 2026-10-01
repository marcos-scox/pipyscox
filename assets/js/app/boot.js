/* pipyscox · app/boot.js
   Inicialização */
'use strict';
/* ===================== Inicialização ===================== */
(async function boot(){
  try{S.theme=localStorage.getItem('pipyscox-theme')||'dark';S.user=localStorage.getItem('pipyscox-user')||''}catch(e){}
  renderTheme();renderAvatar();
  if(!('showDirectoryPicker' in window)){showGate('unsupported');return}
  const h=await kvGet('dir');
  if(h){try{if(await verifyPerm(h,false)){await openDir(h);return}showGate('reconnect',h.name)}catch(e){showGate('choose')}}
  else showGate('choose');
})();
