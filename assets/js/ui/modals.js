/* pipyscox · ui/modals.js
   Modais, confirmações e popovers */
'use strict';
/* ===================== Modais ===================== */
function openModal(html,cls='',closable=false){$('#modalRoot').innerHTML=`<div class="overlay" ${closable?'data-overlay':''}><div class="modal ${cls}">${html}</div></div>`;return $('#modalRoot .modal')}
function closeModal(){const o=S.openCard;$('#modalRoot').innerHTML='';S.openCard=null;if(o?.draft){removePath(`arquivos/${o.pipeId}/${o.cardId}`);S.draftCard=null;return}if(o)renderMain()}
function promptBox(title,label,value='',opts={}){return new Promise(res=>{openModal(`<div class="modal-h"><h3>${esc(title)}</h3>${opts.noCancel?'':`<button class="icon-btn" data-pb="0">${ic('x')}</button>`}</div><div class="modal-b">${opts.html||''}<label class="f"><span>${esc(label)}</span><input class="input" id="pbIn" value="${esc(value)}" placeholder="${esc(opts.placeholder||'')}"></label></div><div class="modal-f">${opts.noCancel?'':'<button class="btn ghost" data-pb="0">Cancelar</button>'}<button class="btn primary" data-pb="1">Confirmar</button></div>`);
  const inp=$('#pbIn');inp.focus();inp.select();const done=v=>{if(opts.noCancel&&!v)return inp.focus();$('#modalRoot').innerHTML='';res(v)};
  $('#modalRoot').querySelectorAll('[data-pb]').forEach(b=>b.onclick=()=>done(b.dataset.pb==='1'?(inp.value.trim()||null):null));
  inp.onkeydown=e=>{if(e.key==='Enter')done(inp.value.trim()||null);if(e.key==='Escape'&&!opts.noCancel)done(null)}})}
function confirmBox(title,msg,ok='Confirmar',danger=false){return new Promise(res=>{openModal(`<div class="modal-h"><h3>${esc(title)}</h3></div><div class="modal-b" style="color:var(--text-2)">${msg}</div><div class="modal-f"><button class="btn ghost" data-cb="0">Cancelar</button><button class="btn ${danger?'danger':'primary'}" data-cb="1">${esc(ok)}</button></div>`);
  $('#modalRoot').querySelectorAll('[data-cb]').forEach(b=>b.onclick=()=>{$('#modalRoot').innerHTML='';res(b.dataset.cb==='1')})})}
function closePop(){$('#popRoot').innerHTML='';S.pop=null}
function openPop(anchor,html){closePop();const r=anchor.getBoundingClientRect();const el=document.createElement('div');el.className='pop';el.innerHTML=html;$('#popRoot').appendChild(el);
  const w=el.offsetWidth,h=el.offsetHeight;let x=Math.min(r.left,innerWidth-w-10),y=r.bottom+6;if(y+h>innerHeight-10)y=Math.max(10,r.top-h-6);el.style.left=Math.max(10,x)+'px';el.style.top=y+'px'}
