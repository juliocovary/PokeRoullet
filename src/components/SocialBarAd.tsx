import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const SOCIAL_BAR_SCRIPT_SRC =
  'https://pl28656785.effectivegatecpm.com/48/0e/b9/480eb99829252870056dec0683c96c45.js';
const SOCIAL_BAR_SESSION_KEY = 'social_bar_shown';
const SOCIAL_BAR_CLOSED_KEY = 'social_bar_closed';
const SOCIAL_BAR_STYLE_ID = 'social-bar-suppression-style';
const SOCIAL_BAR_TEXT_MARKERS = ['adzilla', 'click here', 'hide'];
const SOCIAL_BAR_CLASS_PREFIX = 'pl-480eb99829252870056dec0683c96c45';

const SocialBarAd = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const trackedNodeRef = useRef<HTMLElement | null>(null);
  const barNodeRef = useRef<HTMLElement | null>(null);
  const suppressObserverRef = useRef<MutationObserver | null>(null);
  const barObserverRef = useRef<MutationObserver | null>(null);
  const closeListenerRef = useRef<((event: MouseEvent) => void) | null>(null);
  const cleanupIntervalRef = useRef<number | null>(null);
  const { t, i18n } = useTranslation('common');
  const isEnglish = (i18n.resolvedLanguage || i18n.language).startsWith('en');
  const adLabel = isEnglish ? t('ads.label', 'Advertising') : t('ads.label', 'Publicidade');

  const isSocialBarElement = (element: Element) => {
    if (element.className && typeof element.className === 'string') {
      if (element.className.includes(SOCIAL_BAR_CLASS_PREFIX)) return true;
    }
    const text = (element.textContent || '').toLowerCase();
    if (!text) return false;
    const hasPrimary = text.includes(SOCIAL_BAR_TEXT_MARKERS[0]);
    const hasSecondary =
      text.includes(SOCIAL_BAR_TEXT_MARKERS[1]) || text.includes(SOCIAL_BAR_TEXT_MARKERS[2]);
    return hasPrimary && hasSecondary;
  };

  const removeInjectedBars = () => {
    const iframes = document.querySelectorAll(
      'iframe[src*="effectivegatecpm.com"], iframe[src*="gatecpm.com"]'
    );
    iframes.forEach((iframe) => {
      const host = iframe.closest('div') ?? iframe.parentElement;
      if (host && host instanceof HTMLElement) {
        host.remove();
      }
    });

    const candidates = document.querySelectorAll('div, section, aside, span');
    candidates.forEach((candidate) => {
      if (isSocialBarElement(candidate)) {
        candidate.remove();
      }
    });
  };

  const ensureSuppressionStyle = () => {
    if (document.getElementById(SOCIAL_BAR_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = SOCIAL_BAR_STYLE_ID;
    style.textContent = [
      'iframe[src*="effectivegatecpm.com"],',
      'iframe[src*="gatecpm.com"],',
      `[class*="${SOCIAL_BAR_CLASS_PREFIX}"] {`,
      '  display: none !important;',
      '  visibility: hidden !important;',
      '  opacity: 0 !important;',
      '  pointer-events: none !important;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  };

  const suppressFutureBars = () => {
    if (suppressObserverRef.current) return;

    removeInjectedBars();
    ensureSuppressionStyle();

    suppressObserverRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          const iframe = node.matches('iframe[src*="effectivegatecpm.com"], iframe[src*="gatecpm.com"]')
            ? node
            : node.querySelector('iframe[src*="effectivegatecpm.com"], iframe[src*="gatecpm.com"]');
          if (!iframe) return;
          const host = iframe.closest('div') ?? iframe.parentElement;
          if (host && host instanceof HTMLElement) {
            host.remove();
          }
        });

        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (isSocialBarElement(node)) {
            node.remove();
            return;
          }
          const nested = node.querySelector('div, section, aside');
          if (nested && isSocialBarElement(nested)) {
            nested.remove();
          }
        });
      });
    });

    suppressObserverRef.current.observe(document.body, {
      childList: true,
      subtree: true
    });
  };

  const markClosed = () => {
    if (sessionStorage.getItem(SOCIAL_BAR_CLOSED_KEY) === '1') return;
    sessionStorage.setItem(SOCIAL_BAR_CLOSED_KEY, '1');
    setShouldRender(false);
    containerRef.current?.replaceChildren();
    suppressFutureBars();
  };

  const trackBarElement = (element: HTMLElement) => {
    if (barNodeRef.current === element) return;
    barNodeRef.current = element;

    const closeLink = element.querySelector(`.${SOCIAL_BAR_CLASS_PREFIX}__closelink`);
    if (closeLink) {
      closeLink.addEventListener('click', markClosed, true);
    }

    if (barObserverRef.current) {
      barObserverRef.current.disconnect();
    }

    barObserverRef.current = new MutationObserver(() => {
      const style = element.getAttribute('style') || '';
      const isHidden =
        style.includes('display: none') ||
        style.includes('visibility: hidden') ||
        element.getAttribute('aria-hidden') === 'true' ||
        element.className.includes('hidden');

      if (isHidden) {
        markClosed();
      }
    });

    barObserverRef.current.observe(element, {
      attributes: true,
      attributeFilter: ['style', 'class', 'aria-hidden']
    });
  };

  useEffect(() => {
    if (sessionStorage.getItem(SOCIAL_BAR_CLOSED_KEY) === '1') {
      suppressFutureBars();
      return;
    }

    if (sessionStorage.getItem(SOCIAL_BAR_SESSION_KEY) === '1') return;

    sessionStorage.setItem(SOCIAL_BAR_SESSION_KEY, '1');
    setShouldRender(true);
  }, []);

  useEffect(() => {
    const handleCloseClick = (event: MouseEvent) => {
      if (sessionStorage.getItem(SOCIAL_BAR_CLOSED_KEY) === '1') return;
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const path = (event.composedPath?.() || []) as HTMLElement[];
      const actionable = target.closest('button, [role="button"], a');
      const label = (actionable?.getAttribute('aria-label') ||
        actionable?.getAttribute('title') ||
        actionable?.textContent ||
        '').toLowerCase();

      const pathLabel = path
        .filter((node) => node && node.textContent)
        .map((node) => (node.textContent || '').trim().toLowerCase())
        .find((value) => value === 'hide' || value === 'close' || value === 'fechar' || value === 'ocultar');

      const isCloseAction =
        label.includes('close') ||
        label.includes('hide') ||
        label.includes('fechar') ||
        label.includes('ocultar') ||
        Boolean(pathLabel) ||
        Boolean(target.closest(`.${SOCIAL_BAR_CLASS_PREFIX}__closelink`));

      if (!isCloseAction) return;

      markClosed();
    };

    closeListenerRef.current = handleCloseClick;
    document.addEventListener('click', handleCloseClick, true);

    return () => {
      if (closeListenerRef.current) {
        document.removeEventListener('click', closeListenerRef.current, true);
        closeListenerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!shouldRender || !containerRef.current) return;

    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = SOCIAL_BAR_SCRIPT_SRC;
    containerRef.current.appendChild(script);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (trackedNodeRef.current || !(node instanceof HTMLElement)) return;
          const iframe = node.matches('iframe[src*="effectivegatecpm.com"], iframe[src*="gatecpm.com"]')
            ? node
            : node.querySelector('iframe[src*="effectivegatecpm.com"], iframe[src*="gatecpm.com"]');
          if (!iframe) return;
          trackedNodeRef.current = (iframe.closest('div') ?? iframe.parentElement) as HTMLElement | null;
        });

        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.className && node.className.includes(SOCIAL_BAR_CLASS_PREFIX)) {
            trackBarElement(node);
            return;
          }
          const nested = node.querySelector(`[class*="${SOCIAL_BAR_CLASS_PREFIX}"]`) as HTMLElement | null;
          if (nested) {
            trackBarElement(nested);
          }
        });

        mutation.removedNodes.forEach((node) => {
          const tracked = trackedNodeRef.current;
          if (!tracked || !(node instanceof HTMLElement)) return;
          if (node === tracked || node.contains(tracked)) {
            sessionStorage.setItem(SOCIAL_BAR_CLOSED_KEY, '1');
            setShouldRender(false);
            containerRef.current?.replaceChildren();
            suppressFutureBars();
          }
        });

        mutation.removedNodes.forEach((node) => {
          const bar = barNodeRef.current;
          if (!bar || !(node instanceof HTMLElement)) return;
          if (node === bar || node.contains(bar)) {
            markClosed();
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    const existing = document.querySelector(
      'iframe[src*="effectivegatecpm.com"], iframe[src*="gatecpm.com"]'
    );
    if (existing) {
      trackedNodeRef.current = (existing.closest('div') ?? existing.parentElement) as HTMLElement | null;
    }

    const existingBar = document.querySelector(`[class*="${SOCIAL_BAR_CLASS_PREFIX}"]`) as HTMLElement | null;
    if (existingBar) {
      trackBarElement(existingBar);
    }

    return () => {
      observer.disconnect();
    };
  }, [shouldRender]);

  useEffect(() => {
    if (sessionStorage.getItem(SOCIAL_BAR_CLOSED_KEY) !== '1') return;
    suppressFutureBars();

    if (cleanupIntervalRef.current) return;
    cleanupIntervalRef.current = window.setInterval(() => {
      removeInjectedBars();
    }, 3000);

    return () => {
      if (cleanupIntervalRef.current) {
        window.clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <div className="w-full flex justify-center">
      <div className="rounded-lg border border-zinc-700/40 bg-zinc-900/30 px-2 py-1.5">
        <div className="text-[10px] uppercase tracking-widest text-zinc-100 text-center mb-1 bg-zinc-800/60 rounded-md py-0.5 px-2 border border-zinc-700/50 shadow-sm">
          {adLabel}
        </div>
        <div ref={containerRef} className="flex justify-center" />
      </div>
    </div>
  );
};

export default SocialBarAd;
