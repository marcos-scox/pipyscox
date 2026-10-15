/* pipyscox · views/about.js
   Informações do aplicativo e links de distribuição */
'use strict';
function viewAbout(){
  crumbs([{t:'Sistema'},{t:'Sobre'}]);
  const repo='https://github.com/marcos-scox/pipyscox';
  const apk=`${repo}/releases/download/android-v${APP_VERSION}/pipyscox-android.apk`;
  $('#content').innerHTML=`<div class="about-page view-in">
    <section class="panel about-hero">
      <div class="about-brand">${LOGO}</div>
      <div class="about-intro">
        <span class="badge new">PIPYSCOX PARA ANDROID</span>
        <h1>Seu fluxo de trabalho, no seu celular.</h1>
        <p>Organize pipys, fases, cards, anexos e relatórios em uma interface feita para acompanhar você.</p>
      </div>
      <div class="about-actions">
        <a class="btn primary" href="${apk}" target="_blank" rel="noopener">${ic('down')} Baixar APK v${APP_VERSION}</a>
        <a class="btn ghost" href="${repo}" target="_blank" rel="noopener">${ic('github')} Abrir meu GitHub</a>
      </div>
    </section>
    <div class="about-note">${ic('info')} <span>APK de prévia com assinatura de desenvolvimento para instalação direta. Não é uma build da Play Store; o Android pode pedir autorização para instalar apps desta fonte.</span></div>
    <section class="about-grid">
      <article class="panel about-card"><span class="about-icon">${ic('info')}</span><div><span class="about-label">Aplicativo</span><h2>pipyscox</h2><p>Gestão visual de fluxos no estilo Kanban.</p></div></article>
      <article class="panel about-card"><span class="about-icon">${ic('refresh')}</span><div><span class="about-label">Versão Android</span><h2>${APP_VERSION}</h2><p>Compatível com Android 7.0 ou superior.</p></div></article>
      <article class="panel about-card"><span class="about-icon">${ic('folder')}</span><div><span class="about-label">Seus dados</span><h2>Você escolhe a pasta</h2><p>O Android pede autorização para a pasta escolhida. Também é possível usar o armazenamento local deste app.</p></div></article>
      <article class="panel about-card"><span class="about-icon">${ic('zap')}</span><div><span class="about-label">Uso offline</span><h2>Funciona sem internet</h2><p>Depois de instalado, os dados permanecem no aparelho ou na pasta que você autorizou.</p></div></article>
    </section>
    <section class="panel about-repo">
      <div><h2>Projeto e atualizações</h2><p>Veja o código-fonte, acompanhe mudanças e encontre as versões publicadas no GitHub.</p></div>
      <div class="about-actions">
        <a class="btn ghost" href="${repo}" target="_blank" rel="noopener">${ic('github')} Repositório</a>
        <a class="btn ghost" href="${repo}/releases" target="_blank" rel="noopener">${ic('archive')} Todas as versões</a>
      </div>
    </section>
  </div>`;
}
