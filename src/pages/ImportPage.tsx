import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileCheck } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { usePageData } from '../hooks/usePageData';
import { importService, type ColumnMapping, type PreviewTransaction, type ParsedRawRow } from '../services/importService';
import { formatCurrency, formatDateBR } from '../calculations/financialCalculations';
import { ErrorState, LoadingState } from '../components/ui';

export const ImportPage: React.FC = () => {
  const { isLoading, loadFailed, retry } = usePageData();
  const { accounts, cards, refreshAll } = useFinance();
  const [activeFormat, setActiveFormat] = useState<'csv' | 'ofx'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'success'>('upload');

  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<ParsedRawRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ dateCol: '', descCol: '', amountCol: '' });

  const [previews, setPreviews] = useState<PreviewTransaction[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<{ type: 'account' | 'card'; id: string }>({
    type: 'account',
    id: accounts[0]?.id || '',
  });
  const [importedCount, setImportedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectFile = async (selected: File) => {
    setFile(selected);
    setErrorMsg('');
    await processFile(selected);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    await selectFile(selected);
  };

  const processFile = async (f: File) => {
    try {
      setIsProcessing(true);
      const text = await f.text();
      if (f.name.toLowerCase().endsWith('.ofx') || activeFormat === 'ofx') {
        const parsedTxs = importService.parseOFX(text);
        if (parsedTxs.length === 0) {
          setErrorMsg('Nenhuma transação encontrada no arquivo OFX.');
          return;
        }
        setPreviews(parsedTxs);
        setStep('preview');
      } else {
        const { headers: csvHeaders, rows } = await importService.parseCSV(text);
        if (rows.length === 0) {
          setErrorMsg('Arquivo CSV vazio ou sem linhas de dados.');
          return;
        }
        setHeaders(csvHeaders);
        setRawRows(rows);
        const guessed = importService.guessMapping(csvHeaders);
        setMapping(guessed);
        setStep('mapping');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha ao processar arquivo. Verifique o formato.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGeneratePreview = async () => {
    try {
      setIsProcessing(true);
      const accId = selectedDestination.type === 'account' ? selectedDestination.id : undefined;
      const built = await importService.buildPreview(rawRows, mapping, accId);
      setPreviews(built);
      setStep('preview');
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao gerar pré-visualização.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    try {
      setIsProcessing(true);
      const accId = selectedDestination.type === 'account' ? selectedDestination.id : undefined;
      const crdId = selectedDestination.type === 'card' ? selectedDestination.id : undefined;
      const count = await importService.commitImport(previews, accId, crdId);
      setImportedCount(count);
      await refreshAll();
      setStep('success');
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao importar transações.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setHeaders([]);
    setRawRows([]);
    setPreviews([]);
    setStep('upload');
    setErrorMsg('');
  };

  /* Sem esta guarda a página desenhava o estado vazio antes de o IndexedDB
     responder — e uma falha de leitura ficava idêntica a "não há dados". */
  if (loadFailed) {
    return <ErrorState onRetry={retry} />;
  }

  if (isLoading) {
    return <LoadingState rows={4} />;
  }

  return (
    <div className="page-content space-y-5 animate-fade-in px-0.5">

      {/* ── HEADER ── */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Importar extrato</h1>
        <p className="label-xs mt-0.5">Traga seus dados de bancos e cartões sem pagar nada.</p>
      </div>

      {/* ── FORMAT SELECTOR ── */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-surface border border-edge rounded-2xl max-w-xs">
        {(['csv', 'ofx'] as const).map(fmt => (
          <button
            key={fmt}
            onClick={() => setActiveFormat(fmt)}
            className={`py-2 text-xs font-semibold rounded-xl transition-all ${
              activeFormat === fmt
                ? 'bg-surface-raised text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {fmt.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── ERROR ── */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-negative/8 border border-negative/20 text-negative text-xs flex items-center space-x-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── STEP 1: UPLOAD ── */}
      {step === 'upload' && (
        <div className="space-y-5">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragging(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) void selectFile(dropped);
            }}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all bg-on-accent hover:bg-surface group ${
              isDragging ? 'border-accent bg-accent/5' : 'border-edge hover:border-accent/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={activeFormat === 'csv' ? '.csv' : '.ofx'}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform ${
              file ? 'bg-positive/12 text-positive' : 'bg-surface-raised text-accent group-hover:scale-110'
            }`}>
              {file ? <FileCheck size={30} /> : <UploadCloud size={30} />}
            </div>
            <h3 className="text-base font-bold text-ink mb-1">
              {file ? file.name : 'Arraste o arquivo aqui'}
            </h3>
            <p className="text-xs text-ink-muted mb-4">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB · pronto para importar`
                : 'ou selecione no seu dispositivo'}
            </p>
            <div className="label-xs space-y-0.5 font-mono">
              <p>Formatos aceitos: .{activeFormat}</p>
              <p>Tamanho máximo: 10MB</p>
            </div>
          </div>

          <div className="card p-5">
            <p className="label-section mb-3">Como funciona?</p>
            <div className="space-y-2.5 text-xs text-ink-muted">
              {['Selecione o arquivo exportado pelo seu banco', 'O sistema identifica e categoriza as transações', 'Você confere e confirma a importação'].map((text, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <span className="w-5 h-5 rounded-full bg-edge text-ink flex items-center justify-center font-bold text-[11px] shrink-0">
                    {i + 1}
                  </span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: MAPPING ── */}
      {step === 'mapping' && (
        <div className="card p-5 space-y-4">
          <h3 className="text-base font-bold text-ink">Mapeamento de colunas</h3>
          <p className="label-xs">Confirme as colunas do seu arquivo para importação correta:</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {[
              { label: 'Coluna de Data', key: 'dateCol' as const },
              { label: 'Coluna de Descrição', key: 'descCol' as const },
              { label: 'Coluna de Valor', key: 'amountCol' as const },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-ink-muted mb-1">{label}</label>
                <select
                  value={mapping[key]}
                  onChange={e => setMapping({ ...mapping, [key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-edge text-xs text-ink focus:border-accent outline-none"
                >
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Coluna de Tipo (Opcional)</label>
              <select
                value={mapping.typeCol || ''}
                onChange={e => setMapping({ ...mapping, typeCol: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface border border-edge text-xs text-ink focus:border-accent outline-none"
              >
                <option value="">Não mapear</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button
              onClick={resetAll}
              className="py-2.5 px-4 rounded-xl bg-surface-raised text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGeneratePreview}
              disabled={isProcessing}
              className="btn btn-primary flex-1"
            >
              Visualizar transações →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: PREVIEW ── */}
      {step === 'preview' && (
        <div className="card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-ink">{previews.length} transações identificadas</h3>
              <p className="label-xs">Selecione onde lançar estas movimentações:</p>
            </div>
            <select
              value={`${selectedDestination.type}:${selectedDestination.id}`}
              onChange={e => {
                const [t, id] = e.target.value.split(':');
                setSelectedDestination({ type: t as any, id });
              }}
              className="px-3 py-2 rounded-xl bg-surface border border-edge text-xs text-ink focus:border-accent outline-none"
            >
              <optgroup label="Contas Bancárias">
                {accounts.map(a => <option key={a.id} value={`account:${a.id}`}>{a.name}</option>)}
              </optgroup>
              <optgroup label="Cartões de Crédito">
                {cards.map(c => <option key={c.id} value={`card:${c.id}`}>{c.name}</option>)}
              </optgroup>
            </select>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-none">
            {previews.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                  item.isDuplicate
                    ? 'bg-warning/5 border-warning/20'
                    : 'bg-surface border-edge'
                }`}
              >
                <div className="min-w-0 flex-1 pr-3">
                  <h5 className="font-semibold text-ink truncate">{item.description}</h5>
                  <span className="label-xs">{formatDateBR(item.date)}</span>
                  {item.isDuplicate && (
                    <span className="ml-2 text-[11px] text-warning font-semibold">(Possível duplicidade)</span>
                  )}
                </div>
                <span className={`font-bold ${item.type === 'income' ? 'text-positive' : 'text-ink'}`}>
                  {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-3 pt-4 border-t border-edge">
            <button
              onClick={resetAll}
              className="py-2.5 px-4 rounded-xl bg-surface-raised text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={isProcessing}
              className="btn btn-primary flex-1"
            >
              {isProcessing ? 'Importando...' : `Confirmar importação de ${previews.length} itens`}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: SUCCESS ── */}
      {step === 'success' && (
        <div className="card p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-positive/15 text-positive flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-ink">Importação concluída!</h3>
          <p className="label-xs leading-relaxed">
            {importedCount} transações foram adicionadas com sucesso aos seus registros locais.
          </p>
          <button
            onClick={resetAll}
            className="py-2.5 px-6 rounded-xl bg-surface-raised hover:bg-edge text-ink text-xs font-semibold transition-colors"
          >
            Importar outro arquivo
          </button>
        </div>
      )}
    </div>
  );
};
