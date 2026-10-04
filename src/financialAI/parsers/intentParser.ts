import { ParsedIntent, AIIntentType, IntentParameters } from '../types';
import { parseNaturalLanguageDate } from './dateParser';
import { parseNaturalLanguageAmount } from './amountParser';
import type { Category, Account } from '../../types';

export function parseUserIntent(
  query: string,
  categories: Category[] = [],
  accounts: Account[] = []
): ParsedIntent {
  const lower = query.toLowerCase().trim();
  const dateRange = parseNaturalLanguageDate(lower);
  const amount = parseNaturalLanguageAmount(lower);

  const parameters: IntentParameters = {
    amount,
    dateRange,
    date: dateRange.startDate,
  };

  // 1. Detect Category Context
  let matchedCategory: Category | undefined;
  for (const cat of categories) {
    if (
      lower.includes(cat.name.toLowerCase()) ||
      (cat.name.toLowerCase().includes('alimentaç') && (lower.includes('comida') || lower.includes('restaurante') || lower.includes('supermercado') || lower.includes('almoço') || lower.includes('jantar') || lower.includes('mercado'))) ||
      (cat.name.toLowerCase().includes('transport') && (lower.includes('uber') || lower.includes('combustível') || lower.includes('gasolina') || lower.includes('passagem'))) ||
      (cat.name.toLowerCase().includes('morad') && (lower.includes('aluguel') || lower.includes('condomínio') || lower.includes('luz') || lower.includes('energia') || lower.includes('internet'))) ||
      (cat.name.toLowerCase().includes('lazer') && (lower.includes('cinema') || lower.includes('passeio') || lower.includes('viagem') || lower.includes('jogo')))
    ) {
      matchedCategory = cat;
      parameters.categoryId = cat.id;
      parameters.categoryQuery = cat.name;
      break;
    }
  }

  // 2. Detect Account Context
  for (const acc of accounts) {
    if (lower.includes(acc.name.toLowerCase()) || lower.includes(acc.institution.toLowerCase())) {
      if (!parameters.accountId) {
        parameters.accountId = acc.id;
        parameters.accountQuery = acc.name;
      } else if (!parameters.destinationAccountId) {
        parameters.destinationAccountId = acc.id;
        parameters.destinationAccountQuery = acc.name;
      }
    }
  }

  // 3. ACTION INTENT MATCHING

  // CREATE_TRANSFER: "transfira 200 da conta corrente para carteira"
  if (lower.includes('transfira') || lower.includes('transferir') || lower.includes('transferência')) {
    return {
      intent: 'CREATE_TRANSFER',
      parameters,
      rawText: query,
      confidence: 0.95,
    };
  }

  // DELETE_TRANSACTION: "apague a despesa", "excluir movimentação", "remover lançamento"
  if (lower.includes('apague') || lower.includes('exclua') || lower.includes('deletar') || lower.includes('remover despesa') || lower.includes('apagar')) {
    return {
      intent: 'DELETE_TRANSACTION',
      parameters,
      rawText: query,
      confidence: 0.95,
    };
  }

  // UPDATE_TRANSACTION: "mude aquela despesa", "altere a despesa", "corrija o valor"
  if (lower.includes('mude') || lower.includes('altere a despesa') || lower.includes('corrija o valor') || lower.includes('alterar valor')) {
    return {
      intent: 'UPDATE_TRANSACTION',
      parameters,
      rawText: query,
      confidence: 0.9,
    };
  }

  // CREATE_BILL: "preciso pagar 120 de internet dia 10", "adicionar conta de..."
  if ((lower.includes('preciso pagar') || lower.includes('adicionar conta') || lower.includes('criar conta de')) && amount) {
    return {
      intent: 'CREATE_BILL',
      parameters,
      rawText: query,
      confidence: 0.9,
    };
  }

  // CREATE_GOAL: "quero juntar 10 mil para...", "crie uma meta de..."
  if (lower.includes('juntar') || lower.includes('crie uma meta') || lower.includes('criar meta') || lower.includes('meta de')) {
    return {
      intent: 'CREATE_GOAL',
      parameters: {
        ...parameters,
        targetAmount: amount,
        description: query.replace(/(crie uma meta|criar meta|meta de|para|quero juntar)/gi, '').trim(),
      },
      rawText: query,
      confidence: 0.9,
    };
  }

  // CREATE_EXPENSE: "gastei 50 reais no supermercado", "comprei um...", "registre uma despesa de"
  if (
    (lower.startsWith('gastei') || lower.includes('registre uma despesa') || lower.includes('comprei') || lower.includes('paguei')) &&
    amount
  ) {
    return {
      intent: 'CREATE_EXPENSE',
      parameters: {
        ...parameters,
        description: extractDescription(query, amount),
      },
      rawText: query,
      confidence: 0.9,
    };
  }

  // CREATE_INCOME: "recebi meu salário de 3500", "ganhei 200", "registre receita de"
  if (
    (lower.startsWith('recebi') || lower.includes('registre receita') || lower.includes('ganhei') || lower.includes('depósito de')) &&
    amount
  ) {
    return {
      intent: 'CREATE_INCOME',
      parameters: {
        ...parameters,
        description: extractDescription(query, amount),
      },
      rawText: query,
      confidence: 0.9,
    };
  }

  // 4. QUERY INTENT MATCHING

  // CAN_I_SPEND: "posso gastar R$ 500?", "dá para comprar...", "posso comprar"
  if (lower.includes('posso gastar') || lower.includes('posso comprar') || lower.includes('dá para gastar') || lower.includes('consigo gastar')) {
    return {
      intent: 'CAN_I_SPEND',
      parameters,
      rawText: query,
      confidence: 0.95,
    };
  }

  // GET_MONTHLY_COMPARISON: "gastei mais que mês passado?", "comparar meses", "minha alimentação aumentou?"
  if (
    lower.includes('mês passado') && (lower.includes('gastei mais') || lower.includes('aumentou') || lower.includes('comparar') || lower.includes('variação') || lower.includes('menos que')) ||
    lower.includes('comparação') || lower.includes('comparativo')
  ) {
    return {
      intent: 'GET_MONTHLY_COMPARISON',
      parameters,
      rawText: query,
      confidence: 0.95,
    };
  }

  // GET_CARD_BILL: "fatura do cartão", "quanto está minha fatura?", "quanto devo no cartão?"
  if (lower.includes('fatura') || lower.includes('cartão') || lower.includes('cartao')) {
    return {
      intent: 'GET_CARD_BILL',
      parameters,
      rawText: query,
      confidence: 0.9,
    };
  }

  // GET_SUBSCRIPTIONS: "assinaturas", "Netflix", "Spotify", "quanto gasto com assinaturas?"
  if (lower.includes('assinatura') || lower.includes('assinaturas') || lower.includes('netflix') || lower.includes('spotify')) {
    return {
      intent: 'GET_SUBSCRIPTIONS',
      parameters,
      rawText: query,
      confidence: 0.95,
    };
  }

  // GET_BILLS: "quais contas vencem", "contas a pagar", "contas essa semana", "o que preciso pagar"
  if (lower.includes('conta a pagar') || lower.includes('contas a pagar') || lower.includes('vencem') || lower.includes('preciso pagar')) {
    return {
      intent: 'GET_BILLS',
      parameters,
      rawText: query,
      confidence: 0.95,
    };
  }

  // GET_RECEIVABLES: "contas a receber", "quanto tenho para receber", "recebimentos"
  if (lower.includes('receber') || lower.includes('recebimentos') || lower.includes('a receber')) {
    return {
      intent: 'GET_RECEIVABLES',
      parameters,
      rawText: query,
      confidence: 0.95,
    };
  }

  // GET_FORECAST / GET_CASH_FLOW: "quanto vou ter no fim do mês?", "saldo projetado", "fluxo de caixa", "vou ficar no negativo"
  if (lower.includes('fim do mês') || lower.includes('projetado') || lower.includes('fluxo de caixa') || lower.includes('previsão') || lower.includes('negativo')) {
    return {
      intent: 'GET_FORECAST',
      parameters,
      rawText: query,
      confidence: 0.9,
    };
  }

  // GET_BUDGET: "orçamento", "limite do orçamento", "quanto posso gastar"
  if (lower.includes('orçamento') || lower.includes('orcamento') || lower.includes('limite')) {
    return {
      intent: 'GET_BUDGET',
      parameters,
      rawText: query,
      confidence: 0.9,
    };
  }

  // GET_GOAL: "meta", "metas", "quanto falta para minha meta", "economizei"
  if (lower.includes('meta') || lower.includes('metas') || lower.includes('objetivo')) {
    return {
      intent: 'GET_GOAL',
      parameters,
      rawText: query,
      confidence: 0.9,
    };
  }

  // GET_INSTALLMENTS: "parcelas", "parcelamento", "compras parceladas"
  if (lower.includes('parcela') || lower.includes('parcelas') || lower.includes('parcelamento')) {
    return {
      intent: 'GET_INSTALLMENTS',
      parameters,
      rawText: query,
      confidence: 0.9,
    };
  }

  // GET_COMMITMENTS: "compromissos", "comprometido"
  if (lower.includes('compromisso') || lower.includes('comprometido')) {
    return {
      intent: 'GET_COMMITMENTS',
      parameters,
      rawText: query,
      confidence: 0.9,
    };
  }

  // GET_FINANCIAL_HEALTH: "como estão minhas finanças?", "saúde financeira", "gastando demais", "situação financeira"
  if (lower.includes('finanças') || lower.includes('situacao') || lower.includes('situação') || lower.includes('saúde') || lower.includes('saude') || lower.includes('gastando demais')) {
    return {
      intent: 'GET_FINANCIAL_HEALTH',
      parameters,
      rawText: query,
      confidence: 0.9,
    };
  }

  // GET_CATEGORY_SPENDING: If category match was found & query asks for spent
  if (matchedCategory || lower.includes('comida') || lower.includes('alimentação') || lower.includes('restaurante')) {
    return {
      intent: 'GET_CATEGORY_SPENDING',
      parameters,
      rawText: query,
      confidence: 0.85,
    };
  }

  // GET_BALANCE: "quanto eu tenho?", "qual meu saldo?", "dinheiro disponível"
  if (lower.includes('saldo') || lower.includes('tenho') || lower.includes('disponível') || lower.includes('disponivel')) {
    return {
      intent: 'GET_BALANCE',
      parameters,
      rawText: query,
      confidence: 0.85,
    };
  }

  // GET_INCOME: "quanto recebi", "entradas", "receitas"
  if (lower.includes('recebi') || lower.includes('entradas') || lower.includes('receita')) {
    return {
      intent: 'GET_INCOME',
      parameters,
      rawText: query,
      confidence: 0.85,
    };
  }

  // GET_EXPENSES: Default query for "gastei", "gastos", "despesas"
  if (lower.includes('gastei') || lower.includes('gastos') || lower.includes('despesas')) {
    return {
      intent: 'GET_EXPENSES',
      parameters,
      rawText: query,
      confidence: 0.8,
    };
  }

  return {
    intent: 'UNKNOWN',
    parameters,
    rawText: query,
    confidence: 0.2,
  };
}

function extractDescription(query: string, amount: number): string {
  let cleaned = query
    .replace(/(gastei|recebi|registre|uma despesa|receita|de|reais|no|na|com|por|em|supermercado|almoço)/gi, ' ')
    .replace(new RegExp(String(amount), 'g'), '')
    .trim();
  
  cleaned = cleaned.replace(/\s+/g, ' ');
  if (!cleaned || cleaned.length < 2) {
    if (query.toLowerCase().includes('supermercado') || query.toLowerCase().includes('mercado')) return 'Supermercado';
    if (query.toLowerCase().includes('almoço') || query.toLowerCase().includes('jantar')) return 'Alimentação';
    if (query.toLowerCase().includes('salário') || query.toLowerCase().includes('salario')) return 'Salário';
    return 'Lançamento via IA';
  }
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
