import Papa from 'papaparse';
import type { Transaction, TransactionType } from '../types';
import { transactionService } from './transactionService';

export interface ParsedRawRow {
  [key: string]: string;
}

export interface ColumnMapping {
  dateCol: string;
  descCol: string;
  amountCol: string;
  typeCol?: string;
  categoryCol?: string;
}

export interface PreviewTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  isDuplicate?: boolean;
}

export const importService = {
  /**
   * Parse CSV file text into columns and rows
   */
  parseCSV(fileContent: string): Promise<{ headers: string[]; rows: ParsedRawRow[] }> {
    return new Promise((resolve, reject) => {
      Papa.parse<ParsedRawRow>(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          resolve({
            headers,
            rows: results.data
          });
        },
        error: (error: Error) => reject(error)
      });
    });
  },

  /**
   * Parse OFX banking file into transactions
   */
  parseOFX(fileContent: string): PreviewTransaction[] {
    const transactions: PreviewTransaction[] = [];
    const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;

    while ((match = trnRegex.exec(fileContent)) !== null) {
      const block = match[1];

      // Extract DTPOSTED (e.g. 20261002120000[-03:EST])
      const dateMatch = /<DTPOSTED>(\d{8})/i.exec(block);
      let date = new Date().toISOString().split('T')[0];
      if (dateMatch) {
        const rawDate = dateMatch[1];
        date = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;
      }

      // Extract TRNAMT
      const amtMatch = /<TRNAMT>([-\d.,]+)/i.exec(block);
      let amount = 0;
      let type: TransactionType = 'expense';
      if (amtMatch) {
        const rawVal = parseFloat(amtMatch[1].replace(',', '.'));
        if (rawVal < 0) {
          type = 'expense';
          amount = Math.abs(rawVal);
        } else {
          type = 'income';
          amount = rawVal;
        }
      }

      // Extract MEMO or NAME
      const memoMatch = /<MEMO>(.*)/i.exec(block);
      const nameMatch = /<NAME>(.*)/i.exec(block);
      const description = (memoMatch ? memoMatch[1].trim() : (nameMatch ? nameMatch[1].trim() : 'Transação Bancária')).replace(/<\/?[^>]+(>|$)/g, "");

      transactions.push({
        id: `ofx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date,
        description,
        amount,
        type,
        categoryId: 'outros'
      });
    }

    return transactions;
  },

  /**
   * Automatically detect column mappings from CSV headers
   */
  guessMapping(headers: string[]): ColumnMapping {
    const lower = headers.map(h => h.toLowerCase());

    const findMatch = (candidates: string[]): string => {
      for (const cand of candidates) {
        const idx = lower.findIndex(h => h.includes(cand));
        if (idx !== -1) return headers[idx];
      }
      return headers[0] || '';
    };

    return {
      dateCol: findMatch(['data', 'date', 'dt']),
      descCol: findMatch(['descri', 'memo', 'nome', 'historico', 'title', 'lançamento']),
      amountCol: findMatch(['valor', 'amount', 'val', 'preco']),
      typeCol: findMatch(['tipo', 'type']),
      categoryCol: findMatch(['categoria', 'category', 'cat']),
    };
  },

  /**
   * Converts parsed rows using user mapping into preview transactions and marks duplicates
   */
  async buildPreview(
    rows: ParsedRawRow[],
    mapping: ColumnMapping,
    accountId?: string
  ): Promise<PreviewTransaction[]> {
    const previews: PreviewTransaction[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rawDate = row[mapping.dateCol] || '';
      const rawDesc = row[mapping.descCol] || 'Sem descrição';
      const rawAmount = row[mapping.amountCol] || '0';

      // Parse date (supports DD/MM/YYYY or YYYY-MM-DD)
      let date = new Date().toISOString().split('T')[0];
      if (rawDate.includes('/')) {
        const parts = rawDate.split('/');
        if (parts.length === 3) {
          date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } else if (rawDate.includes('-')) {
        date = rawDate.trim();
      }

      // Parse amount
      let cleanAmountStr = rawAmount.replace(/[R$\s]/g, '').trim();
      if (cleanAmountStr.includes(',') && cleanAmountStr.includes('.')) {
        cleanAmountStr = cleanAmountStr.replace(/\./g, '').replace(',', '.');
      } else if (cleanAmountStr.includes(',')) {
        cleanAmountStr = cleanAmountStr.replace(',', '.');
      }

      let parsedAmount = parseFloat(cleanAmountStr);
      if (isNaN(parsedAmount)) parsedAmount = 0;

      let type: TransactionType = parsedAmount < 0 ? 'expense' : 'income';
      if (mapping.typeCol && row[mapping.typeCol]) {
        const tVal = row[mapping.typeCol].toLowerCase();
        if (tVal.includes('desp') || tVal.includes('deb') || tVal.includes('saida')) {
          type = 'expense';
        } else if (tVal.includes('rec') || tVal.includes('cred') || tVal.includes('entr')) {
          type = 'income';
        }
      }

      const finalAmount = Math.abs(parsedAmount);

      // Guess category from description
      let categoryId = 'outros';
      const descLower = rawDesc.toLowerCase();
      if (descLower.includes('mercado') || descLower.includes('supermercado') || descLower.includes('restaurante') || descLower.includes('ifood') || descLower.includes('padaria')) {
        categoryId = 'alimentacao';
      } else if (descLower.includes('uber') || descLower.includes('combustivel') || descLower.includes('posto') || descLower.includes('99app')) {
        categoryId = 'transporte';
      } else if (descLower.includes('aluguel') || descLower.includes('condominio') || descLower.includes('luz') || descLower.includes('energia') || descLower.includes('agua') || descLower.includes('internet')) {
        categoryId = 'moradia';
      } else if (descLower.includes('farmacia') || descLower.includes('drogaria') || descLower.includes('consulta') || descLower.includes('medico')) {
        categoryId = 'saude';
      } else if (descLower.includes('netflix') || descLower.includes('spotify') || descLower.includes('amazon prime') || descLower.includes('disney')) {
        categoryId = 'assinaturas';
      } else if (descLower.includes('salario') || descLower.includes('pagamento') || descLower.includes('ted recebida') || descLower.includes('pix recebido')) {
        categoryId = 'salario';
        type = 'income';
      }

      // Check duplicate
      const duplicate = await transactionService.detectDuplicate({
        amount: finalAmount,
        date,
        description: rawDesc,
        accountId
      });

      previews.push({
        id: `prev_${i}_${Date.now()}`,
        date,
        description: rawDesc,
        amount: finalAmount,
        type,
        categoryId,
        isDuplicate: !!duplicate
      });
    }

    return previews;
  },

  /**
   * Final batch import of chosen preview transactions into DB
   */
  async commitImport(
    transactions: PreviewTransaction[],
    accountId?: string,
    cardId?: string
  ): Promise<number> {
    let importedCount = 0;

    for (const item of transactions) {
      await transactionService.create({
        type: item.type,
        amount: item.amount,
        description: item.description,
        date: item.date,
        categoryId: item.categoryId,
        accountId: cardId ? undefined : accountId,
        cardId: cardId || undefined,
        paymentMethod: cardId ? 'credit_card' : 'account'
      });
      importedCount++;
    }

    return importedCount;
  }
};
