# OpsForms — Project Memory

## Estado de referência

- Fonte da verdade: `git@github.com:Drilling-PR/OpsForms.git`
- Branch principal: `main`
- Baseline verificada em 2026-09-16: commit `e87e475` (`Adiciona formulario de Comunicado de Evento`).
- Workspace do ChatGPT: `Google Drive/Ferramentas_e_Projetos/OpsForms/Repo_Live`.
- O Drive é somente workspace. GitHub prevalece em caso de divergência.

## Objetivo do sistema

OpsForms é uma aplicação web estática para gerar registros e reportes operacionais padronizados, prontos para copiar/colar principalmente em WhatsApp ou Teams.

## Arquitetura atual

- HTML/CSS/JavaScript puro.
- Sem backend, servidor de aplicação ou banco de dados.
- Persistência local no navegador via `localStorage`.
- Publicável diretamente pelo GitHub Pages.
- Estrutura modular: controlador principal, configuração, utilitários, persistência e módulos específicos por formulário.

## Estrutura principal

- `index.html`: interface, seleção de formulário, campos, prévia e ações principais.
- `css/style.css`: temas, layout, responsividade e componentes visuais.
- `js/config.js`: listas e constantes compartilhadas.
- `js/utils.js`: funções utilitárias compartilhadas.
- `js/storage.js`: persistência de estado e preferências no `localStorage`.
- `js/app.js`: inicialização, troca de formulário, geração da prévia e integração dos módulos.
- `js/forms/*.js`: regras específicas de cada formulário.

## Formulários atualmente registrados no código

1. `sitop` — SITOP / Fiscalização.
2. `sitopSupervisor` — SITOP - Supervisor.
3. `sitopSondador` — SITOP - Sondador, com registro de 6 h e linha do tempo em intervalos de 15 min; a linha do tempo possui ação de adicionar linha no topo e no fim da lista, e novas linhas criadas manualmente recebem foco no campo Início.
4. `desvio` — Caça-Desvio; o cabeçalho inclui Sonda, Poço, Área/Sistema, Data/Hora, Nome e Matrícula.
5. `comunicadoEvento` — Comunicado de Evento.
6. `evento` — Captura de Evento / Lições Aprendidas.

Os módulos correspondentes ficam em `js/forms/`.

## Persistência e preferências

`js/storage.js` salva o estado dos formulários no navegador e mantém preferências reutilizáveis, incluindo último poço e última sonda quando disponíveis.

O tema visual também é persistido no `localStorage`.

Temas conhecidos:
- escuro (`dark`);
- claro (`light`);
- pink anos 1980 (`pink80`).

## Convenções de manutenção

- Um formulário não deve quebrar os demais.
- Alterações específicas devem permanecer, sempre que possível, no módulo do formulário e no bloco HTML correspondente.
- Evitar mudanças em `app.js`, `storage.js`, `utils.js` e `config.js` quando não forem necessárias.
- IDs/campos de novos formulários devem usar prefixos próprios para reduzir conflitos.
- Priorizar mudanças pequenas, rastreáveis e compatíveis.

## Fluxo de desenvolvimento

1. Atualizar `main` a partir do GitHub (`git fetch` / `git pull --ff-only`).
2. Sincronizar somente arquivos apropriados para `Repo_Live`.
3. Trabalhar no Drive com ChatGPT.
4. Retornar alterações ao repositório local.
5. Revisar `git status`, `git diff` e `git diff --cached`.
6. Testar localmente.
7. Commit e push somente após revisão.

## Teste local

Servidor simples recomendado:

```bash
python3 -m http.server 8000
```

Abrir `http://localhost:8000` e validar os formulários afetados e regressão básica dos demais.

## Segurança

Nunca versionar credenciais ou segredos, incluindo:
- GitHub PAT/OAuth/access/refresh tokens;
- chaves privadas SSH;
- `.env` com valores reais;
- credenciais Google/rclone;
- API keys, passwords, client secrets, cookies e credenciais de banco.

O remote SSH `git@github.com:Drilling-PR/OpsForms.git` é aceitável; a chave privada deve permanecer fora do projeto.

Antes de commit/push, revisar alterações e procurar segredos e arquivos inesperados.

## Pontos sensíveis

- `storage.js` afeta persistência transversal entre formulários.
- `app.js` integra todos os módulos; alteração pode produzir regressão ampla.
- O `README.md` deve acompanhar a estrutura real do código.
- GitHub é a fonte da verdade; nunca assumir que o Drive está mais atualizado.
