# OpsForms — Changelog de Desenvolvimento

## 2026-09-16 — SITOP Sondador: inclusão contínua de atividades

### Alterado
- Adicionado um segundo botão **Adicionar linha** ao final da linha do tempo do SITOP Sondador.
- Tanto o botão superior quanto o inferior passam a criar a nova linha e levar o usuário diretamente a ela, com foco no campo **Início**.
- A criação automática/restauração de linhas continua sem deslocar a tela.

### Arquivos afetados
- `index.html`
- `js/app.js`
- `js/forms/sitop-sondador.js`
- `docs/PROJECT_MEMORY.md`
- `docs/CHANGELOG_DEV.md`
- `docs/NEXT.md`

### Motivo
- Evitar rolagens repetidas entre o topo e o fim da lista quando o turno possui muitas atividades registradas.

## 2026-09-16 — Caça-Desvio: identificação do colaborador

### Adicionado
- Campos **Nome** e **Matrícula** no cabeçalho do Caça-Desvio, logo após Área/Sistema e Data/Hora.
- Nome e matrícula também passam a constar no texto gerado para WhatsApp/Teams.

### Arquivos afetados
- `index.html`
- `js/forms/desvio.js`
- `docs/PROJECT_MEMORY.md`
- `docs/CHANGELOG_DEV.md`
- `docs/NEXT.md`

### Motivo
- Identificar o colaborador relacionado ao registro de Caça-Desvio diretamente no formulário e no reporte gerado.

## 2026-09-16

### Adicionado
- Estrutura de memória persistente do projeto em `docs/`.
- `PROJECT_MEMORY.md`, `CHANGELOG_DEV.md` e `NEXT.md`.

### Alterado
- `README.md` alinhado ao código atual: 6 formulários, módulos `sitop-sondador.js` e `comunicado-evento.js`, pasta `docs/` e checklist de regressão com os 6 formulários.
- Nenhum comportamento funcional da aplicação foi alterado nesta rodada.

### Corrigido
- Iniciada consolidação da documentação com base no código atualmente registrado em `main`.

### Arquivos afetados
- `README.md`
- `docs/PROJECT_MEMORY.md`
- `docs/CHANGELOG_DEV.md`
- `docs/NEXT.md`

### Motivo
- Evitar perda de contexto técnico entre sessões e permitir continuidade do desenvolvimento sem depender de memória de conversa.
- Tornar decisões, estado atual e próximo passo versionáveis junto com o código.

### Baseline
- `main`, commit `e87e475`, validado em 2026-09-16 antes da criação desta documentação.
