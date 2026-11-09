# ERP completo TEMPLAR

Construa uma aplicação web mobile-first para inspeções de campo em Engenharia Civil (Vistoria Predial Residencial) para a empresa TEMPLAR ENGENHARIA. O aplicativo deve funcionar como ferramenta de coleta de dados que produz um relatório técnico estruturado (Laudo Técnico de Vistoria Predial — LTVP) seguindo o rigor metodológico do IBAPE, ABNT NBR 16747 e NBR 5674.

O objetivo principal é MINIMIZAR a digitação em campo. Use componentes modernos de interface como menu suspenso pesquisável, multi-seleção (chips/tags), botões de alternância (toggle), controles deslizantes (sliders) e upload de imagens. Cada campo técnico deve incluir um ícone de "informação" (tooltip) com breve explicação para orientar o usuário.

A aplicação deve integrar o serviço de IA do Google Gemini (Google Gemini API) para sugestão automática de Classificação, Recomendações Técnicas e Matriz GUT, reduzindo o tempo de preenchimento de cada patologia para menos de 60 segundos.

O laudo final deve ser gerado em DOIS formatos: Word (.docx) e PDF.

O acesso à aplicação deve ser protegido por login com e-mail e senha.

---

### 0. SISTEMA DE AUTENTICAÇÃO (LOGIN)

A aplicação deve exigir autenticação antes de acessar qualquer funcionalidade. Apenas um e-mail autorizado pode acessar o sistema.

#### 0.1 Arquitetura de Autenticação

Criar um AuthContext (React Context API) que gerencia:
- Estado de autenticação (logado/não logado)
- E-mail do usuário logado
- Sessão persistente (localStorage)
- Funções: login(), logout(), setupPassword()
- Verificação de primeiro acesso (cadastro de senha)

Estrutura do AuthContext (src/context/AuthContext.tsx):

- Constante AUTHORIZED_EMAIL = "vinicius.vpc@gmail.com" (e-mail único autorizado).
- STORAGE_KEYS: CREDENTIALS ("templar_auth_credentials") e SESSION ("templar_auth_session").
- Ao carregar o app (useEffect): verificar se há credenciais e sessão salvas no localStorage. Se houver sessão válida, autenticar automaticamente.
- Função setupPassword(email, password): valida se o e-mail é o autorizado, se a senha tem mínimo 6 caracteres, salva as credenciais (senha em base64) no localStorage, cria a sessão e autentica o usuário.
- Função login(email, password): valida o e-mail contra o autorizado, compara a senha (base64) com a salva, cria sessão se válido.
- Função logout(): remove a sessão do localStorage, desautentica o usuário.
- A senha NUNCA deve ser armazenada em texto puro — usar btoa() para codificar em base64.

#### 0.2 Tela de Login (src/components/LoginScreen.tsx)

Tela dedicada de login com a identidade visual TEMPLAR:

LAYOUT (centralizado vertical e horizontalmente):
- Fundo: cinza muito claro (#F7F8FA).
- Container central: max-width 448px (max-w-md).

LOGO (topo, centralizado):
- Escudo TEMPLAR em SVG (escudo vermelho #8B1A1A com cruz branca patée dentro).
- Abaixo: "TEMPLAR" em fonte serif bold, #2D3748.
- Abaixo: "ENGENHARIA" em sans-serif menor, uppercase, letter-spacing wide, cinza.

CARD DE LOGIN (branco, sombra suave, borda arredondada 12px, padding 32px):
- Título: "Primeiro Acesso" (se isFirstAccess=true) ou "Login" (se já tem senha cadastrada).
- Subtítulo: "Defina sua senha para acessar o sistema." ou "Acesse com suas credenciais para continuar."

CAMPOS DO FORMULÁRIO:
1. E-mail:
   - Ícone Mail (Lucide) à esquerda dentro do input.
   - Type: email, required.
   - Placeholder: "seu@email.com"
   - Estilo: padding 12px, borda cinza, focus ring vermelho #8B1A1A.

2. Senha:
   - Ícone Lock (Lucide) à esquerda.
   - Botão Eye/EyeOff (Lucide) à direita para mostrar/ocultar senha.
   - Type: password (toggle para text).
   - Placeholder: "Mínimo 6 caracteres" (primeiro acesso) ou "Sua senha".
   - Mesmo estilo do campo e-mail.

3. Confirmar Senha (APENAS no primeiro acesso):
   - Mesmo estilo do campo senha.
   - Placeholder: "Repita a senha".
   - Validação: deve ser igual à senha.

MENSAGEM DE ERRO:
- Se houver erro (e-mail não autorizado, senha incorreta, senhas não coincidem), exibir caixa com fundo vermelho claro (red-50), borda vermelha (red-200), ícone AlertCircle (Lucide) vermelho, e texto vermelho (red-700).

BOTÃO DE SUBMISSÃO:
- Largura total, fundo vermelho #8B1A1A, texto branco bold, padding 12px, borda arredondada 8px.
- Texto: "Definir Senha e Entrar" (primeiro acesso) ou "Entrar" (login normal).
- Estado loading: spinner Loader2 (Lucide) animado + texto "Processando...".
- Hover: fundo #7A1515.

RODAPÉ DA TELA:
- Texto pequeno: "TEMPLAR ENGENHARIA — Vistorias • Inspeções • Laudos • Perícias"
- Linha com hyperlinks: www.templarengenharia.com.br | templarengenharia@hotmail.com | WhatsApp (21) 98180-8812

LÓGICA DE SUBMISSÃO:
- Loading artificial de 500ms para UX (simular processamento).
- Se primeiro acesso: chamar setupPassword(email, password). Validar confirmPassword === password.
- Se login normal: chamar login(email, password).
- Se erro: exibir mensagem e manter na tela.
- Se sucesso: o AuthProvider atualiza o estado e o app redireciona para o dashboard.

#### 0.3 Proteção de Rotas

- O App.tsx deve envolver TODO o conteúdo com AuthProvider.
- Se isAuthenticated === false, renderizar LoginScreen (NÃO renderizar o dashboard).
- Se isAuthenticated === true, renderizar o app normal (dashboard, vistorias, etc.).
- Botão "Sair" (LogOut - Lucide) no header do app, ao lado das informações do usuário logado.
- Ao clicar em "Sair": chamar logout(), limpar sessão, voltar para a tela de login.

#### 0.4 Header com Usuário Logado

O header do dashboard deve incluir:
- Lado direito: nome do usuário logado (e-mail) + botão "Sair" (ícone LogOut).
- Exibir: "Logado como" (texto cinza pequeno) + e-mail (texto cinza escuro médio) acima do botão Sair.

#### 0.5 Código de Referência — AuthContext

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  login: (email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  isFirstAccess: boolean;
  setupPassword: (email: string, password: string) => { success: boolean; message: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTHORIZED_EMAIL = "vinicius.vpc@gmail.com";
const STORAGE_KEYS = {
  CREDENTIALS: "templar_auth_credentials",
  SESSION: "templar_auth_session",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [isFirstAccess, setIsFirstAccess] = useState(true);

  useEffect(() => {
    const storedCredentials = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    const session = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (storedCredentials) setIsFirstAccess(false);
    if (session) {
      const sessionData = JSON.parse(session);
      if (sessionData.email === AUTHORIZED_EMAIL) {
        setIsAuthenticated(true);
        setUserEmail(sessionData.email);
      }
    }
  }, []);

  const setupPassword = (email: string, password: string) => {
    if (email.toLowerCase() !== AUTHORIZED_EMAIL)
      return { success: false, message: "E-mail não autorizado." };
    if (password.length < 6)
      return { success: false, message: "A senha deve ter no mínimo 6 caracteres." };
    const credentials = { email: AUTHORIZED_EMAIL, password: btoa(password) };
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ email: AUTHORIZED_EMAIL, timestamp: Date.now() }));
    setIsFirstAccess(false);
    setIsAuthenticated(true);
    setUserEmail(AUTHORIZED_EMAIL);
    return { success: true, message: "Senha definida com sucesso!" };
  };

  const login = (email: string, password: string) => {
    const stored = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    if (!stored) return { success: false, message: "Nenhuma senha cadastrada." };
    const credentials = JSON.parse(stored);
    if (email.toLowerCase() !== AUTHORIZED_EMAIL)
      return { success: false, message: "E-mail não autorizado." };
    if (btoa(password) !== credentials.password)
      return { success: false, message: "Senha incorreta." };
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ email: AUTHORIZED_EMAIL, timestamp: Date.now() }));
    setIsAuthenticated(true);
    setUserEmail(AUTHORIZED_EMAIL);
    return { success: true, message: "Login realizado!" };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  return (
    
      {children}
    
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}

