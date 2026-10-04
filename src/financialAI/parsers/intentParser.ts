import { ParsedIntent, AIIntentType, IntentParameters } from '../types';
import { parseNaturalLanguageDate } from './dateParser';
import { parseNaturalLanguageAmount } from './amountParser';
import { extractEntities, normalizeText } from './entityExtractor';
import type { Category, Account, CreditCard, Goal } from '../../types';

export function parseUserIntent(
  query: string,
  categories: Category[] = [],
  accounts: Account[] = [],
  cards: CreditCard[] = [],
  goals: Goal[] = []
): ParsedIntent {
  const norm = normalizeText(query);
  const dateRange = parseNaturalLanguageDate(query);
  const amount = parseNaturalLanguageAmount(query);
  const extracted = extractEntities(query, categories, accounts, cards, goals);

  const parameters: IntentParameters = {
    amount,
    dateRange,
    date: dateRange.startDate,
  };

  if (extracted.category) {
    parameters.categoryId = extracted.category.id;
    parameters.categoryQuery = extracted.category.name;
  }
  if (extracted.secondCategory) {
    parameters.secondCategoryId = extracted.secondCategory.id;
    parameters.secondCategoryQuery = extracted.secondCategory.name;
  }
  if (extracted.account) {
    parameters.accountId = extracted.account.id;
    parameters.accountQuery = extracted.account.name;
  }
  if (extracted.destinationAccount) {
    parameters.destinationAccountId = extracted.destinationAccount.id;
    parameters.destinationAccountQuery = extracted.destinationAccount.name;
  }
  if (extracted.card) {
    parameters.cardId = extracted.card.id;
    parameters.cardQuery = extracted.card.name;
  }
  if (extracted.goal) {
    parameters.goalId = extracted.goal.id;
  }

  // ─── 1. SAUDAÇÃO & AJUDA (HELP_GREETING) ───
  if (
    norm === 'oi' || norm === 'ola' || norm === 'e ai' || norm === 'bom dia' ||
    norm === 'boa tarde' || norm === 'boa noite' || norm === 'opa' ||
    norm.includes('quem e voce') || norm.includes('o que voce faz') ||
    norm.includes('o que voce sabe fazer') || norm.includes('como funciona') ||
    norm.includes('ajuda') || norm.includes('socorro') || norm.includes('menu de comandos')
  ) {
    return {
      intent: 'HELP_GREETING',
      parameters,
      rawText: query,
      confidence: 0.98,
    };
  }

  // ─── 2. AÇÕES DE MUTAÇÃO (MUTATION INTENTS) ───

  // CREATE_TRANSFER: "transfira 200 da conta corrente para carteira"
  if (norm.includes('transfira') || norm.includes('transferir') || norm.includes('transferencia') || norm.includes('manda da conta')) {
    return {
      intent: 'CREATE_TRANSFER',
      parameters,
      rawText: query,
      confidence: 0.95,
    };
  }

  // DELETE_TRANSACTION: "apague a despesa", "excluir movimentação", "remover lançamento"
  if (norm.includes('apague') || norm.includes('exclua') || norm.includes('deletar') || norm.includes('remover despesa') || norm.includes('apagar')) {
    return {
      intent: 'DELETE_TRANSACTION',
      parameters,
      rawText: query,
      confidence: 0.95,
    };
  }

  // CREATE_BILL: "preciso pagar 120 de internet dia 10", "adicionar conta de..."
  if ((norm.includes('preciso pagar') || norm.includes('adicionar conta') || norm.includes('agendar conta') || norm.includes('criar conta de')) && amount) {
    return {
      intent: 'CREATE_BILL',
      parameters: {
        ...parameters,
        description: extractDescription(query, amount, ['preciso', 'pagar', 'adicionar', 'conta', 'de', 'agendar']),
      },
      rawText: query,
      confidence: 0.92,
    };
  }

  // CREATE_BUDGET: "definir orcamento de 1000", "criar limite de..."
  if ((norm.includes('criar orcamento') || norm.includes('definir orcamento') || norm.includes('novo orcamento') || norm.includes('limite para')) && amount) {
    return {
      intent: 'CREATE_BUDGET',
      parameters: {
        ...parameters,
        limitAmount: amount,
      },
      rawText: query,
      confidence: 0.9,
    };
  }

  // CREATE_GOAL: "quero juntar 10 mil para...", "crie uma meta de..."
  if (norm.includes('juntar') || norm.includes('crie uma meta') || norm.includes('criar meta') || (norm.includes('meta de') && amount)) {
    return {
      intent: 'CREATE_GOAL',
      parameters: {
        ...parameters,
        targetAmount: amount,
        description: extractDescription(query, amount || 0, ['crie', 'uma', 'meta', 'criar', 'de', 'para', 'quero', 'juntar', 'economizar']),
      },
      rawText: query,
      confidence: 0.92,
    };
  }

  // CREATE_EXPENSE: "gastei 50 no supermercado", "comprei uma pizza", "registre uma despesa", "paguei 40"
  if (
    (norm.startsWith('gastei') || norm.includes('registre uma despesa') || norm.includes('comprei') || norm.startsWith('paguei') || norm.includes('anote uma despesa') || norm.includes('lancar despesa')) &&
    amount
  ) {
    return {
      intent: 'CREATE_EXPENSE',
      parameters: {
        ...parameters,
        description: extractDescription(query, amount, ['gastei', 'comprei', 'paguei', 'registre', 'anote', 'uma', 'despesa', 'no', 'na', 'com']),
      },
      rawText: query,
      confidence: 0.92,
    };
  }

  // CREATE_INCOME: "recebi meu salário de 3500", "ganhei 200", "registre receita de"
  if (
    (norm.startsWith('recebi') || norm.includes('registre receita') || norm.includes('ganhei') || norm.includes('deposito de') || norm.includes('anote receita')) &&
    amount
  ) {
    return {
      intent: 'CREATE_INCOME',
      parameters: {
        ...parameters,
        description: extractDescription(query, amount, ['recebi', 'ganhei', 'registre', 'anote', 'receita', 'deposito', 'de']),
      },
      rawText: query,
      confidence: 0.92,
    };
  }

  // ─── 3. SIMULAÇÕES & VIABILIDADE (CAN_I_SPEND / SIMULATE) ───

  // CAN_I_SPEND: "posso gastar R$ 500?", "dá para comprar...", "consigo comprar", "sera que posso gastar"
  if (
    norm.includes('posso gastar') || norm.includes('posso comprar') || norm.includes('da para gastar') ||
    norm.includes('da para comprar') || norm.includes('consigo gastar') || norm.includes('consigo comprar') ||
    norm.includes('tenho dinheiro para') || norm.includes('posso pagar')
  ) {
    return {
      intent: 'CAN_I_SPEND',
      parameters,
      rawText: query,
      confidence: 0.95,
    };
  }

  // SIMULATE_GOAL: "quanto preciso economizar por mes", "como atingir minha meta", "simule guardar"
  if (norm.includes('quanto preciso guardar') || norm.includes('quanto preciso economizar') || norm.includes('simular meta') || norm.includes('simule a meta')) {
    return {
      intent: 'SIMULATE_GOAL',
      parameters,
      rawText: query,
      confidence: 0.9,
    };
  }

  // ─── 4. COMPARAÇÕES ───

  // GET_CATEGORY_COMPARISON: Se duas categorias foram detectadas ou pede comparação entre categorias
  if (
    extracted.category && extracted.secondCategory &&
    (norm.includes('compara') || norm.includes('diferenca') || norm.includes('vs') || norm.includes('versus') || norm.includes('ou'))
  ) {
    return {
      intent: 'GET_CATEGORY_COMPARISON',
      parameters,
      rawText: query,
      confidence: 0.94,
    };
  }

  // GET_MONTHLY_COMPARISON: "gastei mais que mês passado?", "comparar meses", "comparativo mensal", "variacao"
  if (
    (norm.includes('mes passado') && (norm.includes('mais') || norm.includes('menos') || norm.includes('aumentou') || norm.includes('caiu') || norm.includes('diminuiu') || norm.includes('variacao'))) ||
    norm.includes('comparar meses') || norm.includes('comparativo mensal') || norm.includes('comparar com mes anterior')
  ) {
    return {
      intent: 'GET_MONTHLY_COMPARISON',
      parameters,
      rawText: query,
      confidence: 0.95,
    };
  }

  // ─── 5. CONSULTAS ESPECIALIZADAS ───

  // GET_INVESTMENTS: "investimentos", "patrimonio", "carteira de investimento", "onde tenho investido"
  if (norm.includes('investimento') || norm.includes('investimentos') || norm.includes('patrimonio') || norm.includes('carteira')) {
    return {
      intent: 'GET_INVESTMENTS',
      parameters,
      rawText: query,
      confidence: 0.92,
    };
  }

  // GET_CARD_BILL: "fatura do cartão", "quanto devo no cartão?", "fatura atual", "limite do cartao"
  if (norm.includes('fatura') || norm.includes('cartao') || norm.includes('cartoes') || extracted.card) {
    return {
      intent: 'GET_CARD_BILL',
      parameters,
      rawText: query,
      confidence: 0.92,
    };
  }

  // GET_SUBSCRIPTIONS: "assinaturas", "Netflix", "Spotify", "quanto gasto com assinaturas?"
  if (norm.includes('assinatura') || norm.includes('assinaturas') || norm.includes('streaming')) {
    return {
      intent: 'GET_SUBSCRIPTIONS',
      parameters,
      rawText: query,
      confidence: 0.95,
    };
  }

  // GET_RECURRING: "despesas fixas", "gastos recorrentes", "custos fixos", "recorrencia"
  if (norm.includes('despesa fixa') || norm.includes('despesas fixas') || norm.includes('gastos recorrentes') || norm.includes('custos fixos') || norm.includes('recorrentes')) {
    return {
      intent: 'GET_RECURRING',
      parameters,
      rawText: query,
      confidence: 0.93,
    };
  }

  // GET_BILLS: "contas a pagar", "o que vence", "quais contas vencem", "boletos a pagar"
  if (norm.includes('conta a pagar') || norm.includes('contas a pagar') || norm.includes('vencem') || norm.includes('a vencer') || norm.includes('boletos')) {
    return {
      intent: 'GET_BILLS',
      parameters,
      rawText: query,
      confidence: 0.95,
    };
  }

  // GET_RECEIVABLES: "contas a receber", "quanto tenho para receber", "recebimentos futuros"
  if (norm.includes('receber') || norm.includes('recebimentos') || norm.includes('a receber')) {
    return {
      intent: 'GET_RECEIVABLES',
      parameters,
      rawText: query,
      confidence: 0.95,
    };
  }

  // GET_FORECAST / GET_CASH_FLOW: "quanto vou ter no fim do mês?", "saldo projetado", "fluxo de caixa", "vou ficar no negativo"
  if (norm.includes('fim do mes') || norm.includes('projetado') || norm.includes('fluxo de caixa') || norm.includes('previsao') || norm.includes('vou ficar no negativo') || norm.includes('projecao')) {
    return {
      intent: 'GET_FORECAST',
      parameters,
      rawText: query,
      confidence: 0.92,
    };
  }

  // GET_BUDGET: "orçamento", "limite do orçamento", "como estao meus orcamentos"
  if (norm.includes('orcamento') || norm.includes('orcamentos') || norm.includes('limite da categoria') || norm.includes('teto de gastos')) {
    return {
      intent: 'GET_BUDGET',
      parameters,
      rawText: query,
      confidence: 0.92,
    };
  }

  // GET_GOAL: "meta", "metas", "quanto falta para minha meta", "objetivos"
  if (norm.includes('meta') || norm.includes('metas') || norm.includes('objetivo financeiro') || extracted.goal) {
    return {
      intent: 'GET_GOAL',
      parameters,
      rawText: query,
      confidence: 0.92,
    };
  }

  // GET_INSTALLMENTS: "parcelas", "parcelamento", "compras parceladas"
  if (norm.includes('parcela') || norm.includes('parcelas') || norm.includes('parcelamento') || norm.includes('parceladas')) {
    return {
      intent: 'GET_INSTALLMENTS',
      parameters,
      rawText: query,
      confidence: 0.92,
    };
  }

  // GET_FINANCIAL_HEALTH: "como estão minhas finanças?", "saúde financeira", "gastando demais", "situação financeira"
  if (
    norm.includes('financas') || norm.includes('situacao financeira') || norm.includes('saude financeira') ||
    norm.includes('gastando demais') || norm.includes('como estao minhas contas') || norm.includes('diagnostico')
  ) {
    return {
      intent: 'GET_FINANCIAL_HEALTH',
      parameters,
      rawText: query,
      confidence: 0.93,
    };
  }

  // GET_ACCOUNTS: "quais contas eu tenho?", "minhas contas bancarias", "listar contas"
  if (
    (norm.includes('contas') && (norm.includes('banco') || norm.includes('bancarias') || norm.includes('quais') || norm.includes('listar') || norm.includes('cadastradas'))) ||
    norm === 'minhas contas' || norm === 'contas bancarias'
  ) {
    return {
      intent: 'GET_ACCOUNTS',
      parameters,
      rawText: query,
      confidence: 0.92,
    };
  }

  // GET_TRANSACTIONS: "ultimas compras", "extrato", "minhas movimentacoes", "ultimos lancamentos"
  if (
    norm.includes('extrato') || norm.includes('ultimas compras') || norm.includes('ultimos gastos') ||
    norm.includes('movimentacoes') || norm.includes('lancamentos') || norm.includes('historico de compras')
  ) {
    return {
      intent: 'GET_TRANSACTIONS',
      parameters,
      rawText: query,
      confidence: 0.91,
    };
  }

  // ─── 6. CONSULTAS DE CATEGORIA OU GERAIS ───

  // Se uma categoria foi identificada e a pergunta fala de gasto/despesa ou é direta ("quanto com alimentação?")
  if (extracted.category) {
    return {
      intent: 'GET_CATEGORY_SPENDING',
      parameters,
      rawText: query,
      confidence: 0.9,
    };
  }

  // GET_BALANCE: "quanto eu tenho?", "qual meu saldo?", "dinheiro disponível", "saldo geral"
  if (norm.includes('saldo') || norm.includes('quanto tenho') || norm.includes('disponivel') || norm.includes('dinheiro na conta')) {
    return {
      intent: 'GET_BALANCE',
      parameters,
      rawText: query,
      confidence: 0.92,
    };
  }

  // GET_INCOME: "quanto recebi", "entradas", "receitas", "ganhos"
  if (norm.includes('recebi') || norm.includes('entradas') || norm.includes('receita') || norm.includes('receitas') || norm.includes('ganhos')) {
    return {
      intent: 'GET_INCOME',
      parameters,
      rawText: query,
      confidence: 0.9,
    };
  }

  // GET_EXPENSES: "quanto gastei esse mes?", "qual foi meu gasto total no mes atual?", "me mostra minhas despesas de outubro", "quanto saiu da minha conta neste mes?"
  if (
    norm.includes('gastei') || norm.includes('gastos') || norm.includes('despesas') ||
    norm.includes('gasto total') || norm.includes('despesa total') || norm.includes('saiu da minha conta') ||
    norm.includes('saiu este mes') || norm.includes('total gasto') || norm.includes('meus gastos')
  ) {
    return {
      intent: 'GET_EXPENSES',
      parameters,
      rawText: query,
      confidence: 0.88,
    };
  }

  // Default: UNKNOWN
  return {
    intent: 'UNKNOWN',
    parameters,
    rawText: query,
    confidence: 0.25,
    needsClarification: true,
  };
}

