export function parseNaturalLanguageAmount(text: string): number | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase().trim();

  // 1. Direct Regex for Currency or Numeric Patterns (e.g., R$ 1.500,50, R$50, 1500, 50.00)
  const currencyMatch = lower.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i);
  
  if (currencyMatch && currencyMatch[1]) {
    let rawNumStr = currencyMatch[1];
    
    // Check if format uses dots for thousands and comma for cents (pt-BR: 1.500,50)
    if (rawNumStr.includes('.') && rawNumStr.includes(',')) {
      rawNumStr = rawNumStr.replace(/\./g, '').replace(',', '.');
    } else if (rawNumStr.includes(',')) {
      rawNumStr = rawNumStr.replace(',', '.');
    } else if (/^\d{1,3}(\.\d{3})+$/.test(rawNumStr)) {
      // 1.500 without cents
      rawNumStr = rawNumStr.replace(/\./g, '');
    }

    const val = parseFloat(rawNumStr);
    if (!isNaN(val) && val > 0) {
      return Math.round(val * 100) / 100;
    }
  }

  // 2. Natural language word numbers mapping (PT-BR)
  const wordNumbers: Record<string, number> = {
    'um': 1, 'dois': 2, 'três': 3, 'tres': 3, 'quatro': 4, 'cinco': 5,
    'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10,
    'vinte': 20, 'trinta': 30, 'quarenta': 40, 'cinquenta': 50,
    'sessenta': 60, 'setenta': 70, 'oitenta': 80, 'noventa': 90,
    'cem': 100, 'cento': 100, 'duzentos': 200, 'trezentos': 300,
    'quatrocentos': 400, 'quinhentos': 500, 'seiscentos': 600,
    'setecentos': 700, 'oitocentos': 800, 'novecentos': 900,
    'mil': 1000,
  };

  // Check for phrases like "dez mil", "cinco mil", "mil e quinhentos"
  if (lower.includes('dez mil')) return 10000;
  if (lower.includes('cinco mil')) return 5000;
  if (lower.includes('três mil') || lower.includes('tres mil')) return 3000;
  if (lower.includes('dois mil')) return 2000;
  if (lower.includes('mil e quinhentos')) return 1500;
  if (lower.includes('mil reais') || lower.includes('um mil')) return 1000;
  if (lower.includes('quinhentos reais')) return 500;
  if (lower.includes('duzentos reais')) return 200;
  if (lower.includes('cem reais')) return 100;
  if (lower.includes('cinquenta reais')) return 50;

  for (const [word, val] of Object.entries(wordNumbers)) {
    const wordPattern = new RegExp(`\\b${word}\\s*(?:reais|real)?\\b`, 'i');
    if (wordPattern.test(lower)) {
      return val;
    }
  }

  return undefined;
}
