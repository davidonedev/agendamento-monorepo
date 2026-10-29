import { useEffect, useRef } from 'react';

/**
 * Adiciona a classe `is-visible` aos elementos `.reveal` dentro do container
 * quando entram na viewport (uma vez só). Usado nas seções da landing page.
 */
export function useReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>('.reveal');

    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );

    targets.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return ref;
}
