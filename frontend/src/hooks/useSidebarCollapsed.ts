import { useCallback, useState } from 'react';

const KEY = 'nimbo_admin_sidebar_collapsed';

/** Estado recolhido/expandido da sidebar do painel, lembrado no localStorage (só vale no desktop). */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
  });

  const toggle = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(KEY, next ? '1' : '0'); } catch { /* sem storage: só não persiste */ }
      return next;
    });
  }, []);

  return { collapsed, toggle };
}
