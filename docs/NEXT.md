# OpsForms — Próximos passos

## Objetivo atual
Melhorar o fluxo de inclusão de atividades na linha do tempo do **SITOP Sondador** quando existem muitas linhas no turno.

## Em andamento
- Segundo botão **Adicionar linha** incluído ao final da lista.
- Botões superior e inferior criam a linha e direcionam o foco para o campo **Início** da nova atividade.
- Alteração limitada ao fluxo do SITOP Sondador, sem mudança no formato do relatório ou na persistência.

## Próximo passo
Sincronizar a rodada para o repositório local e validar no navegador com uma lista longa de atividades: botão inferior, botão superior, rolagem automática, foco em Início, persistência e remoção de linhas.

## Pendências
- Revisar se o `style.css` existente na raiz ainda possui função ou é legado antes de qualquer remoção.
- Configurar futuramente um Client ID próprio do Google para o rclone, pois o client compartilhado está em processo de descontinuação.

## Problemas conhecidos
- A melhoria de UX ainda não foi validada visualmente no navegador nesta rodada.
