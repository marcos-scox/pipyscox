/* pipyscox · ui/animations.js
   Camada de animação: entrada de telas, contadores, destaque do card movido,
   fechamento suave de modais e troca de tema. Não altera dados. */
'use strict';
const ANIM={on:true,lastKey:'',moved:null,theme:null,viewT:null};
try{ANIM.on=localStorage.getItem('pipyscox-anim')!=='off'}catch(e){}
const reduceMotion=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
const animOn=()=>ANIM.on&&!reduceMotion.matches;
function applyAnimPref(){document.documentElement.classList.toggle('no-anim',!animOn())}
function setAnim(on){ANIM.on=on;try{localStorage.setItem('pipyscox-anim',on?'on':'off')}catch(e){}applyAnimPref()}
applyAnimPref();reduceMotion.addEventListener?.('change',applyAnimPref);

/* Numera os elementos para criar o efeito "cascata" (--i usado no CSS) */
function stagger(sel,root){root.querySelectorAll(sel).forEach((el,i)=>el.style.setProperty('--i',Math.min(i,24)))}

/* Contador animado para números de destaque (widgets e indicadores) */
function countUp(el){
  const node=[...el.childNodes].find(n=>n.nodeType===3&&/\d/.test(n.textContent));if(!node)return;
  const m=node.textContent.match(/^(\s*)(\d+)([\s\S]*)$/);if(!m)return;const target=+m[2];if(target<2)return;
  const t0=performance.now(),dur=750;
  const step=t=>{const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);node.textContent=m[1]+Math.round(target*e)+m[3];if(k<1)requestAnimationFrame(step)};
  node.textContent=m[1]+'0'+m[3];requestAnimationFrame(step);
}

function animateView(){
  if(!animOn())return;const c=$('#content');if(!c)return;
  clearTimeout(ANIM.viewT);c.classList.remove('view-in');void c.offsetWidth;
  ['.widget','.pipe-card','.stat','.col','.kcard','.panel','.pal-item','.fb-item','.tbl tbody tr','.rbar','.wchart g.wk','.auto-item'].forEach(s=>stagger(s,c));
  c.querySelectorAll('.w-val,.stat b').forEach(countUp);
  c.classList.add('view-in');
  ANIM.viewT=setTimeout(()=>c.classList.remove('view-in'),1600);
}

/* Anima a tela apenas quando a rota muda (não a cada redesenho) */
const _renderMain=renderMain;
renderMain=function(){
  _renderMain();
  const r=S.route,key=[r.v,r.id||'',r.ph||''].join('|');
  if(key!==ANIM.lastKey){ANIM.lastKey=key;animateView()}
};

/* Destaca o card que acabou de mudar de fase */
const _moveCard=moveCard;
moveCard=function(pipe,card,toId,opt){const ok=_moveCard(pipe,card,toId,opt);if(ok)ANIM.moved=card.id;return ok};
const _renderBoard=renderBoard;
renderBoard=function(){
  _renderBoard();
  if(ANIM.moved&&animOn()){const el=document.querySelector(`[data-card="${ANIM.moved}"]`);if(el){el.classList.add('drop-pop');setTimeout(()=>el.classList.remove('drop-pop'),600)}}
  ANIM.moved=null;
};

/* Fechamento suave do modal do card */
const _closeModal=closeModal;
closeModal=function(){
  const ov=$('#modalRoot .overlay');
  if(animOn()&&ov&&!ov.classList.contains('closing')){ov.classList.add('closing');setTimeout(_closeModal,150)}
  else _closeModal();
};

/* Transição de cores ao trocar o tema */
const _renderTheme=renderTheme;
renderTheme=function(){
  if(ANIM.theme&&ANIM.theme!==S.theme&&animOn()){const h=document.documentElement;h.classList.add('theming');setTimeout(()=>h.classList.remove('theming'),420)}
  ANIM.theme=S.theme;_renderTheme();
};

/* Opção em Configurações → Aparência */
C.animSet=el=>{setAnim(el.checked);toast(el.checked?'Animações ativadas.':'Animações desativadas.')};
