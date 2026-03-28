const LIQPAY_SCRIPT = 'https://static.liqpay.ua/libjs/checkout.js';

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${LIQPAY_SCRIPT}"]`)) { resolve(); return; }
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
  amount: number;
  tourTitle: string;
  seats: number;
  onSuccess?: () => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    LiqPayCheckout?: {
      init: (opts: { data: string; signature: string; embedTo: string; mode: string; language: string }) => {
        on: (event: string, cb: (data: any) => void) => any;
      };
    };
  }
}

const API = process.env.REACT_APP_API_URL!;

async function confirmPaymentOnServer(data: string, signature: string): Promise<void> {
  const token = localStorage.getItem('tour_auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}/liqpay/confirm`, {
    method: 'POST', headers,
    body: JSON.stringify({ data, signature }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Confirmation failed'); }
}

const fmt = (n: number) =>
  new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(n);

export async function openLiqPayWidget(opts: LiqPayWidgetOptions): Promise<void> {
  await loadScript();
  if (!window.LiqPayCheckout) throw new Error('LiqPayCheckout not available');

  const containerId = `liqpay-embed-${Date.now()}`;

  // Inject styles
  if (!document.getElementById('liqpay-overlay-styles')) {
    const style = document.createElement('style');
    style.id = 'liqpay-overlay-styles';
    style.textContent = `
      #liqpay-overlay {
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(15,23,42,0.75);
        backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center;
        animation: lpFadeIn 0.2s ease-out;
      }
      @keyframes lpFadeIn { from { opacity: 0; } to { opacity: 1; } }
      #liqpay-modal {
        background: #fff;
        border-radius: 20px;
        width: 90%;
        max-width: 420px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 24px 60px rgba(0,0,0,0.25);
        overflow: hidden;
        animation: lpSlideUp 0.25s ease-out;
      }
      #liqpay-modal-body {
        overflow-y: auto;
        flex: 1;
      }
      @keyframes lpSlideUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      #liqpay-modal-header {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        padding: 20px 22px 18px;
        color: #fff;
        position: relative;
      }
      #liqpay-modal-header h3 {
        margin: 0 0 12px;
        font-size: 17px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      #liqpay-modal-summary {
        display: flex;
        gap: 12px;
        background: rgba(255,255,255,0.15);
        border-radius: 12px;
        padding: 12px 14px;
      }
      .lp-sum-item { display: flex; flex-direction: column; gap: 2px; flex: 1; }
      .lp-sum-label { font-size: 10px; font-weight: 600; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.06em; }
      .lp-sum-value { font-size: 15px; font-weight: 800; }
      .lp-sum-divider { width: 1px; background: rgba(255,255,255,0.25); margin: 2px 0; }
      #liqpay-close-btn {
        position: absolute; top: 14px; right: 16px;
        background: rgba(255,255,255,0.2); border: none;
        border-radius: 50%; width: 28px; height: 28px;
        color: #fff; font-size: 14px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.15s;
      }
      #liqpay-close-btn:hover { background: rgba(255,255,255,0.35); }
      #liqpay-modal-body { padding: 0; }
      #liqpay-modal-footer {
        padding: 10px 16px 14px;
        display: flex; align-items: center; justify-content: center;
        gap: 6px;
        font-size: 11px; color: #94a3b8; font-weight: 500;
        border-top: 1px solid #f1f5f9;
      }
      #liqpay-modal-footer img { height: 14px; opacity: 0.6; }
    `;
    document.head.appendChild(style);
  }

  // Build overlay
  const overlay = document.createElement('div');
  overlay.id = 'liqpay-overlay';

  const modal = document.createElement('div');
  modal.id = 'liqpay-modal';

  const seatsLabel = opts.seats === 1 ? '1 особа' : opts.seats <= 4 ? `${opts.seats} особи` : `${opts.seats} осіб`;

  modal.innerHTML = `
    <div id="liqpay-modal-header">
      <button id="liqpay-close-btn">✕</button>
      <h3>Оплата бронювання</h3>
      <div id="liqpay-modal-summary">
        <div class="lp-sum-item">
          <span class="lp-sum-label">Тур</span>
          <span class="lp-sum-value" style="font-size:13px">${opts.tourTitle}</span>
        </div>
        <div class="lp-sum-divider"></div>
        <div class="lp-sum-item">
          <span class="lp-sum-label">Місць</span>
          <span class="lp-sum-value">${seatsLabel}</span>
        </div>
        <div class="lp-sum-divider"></div>
        <div class="lp-sum-item">
          <span class="lp-sum-label">Сума</span>
          <span class="lp-sum-value">${fmt(opts.amount)}</span>
        </div>
      </div>
    </div>
    <div id="liqpay-modal-body">
      <div id="${containerId}"></div>
    </div>
    <div id="liqpay-modal-footer">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Захищено SSL · Powered by
      <img src="https://static.liqpay.ua/buttons/logo-small.png" alt="LiqPay" />
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close button
  document.getElementById('liqpay-close-btn')!.onclick = () => {
    if (document.body.contains(overlay)) document.body.removeChild(overlay);
    opts.onClose?.();
  };

  // Click outside to close
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
      opts.onClose?.();
    }
  };

  const widget = window.LiqPayCheckout.init({
    data: opts.data,
    signature: opts.signature,
    embedTo: `#${containerId}`,
    mode: 'embed',
    language: 'uk',
  });

  widget
    .on('liqpay.callback', async (callbackData: any) => {
      if (callbackData.status === 'success' || callbackData.status === 'sandbox') {
        try {
          await confirmPaymentOnServer(callbackData.data, callbackData.signature);
        } catch (err) {
          console.error('Payment confirmation error:', err);
        }
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        opts.onSuccess?.();
      }
    })
    .on('liqpay.close', () => {
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
      opts.onClose?.();
    });
}
