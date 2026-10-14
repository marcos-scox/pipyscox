/* pipyscox · app/boot.js
   Inicialização */
'use strict';
/* ===================== Inicialização ===================== */
const mobileUA=/Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
const deviceWidth=Number(window.screen?.width)||window.innerWidth;
const isMobileDevice=window.matchMedia?.('(max-width:640px)').matches||/iPhone|iPod|Windows Phone/i.test(navigator.userAgent)||(mobileUA&&deviceWidth<=900);
document.documentElement.classList.toggle('mobile-device',!!isMobileDevice);
if(isMobileDevice&&deviceWidth){document.documentElement.style.setProperty('--mobile-app-width',`${deviceWidth}px`);if(window.screen?.height)document.documentElement.style.setProperty('--mobile-app-height',`${window.screen.height}px`)}
(async function boot(){
  try{S.theme=localStorage.getItem('pipyscox-theme')||'dark';S.user=localStorage.getItem('pipyscox-user')||''}catch(e){}
  renderTheme();renderAvatar();
  const h=await kvGet('dir');
  if(h?.local){await openLocalStore();return}
  if(!('showDirectoryPicker' in window)){showGate('unsupported');return}
  if(h){try{if(await verifyPerm(h,false)){await openDir(h);return}showGate('reconnect',h.name)}catch(e){showGate('choose')}}
  else showGate('choose');
})();
