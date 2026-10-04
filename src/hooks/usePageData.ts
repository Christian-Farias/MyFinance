import { useFinance } from '../context/FinanceContext';

/**
 * Read/error state for a page.
 *
 * `FinanceContext.isLoading` was exported but read by nothing, so every page
 * painted its empty state before IndexedDB answered — and a failed read was
 * reported as "no data". Pages should branch on this once, at the top:
 *
 *   const { isLoading, loadFailed, retry } = usePageData();
 *   if (isLoading) return <LoadingState />;
 *   if (loadFailed) return <ErrorState onRetry={retry} />;
 */
export interface PageDataState {
  isLoading: boolean;
  /** True when IndexedDB could not be read, as opposed to being empty. */
  loadFailed: boolean;
  retry: () => Promise<void>;
}

export function usePageData(): PageDataState {
  const { isLoading, error, retry } = useFinance();
  return { isLoading, loadFailed: error !== null, retry };
}