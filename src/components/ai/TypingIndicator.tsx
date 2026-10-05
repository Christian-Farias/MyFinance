import React from 'react';

/**
 * "Neguin is typing" indicator.
 *
 * `role="status"` with visually hidden text because the animation alone
 * announces nothing — a screen reader user needs to know the reply is on its
 * way. `aria-hidden` on the dots keeps them from being read as three stray
 * bullet characters.
 */
export const TypingIndicator: React.FC = () => (
  <div className="flex items-end gap-2.5" role="status">
    <img
      src="/logo.png"
      alt=""
      width={32}
      height={32}
      className="w-8 h-8 rounded-full object-contain bg-black border border-active shrink-0 mb-1"
    />
    <div className="bg-panel border border-active px-4 py-3.5 rounded-3xl rounded-bl-sm flex items-center gap-1.5">
      {[0, 0.2, 0.4].map((delay) => (
        <span
          key={delay}
          aria-hidden="true"
          className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
    <span className="sr-only">Neguin está digitando…</span>
  </div>
);