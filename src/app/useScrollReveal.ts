import { useEffect } from 'react';

export function useScrollReveal(page: string) {
  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const elements = document.querySelectorAll<HTMLElement>('[data-scroll-reveal]');
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.remove('scroll-reveal-pending');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    for (const element of elements) {
      // Keep content already on screen visible, including on restored scroll positions.
      if (element.getBoundingClientRect().top < window.innerHeight * 0.92) continue;
      element.classList.add('scroll-reveal-pending');
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
      for (const element of elements) element.classList.remove('scroll-reveal-pending');
    };
  }, [page]);
}