#### 0.6 Código de Referência — LoginScreen

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

export default function LoginScreen() {
  const { login, setupPassword, isFirstAccess } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      if (isFirstAccess) {
        if (password !== confirmPassword) {
          setError("As senhas não coincidem.");
          setLoading(false);
          return;
        }
        const result = setupPassword(email, password);
        if (!result.success) setError(result.message);
      } else {
        const result = login(email, password);
        if (!result.success) setError(result.message);
      }
      setLoading(false);
    }, 500);
  };

  // Renderizar tela com logo TEMPLAR, card de login, campos, botão e rodapé
  // (ver especificação visual detalhada na seção 0.2 acima)
}

#### 0.7 Código de Referência — App.tsx com Auth

import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginScreen from "./components/LoginScreen";
import { LogOut } from "lucide-react";

function AppContent() {
  const { isAuthenticated, userEmail, logout } = useAuth();
  if (!isAuthenticated) return ;

  return (
    


      


        {/* Logo TEMPLAR + Menu + Usuário logado + Botão Sair */}
      


      
        {/* Dashboard, Vistorias, etc. */}
      
    


  );
}

function App() {
  return (
    
      
    
  );
}
export default App;

---

### FLUXO DE TRABALHO: COLETA EM CAMPO → REVISÃO NO ESCRITÓRIO → GERAÇÃO DO LAUDO

A aplicação deve separar claramente duas fases:

FASE 1 — COLETA EM CAMPO (mobile-first, offline):
- O engenheiro realiza a inspeção no imóvel, registrando dados do imóvel, anamnese e patologias.
- Ao finalizar a coleta, o usuário clica em "Salvar e Finalizar Coleta" — todos os dados são persistidos localmente (localStorage) e a vistoria recebe status "AGUARDANDO REVISÃO".
- NÃO é necessário gerar o laudo em campo. O foco é apenas na coleta de dados.
- A geração do laudo fica disponível apenas quando o usuário abrir a vistoria no escritório.

FASE 2 — REVISÃO NO ESCRITÓRIO E GERAÇÃO DO LAUDO (desktop/tablet):
- O usuário abre a vistoria salva no dashboard, revisa todas as patologias registradas, edita/ajusta informações se necessário, e então gera o laudo em Word ou PDF.
- A revisão permite: editar dados do imóvel, editar anamnese, editar/excluir/reordenar patologias, ajustar recomendações e GUT antes de gerar o documento final.

---

### 1. Identidade Visual e Paleta de Cores (TEMPLAR ENGENHARIA)

A aplicação deve seguir a identidade visual da TEMPLAR ENGENHARIA:

