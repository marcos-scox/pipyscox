# pipyscox

Sistema de gestão de fluxos no estilo kanban, inspirado no Pipefy, para equipes que cuidam de dados de pessoas.

**Demonstração online:** [abrir o pipyscox](https://htmlpreview.github.io/?https://raw.githubusercontent.com/marcos-scox/pipyscox/cac36be/index.html?v=mobile-20261001-fix5)

**Download offline:** [baixar o pipyscox standalone (.html)](https://github.com/marcos-scox/pipyscox/raw/031247ce30baec46b289596517843bdce000963c/dist/pipyscox-standalone.html) — arquivo único, funciona sem instalação.

**Android (APK):** [baixar pipyscox para Android v0.2.0](https://github.com/marcos-scox/pipyscox/releases/download/android-v0.2.0/pipyscox-android.apk) — prévia para Android 7.0+ (cerca de 4,2 MB). É assinada com chave de desenvolvimento e não é uma build da Play Store; ao instalar, o Android pode pedir autorização para instalar apps desta fonte.

> **Ao atualizar outra prévia:** builds assinadas com chaves de desenvolvimento diferentes podem exigir a desinstalação da versão anterior. Antes, exporte um ZIP em **Configurações → Baixar ZIP**; a desinstalação pode apagar os dados que estejam somente no armazenamento interno do app.

> **Ao atualizar outra prévia:** builds assinadas com chaves de desenvolvimento diferentes podem exigir a desinstalação da versão anterior. Antes, exporte um ZIP em **Configurações → Baixar ZIP**; a desinstalação pode apagar os dados que estejam somente no armazenamento interno do app.

O sistema roda diretamente no navegador, sem servidor e sem instalação. No computador, os dados ficam na pasta local escolhida pelo usuário. No APK Android, também é possível escolher uma pasta pelo seletor nativo do sistema ou salvar no armazenamento interno do app. Em navegadores mobile sem seleção de pastas, os dados ficam no armazenamento local do navegador.

> **Compatibilidade:** use uma versão atual do navegador. No APK, a pasta é escolhida pelo seletor nativo do Android; no Android 11 ou superior, escolha uma subpasta, pois o sistema não permite selecionar a raiz do armazenamento ou a pasta Downloads. No computador, o modo de pasta compartilhada requer a File System Access API (Chrome/Edge). Em navegadores mobile sem essa API, use **Salvar neste celular**: os recursos continuam disponíveis, mas os dados ficam restritos ao armazenamento desse navegador e não sincronizam sozinhos entre aparelhos.

## Como usar

1. Abra a [demonstração online](https://htmlpreview.github.io/?https://raw.githubusercontent.com/marcos-scox/pipyscox/cac36be/index.html?v=mobile-20261001-fix5), descompacte o projeto e abra `index.html`, ou instale o APK no Android pelo link acima.
2. Na primeira execução, escolha uma pasta no computador; no APK Android, escolha uma pasta pelo seletor do sistema ou toque em **Salvar neste celular** e informe seu nome. No navegador mobile sem seletor de pasta, use **Salvar neste celular**.
3. Use o menu lateral para criar pipys, configurar fases, cadastrar cards e acompanhar relatórios.
4. Para compartilhar ou mover os dados, use **Configurações → Baixar ZIP**. No computador também pode enviar a pasta inteira; no APK Android, escolha onde salvar ou compartilhar o ZIP na folha nativa do sistema.

A versão [standalone](dist/pipyscox-standalone.html) reúne HTML, CSS e JavaScript em um único arquivo para distribuição offline. Para regenerá-la depois de editar o código:

```bash
python3 tools/build_standalone.py
```

## Recursos

- Pipys com fases, cores, ordem e cards arrastáveis.
- Tempo na fase ao vivo e filtros por texto, tag, fase percorrida, responsável e inatividade.
- Campos de texto, número, moeda, e-mail, telefone, CPF, datas, lista, checkbox, responsável, arquivos e tags.
- Comentários e histórico de atividades por card.
- Automações por fase: aplicar ou remover tag, preencher campo, mover card e comentar.
- Formulário externo opcional e importação de cards por CSV.
- Relatórios por pipy com exportação em PDF.
- Lixeira de 30 dias, backup automático e aviso de alterações feitas em outro computador.
- Tema escuro/claro, animações configuráveis e interface responsiva para celular e tablet, com navegação em gaveta, áreas de toque maiores e quadro Kanban com rolagem horizontal; no celular, cards também podem ser movidos pela seleção **Mover para a fase** ao abrir o card.

## Estrutura do projeto

```text
pipyscox/
├── index.html                       ← entrada da aplicação
├── assets/
│   ├── css/                         ← estilos base, telas e responsividade
│   ├── js/
│   │   ├── core/                    ← modelo, armazenamento, ZIP e automações
│   │   ├── ui/                      ← shell, modais e animações
│   │   ├── views/                   ← dashboard, quadro, cards, dados e relatórios
│   │   ├── features/                ← formulário externo e importação CSV
│   │   └── app/                     ← ações, eventos, drag-and-drop e inicialização
│   └── img/logo.svg
├── dist/pipyscox-standalone.html    ← versão em arquivo único
├── android/                          ← projeto nativo Android (Capacitor)
├── capacitor.config.json             ← configuração do app Android
├── package.json                      ← dependências e comandos de build Android
├── .github/workflows/android-apk.yml  ← build e publicação automática do APK
├── exemplos/importar-cards-exemplo.csv
└── tools/                             ← geradores web/Android
```

Os scripts são carregados em ordem no `index.html`, sem módulos ES, para que o sistema continue funcionando ao abrir o arquivo diretamente.

## Dados e privacidade

A pasta escolhida pelo usuário contém:

```text
<sua pasta>/
├── pipyscox.json
├── arquivos/<pipy>/<card>/
└── backups/
```

Essa pasta pode conter dados pessoais e, dependendo do uso, dados sensíveis. Mantenha o acesso restrito, compartilhe apenas com quem precisa e evite enviar ZIPs por canais abertos.

## Desenvolvimento local

Para testar com um servidor local:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000` no Chrome ou Edge.

## Licença

Este projeto ainda não possui uma licença de código aberto definida.
