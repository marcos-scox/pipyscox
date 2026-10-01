/* pipyscox · features/csv-import.js
   Importação de cards via CSV */
'use strict';
/* ===================== Importar CSV ===================== */
function parseCSV(txt){txt=txt.replace(/^﻿/,'');const first=txt.split(/\r?\n/)[0]||'';const del=first.split(';').length>first.split(',').length?';':(first.split('\t').length>first.split(',').length?'\t':',');
  const rows=[];let row=[],cur='',q=false;for(let i=0;i<txt.length;i++){const ch=txt[i];
    if(q){if(ch==='"'){if(txt[i+1]==='"'){cur+='"';i++}else q=false}else cur+=ch}
    else if(ch==='"')q=true;else if(ch===del){row.push(cur);cur=''}else if(ch==='\n'){row.push(cur);rows.push(row);row=[];cur=''}else if(ch!=='\r')cur+=ch}
  if(cur||row.length){row.push(cur);rows.push(row)}return rows.filter(r=>r.some(c=>c.trim()))}
async function csvImportFlow(file){
  const p=pipeById(S.route.id);const buf=await file.arrayBuffer();let txt=new TextDecoder('utf-8').decode(buf);if(txt.includes('�'))txt=new TextDecoder('windows-1252').decode(buf);
  const rows=parseCSV(txt);if(rows.length<2){toast('O CSV precisa ter uma linha de cabeçalho e ao menos uma linha de dados.','warn');return}
  const head=rows[0].map(h=>h.trim());const fields=allFields(p).map(x=>x.f).filter(f=>!['file','time','phasetag'].includes(f.type));
  let tIdx=head.findIndex(h=>['titulo','title','nome','nome completo'].includes(norm(h)));if(tIdx<0)tIdx=0;
  const map=head.map((h,i)=>i===tIdx?{t:'title'}:{f:fields.find(f=>norm(f.label)===norm(h))});
  const data=rows.slice(1);
  if(!await confirmBox('Importar CSV',`<b>${data.length}</b> linha(s) serão criadas como cards na fase <b>${esc(p.phases[0].name)}</b>.<br><br><div class="fl">Mapeamento das colunas</div><div class="files">${head.map((h,i)=>`<div class="file"><span class="nm">${esc(h)}</span><span>${map[i].t?'<b>Título do card</b>':map[i].f?`→ ${esc(map[i].f.label)}`:'<span class="muted">ignorada</span>'}</span></div>`).join('')}</div><div class="muted" style="font-size:12px;margin-top:8px">As colunas são ligadas aos campos pelo nome (sem diferenciar maiúsculas e acentos). Datas em dd/mm/aaaa, tags separadas por vírgula, checkbox com "sim".</div>`,`Importar ${data.length} card(s)`)){renderMain();return}
  const ph=p.phases[0];let n=0;
  data.forEach(r=>{const at=nowISO();const c=normCard({id:uid(),title:(r[tIdx]||'').trim()||'Sem título',phaseId:ph.id,createdAt:at,phaseEnteredAt:at,history:[{phaseId:ph.id,enteredAt:at,leftAt:null}],values:{}});
    map.forEach((m,i)=>{if(m.f){const v=convertVal(m.f,r[i]);if(v!==undefined)c.values[m.f.id]=v}});
    logCard(c,'Importado de CSV',file.name);autoFill(p,c,ph.id);p.cards.push(c);runAuto(p,c,ph.id,'enter');n++});
  save();renderMain();toast(`${n} card(s) importado(s) do CSV.`);
}