function extractDescription(rawQuery: string, amount: number, stopwords: string[]): string {
  let cleaned = rawQuery;
  
  // Remove amount occurrences
  cleaned = cleaned.replace(new RegExp(String(amount), 'g'), ' ');
  cleaned = cleaned.replace(/R\$\s*[\d.,]+/gi, ' ');
  cleaned = cleaned.replace(/\b\d+([.,]\d+)?\s*(reais|real|pila|conto)?\b/gi, ' ');

  // Remove stopwords
  const stopPattern = new RegExp(`\\b(${stopwords.join('|')})\\b`, 'gi');
  cleaned = cleaned.replace(stopPattern, ' ');

  // Clean remaining punctuation and whitespace
  cleaned = cleaned.replace(/[^\w\sáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ-]/gi, ' ').replace(/\s+/g, ' ').trim();

  if (!cleaned || cleaned.length < 2) {
    const lower = rawQuery.toLowerCase();
    if (lower.includes('supermercado') || lower.includes('mercado')) return 'Supermercado';
    if (lower.includes('almoço') || lower.includes('almoco') || lower.includes('jantar')) return 'Alimentação';
    if (lower.includes('uber') || lower.includes('gasolina')) return 'Transporte';
    if (lower.includes('salário') || lower.includes('salario')) return 'Salário';
    return 'Lançamento via IA';
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

