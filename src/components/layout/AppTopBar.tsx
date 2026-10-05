import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, Search, WifiOff } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

/**
 * Application utility bar, modelled on Banco Inter's AppBar.
 *
 * Deliberately NOT a title bar. Each route owns its own `<h1>` inside
 * `<main>` (via `PageHeader`), so putting the route title here too
 * would print it twice — once in the shell and once in the content.
 *
 * Layout, per breakpoint:
 *
 * - below `md` — the sidebar is hidden, so the brand occupies the
 *   leading edge and the search control collapses to a circle.
 * - `md` and up — the sidebar renders logo.png + wordmark itself, so
 *   the bar drops its own brand and the search expands into a pill.
 *   Previously the brand rendered at every width, which printed the
 *   identity twice on desktop.
 *
 * Search opens the existing `GlobalSearchModal`, which filters
 * transactions, accounts, cards, goals and investments. That modal was
 * already mounted and already bound to Cmd/Ctrl+K, but had no visible
 * trigger — and since the sidebar is hidden on phones and there is no
 * Cmd key, global search was unreachable on mobile entirely.
 *
 * The unread count is derived rather than stored so the badge and the
 * sidebar's own badge can never disagree.
 */
export const AppTopBar: React.FC = () => {
  const { alerts, isOffline, settings, setGlobalSearchOpen } = useFinance();

  const unreadAlerts = alerts.filter((alert) => !alert.isRead).length;
  const initial = settings.name.trim().charAt(0).toUpperCase() || 'M';

  return (
    <header className="app-topbar">
      <div className="app-topbar-lead">
        {/* 26px against the sidebar's 40px. The mark fills ~88% of the
          file, so this renders ~23px of actual glyph — the same optical
          weight the padded original was fighting for. */}
        <img
          src="/logo.png"
          alt=""
          width={26}
          height={26}
          className="w-[26px] h-[26px] rounded-lg object-contain shrink-0"
        />
        {/* The wordmark carries the brand weight; the mark beside it is
            supporting. Trimming the gap to 6px keeps the pair reading as
            one lockup instead of two separate objects. */}
        <span className="text-ink text-[15px] font-semibold tracking-tight truncate -ml-0.5">
          MyFinance
        </span>
      </div>

      <button
        type="button"
        className="app-topbar-search"
        onClick={() => setGlobalSearchOpen(true)}
      >
        <Search size={17} aria-hidden="true" className="shrink-0" />
        <span className="app-topbar-search-label">Buscar transações, contas, metas…</span>
        <kbd aria-hidden="true">⌘K</kbd>
      </button>

      <div className="app-topbar-actions">
        {/* Mobile-only: on desktop the sidebar footer already states the
            offline condition in full. As an inline pill this used to
            appear and vanish with the network state, pushing the search
            and the action cluster sideways. */}
        {isOffline && (
          <span
            className="app-topbar-offline"
            role="status"
            aria-label="Sem conexão com a internet"
          >
            <WifiOff size={13} aria-hidden="true" />
          </span>
        )}

        <NavLink
          to="/alertas"
          className="app-topbar-action"
          aria-label={
            unreadAlerts > 0
              ? `Alertas: ${unreadAlerts} não lido${unreadAlerts > 1 ? 's' : ''}`
              : 'Alertas'
          }
        >
          <Bell size={18} aria-hidden="true" />
          {unreadAlerts > 0 && (
            <span
              className="app-topbar-badge"
              /* Count is announced via the link's aria-label; repeating it
                 here would double-announce to screen readers. */
              aria-hidden="true"
            >
              {unreadAlerts > 9 ? '9+' : unreadAlerts}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/configuracoes"
          className="app-topbar-avatar"
          aria-label={`Perfil e configurações${settings.name ? `: ${settings.name}` : ''}`}
        >
          {settings.avatar ? (
            <img
              src={settings.avatar}
              alt=""
              width={36}
              height={36}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            /* Initial only. Pairing a generic User glyph with the letter
               read as an unconfigured avatar placeholder. */
            <span aria-hidden="true">{initial}</span>
          )}
        </NavLink>
      </div>
    </header>
  );
};