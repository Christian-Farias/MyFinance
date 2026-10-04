import type { Category, Account, CreditCard, Goal } from '../../types';

export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^\w\s$R]/g, ' ')       // remove punctuation but keep letters, numbers, spaces, currency symbols
    .replace(/\s+/g, ' ')
    .trim();
}

// Synonyms map: canonical category topic -> keyword aliases
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  alimentacao: [
    'comida', 'refeicao', 'restaurante', 'almoco', 'jantar', 'lanche', 'ifood',
    'rappi', 'mercado', 'supermercado', 'padaria', 'feira', 'bar', 'cafe',
    'hamburguer', 'pizza', 'acai', 'churrasco', 'alimentacao'
  ],
  transporte: [
    'uber', '99', 'taxi', 'combustivel', 'gasolina', 'etanol', 'alcool',
    'abastecer', 'pedagio', 'estacionamento', 'passagem', 'metro', 'onibus',
    'oficina', 'mecanico', 'ipva', 'seguro auto', 'transporte'
  ],
  moradia: [
    'aluguel', 'condominio', 'luz', 'energia', 'agua', 'internet', 'gas',
    'iptu', 'reforma', 'casa', 'apartamento', 'moradia'
  ],
  lazer: [
    'cinema', 'filme', 'netflix', 'show', 'barzinho', 'viagem', 'passagem aerea',
    'hotel', 'passeio', 'jogo', 'steam', 'playstation', 'videogame', 'lazer', 'balada'
  ],
  saude: [
    'farmacia', 'remedio', 'medico', 'dentista', 'consulta', 'exame',
    'plano de saude', 'terapia', 'psicologo', 'academia', 'drogaria', 'saude'
  ],
  educacao: [
    'faculdade', 'curso', 'livro', 'escola', 'mensalidade', 'udemy', 'estudo', 'educacao'
  ],
  vestuario: [
    'roupa', 'calcado', 'tenis', 'camisa', 'calca', 'shopping', 'vestuario', 'sapato'
  ],
  salario: [
    'salario', 'adiantamento', 'freela', 'freelance', 'pagamento', 'comissao',
    'bonus', 'rendimento', 'dividendo', 'pro labore', 'receita', 'renda'
  ]
};

export interface ExtractedEntities {
  category?: Category;
  secondCategory?: Category;
  account?: Account;
  destinationAccount?: Account;
  card?: CreditCard;
  goal?: Goal;
  ambiguousMatches?: Array<{ id: string; name: string; type: string }>;
}

export function extractEntities(
  rawQuery: string,
  categories: Category[] = [],
  accounts: Account[] = [],
  cards: CreditCard[] = [],
  goals: Goal[] = []
): ExtractedEntities {
  const norm = normalizeText(rawQuery);
  const result: ExtractedEntities = {};
  const ambiguousMatches: Array<{ id: string; name: string; type: string }> = [];

  // 1. Match Categories (can match up to 2 for comparisons)
  const matchedCategories: Category[] = [];

  // Check direct category names first
  for (const cat of categories) {
    const normCat = normalizeText(cat.name);
    if (norm.includes(normCat)) {
      if (!matchedCategories.some(c => c.id === cat.id)) {
        matchedCategories.push(cat);
      }
    }
  }

  // Check synonyms if not found or only 1 found
  if (matchedCategories.length < 2) {
    for (const [topic, keywords] of Object.entries(CATEGORY_SYNONYMS)) {
      const foundKeyword = keywords.find(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        return regex.test(norm);
      });

      if (foundKeyword) {
        // Find matching category in the user's category list
        const matchingCat = categories.find(c => {
          const normCat = normalizeText(c.name);
          return normCat.includes(topic) || keywords.some(kw => normCat.includes(kw));
        });

        if (matchingCat && !matchedCategories.some(c => c.id === matchingCat.id)) {
          matchedCategories.push(matchingCat);
        }
      }
    }
  }

  if (matchedCategories.length > 0) {
    result.category = matchedCategories[0];
  }
  if (matchedCategories.length > 1) {
    result.secondCategory = matchedCategories[1];
  }

  // 2. Match Accounts
  const matchedAccounts: Account[] = [];
  for (const acc of accounts) {
    const normName = normalizeText(acc.name);
    const normInst = normalizeText(acc.institution);
    if (norm.includes(normName) || (normInst.length > 2 && norm.includes(normInst))) {
      matchedAccounts.push(acc);
    }
  }

  // Handle transfer origin and destination if "para" or "pra" separates them
  if (matchedAccounts.length >= 2) {
    const idx0 = norm.indexOf(normalizeText(matchedAccounts[0].name));
    const idx1 = norm.indexOf(normalizeText(matchedAccounts[1].name));
    if (idx0 < idx1) {
      result.account = matchedAccounts[0];
      result.destinationAccount = matchedAccounts[1];
    } else {
      result.account = matchedAccounts[1];
      result.destinationAccount = matchedAccounts[0];
    }
  } else if (matchedAccounts.length === 1) {
    result.account = matchedAccounts[0];
  }

  // 3. Match Cards
  for (const card of cards) {
    const normCard = normalizeText(card.name);
    if (norm.includes(normCard)) {
      result.card = card;
      break;
    }
  }

  // 4. Match Goals
  for (const goal of goals) {
    const normGoal = normalizeText(goal.name);
    if (norm.includes(normGoal)) {
      result.goal = goal;
      break;
    }
  }

  if (ambiguousMatches.length > 0) {
    result.ambiguousMatches = ambiguousMatches;
  }

  return result;
}
