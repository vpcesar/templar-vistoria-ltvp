# Corrigir cadastro de patologia no celular

Dois problemas relatados no celular: (1) ao tocar nos botões de IA os dados já preenchidos da patologia desaparecem, (2) várias palavras aparecem "erradas" nas listas de seleção.

## 1. Nunca perder os dados da patologia

A ficha guarda tudo apenas na memória da tela. No celular, se a aba recarregar (falta de memória por causa das fotos, troca de app, queda de rede durante a chamada da IA), tudo é perdido.

Correções:
- Salvar automaticamente um rascunho da ficha em andamento no aparelho (a cada alteração, com pequeno atraso para não travar).
- Ao abrir a ficha, se existir rascunho da mesma patologia, restaurar os dados automaticamente.
- Limpar o rascunho ao salvar ou cancelar a patologia.
- Salvar o rascunho também imediatamente antes de cada chamada de IA, e quando o app vai para segundo plano.
- Garantir que uma falha da IA nunca derrube a tela: tratamento de erro isolado, sem propagar para o ErrorBoundary, mantendo o estado preenchido.

## 2. Palavras cortadas nas listas (o que parece erro de digitação)

Nos campos de seleção o texto é cortado em uma linha só, então em telas estreitas "Cobertura e Telhado" ou "Área de Serviço" aparecem pela metade e parecem palavras erradas. Os textos no código estão corretos.

Correções:
- Permitir que o rótulo selecionado ocupe duas linhas (ou reduza levemente a fonte) no celular, em vez de cortar.
- Aplicar o mesmo ajuste nos chips de manifestações e nas opções de classificação.
- Revisar em 360px de largura para confirmar que todos os rótulos ficam legíveis por inteiro.

## Detalhes técnicos

- `src/components/PatologiaForm.tsx`: rascunho em `localStorage` (chave `templar_patologia_rascunho`) com `useEffect` debounce + restauração no `useState` inicial via `useEffect` pós-hidratação; listener `visibilitychange`/`pagehide`; limpeza em salvar/cancelar; `executarIA` já isolado em try/catch — reforçar para nunca lançar.
- `src/components/fields.tsx`: trocar `truncate` do gatilho do `SearchSelect`/`SelectOrText` por texto com quebra (`line-clamp-2` / `text-left`) e ajuste de altura mínima; chips e `SegmentedOptions` com `whitespace-normal`.
- Verificação com Playwright em viewport 360x800: preencher a ficha, disparar IA com chave ausente (erro), confirmar que os campos permanecem, e capturar tela das listas.
