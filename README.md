# pipyscox

Sistema de gestão de fluxos no estilo kanban, inspirado no Pipefy, para equipes que cuidam de dados de pessoas.

**Demonstração online:** [abrir o pipyscox](https://htmlpreview.github.io/?https://raw.githubusercontent.com/marcos-scox/pipyscox/6d1690c/index.html?v=mobile-20261001-fix4)

O sistema roda diretamente no navegador, sem servidor e sem instalação. No computador, os dados ficam na pasta local escolhida pelo usuário. Em celulares sem suporte à seleção de pastas, o sistema oferece um modo local que salva os dados no armazenamento do navegador.

> **Compatibilidade:** use uma versão atual do Google Chrome ou Microsoft Edge. O armazenamento em pasta usa a File System Access API; Firefox e Safari ainda não oferecem suporte suficiente para esse fluxo.

## Como usar

1. Abra a [demonstração online](https://htmlpreview.github.io/?https://raw.githubusercontent.com/marcos-scox/pipyscox/6d1690c/index.html?v=mobile-20261001-fix4) ou descompacte o projeto e abra `index.html`.
2. Na primeira execução, escolha uma pasta para os dados e informe seu nome.
3. Use o menu lateral para criar pipys, configurar fases, cadastrar cards e acompanhar relatórios.
4. No computador, para compartilhar ou mover os dados, use **Configurações → Baixar ZIP** ou envie a pasta inteira. No celular, os dados ficam neste navegador; para exportar, abra o sistema no computador.

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
- Tema escuro/claro, animações configuráveis e interface responsiva para celular e tablet.

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
├── exemplos/importar-cards-exemplo.csv
└── tools/build_standalone.py        ← gerador do arquivo standalone
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
