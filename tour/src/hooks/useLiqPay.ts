// Dynamically loads LiqPay JS SDK and opens the payment widget.
// LiqPay docs: https://www.liqpay.ua/documentation/api/aquiring/checkout/doc

const LIQPAY_SCRIPT = 'https://static.liqpay.ua/libjs/checkout.js';

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${LIQPAY_SCRIPT}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = LIQPAY_SCRIPT;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load LiqPay SDK'));
    document.head.appendChild(s);
  });
}

export interface LiqPayWidgetOptions {
  data: string;
  signature: string;
  /** Called when payment completed successfully */
  onSuccess?: (data: any) => void;
  /** Called when widget closed without payment */
  onClose?: () => void;
  /** Called on any LiqPay callback status */
  onCallback?: (data: any) => void;
}

declare global {
  interface Window {
    LiqPayCheckout?: {
      init: (opts: {
        data: string;
        signature: string;
        embedTo: string;
        mode: string;
        language: string;
      }) => {
        on: (event: string, cb: (data: any) => void) => any;
      };
    };
  }
}

export async function openLiqPayWidget(opts: LiqPayWidgetOptions): Promise<void> {
  await loadScript();

  if (!window.LiqPayCheckout) {
    throw new Error('LiqPayCheckout not available');
  }

  // Create a temporary container for the widget
  const containerId = `liqpay-widget-${Date.now()}`;
  const overlay = document.createElement('div');
  overlay.id = 'liqpay-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
  `;

  const container = document.createElement('div');
  container.id = containerId;
  container.style.cssText = `
    background: #fff; border-radius: 16px;
    padding: 24px; max-width: 420px; width: 90%;
    box-shadow: 0 24px 60px rgba(0,0,0,0.2);
    position: relative;
  `;

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    position: absolute; top: 12px; right: 14px;
    background: none; border: none; font-size: 18px;
    color: #9ca3af; cursor: pointer; line-height: 1;
  `;
  closeBtn.onclick = () => {
    document.body.removeChild(overlay);
    opts.onClose?.();
  };

  container.appendChild(closeBtn);
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  const widget = window.LiqPayCheckout.init({
    data: opts.data,
    signature: opts.signature,
    embedTo: `#${containerId}`,
    mode: 'embed',
    language: 'uk',
  });

  widget
    .on('liqpay.callback', (data: any) => {
      opts.onCallback?.(data);
      if (data.status === 'success' || data.status === 'sandbox') {
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        opts.onSuccess?.(data);
      }
    })
    .on('liqpay.close', () => {
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
      opts.onClose?.();
    });
}