- Cor primária/brand: Vermelho escuro (burgundy/crimson) — #8B1A1A (usado em botões de ação, header, elementos de destaque).
- Cor secundária: Cinza ardósia escuro (#2D3748) — usado em textos, títulos e ícones.
- Background: Branco puro (#FFFFFF) e cinza muito claro (#F7F8FA) para áreas de seção.
- Acentos: Verde (#16A34A) para status "Concluída", laranja (#EA580C) para "Risco Médio", vermelho intenso (#DC2626) para "Risco Crítico", amarelo (#EAB308) para "Aguardando Revisão".
- Tipografia: Sans-serif limpa e moderna (Inter ou system-ui). Títulos em peso 700, corpo em peso 400.
- O logotipo da TEMPLAR ENGENHARIA (escudo vermelho com cruz branca + texto "TEMPLAR ENGENHARIA") deve aparecer no header da aplicação, na tela de login e na capa do laudo.

---

### 2. Tela Inicial — Dashboard de Vistorias

A tela inicial (após login) deve ser um dashboard de gestão de vistorias com o seguinte layout:

#### 2.1 Header (Barra Superior)
- Fundo branco com sombra sutil na borda inferior.
- Lado esquerdo: Logotipo da TEMPLAR ENGENHARIA (escudo + "TEMPLAR ENGENHARIA").
- Centro: Menu de navegação horizontal: "Vistorias", "Inspeções", "Laudos", "Perícias".
- Lado direito: Ícone de engrenagem (Configurações) + informações do usuário logado + botão "Sair" (ícone LogOut).

#### 2.2 Área de Conteúdo Principal
- Título: "Vistorias".
- Subtítulo: "Gerencie suas vistorias de imóveis novos."
- Banner informativo: "Os dados ficam salvos neste dispositivo. Após a vistoria em campo, revise as informações no escritório e gere o laudo."

#### 2.3 Botão de Ação Principal
- Botão "+ NOVA VISTORIA" (vermelho escuro, branco, uppercase, mínimo 56px).

#### 2.4 Cards de Vistorias
- Cards brancos com borda cinza, cantos arredondados.
- Cada card: nome do cliente, data, endereço, inspetor, badge de status (amarelo "AGUARDANDO REVISÃO" / azul "EM ANDAMENTO" / verde "CONCLUÍDA"), contador de patologias, botões de ação dinâmicos por status.
- Status "EM ANDAMENTO": "Abrir" (FolderOpen).
- Status "AGUARDANDO REVISÃO": "Revisar e Gerar Laudo" (FileText).
- Status "CONCLUÍDA": "Abrir Laudo" (FileText), "Baixar Word" (Download), "Baixar PDF" (Download).
- Todos: "Editar cabeçalho" (Pencil), "Excluir" (Trash2 com confirmação).

---

### 3. Fluxo de Coleta em Campo — Stepper de 3 Passos

Passo 1: Dados do Imóvel → Passo 2: Anamnese → Passo 3: Registrar Patologias.
Ao final do Passo 3, "Salvar e Finalizar Coleta" → status "AGUARDANDO REVISÃO" → retorna ao dashboard.

---

### 4. Passo 1 — Dados do Imóvel

- Tipo de edificação: Menu suspenso (Residencial Unifamiliar, Residencial Multifamiliar, Comercial, Misto).
- Endereço completo: CEP, Logradouro, Número, Bairro, Cidade, UF.
- Idade aparente: Slider 0–100.
- Número de pavimentos: Menu suspenso (1 a 5+).
- Área construída (m²): Campo numérico.
- Nome do proprietário/solicitante: Campo de texto.
- Data da vistoria: DatePicker (DD/MM/AAAA).
- Nome do inspetor: Campo de texto (pré-preenchido com "Vinicius Paulino Cesar").
- Conselho (CREA): Campo de texto.
- Observações gerais: Textarea (opcional).
- Tooltips em todos os campos.
- Botão "Salvar e Continuar".

---

### 5. Passo 2 — Anamnese Prévia

Checklist interativo (toggle Sim/Não/Não Sabe):
- Histórico de infiltrações ou umidade?
- Trincas/fissuras conhecidas?
- Reformas ou ampliações?
- Contas de água anormalmente altas?
- Cheiros, mofo ou bolor?
- Impermeabilização corretiva?
- Problemas elétricos conhecidos?
- Manutenção periódica do telhado e calhas?
- Recalque ou movimentação do solo?
- Tooltips em cada item.
- Campo: "Observações complementares da anamnese".
- Botão "Salvar e Continuar".

---

### 6. Passo 3 — Registrar Patologias

Botão flutuante "+" para adicionar múltiplas patologias. Cada ficha:

#### 6.1 Foto (Upload de Imagem)
- Área tocável para capturar/enviar foto.
- Múltiplas fotos por patologia (mínimo 1, sem limite máximo).
- Thumbnails com opção de remover individualmente.

#### 6.2 Setor Vistoriado
- Menu suspenso: Perímetro Externo/Fachadas e Solo | Cobertura e Telhado | Ambientes Internos | Sistemas e Instalações Globais.

#### 6.3 Elemento Inspecionado
- Menu suspenso pesquisável: Alvenaria de Vedação, Laje de Cobertura, Revestimento Cerâmico, Esquadrias, Instalações Elétricas (QDC), Instalações Hidrossanitárias, Telhado, Estrutura de Concreto, Estrutura Metálica, Piso, Pintura, Impermeabilização, Pavimentação, Acessibilidade, Ventilação, Combate a Incêndio, Elevadores, Novo (+).

#### 6.4 Local (Ambiente)
- Menu suspenso + "Adicionar Novo": Fachada, Sala, Cozinha, Quarto 1, Banheiro Social, Suíte, Área de Serviço, Cobertura, Perímetro Externo, Garagem, Subsolo, Pilotis, Novo (+).

#### 6.5 Posição no Ambiente
- Menu suspenso: Piso, Parede Norte/Sul/Leste/Oeste, Teto/Gesso, Esquadria/Janela, Esquadria/Porta, Rodapé, Forro, Novo (+).

#### 6.6 Manifestações Patológicas
- Multi-seleção chips/tags: Fissura diagonal, Fissura horizontal, Fissura vertical, Umidade ascendente, Eflorescência, Descolamento de reboco, Estufamento de pintura, Infiltração ativa, Fiação exposta, Sobrecarga térmica, Corrosão, Bolor/Fungos, Trinca estrutural, Vazamento visível, Recalque, Laje com infiltração, Calha entupida, Telha quebrada, Disjuntor danificado, Novo (+).

#### 6.7 Classificação (Origem) — com Sugestão por IA

- Controle segmentado: Anomalia Endógena, Anomalia Exógena, Anomalia Natural, Anomalia Funcional, Falha de Manutenção, Falha de Execução de Reparos, Falha Operacional/Uso, Falha Gerencial.
- Após preencher Elemento + Local + Manifestações, exibir botão "Sugerir Classificação com IA" (Sparkles).
- IA retorna: classificação sugerida (pré-selecionada), nível de confiança (badge), justificativa técnica (máx. 3 linhas em caixa expansível).
- Usuário pode aceitar ou selecionar manualmente. IA não bloqueia seleção manual.
- Loading: spinner + "Analisando...". Fallback: campo manual se IA falhar.

Prompt interno da IA:
"Como engenheiro civil perito, com base no elemento construtivo, local e manifestações patológicas, classifique a origem do problema em: 1. Anomalia Endógena, 2. Anomalia Exógena, 3. Anomalia Natural, 4. Anomalia Funcional, 5. Falha de Manutenção, 6. Falha de Execução de Reparos, 7. Falha Operacional/Uso, 8. Falha Gerencial. Retorne JSON: { classificacao, confianca, justificativa }. Baseie-se em ABNT NBR 16747, NBR 5674 e IBAPE."

#### 6.8 Recomendações Técnicas — com Geração por IA (sem templates)

- Textarea editável + botão "Gerar Recomendação com IA" (Sparkles).
- NÃO usar templates pré-definidos. Geração exclusiva por IA. Engenheiro valida ou edita.
- IA gera: ação corretiva principal, etapas de execução (bullets), norma de referência, observação complementar.
- Texto aparece em textarea editável. Botões "Aceitar" / "Editar".
- Loading: "Gerando recomendação...". Fallback: textarea manual.

Prompt interno da IA:
"Como engenheiro civil perito, elabore recomendação técnica corretiva. Deve conter: 1. Ação corretiva principal, 2. Etapas de execução em sequência, 3. Norma técnica ABNT de referência, 4. Observação complementar se relevante. Siga IBAPE, ABNT NBR 16747 e NBR 5674. Máx. 200 palavras. Retorne JSON: { acao_principal, etapas[], norma_referencia, observacao_complementar }."

#### 6.9 Matriz GUT — com Sugestão por IA

- 3 sliders (1 a 5): Gravidade (G), Urgência (U), Tendência (T).
- Cálculo automático: G × U × T (1 a 125).
- Badges: ≥81 vermelho "Risco Crítico", 30–80 laranja "Risco Médio", <30 verde "Risco Baixo".
- Após preencher Elemento + Manifestações + Classificação, botão "Sugerir GUT com IA" (Sparkles).
- IA retorna: valores G/U/T (pré-aplicados nos sliders), justificativa por slider (1 linha cada).
- Sliders permanecem ajustáveis. Se ajustado manualmente: badge "Ajustado pelo inspetor".
- Loading: "Analisando risco...". Fallback: sliders manuais.

Prompt interno da IA:
"Avalie o Grau de Risco usando Matriz GUT (1-5 cada). Considere: G (risco a pessoas/edifício), U (tempo de intervenção), T (velocidade de agravamento). Baseie-se em IBAPE, ABNT NBR 16747, NBR 5674. Retorne JSON: { gravidade, urgencia, tendencia, justificativa_g, justificativa_u, justificativa_t }."

#### 6.10 Observações da Patologia
- Textarea opcional.

#### 6.11 Finalizar Coleta
- Botão "Salvar e Finalizar Coleta": salva tudo no localStorage, status "AGUARDANDO REVISÃO", toast de confirmação, retorna ao dashboard.

---

### 7. Modo Revisão e Geração do Laudo

Ao clicar "Revisar e Gerar Laudo" em vistoria "AGUARDANDO REVISÃO":

#### 7.1 Painel Resumo
- Patologias ordenadas por GUT (maior → menor).
- Cada item: thumbnail, elemento, local, manifestações (chips), classificação, badge de risco.
- Contadores: Total | Críticas | Médias | Baixas.
- Botões: Editar (Pencil), Excluir (Trash2), Adicionar Patologia (+), Reordenar, Editar Dados do Imóvel, Editar Anamnese.

#### 7.2 Geração
- Botão "Gerar Laudo" → modal: "Baixar Word (.docx)" / "Baixar PDF".
- Após gerar: status "CONCLUÍDA". Laudo disponível para re-download.

---

### 8. Estrutura do Laudo (LTVP)

PÁGINA 1 — CAPA: Cabeçalho TEMPLAR + "LAUDO TÉCNICO DE VISTORIA PREDIAL (LTVP)" + data + endereço.

SEÇÃO 1 — IDENTIFICAÇÃO DO SOLICITANTE: Texto sobre o solicitante + definição de ANOMALIA e FALHA.
SEÇÃO 2 — OBJETIVO: Diagnóstico geral, anomalias, falhas, análise de riscos.
SEÇÃO 3 — DADOS INICIAIS: 3.1 Identificação (edificação, endereço), 3.2 Realização (responsável, CREA), 3.3 Data da vistoria.
SEÇÃO 4 — DESCRIÇÃO DO IMÓVEL: Localização, pavimentos, classificação, padrão, idade, sistemas componentes.
SEÇÃO 5 — FOTO DA EDIFICAÇÃO: Foto da fachada + satélite se disponível.
SEÇÃO 6 — CLASSIFICAÇÃO DA INSPEÇÃO: Nível 1, 2 ou 3 (sugerido automaticamente por pavimentos/tipo).
SEÇÃO 7 — METODOLOGIA: 7.1 Fase inicial/documental, 7.2 Vistoria das áreas, 7.3 Elaboração do laudo + glossário (ABNT NBR 16747: Agentes de degradação, Anomalia, Desempenho, Deterioração, Falha, Manifestação patológica, Plano de manutenção, Sistema, Vida útil).
SEÇÃO 8 — GRAU DE RISCO E PRIORIDADES: 8.1 Risco Crítico/Médio/Baixo (IBAPE), 8.2 Tabela GUT de pesos (5 níveis), 8.3 Classificação de Anomalias (Endógena/Exógena/Natural/Funcional) e Falhas (Planejamento/Execução/Operacionais/Gerenciais).
SEÇÃO 9 — SISTEMAS CONSTRUTIVOS INSPECIONADOS: Lista dos sistemas.
SEÇÃO 10 — LISTA DE VERIFICAÇÃO: Tabela ITEM | DESCRIÇÃO | VERIFICADO (SIM/NÃO) | OBSERVAÇÃO.
SEÇÃO 11 — VISTORIA DA ÁREA (RELATÓRIO FOTOGRÁFICO): Para cada patologia: fotos com legenda → quadro técnico (Elemento, Local, Manifestações, Classificação, Recomendações) → tabela GUT (Gravidade, Urgência, Tendência) + Pontuação. Ordenado por GUT.
SEÇÃO 12 — LISTA DE PRIORIDADES: Texto exato + tabela:

"12. LISTA DE PRIORIDADES
Com o intuito de subsidiar a administração da edificação em relação às principais não conformidades, as anomalias e falhas de manutenção constatadas e analisadas na inspeção predial da [NOME DA EDIFICAÇÃO], foram classificadas conforme apresentado nas tabelas a seguir. É recomendável ainda que o imóvel estabeleça uma programação de manutenção, inicialmente, corretiva, com posterior implantação de procedimentos de manutenção preventiva, com base em suas características e nas legislações e normas técnicas aplicáveis."

| Prioridade | Pontuação | Prazo |
|---|---|---|
| 1ª | 81 a 150 | Até 30 dias |
| 2ª | 75 a 80 | 30 dias a 120 dias |
| 3ª | 60 a 64 | 120 dias a 150 dias |
| 4ª | 30 a 59 | 150 dias a 210 dias |
| 5ª | 10 a 29 | 210 dias a 240 dias |
| 6ª | 1 a 9 | 240 dias a 360 dias |

SEÇÃO 13 — CONCLUSÕES: Classificação global do grau de risco, sistemas críticos, recomendações imediatas.
SEÇÃO 14 — NORMAS TÉCNICAS: Lista de NBRs aplicáveis + Norma IBAPE.
SEÇÃO 15 — ENCERRAMENTO: Texto com número de folhas e responsável.
SEÇÃO 16 — ASSINATURA: Local, data, linha de assinatura, nome, CREA.

---

### 9. Template Visual do Laudo

CABEÇALHO (todas as páginas): Logo TEMPLAR (escudo + texto) à esquerda + "Vistorias • Inspeções • Laudos • Perícias" à direita.

RODAPÉ (todas as páginas, com hyperlinks clicáveis):
- Esquerda: "www.templarengenharia.com.br" (link https://www.templarengenharia.com.br)
- Centro: "templarengenharia@hotmail.com" (link mailto:)
- Direita: "WhatsApp (21) 98180-8812" (link https://wa.me/5521981808812)

CONFIGURAÇÕES: A4, margens 2cm/2.5cm, Arial/Helvetica 11 corpo/14 títulos, numeração "Página X de Y", cores TEMPLAR.

---

### 10. Roteiro de Inspeção (Guia em App)

Menu lateral com roteiro de campo: 5 etapas (Preparação → Varredura Setorial → Identificação de Não Conformidade → Registro → Finalizar Coleta).

---

### 11. Requisitos Técnicos

- React + Tailwind CSS + Lucide React.
- Context API ou Zustand para estado.
- localStorage para persistência.
- Mobile-first, responsivo, alvos de toque 48px+.
- Validação de formulários.
- Framer Motion para transições.
- PWA com service worker (modo offline em campo).

---

### 12. Geração de Documentos (Word e PDF)

- Word (.docx): biblioteca docx (npm install docx). Cabeçalho/rodapé TEMPLAR, tabelas, fotos, hyperlinks.
- PDF: jsPDF + html2canvas ou react-pdf. Layout idêntico ao Word.
- Ambos: fotos, quadro técnico após fotos, tabela de prioridades, tabela GUT, cabeçalho/rodapé, hyperlinks clicáveis.
- Modal com dois botões: "Baixar Word" e "Baixar PDF".

---

### 13. Integração de IA — Google Gemini

- Pacote: @google/generative-ai (npm install @google/generative-ai).
- Arquivo: src/lib/gemini.ts com funções sugerirClassificacao(), gerarRecomendacao(), sugerirGUT().
- Variável de ambiente: VITE_GEMINI_API_KEY.
- Modelo: "gemini-2.0-flash".
- Config: responseMimeType: "application/json", temperature: 0.3.
- Loading states específicos por função. Fallback manual em caso de erro.
- IA sempre opcional e editável. Botões só aparecem após campos básicos preenchidos.

Estrutura de referência:

import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
export const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
});

---

### 14. Experiência do Usuário

- Tooltips em todos os campos técnicos.
- Sliders GUT com valor numérico em tempo real.
- Badges de risco atualizam instantaneamente.
- Toast após salvar patologia. Limpar formulário para próxima entrada.
- "Salvar Rascunho" em todos os passos.
- Confirmação antes de excluir.
- Dashboard persiste no localStorage.
- Fluxo em campo: foto + seleções por toque → botões de IA → revisar → salvar. Menos de 60 segundos por patologia.
- Coleta em campo salva com status "AGUARDANDO REVISÃO".
- No escritório: abrir vistoria, revisar/editar, gerar laudo em Word ou PDF.
- Login obrigatório: sem autenticação, o usuário vê apenas a tela de login.
- Primeiro acesso: definir senha (mín. 6 caracteres). Acessos seguintes: e-mail + senha.
- Sessão persistente até clicar "Sair".
- Apenas e-mail vinicius.vpc@gmail.com tem acesso.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://templar-vistoria-ltvp.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c3928630-7d23-4528-8730-c0e11d8e26cf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
