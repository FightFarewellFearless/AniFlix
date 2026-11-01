/**
 * Windows toast implementation.
 *
 * Android uses `ToastAndroid`, which draws an in-app toast. The previous
 * Windows implementation forwarded every message to a Windows notification,
 * which looks wrong for short foreground feedback ("Ditambahkan ke tonton
 * nanti") and does not appear when notifications are disabled. This version
 * renders a small DOM toast in the same style as the rest of the app, and
 * falls back to a native notification only if no document is available.
 */

const MAX_VISIBLE_TOASTS = 4;

let container: HTMLDivElement | null = null;

function ensureContainer(): HTMLDivElement {
  if (container && document.body.contains(container)) return container;

  container = document.createElement('div');
  container.setAttribute('data-aniflix-toast-container', '');
  Object.assign(container.style, {
    position: 'fixed',
    left: '50%',
    bottom: '28px',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    zIndex: '2147483647',
    pointerEvents: 'none',
    width: 'min(92vw, 680px)',
  });
  document.body.appendChild(container);
  return container;
}

function removeToast(element: HTMLDivElement) {
  element.style.opacity = '0';
  element.style.transform = 'translateY(8px)';
  window.setTimeout(() => {
    element.remove();
    if (container && container.childElementCount === 0) {
      container.remove();
      container = null;
    }
  }, 180);
}

function renderToast(message: string, duration: number) {
  const host = ensureContainer();

  while (host.childElementCount >= MAX_VISIBLE_TOASTS) {
    const oldest = host.firstElementChild as HTMLDivElement | null;
    if (!oldest) break;
    oldest.remove();
  }

  const element = document.createElement('div');
  element.setAttribute('role', 'status');
  element.setAttribute('aria-live', 'polite');
  element.textContent = message;
  Object.assign(element.style, {
    maxWidth: '100%',
    padding: '9px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(30, 30, 34, 0.96)',
    color: '#f3f3f3',
    boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
    fontSize: '13px',
    fontWeight: '500',
    lineHeight: '1.45',
    textAlign: 'center',
    whiteSpace: 'pre-line',
    opacity: '0',
    transform: 'translateY(8px)',
    transition: 'opacity 160ms ease, transform 160ms ease',
  });

  host.appendChild(element);
  window.requestAnimationFrame(() => {
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
  });

  window.setTimeout(
    () => removeToast(element),
    Math.max(1200, Number.isFinite(duration) ? duration : 0),
  );
}

export const windowsToast = {
  show: (message: string, duration: number = 2500) => {
    if (typeof document === 'undefined' || !document.body) {
      void (globalThis as any).electronAPI?.showNotification?.({
        title: 'AniFlix',
        body: message,
      });
      return;
    }
    renderToast(message, duration);
  },
};

export const Toast = windowsToast;
export default windowsToast;
