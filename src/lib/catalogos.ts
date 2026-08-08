export const SETORES = [
  "Perímetro Externo/Fachadas e Solo",
  "Cobertura e Telhado",
  "Ambientes Internos",
  "Sistemas e Instalações Globais",
];

export const ELEMENTOS = [
  "Alvenaria de Vedação",
  "Laje de Cobertura",
  "Revestimento Cerâmico",
  "Esquadrias",
  "Instalações Elétricas (QDC)",
  "Instalações Hidrossanitárias",
  "Telhado",
  "Estrutura de Concreto",
  "Estrutura Metálica",
  "Piso",
  "Pintura",
  "Impermeabilização",
  "Pavimentação",
  "Acessibilidade",
  "Ventilação",
  "Combate a Incêndio",
  "Elevadores",
];

export const LOCAIS = [
  "Fachada",
  "Sala",
  "Cozinha",
  "Quarto 1",
  "Banheiro Social",
  "Suíte",
  "Área de Serviço",
  "Cobertura",
  "Perímetro Externo",
  "Garagem",
  "Subsolo",
  "Pilotis",
];

export const POSICOES = [
  "Piso",
  "Parede Norte",
  "Parede Sul",
  "Parede Leste",
  "Parede Oeste",
  "Teto/Gesso",
  "Esquadria/Janela",
  "Esquadria/Porta",
  "Rodapé",
  "Forro",
];

export const MANIFESTACOES = [
  "Fissura diagonal",
  "Fissura horizontal",
  "Fissura vertical",
  "Umidade ascendente",
  "Eflorescência",
  "Descolamento de reboco",
  "Estufamento de pintura",
  "Infiltração ativa",
  "Fiação exposta",
  "Sobrecarga térmica",
  "Corrosão",
  "Bolor/Fungos",
  "Trinca estrutural",
  "Vazamento visível",
  "Recalque",
  "Laje com infiltração",
  "Calha entupida",
  "Telha quebrada",
  "Disjuntor danificado",
];

export const CLASSIFICACOES = [
  "Anomalia Endógena",
  "Anomalia Exógena",
  "Anomalia Natural",
  "Anomalia Funcional",
  "Falha de Manutenção",
  "Falha de Execução de Reparos",
  "Falha Operacional/Uso",
  "Falha Gerencial",
];

export const TIPOS_EDIFICACAO = [
  "Residencial Unifamiliar",
  "Residencial Multifamiliar",
  "Comercial",
  "Misto",
];

export const PAVIMENTOS = ["1", "2", "3", "4", "5+"];

export const ANAMNESE_ITENS: { id: string; pergunta: string; tip: string }[] = [
  {
    id: "infiltracoes",
    pergunta: "Histórico de infiltrações ou umidade?",
    tip: "Registros anteriores de manchas, goteiras ou umidade indicam falhas de impermeabilização ou vedação.",
  },
  {
    id: "trincas",
    pergunta: "Trincas/fissuras conhecidas?",
    tip: "Fissuras já observadas pelo usuário ajudam a avaliar evolução e possível origem estrutural.",
  },
  {
    id: "reformas",
    pergunta: "Reformas ou ampliações?",
    tip: "Intervenções sem projeto podem gerar sobrecargas e falhas de execução (NBR 5674).",
  },
  {
    id: "contas_agua",
    pergunta: "Contas de água anormalmente altas?",
    tip: "Indício de vazamentos não aparentes nas prumadas ou ramais.",
  },
  {
    id: "mofo",
    pergunta: "Cheiros, mofo ou bolor?",
    tip: "Sinal de umidade persistente e ventilação insuficiente, com risco à salubridade.",
  },
  {
    id: "impermeabilizacao",
    pergunta: "Impermeabilização corretiva?",
    tip: "Reparos anteriores indicam recorrência do problema e possível falha de execução.",
  },
  {
    id: "eletrica",
    pergunta: "Problemas elétricos conhecidos?",
    tip: "Quedas de disjuntor, aquecimento e oscilações indicam sobrecarga (NBR 5410).",
  },
  {
    id: "telhado",
    pergunta: "Manutenção periódica do telhado e calhas?",
    tip: "Ausência de plano de manutenção caracteriza falha gerencial/manutenção (NBR 5674).",
  },
  {
    id: "recalque",
    pergunta: "Recalque ou movimentação do solo?",
    tip: "Movimentações de fundação produzem fissuras inclinadas e desaprumos.",
  },
];

export const TOOLTIPS = {
  tipoEdificacao:
    "Define a tipologia da edificação para enquadramento normativo e nível de inspeção.",
  cep: "Código postal do imóvel vistoriado; compõe a identificação no laudo.",
  logradouro: "Rua/avenida do imóvel, conforme documentação.",
  numero: "Número do imóvel ou lote.",
  bairro: "Bairro do imóvel vistoriado.",
  cidade: "Município do imóvel.",
  uf: "Unidade federativa (sigla, ex.: RJ).",
  idadeAparente:
    "Idade estimada da edificação em anos, base para análise de vida útil (NBR 15575).",
  pavimentos: "Quantidade de pavimentos; influencia a classificação do nível de inspeção (IBAPE).",
  areaConstruida: "Área construída total em m², usada na descrição do imóvel.",
  proprietario: "Nome do solicitante/proprietário que contratou a vistoria.",
  dataVistoria: "Data efetiva da inspeção em campo.",
  inspetor: "Profissional responsável técnico pela inspeção.",
  crea: "Registro no Conselho Regional de Engenharia e Agronomia do responsável técnico.",
  art: "Número da Anotação de Responsabilidade Técnica (ART) do CREA, se já emitida. Opcional.",
  equipamentos:
    "Liste aqui qualquer equipamento adicional utilizado na vistoria além dos já pré-definidos no laudo (trena, martelo oco, nível de bolha e/ou nível a laser, câmera fotográfica, medidor de umidade FNIRSI WMT-10).",
  observacoes: "Informações complementares relevantes ao contexto da vistoria.",
  fotosEdificacao:
    "Foto da fachada do imóvel vistoriado. Será incluída na Seção 5 do laudo (Foto da Edificação).",
  fotosSatelite:
    "Captura de tela do Google Earth mostrando a localização do imóvel. Será incluída na Seção 5 do laudo ao lado da foto da fachada.",
  fotos: "Registre no mínimo uma foto por patologia; as imagens compõem o relatório fotográfico.",
  setor: "Agrupamento macro da varredura de inspeção conforme roteiro de campo.",
  elemento: "Sistema ou componente construtivo onde a manifestação foi observada.",
  local: "Ambiente específico em que a anomalia ou falha foi constatada.",
  posicao: "Posição da manifestação dentro do ambiente, para localização precisa no laudo.",
  manifestacoes: "Sintomas observados. Selecione todos os que se aplicam.",
  classificacao:
    "Origem da não conformidade: anomalia (construtiva/natural) ou falha (manutenção/uso/gestão).",
  recomendacao: "Ação corretiva técnica com etapas de execução e norma de referência.",
  gravidade: "G — impacto do problema sobre pessoas e edificação (1 a 5).",
  urgencia: "U — prazo necessário para intervenção (1 a 5).",
  tendencia: "T — velocidade de agravamento se nada for feito (1 a 5).",
};
