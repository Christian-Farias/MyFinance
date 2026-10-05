import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, WifiOff, User } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

/**
 * Application utility bar.
 *
 * Deliberately NOT a title bar. Each route owns its own `<h1>` inside `<main>`
 * (via `PageHeader`), so putting the route title here too would print it twice —
 * once in the shell and once in the content. What lives here is only the
 * chrome that has no home on the current route:
 *
 * - brand mark — the sidebar is hidden below `md`, so mobile had no identity
 * - offline status — previously only rendered in the desktop sidebar footer
 * - alerts bell + unread count — on mobile this was buried two taps deep in
 *   the "Mais" sheet, so an alert was invisible until you went looking
 * - avatar — the only shortcut to Settings on mobile
 *
 * The unread count is derived rather than stored so the badge and the sidebar's
 * own badge can never disagree.
 */
export const AppTopBar: React.FC = () => {
  const { alerts, isOffline, settings } = useFinance();

  const unreadAlerts = alerts.filter((alert) => !alert.isRead).length;
  const initial = settings.name.trim().charAt(0).toUpperCase() || 'M';

  return (
    <header className="app-topbar">
      {/* Brand fills the space where the sidebar is hidden on mobile. */}
      <div className="flex items-center gap-2.5 min-w-0">
        <img
          src="/logo.png"
          alt=""
          width={26}
          height={26}
          className="w-[26px] h-[26px] rounded-lg object-contain bg-black border border-active shrink-0"
        />
        <span className="text-ink text-sm font-bold tracking-tight truncate">
          MyFinance
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isOffline && (
          <span
            className="app-topbar-offline"
            /* The sidebar footer carries the same message on desktop; this
               copy is the mobile-only instance. */
          >
            <WifiOff size={13} aria-hidden="true" />
            <span>Offline</span>
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
              width={28}
              height={28}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <>
              <User size={15} aria-hidden="true" />
              <span aria-hidden="true">{initial}</span>
            </>
          )}
        </NavLink>
      </div>
    </header>
  );
};