/* pipyscox · views/reports.js
   Relatórios por pipy */
'use strict';
/* ===================== Relatórios ===================== */
function weekStart(d){const x=new Date(d);x.setHours(0,0,0,0);const wd=(x.getDay()+6)%7;x.setDate(x.getDate()-wd);return x}
function viewReport(){
  const p=pipeById(S.route.id);const now=Date.now();
  crumbs([{t:'Home',attrs:'data-v="home"'},{t:p.name,attrs:`data-v="pipe" data-id="${p.id}"`},{t:'Relatórios'}]);
  const last=p.phases[p.phases.length-1];
  const enteredLast=c=>last&&c.history.find(h=>h.phaseId===last.id);
  const concluded=p.cards.filter(c=>last&&c.phaseId===last.id);
  const doneTimes=concluded.map(c=>new Date(enteredLast(c)?.enteredAt||c.phaseEnteredAt)-new Date(c.createdAt));
  const avgDone=doneTimes.length?doneTimes.reduce((a,b)=>a+b,0)/doneTimes.length:0;
  const open=p.cards.filter(c=>!last||c.phaseId!==last.id);
  const stale=open.filter(c=>now-new Date(c.phaseEnteredAt)>7*864e5).length;
  const per=p.phases.map(ph=>{const ds=[];p.cards.forEach(c=>c.history.forEach(h=>{if(h.phaseId===ph.id)ds.push((h.leftAt?new Date(h.leftAt):now)-new Date(h.enteredAt))}));return{ph,now:p.cards.filter(c=>c.phaseId===ph.id).length,avg:ds.length?ds.reduce((a,b)=>a+b,0)/ds.length:0,visits:ds.length}});
  const work=per.filter(x=>x.ph!==last);const bott=work.reduce((m,x)=>x.avg>(m?m.avg:0)?x:m,null);
  const maxAvg=Math.max(1,...per.map(x=>x.avg)),maxNow=Math.max(1,...per.map(x=>x.now));
  const W=8,w0=weekStart(new Date(now-7*(W-1)*864e5));const weeks=[...Array(W)].map((_,i)=>{const a=new Date(w0);a.setDate(a.getDate()+7*i);const b=new Date(a);b.setDate(b.getDate()+7);
    return{a,cr:p.cards.filter(c=>{const d=new Date(c.createdAt);return d>=a&&d<b}).length,dn:p.cards.filter(c=>{const h=enteredLast(c);if(!h)return false;const d=new Date(h.enteredAt);return d>=a&&d<b}).length}});
  const bar=(lb,color,val,max,txt,title)=>`<div class="rbar" title="${esc(title||'')}"><span class="lb"><span style="width:9px;height:9px;border-radius:3px;background:${color};flex:none"></span>${esc(lb)}</span><div class="tr"><div class="fi" style="width:${Math.max(.5,val/max*100)}%;background:${color}"></div></div><span class="vl">${txt}</span></div>`;
  const tagFields=allFields(p).filter(({f})=>f.type==='tag'||f.type==='select');
  const tagBlocks=tagFields.map(({f})=>{const counts=(f.options||[]).map(o=>({o,n:p.cards.filter(c=>f.type==='tag'?(c.values[f.id]||[]).includes(o.id):c.values[f.id]===o.id).length}));const mx=Math.max(1,...counts.map(x=>x.n));
    return`<div class="panel"><div class="panel-h"><h3 style="font-size:15px">${esc(f.label)}</h3><span class="muted" style="font-size:13px">cards por ${f.type==='tag'?'tag':'opção'}</span></div><div class="panel-b">${counts.map(x=>bar(x.o.label,x.o.color||'var(--s1)',x.n,mx,x.n)).join('')||'<span class="muted">Sem opções.</span>'}</div></div>`}).join('');
  $('#content').innerHTML=`<div class="page-head"><h1 class="page">Relatório · ${esc(p.name)}</h1><div class="sp"></div><button class="btn ghost no-print" data-act="go" data-v="pipe" data-id="${p.id}">${ic('board')} Voltar ao quadro</button><button class="btn primary no-print" data-act="printReport">${ic('print')} Exportar PDF</button></div>
  <p class="print-only muted">Gerado em ${fmtDateTime(nowISO())} por ${esc(S.user)} · pipyscox</p>
  <div class="stat-row">
    <div class="stat" style="border-left-color:var(--primary)"><b>${p.cards.length}</b><span class="muted">cards no total</span></div>
    <div class="stat" style="border-left-color:var(--info)"><b>${open.length}</b><span class="muted">em andamento</span></div>
    <div class="stat" style="border-left-color:var(--success)"><b>${concluded.length}</b><span class="muted">concluídos${last?` (fase “${esc(last.name)}”)`:''}</span></div>
    <div class="stat" style="border-left-color:var(--warning)"><b>${doneTimes.length?fmtDurShort(avgDone):'—'}</b><span class="muted">tempo médio até concluir</span></div>
    <div class="stat" style="border-left-color:var(--danger)"><b>${stale}</b><span class="muted">parados há +7 dias</span></div>
  </div>
  <div class="rep-grid">
    <div class="panel"><div class="panel-h"><h3 style="font-size:15px">Tempo médio por fase</h3>${bott&&bott.avg?`<span class="chip" style="background:var(--danger)">Gargalo: ${esc(bott.ph.name)}</span>`:''}</div><div class="panel-b">${per.map(x=>bar(x.ph.name,x.ph.color,x.avg,maxAvg,x.visits?fmtDurShort(x.avg):'—',`${x.visits} passagem(ns)`)).join('')}</div></div>
    <div class="panel"><div class="panel-h"><h3 style="font-size:15px">Cards em cada fase agora</h3></div><div class="panel-b">${per.map(x=>bar(x.ph.name,x.ph.color,x.now,maxNow,x.now)).join('')}</div></div>
  </div>
  <div class="panel" style="margin-bottom:20px"><div class="panel-h"><h3 style="font-size:15px">Criados × concluídos por semana</h3><span class="muted" style="font-size:13px">últimas ${W} semanas</span></div><div class="panel-b">
    <div class="legend"><span><i style="background:var(--s1)"></i>Criados</span><span><i style="background:var(--s2)"></i>Concluídos</span></div>${weekChart(weeks)}</div></div>
  ${tagBlocks?`<div class="rep-grid">${tagBlocks}</div>`:''}
  <div class="panel"><div class="panel-h"><h3 style="font-size:15px">Detalhe por fase</h3></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Fase</th><th class="num">Cards agora</th><th class="num">Passagens</th><th class="num">Tempo médio</th></tr></thead><tbody>
  ${per.map(x=>`<tr><td><span class="chip" style="background:${x.ph.color}">${esc(x.ph.name)}</span></td><td class="num">${x.now}</td><td class="num">${x.visits}</td><td class="num">${x.visits?fmtDurShort(x.avg):'—'}</td></tr>`).join('')}</tbody></table></div></div>`;
}
function weekChart(weeks){
  const w=720,h=220,pl=34,pr=8,pt=18,pb=28,iw=w-pl-pr,ih=h-pt-pb;const max=Math.max(1,...weeks.flatMap(x=>[x.cr,x.dn]));
  const step=Math.ceil(max/4)||1,top=step*4;const gw=iw/weeks.length,bw=Math.min(22,gw*.32);const y=v=>pt+ih-v/top*ih;
  const rb=(x,v,cls)=>{if(!v)return'';const yy=y(v),hh=pt+ih-yy,r=Math.min(4,hh);return`<path d="M${x},${pt+ih} V${yy+r} Q${x},${yy} ${x+r},${yy} H${x+bw-r} Q${x+bw},${yy} ${x+bw},${yy+r} V${pt+ih} Z" fill="var(${cls})"/>`};
  let g='';for(let i=0;i<=4;i++){const yy=y(step*i);g+=`<line class="${i?'grid':'base'}" x1="${pl}" x2="${w-pr}" y1="${yy}" y2="${yy}"/><text x="${pl-6}" y="${yy+4}" text-anchor="end">${step*i}</text>`}
  const bars=weeks.map((k,i)=>{const cx=pl+gw*i+gw/2,x1=cx-bw-1,x2=cx+1;const lbl=`${String(k.a.getDate()).padStart(2,'0')}/${String(k.a.getMonth()+1).padStart(2,'0')}`;
    return`<g class="wk"><title>Semana de ${lbl}: ${k.cr} criado(s), ${k.dn} concluído(s)</title><rect class="hit" x="${pl+gw*i}" y="${pt}" width="${gw}" height="${ih}"/>${rb(x1,k.cr,'--s1')}${rb(x2,k.dn,'--s2')}
    ${k.cr?`<text class="vt" x="${x1+bw/2}" y="${y(k.cr)-4}" text-anchor="middle">${k.cr}</text>`:''}${k.dn?`<text class="vt" x="${x2+bw/2}" y="${y(k.dn)-4}" text-anchor="middle">${k.dn}</text>`:''}<text x="${cx}" y="${h-8}" text-anchor="middle">${lbl}</text></g>`}).join('');
  return`<svg class="wchart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Cards criados e concluídos por semana">${g}${bars}</svg>`;
}
