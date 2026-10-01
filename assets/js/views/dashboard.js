/* pipyscox · views/dashboard.js
   Tela inicial (dashboard) */
'use strict';
/* ===================== Dashboard ===================== */
function lastDays(n,fn){const out=[];for(let i=n-1;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const e=new Date(d);e.setDate(e.getDate()+1);out.push(fn(d,e))}return out}
function chartLine(vals,area){const w=300,h=80,pad=12;const max=Math.max(1,...vals),min=Math.min(...vals);const span=Math.max(1,max-min);const pts=vals.map((v,i)=>[pad+i*(w-2*pad)/(vals.length-1||1),h-14-(v-min)/span*(h-36)]);
  if(area){const d='M0,'+pts[0][1]+pts.map(p=>' L'+p[0]+','+p[1]).join('')+` L${w},${pts[pts.length-1][1]} L${w},${h} L0,${h}Z`;return`<svg class="w-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${d}" fill="rgba(255,255,255,.22)" stroke="rgba(255,255,255,.55)" stroke-width="2"/></svg>`}
  return`<svg class="w-chart" viewBox="0 0 ${w} ${h}"><polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1.5"/>${pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="none" stroke="#fff" stroke-width="1.2"/>`).join('')}</svg>`}
function chartBars(vals){const w=300,h=80,n=vals.length,bw=(w-20)/n*.55,max=Math.max(1,...vals);return`<svg class="w-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${vals.map((v,i)=>{const bh=Math.max(4,v/max*(h-18));return`<rect x="${10+i*(w-20)/n}" y="${h-bh}" width="${bw}" height="${bh}" fill="rgba(255,255,255,.28)"/>`}).join('')}</svg>`}
function viewHome(){
  crumbs([{t:'Home',attrs:'data-v="home"'},{t:'Dashboard'}]);
  const cards=S.db.pipes.flatMap(p=>p.cards.map(c=>({p,c})));
  const files=cards.reduce((a,{p,c})=>a+cardFiles(p,c),0);
  const stale=cards.filter(({p,c})=>c.phaseId!==p.phases[p.phases.length-1]?.id&&Date.now()-new Date(c.phaseEnteredAt)>7*864e5).length;
  const created=lastDays(12,(a,b)=>cards.filter(({c})=>{const d=new Date(c.createdAt);return d>=a&&d<b}).length);
  const moves=lastDays(12,(a,b)=>cards.reduce((s,{c})=>s+c.history.filter(h=>{const d=new Date(h.enteredAt);return d>=a&&d<b}).length,0));
  let acc=0;const cum=created.map(v=>acc+=v);const today=created[created.length-1];
  const pipeCards=S.db.pipes.map(p=>`<div class="pipe-card" data-act="go" data-v="pipe" data-id="${p.id}"><span class="bar" style="background:${p.color}"></span>
    <h4>${esc(p.name)}</h4><div class="muted">${p.phases.length} fases · ${p.cards.length} cards</div>
    <div class="phase-strip">${p.phases.map(ph=>{const n=p.cards.filter(c=>c.phaseId===ph.id).length;return`<span title="${esc(ph.name)}: ${n}" style="background:${ph.color};opacity:${n?1:.3}"></span>`}).join('')}</div></div>`).join('');
  $('#content').innerHTML=`
  <div class="widgets">
    <div class="widget" style="background:#5856d6"><div class="w-top"><div><div class="w-val">${cards.length}<small>(+${today} hoje)</small></div><div class="w-lbl">Cards</div></div></div>${chartLine(created)}</div>
    <div class="widget" style="background:#3399ff"><div class="w-top"><div><div class="w-val">${S.db.pipes.length}<small>(${S.db.pipes.reduce((a,p)=>a+p.phases.length,0)} fases)</small></div><div class="w-lbl">Pipys</div></div></div>${chartLine(moves)}</div>
    <div class="widget" style="background:#f0ad1a"><div class="w-top"><div><div class="w-val">${files}</div><div class="w-lbl">Arquivos anexados</div></div></div>${chartLine(cum.length>1?cum:[0,0],true)}</div>
    <div class="widget" style="background:#e05555"><div class="w-top"><div><div class="w-val">${stale}<small>(+7 dias)</small></div><div class="w-lbl">Cards parados na fase</div></div></div>${chartBars(moves)}</div>
  </div>
  <div class="panel"><div class="panel-h"><div style="flex:1"><h3>Fluxos criados</h3><div class="muted" style="font-size:13px">Clique para abrir o quadro</div></div><button class="btn primary" data-act="newPipe">${ic('plus')} Novo pipy</button></div>
  <div class="panel-b">${S.db.pipes.length?`<div class="pipe-grid">${pipeCards}</div>`:`<div class="empty">${ic('board')}<div style="font-size:16px;color:var(--text);margin-bottom:6px">Nenhum pipy ainda</div><div style="margin-bottom:18px">Crie seu primeiro fluxo ou carregue um exemplo para explorar.</div><div class="row" style="justify-content:center"><button class="btn primary" data-act="newPipe">${ic('plus')} Criar pipy</button><button class="btn ghost" data-act="examplePipe">Carregar exemplo</button></div></div>`}</div></div>`;
}
