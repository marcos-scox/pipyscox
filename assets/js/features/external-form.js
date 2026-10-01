/* pipyscox · features/external-form.js
   Formulário externo (opcional por pipy) */
'use strict';
/* ===================== Formulário externo (opcional por pipy) ===================== */
function formModal(){
  const p=pipeById(S.route.id);const fm=p.form;const phId=fm.phaseId&&phaseOf(p,fm.phaseId)?fm.phaseId:p.phases[0]?.id;
  const ph=phaseOf(p,phId);const flds=ph?ph.fields.filter(f=>!['time','phasetag','resp'].includes(f.type)):[];
  openModal(`<div class="modal-h">${ic('form')}<h3>Formulário externo</h3><button class="icon-btn" data-act="closeForm">${ic('x')}</button></div><div class="modal-b">
  <p class="muted" style="margin:0 0 14px;font-size:13px">Opcional, para usar caso a caso: gera um arquivo HTML de formulário que você envia para alguém preencher (por e-mail, WhatsApp...). A pessoa preenche no navegador e baixa um arquivo de resposta; você importa esse arquivo aqui e ele vira um card.</p>
  <label class="chk"><input type="checkbox" data-ch="formSet" data-k="enabled" ${fm.enabled?'checked':''}> <b>Ativar formulário externo neste pipy</b></label>
  ${fm.enabled?`<label class="f"><span>Fase onde o card será criado</span><select class="input" data-ch="formSet" data-k="phaseId">${p.phases.map(x=>`<option value="${x.id}" ${x.id===phId?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label>
  <label class="f"><span>Título do formulário</span><input class="input" data-in="formSet" data-k="title" value="${esc(fm.title||p.name)}"></label>
  <label class="f"><span>Descrição (opcional)</span><textarea class="input" data-in="formSet" data-k="desc" style="min-height:60px">${esc(fm.desc)}</textarea></label>
  <label class="f"><span>Rótulo do campo de identificação (vira o título do card)</span><input class="input" data-in="formSet" data-k="titleLabel" value="${esc(fm.titleLabel)}"></label>
  <label class="chk"><input type="checkbox" data-ch="formSet" data-k="consent" ${fm.consent?'checked':''}> Exigir aceite de uso dos dados (LGPD)</label>
  ${fm.consent?`<label class="f"><span>Texto do aceite</span><textarea class="input" data-in="formSet" data-k="consentText" style="min-height:60px">${esc(fm.consentText)}</textarea></label>`:''}
  <div class="fl">Campos incluídos (da fase “${esc(ph?.name||'')}”)</div><div class="tagsel" style="margin-bottom:6px">${flds.map(f=>`<span class="chip soft">${esc(f.label)}${f.required?' *':''}</span>`).join('')||'<span class="muted">Nenhum campo nesta fase — só a identificação será pedida.</span>'}</div>
  <div class="muted" style="font-size:12px">Campos de responsável, tempo e tag de fase são internos e não aparecem no formulário. Sempre que mudar os campos, gere o formulário de novo.</div>`:''}
  </div><div class="modal-f"><button class="btn ghost" data-act="closeForm">Fechar</button>${fm.enabled?`<button class="btn primary" data-act="formDownload">${ic('down')} Baixar formulário HTML</button>`:''}</div>`,'md');
}
function genFormHtml(p){
  const fm=p.form;const ph=phaseOf(p,fm.phaseId)||p.phases[0];
  const spec={pipeId:p.id,pipeName:p.name,phaseId:ph.id,title:fm.title||p.name,desc:fm.desc||'',titleLabel:fm.titleLabel||'Nome completo',consent:fm.consent?fm.consentText:'',
    fields:ph.fields.filter(f=>!['time','phasetag','resp'].includes(f.type)).map(f=>({id:f.id,type:f.type,label:f.label,required:!!f.required,multiline:!!f.multiline,placeholder:f.placeholder||'',options:(f.options||[]).map(o=>({id:o.id,label:o.label})),multiple:!!f.multiple,accept:f.accept||''}))};
  const json=JSON.stringify(spec).replace(/</g,'\\u003c');
  const css='*{box-sizing:border-box}body{margin:0;background:#f3f4f7;font:15px/1.5 system-ui,Segoe UI,Roboto,Arial,sans-serif;color:#252b36}main{max-width:640px;margin:0 auto;padding:32px 16px}.card{background:#fff;border:1px solid #dbdfe6;border-radius:12px;padding:28px;box-shadow:0 8px 30px rgba(30,40,60,.08)}h1{margin:0 0 6px;font-size:24px}.desc{color:#4a5160;margin:0 0 20px;white-space:pre-wrap}.fld{margin-bottom:16px}label.l{display:block;font-weight:600;font-size:13.5px;margin-bottom:6px}b.r{color:#e05555}input,select,textarea{width:100%;font:inherit;padding:10px 12px;border:1px solid #cfd4dc;border-radius:8px;background:#fff}textarea{min-height:90px}input:focus,select:focus,textarea:focus{outline:0;border-color:#5856d6;box-shadow:0 0 0 3px rgba(88,86,214,.2)}.ck{display:flex;gap:10px;align-items:flex-start;font-weight:400;margin:6px 0}.ck input{width:18px;height:18px;margin-top:2px;flex:none}.err{color:#c53030;font-size:13px;display:block;margin-top:4px}.err:empty{display:none}button{background:#5856d6;color:#fff;border:0;border-radius:8px;padding:12px 20px;font:inherit;font-weight:600;cursor:pointer;width:100%}button:hover{background:#4b49c4}.ok{text-align:center}.ok svg{width:56px;height:56px;color:#2eb85c}.foot{text-align:center;color:#768192;font-size:12px;margin-top:16px}';
  const js="var S=JSON.parse(document.getElementById('spec').textContent);function e(s){return String(s==null?'':s).replace(/[&<>\"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]})}"+
  "function dg(s){return String(s||'').replace(/\\D/g,'')}function cpfOk(v){var c=dg(v);if(c.length!==11||/^(\\d)\\1+$/.test(c))return false;var s=0,i,r;for(i=0;i<9;i++)s+=+c[i]*(10-i);r=(s*10)%11%10;if(r!==+c[9])return false;s=0;for(i=0;i<10;i++)s+=+c[i]*(11-i);r=(s*10)%11%10;return r===+c[10]}"+
  "function mCPF(v){var d=dg(v).slice(0,11);return d.replace(/^(\\d{3})(\\d)/,'$1.$2').replace(/^(\\d{3})\\.(\\d{3})(\\d)/,'$1.$2.$3').replace(/\\.(\\d{3})(\\d)/,'.$1-$2')}function mTel(v){var d=dg(v).slice(0,11);if(d.length<=2)return d.length?'('+d:'';if(d.length<=6)return'('+d.slice(0,2)+') '+d.slice(2);if(d.length<=10)return'('+d.slice(0,2)+') '+d.slice(2,6)+'-'+d.slice(6);return'('+d.slice(0,2)+') '+d.slice(2,7)+'-'+d.slice(7)}"+
  "document.getElementById('ttl').textContent=S.title;document.title=S.title;document.getElementById('dsc').textContent=S.desc;"+
  "var h='<div class=\"fld\"><label class=\"l\">'+e(S.titleLabel)+' <b class=\"r\">*</b></label><input id=\"f__title\"><small class=\"err\" id=\"e__title\"></small></div>';"+
  "S.fields.forEach(function(f){var id='f_'+f.id,i='';var lab='<label class=\"l\">'+e(f.label)+(f.required?' <b class=\"r\">*</b>':'')+'</label>';"+
  "if(f.type==='text')i=f.multiline?'<textarea id=\"'+id+'\" placeholder=\"'+e(f.placeholder)+'\"></textarea>':'<input id=\"'+id+'\" placeholder=\"'+e(f.placeholder)+'\">';"+
  "else if(f.type==='number')i='<input type=\"number\" step=\"any\" id=\"'+id+'\">';else if(f.type==='currency')i='<input type=\"number\" step=\"0.01\" min=\"0\" id=\"'+id+'\" placeholder=\"R$ 0,00\">';"+
  "else if(f.type==='email')i='<input type=\"email\" id=\"'+id+'\" placeholder=\"nome@email.com\">';else if(f.type==='phone')i='<input type=\"tel\" id=\"'+id+'\" placeholder=\"(DD) 99999-9999\" data-m=\"tel\">';"+
  "else if(f.type==='cpf')i='<input inputmode=\"numeric\" id=\"'+id+'\" placeholder=\"000.000.000-00\" data-m=\"cpf\">';else if(f.type==='date')i='<input type=\"date\" id=\"'+id+'\">';"+
  "else if(f.type==='select')i='<select id=\"'+id+'\"><option value=\"\">Selecione...</option>'+f.options.map(function(o){return'<option value=\"'+o.id+'\">'+e(o.label)+'</option>'}).join('')+'</select>';"+
  "else if(f.type==='tag')i=f.options.map(function(o){return'<label class=\"ck\"><input type=\"'+(f.multiple?'checkbox':'radio')+'\" name=\"'+id+'\" value=\"'+o.id+'\"> '+e(o.label)+'</label>'}).join('');"+
  "else if(f.type==='checkbox'){lab='';i='<label class=\"ck\"><input type=\"checkbox\" id=\"'+id+'\"> '+e(f.label)+(f.required?' <b class=\"r\">*</b>':'')+'</label>'}"+
  "else if(f.type==='file')i='<input type=\"file\" multiple id=\"'+id+'\"'+(f.accept?' accept=\"'+e(f.accept)+'\"':'')+'><small style=\"color:#768192\">Até 10 MB por arquivo.</small>';"+
  "h+='<div class=\"fld\">'+lab+i+'<small class=\"err\" id=\"e_'+f.id+'\"></small></div>'});"+
  "if(S.consent)h+='<div class=\"fld\"><label class=\"ck\"><input type=\"checkbox\" id=\"f__consent\"> '+e(S.consent)+' <b class=\"r\">*</b></label><small class=\"err\" id=\"e__consent\"></small></div>';"+
  "document.getElementById('fields').innerHTML=h;"+
  "document.addEventListener('input',function(ev){var t=ev.target;if(t.dataset.m==='cpf')t.value=mCPF(t.value);if(t.dataset.m==='tel')t.value=mTel(t.value)});"+
  "function rd(file){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result)};r.onerror=rej;r.readAsDataURL(file)})}"+
  "var last=null;document.getElementById('frm').addEventListener('submit',async function(ev){ev.preventDefault();var bad=0,vals={},files={};function er(k,m){var x=document.getElementById('e_'+k);if(x)x.textContent=m||'';if(m)bad++}"+
  "var t=document.getElementById('f__title').value.trim();er('_title',t?'':'Campo obrigatório');"+
  "for(var j=0;j<S.fields.length;j++){var f=S.fields[j],el=document.getElementById('f_'+f.id),v;er(f.id,'');"+
  "if(f.type==='tag'){v=[].slice.call(document.querySelectorAll('input[name=\"f_'+f.id+'\"]:checked')).map(function(x){return x.value});if(f.required&&!v.length)er(f.id,'Selecione ao menos uma opção');vals[f.id]=v;continue}"+
  "if(f.type==='checkbox'){v=el.checked;if(f.required&&!v)er(f.id,'Obrigatório');vals[f.id]=v;continue}"+
  "if(f.type==='file'){var fl=[].slice.call(el.files);if(f.required&&!fl.length)er(f.id,'Anexe ao menos um arquivo');var big=fl.filter(function(x){return x.size>10485760});if(big.length)er(f.id,'Arquivo acima de 10 MB: '+big[0].name);files[f.id]=fl;continue}"+
  "v=el.value.trim();if(f.required&&!v){er(f.id,'Campo obrigatório');continue}if(!v)continue;"+
  "if(f.type==='email'&&!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(v))er(f.id,'E-mail inválido');if(f.type==='cpf'&&!cpfOk(v))er(f.id,'CPF inválido');if(f.type==='phone'&&(dg(v).length<10||dg(v).length>11))er(f.id,'Telefone incompleto');vals[f.id]=v}"+
  "if(S.consent){var c=document.getElementById('f__consent').checked;er('_consent',c?'':'É necessário aceitar para enviar')}"+
  "if(bad){var fe=document.querySelector('.err:not(:empty)');if(fe)fe.scrollIntoView({block:'center'});return}"+
  "var out={pipyscoxForm:1,responseId:Date.now().toString(36)+Math.random().toString(36).slice(2,8),pipeId:S.pipeId,phaseId:S.phaseId,submittedAt:new Date().toISOString(),title:t,values:vals,files:{},consent:S.consent?{text:S.consent,acceptedAt:new Date().toISOString()}:null};"+
  "for(var k in files){out.files[k]=[];for(var q=0;q<files[k].length;q++){var fx=files[k][q];out.files[k].push({name:fx.name,type:fx.type,size:fx.size,data:await rd(fx)})}}"+
  "last=new Blob([JSON.stringify(out)],{type:'application/json'});dl();document.getElementById('frm').style.display='none';document.getElementById('done').style.display='block'});"+
  "function dl(){var a=document.createElement('a');a.href=URL.createObjectURL(last);a.download='resposta-'+(document.getElementById('f__title').value.trim().replace(/[^\\w\\-]+/g,'_').slice(0,40)||'formulario')+'.pipyform.json';document.body.appendChild(a);a.click();a.remove()}"+
  "document.getElementById('again').onclick=dl;";
  return'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Formulário</title><style>'+css+'</style></head><body><main><div class="card">'+
  '<form id="frm" novalidate><h1 id="ttl"></h1><p class="desc" id="dsc"></p><div id="fields"></div><button type="submit">Enviar respostas</button></form>'+
  '<div id="done" class="ok" style="display:none"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></svg><h1>Respostas salvas</h1><p class="desc">Um arquivo <b>.pipyform.json</b> foi baixado no seu computador. Envie esse arquivo para quem te mandou este formulário.</p><button type="button" id="again">Baixar o arquivo novamente</button></div>'+
  '</div><div class="foot">Formulário gerado pelo pipyscox · seus dados ficam só no seu computador até você enviar o arquivo.</div></main>'+
  '<script type="application/json" id="spec">'+json+'<'+'/script><script>'+js+'<'+'/script></body></html>';
}
async function importFormResponses(fileList){
  const p=pipeById(S.route.id);let ok=0,skip=0,dup=0;
  for(const file of fileList){
    try{const o=JSON.parse(await file.text());
      if(o.pipyscoxForm!==1||o.pipeId!==p.id){skip++;continue}
      if(p.imported.includes(o.responseId)){dup++;continue}
      const phId=phaseOf(p,o.phaseId)?o.phaseId:(phaseOf(p,p.form.phaseId)?p.form.phaseId:p.phases[0].id);
      const at=nowISO();const c=normCard({id:uid(),title:String(o.title||'Resposta do formulário').slice(0,200),phaseId:phId,createdAt:at,phaseEnteredAt:at,history:[{phaseId:phId,enteredAt:at,leftAt:null}],values:{}});
      for(const[fid,v]of Object.entries(o.values||{})){const{f}=findField(p,fid);if(!f||f.type==='file')continue;
        if(f.type==='tag')c.values[fid]=(Array.isArray(v)?v:[]).filter(id=>f.options.some(x=>x.id===id));
        else if(f.type==='select')c.values[fid]=f.options.some(x=>x.id===v)?v:'';
        else if(f.type==='checkbox')c.values[fid]=!!v;else c.values[fid]=f.type==='cpf'?maskCPF(v):f.type==='phone'?maskPhone(v):String(v)}
      for(const[fid,list]of Object.entries(o.files||{})){const{f}=findField(p,fid);if(!f||f.type!=='file')continue;c.values[fid]=[];
        for(const x of list){const blob=await(await fetch(x.data)).blob();const safe=String(x.name).replace(/[\\/:*?"<>|]+/g,'_');const path=`arquivos/${p.id}/${c.id}/${Date.now()}-${safe}`;await writeFile(path,blob);c.values[fid].push({name:x.name,path,size:blob.size,type:x.type,addedAt:at})}}
      logCard(c,'Criado via formulário externo',`Enviado em ${fmtDateTime(o.submittedAt)} · arquivo ${file.name}`);
      if(o.consent)logCard(c,'Aceite LGPD registrado',`Aceito em ${fmtDateTime(o.consent.acceptedAt)}`);
      autoFill(p,c,phId);p.cards.push(c);p.imported.push(o.responseId);runAuto(p,c,phId,'enter');ok++;
    }catch(e){console.error(e);skip++}
  }
  save();renderMain();toast(`${ok} resposta(s) importada(s)${dup?`, ${dup} já importada(s) antes`:''}${skip?`, ${skip} arquivo(s) ignorado(s) (não pertencem a este pipy ou estão corrompidos)`:''}.`,ok?'ok':'warn',6000);
}
