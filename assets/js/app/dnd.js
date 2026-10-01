/* pipyscox · app/dnd.js
   Arrastar e soltar (cards, fases e campos) */
'use strict';
/* ===================== Arrastar e soltar ===================== */
document.addEventListener('dragstart',e=>{
  const card=e.target.closest?.('[data-card]'),ph=e.target.closest?.('[data-phdrag]'),pal=e.target.closest?.('[data-ftype]'),fb=e.target.closest?.('[data-fid]');
  if(card)S.drag={k:'card',id:card.dataset.card,el:card};else if(ph)S.drag={k:'phase',id:ph.dataset.phdrag};
  else if(pal)S.drag={k:'new',t:pal.dataset.ftype};else if(fb)S.drag={k:'field',id:fb.dataset.fid,el:fb};else return;
  e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','pipyscox');requestAnimationFrame(()=>S.drag?.el?.classList.add('dragging'));
});
function clearDnD(){document.querySelectorAll('.drop-target,.ph-target,.over').forEach(x=>x.classList.remove('drop-target','ph-target','over'));document.querySelectorAll('.fb-ph').forEach(x=>x.remove());const em=document.querySelector('.fb-empty');if(em)em.style.display=''}
function fbIndex(list,y){const items=[...list.querySelectorAll('.fb-item:not(.dragging)')];for(let i=0;i<items.length;i++){const r=items[i].getBoundingClientRect();if(y<r.top+r.height/2)return{i,items}}return{i:items.length,items}}
document.addEventListener('dragover',e=>{const d=S.drag;if(!d)return;
  if(d.k==='card'||d.k==='phase'){const col=e.target.closest('.col[data-col]');if(!col)return;e.preventDefault();document.querySelectorAll('.drop-target,.ph-target').forEach(x=>x!==col&&x.classList.remove('drop-target','ph-target'));col.classList.add(d.k==='card'?'drop-target':'ph-target')}
  if(d.k==='new'||d.k==='field'){const list=e.target.closest('#fbList');if(!list)return;e.preventDefault();list.classList.add('over');
    const{i,items}=fbIndex(list,e.clientY);let ph=list.querySelector('.fb-ph');if(!ph){ph=document.createElement('div');ph.className='fb-ph'}
    const empty=list.querySelector('.fb-empty');if(empty)empty.style.display='none';if(items[i])list.insertBefore(ph,items[i]);else list.appendChild(ph)}});
document.addEventListener('dragleave',e=>{const list=e.target.closest?.('#fbList');if(list&&!list.contains(e.relatedTarget)){list.classList.remove('over');list.querySelectorAll('.fb-ph').forEach(x=>x.remove());const em=list.querySelector('.fb-empty');if(em)em.style.display=''}});
document.addEventListener('drop',e=>{const d=S.drag;if(!d)return;e.preventDefault();
  if(d.k==='card'){const col=e.target.closest('.col[data-col]');if(col){const p=pipeById(S.route.id);const c=p.cards.find(x=>x.id===d.id);if(c&&moveCard(p,c,col.dataset.col)){p.cards=p.cards.filter(x=>x!==c);p.cards.push(c)}renderBoard()}}
  if(d.k==='phase'){const col=e.target.closest('.col[data-col]');if(col&&col.dataset.col!==d.id){const p=pipeById(S.route.id);const from=p.phases.findIndex(x=>x.id===d.id);const[m]=p.phases.splice(from,1);const to=p.phases.findIndex(x=>x.id===col.dataset.col);p.phases.splice(to,0,m);save();renderBoard()}}
  if(d.k==='new'||d.k==='field'){const list=e.target.closest('#fbList');if(list){const{ph}=phaseCtx();const{i}=fbIndex(list,e.clientY);
    if(d.k==='new'){const it=PALETTE.find(x=>x.k===d.t);const f=newField(it.t,it.preset);ph.fields.splice(i,0,f);S.selField=f.id}else{const f=ph.fields.find(x=>x.id===d.id);ph.fields=ph.fields.filter(x=>x!==f);ph.fields.splice(i,0,f)}save();renderFbAll();renderAutoPanel()}}
  clearDnD();S.drag=null});
document.addEventListener('dragend',()=>{clearDnD();document.querySelectorAll('.dragging').forEach(x=>x.classList.remove('dragging'));S.drag=null});
