/* pipyscox · core/config.js
   Constantes, tipos de campo, estado global e utilitários */
'use strict';
/* =====================================================================
   pipyscox — gestão de fluxos estilo kanban com dados numa pasta local
   ===================================================================== */
const DBFILE='pipyscox.json';
const TRASH_DAYS=30;
const COLORS=['#5856d6','#3399ff','#2eb85c','#f0ad1a','#e05555','#e83e8c','#8b5cf6','#20c997','#fd7e14','#64748b'];
const FT={
  text:{label:'Texto',desc:'Texto curto ou longo',icon:'text',color:'#5856d6'},
  number:{label:'Número',desc:'Valor numérico',icon:'hash',color:'#6366f1'},
  currency:{label:'Moeda (R$)',desc:'Valor em reais',icon:'money',color:'#16a34a'},
  email:{label:'E-mail',desc:'Com validação',icon:'mail',color:'#0ea5e9'},
  phone:{label:'Telefone',desc:'(DD) 99999-9999',icon:'phone',color:'#14b8a6'},
  cpf:{label:'CPF',desc:'Com máscara e validação',icon:'idc',color:'#64748b'},
  date:{label:'Data',desc:'Data',icon:'cal',color:'#f0ad1a'},
  select:{label:'Lista de seleção',desc:'Escolha uma opção',icon:'list',color:'#a855f7'},
  checkbox:{label:'Checkbox',desc:'Sim / não',icon:'chkb',color:'#22c55e'},
  resp:{label:'Responsável',desc:'Pessoa da equipe',icon:'user',color:'#ec4899'},
  file:{label:'Arquivos',desc:'Anexos salvos na pasta',icon:'clip',color:'#3399ff'},
  tag:{label:'Tag',desc:'Etiquetas escolhidas no card',icon:'tag',color:'#e05555'},
  phasetag:{label:'Tag de fase',desc:'Automática: fases percorridas',icon:'board',color:'#8b5cf6'},
  time:{label:'Tempo na fase',desc:'Calculado automaticamente',icon:'clock',color:'#2eb85c'}
};
const PALETTE=[
  {k:'text',t:'text'},{k:'longtext',t:'text',label:'Texto longo',desc:'Várias linhas',preset:{multiline:true,label:'Observações'}},
  {k:'number',t:'number'},{k:'currency',t:'currency'},{k:'email',t:'email'},{k:'phone',t:'phone'},{k:'cpf',t:'cpf'},
  {k:'entry',t:'date',label:'Data de entrada',desc:'Preenchida ao entrar na fase',preset:{autoFill:true,label:'Data de entrada'}},
  {k:'date',t:'date',preset:{autoFill:false}},
  {k:'select',t:'select'},{k:'checkbox',t:'checkbox'},{k:'resp',t:'resp'},{k:'file',t:'file'},
  {k:'tag',t:'tag'},{k:'phasetag',t:'phasetag'},{k:'time',t:'time'}
];
const S={db:null,dir:null,route:{v:'home'},selField:null,drag:null,openCard:null,draftCard:null,cardTab:'fields',pop:null,theme:'dark',user:'',
  dataF:{pipe:'',q:'',phase:''},boardF:{},saveT:null,saving:false,lastMod:0,conflict:false,changeCount:0,backingUp:false,ad:null};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
const nowISO=()=>new Date().toISOString();
const todayLocal=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
function fmtDate(v){if(!v)return'';if(/^\d{4}-\d{2}-\d{2}$/.test(v)){const[y,m,d]=v.split('-');return`${d}/${m}/${y}`}const d=new Date(v);return isNaN(d)?v:d.toLocaleDateString('pt-BR')}
function fmtDateTime(v){const d=new Date(v);return isNaN(d)?'':d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function fmtDur(ms){ms=Math.max(0,ms);const sec=Math.floor(ms/1000),m=Math.floor(sec/60),h=Math.floor(m/60),d=Math.floor(h/24);if(d>0)return`${d}d ${h%24}h ${m%60}min`;if(h>0)return`${h}h ${m%60}min`;if(m>0)return`${m}min ${sec%60}s`;return`${sec}s`}
function fmtDurShort(ms){const h=ms/36e5;if(h>=48)return(h/24).toFixed(1).replace('.',',')+' dias';if(h>=1)return h.toFixed(1).replace('.',',')+' h';return Math.round(ms/60000)+' min'}
function fmtSize(b){if(b<1024)return b+' B';if(b<1048576)return(b/1024).toFixed(1)+' KB';return(b/1048576).toFixed(1)+' MB'}
const fmtMoney=v=>{const n=parseFloat(v);return isNaN(n)?'':n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})};
const initials=n=>String(n||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?';
const tick=(since)=>`<span class="tick" data-since="${since}">${fmtDur(Date.now()-new Date(since))}</span>`;
const digits=s=>String(s||'').replace(/\D/g,'');
function maskCPF(v){const d=digits(v).slice(0,11);return d.replace(/^(\d{3})(\d)/,'$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1-$2')}
function maskPhone(v){const d=digits(v).slice(0,11);if(d.length<=2)return d.length?'('+d:'';if(d.length<=6)return`(${d.slice(0,2)}) ${d.slice(2)}`;if(d.length<=10)return`(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;return`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`}
function validCPF(v){const c=digits(v);if(c.length!==11||/^(\d)\1+$/.test(c))return false;let s=0;for(let i=0;i<9;i++)s+=+c[i]*(10-i);let r=(s*10)%11%10;if(r!==+c[9])return false;s=0;for(let i=0;i<10;i++)s+=+c[i]*(11-i);r=(s*10)%11%10;return r===+c[10]}
const ic=(n,cls='')=>`<svg class="i ${cls}" viewBox="0 0 24 24">${ICONS[n]||''}</svg>`;
const fic=t=>`<span class="fic" style="background:${FT[t].color}">${ic(FT[t].icon)}</span>`;
const LOGO=`<svg class="brand-logo" viewBox="0 0 32 32"><path d="M16 2.5 27.7 9.2v13.6L16 29.5 4.3 22.8V9.2Z" fill="none" stroke="currentColor" stroke-width="2"/><rect x="10" y="10" width="3.2" height="12" rx="1.2" fill="#5856d6"/><rect x="14.4" y="10" width="3.2" height="8" rx="1.2" fill="#3399ff"/><rect x="18.8" y="10" width="3.2" height="10" rx="1.2" fill="#f0ad1a"/></svg>`;
function toast(msg,type='ok',ms=3400){const t=document.createElement('div');t.className='toast '+(type==='ok'?'':type);t.innerHTML=msg;$('#toasts').appendChild(t);setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),260)},ms)}
