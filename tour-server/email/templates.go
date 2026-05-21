package email

import "fmt"

// BookingNotification holds the data needed for all booking email templates.
type BookingNotification struct {
	CustomerName string
	TourTitle    string
	Seats        int
	TotalPrice   float64
	BookingID    uint
	Status       string // "confirmed", "cancelled", "pending", "paid"
	PaymentURL   string // optional magic-link to resume payment (guest bookings)
}

// NotifyBookingConfirmed sends email when booking is confirmed by admin.
func NotifyBookingConfirmed(to string, data BookingNotification) {
	subject := fmt.Sprintf("✅ Бронювання #%d підтверджено — %s", data.BookingID, data.TourTitle)
	body, err := renderTemplate(confirmedTemplate, templateData(data))
	if err != nil {
		fmt.Printf("Email template error: %v\n", err)
		return
	}
	SendAsync(to, subject, body)
}

// NotifyBookingCancelled sends email when booking is cancelled.
func NotifyBookingCancelled(to string, data BookingNotification) {
	subject := fmt.Sprintf("❌ Бронювання #%d скасовано — %s", data.BookingID, data.TourTitle)
	body, err := renderTemplate(cancelledTemplate, templateData(data))
	if err != nil {
		fmt.Printf("Email template error: %v\n", err)
		return
	}
	SendAsync(to, subject, body)
}

// NotifyPaymentReceived sends email when payment is successfully processed.
func NotifyPaymentReceived(to string, data BookingNotification) {
	subject := fmt.Sprintf("💳 Оплату отримано — бронювання #%d підтверджено", data.BookingID)
	body, err := renderTemplate(paymentReceivedTemplate, templateData(data))
	if err != nil {
		fmt.Printf("Email template error: %v\n", err)
		return
	}
	SendAsync(to, subject, body)
}

// NotifyBookingCreated sends email when a new booking is created (pending).
func NotifyBookingCreated(to string, data BookingNotification) {
	subject := fmt.Sprintf("🕐 Бронювання #%d створено — %s", data.BookingID, data.TourTitle)
	body, err := renderTemplate(createdTemplate, templateData(data))
	if err != nil {
		fmt.Printf("Email template error: %v\n", err)
		return
	}
	SendAsync(to, subject, body)
}

type tmplData struct {
	CustomerName string
	TourTitle    string
	Seats        int
	TotalPrice   string
	BookingID    uint
	SeatsWord    string
	PaymentURL   string
}

func templateData(n BookingNotification) tmplData {
	word := "місць"
	if n.Seats == 1 {
		word = "місце"
	} else if n.Seats >= 2 && n.Seats <= 4 {
		word = "місця"
	}
	return tmplData{
		CustomerName: n.CustomerName,
		TourTitle:    n.TourTitle,
		Seats:        n.Seats,
		TotalPrice:   formatPrice(n.TotalPrice),
		BookingID:    n.BookingID,
		SeatsWord:    word,
		PaymentURL:   n.PaymentURL,
	}
}

// ─── HTML Templates ────────────────────────────────────────────────

const emailLayout = `<!DOCTYPE html>
<html lang="uk">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,{{.HeaderColor1}},{{.HeaderColor2}});padding:32px 40px;text-align:center;">
  <div style="font-size:36px;margin-bottom:8px;">{{.Icon}}</div>
  <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;letter-spacing:-0.02em;">{{.Title}}</h1>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px 40px;">
  <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px;">
    Привіт, <strong>{{.CustomerName}}</strong>! {{.Message}}
  </p>

  <!-- Booking details card -->
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <table width="100%%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Тур</td>
        <td style="padding:8px 0;color:#1e293b;font-size:15px;font-weight:700;text-align:right;">{{.TourTitle}}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Бронювання</td>
        <td style="padding:8px 0;border-top:1px solid #e2e8f0;color:#1e293b;font-size:15px;font-weight:700;text-align:right;">#{{.BookingID}}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Кількість</td>
        <td style="padding:8px 0;border-top:1px solid #e2e8f0;color:#1e293b;font-size:15px;font-weight:700;text-align:right;">{{.Seats}} {{.SeatsWord}}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Сума</td>
        <td style="padding:8px 0;border-top:1px solid #e2e8f0;color:#1e293b;font-size:18px;font-weight:900;text-align:right;">{{.TotalPrice}}</td>
      </tr>
    </table>
  </td></tr>
  </table>

  {{.Extra}}
</td></tr>

<!-- Footer -->
<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
  <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">© 2026 OpenWorld — Ваш провідник у світ подорожей</p>
  <p style="color:#94a3b8;font-size:12px;margin:0;">Цей лист відправлено автоматично, будь ласка, не відповідайте на нього.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

// ─── Individual templates using the layout ─────────────────────────

const confirmedTemplate = `<!DOCTYPE html>
<html lang="uk">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 40px;text-align:center;">
  <div style="font-size:36px;margin-bottom:8px;">✅</div>
  <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;">Бронювання підтверджено</h1>
</td></tr>

<tr><td style="padding:32px 40px;">
  <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px;">
    Привіт, <strong>{{.CustomerName}}</strong>! Ваше бронювання було успішно підтверджено. Менеджер зв'яжеться з вами найближчим часом для уточнення деталей.
  </p>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:13px;font-weight:600;">Тур</td>
        <td style="padding:8px 0;color:#1e293b;font-size:15px;font-weight:700;text-align:right;">{{.TourTitle}}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #bbf7d0;color:#64748b;font-size:13px;font-weight:600;">Бронювання</td>
        <td style="padding:8px 0;border-top:1px solid #bbf7d0;color:#1e293b;font-size:15px;font-weight:700;text-align:right;">#{{.BookingID}}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #bbf7d0;color:#64748b;font-size:13px;font-weight:600;">Кількість</td>
        <td style="padding:8px 0;border-top:1px solid #bbf7d0;color:#1e293b;font-size:15px;font-weight:700;text-align:right;">{{.Seats}} {{.SeatsWord}}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #bbf7d0;color:#64748b;font-size:13px;font-weight:600;">Сума</td>
        <td style="padding:8px 0;border-top:1px solid #bbf7d0;color:#059669;font-size:18px;font-weight:900;text-align:right;">{{.TotalPrice}}</td>
      </tr>
    </table>
  </td></tr>
  </table>

  <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0;">
    Якщо у вас є питання — зверніться до нашої служби підтримки.
  </p>
</td></tr>

<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
  <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">© 2026 OpenWorld — Ваш провідник у світ подорожей</p>
  <p style="color:#94a3b8;font-size:12px;margin:0;">Цей лист відправлено автоматично.</p>
</td></tr>

</table></td></tr></table></body></html>`

const cancelledTemplate = `<!DOCTYPE html>
<html lang="uk">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<tr><td style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:32px 40px;text-align:center;">
  <div style="font-size:36px;margin-bottom:8px;">❌</div>
  <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;">Бронювання скасовано</h1>
</td></tr>

<tr><td style="padding:32px 40px;">
  <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px;">
    Привіт, <strong>{{.CustomerName}}</strong>! На жаль, ваше бронювання було скасовано. Якщо у вас виникли запитання, зверніться до нашої служби підтримки.
  </p>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:13px;font-weight:600;">Тур</td>
        <td style="padding:8px 0;color:#1e293b;font-size:15px;font-weight:700;text-align:right;">{{.TourTitle}}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #fecaca;color:#64748b;font-size:13px;font-weight:600;">Бронювання</td>
        <td style="padding:8px 0;border-top:1px solid #fecaca;color:#1e293b;font-size:15px;font-weight:700;text-align:right;">#{{.BookingID}}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #fecaca;color:#64748b;font-size:13px;font-weight:600;">Кількість</td>
        <td style="padding:8px 0;border-top:1px solid #fecaca;color:#1e293b;font-size:15px;font-weight:700;text-align:right;">{{.Seats}} {{.SeatsWord}}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #fecaca;color:#64748b;font-size:13px;font-weight:600;">Сума</td>
        <td style="padding:8px 0;border-top:1px solid #fecaca;color:#991b1b;font-size:18px;font-weight:900;text-align:right;text-decoration:line-through;">{{.TotalPrice}}</td>
      </tr>
    </table>
  </td></tr>
  </table>

  <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0;">
    Ви завжди можете обрати інший тур на нашому сайті. Будемо раді бачити вас знову!
  </p>
</td></tr>

<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
  <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">© 2026 OpenWorld — Ваш провідник у світ подорожей</p>
  <p style="color:#94a3b8;font-size:12px;margin:0;">Цей лист відправлено автоматично.</p>
</td></tr>

</table></td></tr></table></body></html>`

const paymentReceivedTemplate = `<!DOCTYPE html>
<html lang="uk">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
  <div style="font-size:36px;margin-bottom:8px;">💳</div>
  <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;">Оплату отримано</h1>
</td></tr>

<tr><td style="padding:32px 40px;">
  <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px;">
    Привіт, <strong>{{.CustomerName}}</strong>! Ваша оплата успішно оброблена через LiqPay. Бронювання автоматично підтверджено.
  </p>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:13px;font-weight:600;">Тур</td>
        <td style="padding:8px 0;color:#1e293b;font-size:15px;font-weight:700;text-align:right;">{{.TourTitle}}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #c7d2fe;color:#64748b;font-size:13px;font-weight:600;">Бронювання</td>
        <td style="padding:8px 0;border-top:1px solid #c7d2fe;color:#1e293b;font-size:15px;font-weight:700;text-align:right;">#{{.BookingID}}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #c7d2fe;color:#64748b;font-size:13px;font-weight:600;">Кількість</td>
        <td style="padding:8px 0;border-top:1px solid #c7d2fe;color:#1e293b;font-size:15px;font-weight:700;text-align:right;">{{.Seats}} {{.SeatsWord}}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #c7d2fe;color:#64748b;font-size:13px;font-weight:600;">Оплачено</td>
        <td style="padding:8px 0;border-top:1px solid #c7d2fe;color:#4f46e5;font-size:18px;font-weight:900;text-align:right;">{{.TotalPrice}}</td>
      </tr>
    </table>
  </td></tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:16px;">
  <tr><td style="padding:14px 18px;">
    <p style="color:#166534;font-size:14px;font-weight:600;margin:0;">✅ Статус: Підтверджено та оплачено</p>
  </td></tr>
  </table>

  <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0;">
    Менеджер зв'яжеться з вами для уточнення деталей подорожі. Дякуємо за довіру!
  </p>
</td></tr>

<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
  <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">© 2026 OpenWorld — Ваш провідник у світ подорожей</p>
  <p style="color:#94a3b8;font-size:12px;margin:0;">Цей лист відправлено автоматично.</p>
</td></tr>

</table></td></tr></table></body></html>`

const createdTemplate = `<!DOCTYPE html>
<html lang="uk">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<tr><td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px 40px;text-align:center;">
  <div style="font-size:36px;margin-bottom:8px;">🕐</div>
  <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;">Бронювання створено</h1>
</td></tr>

<tr><td style="padding:32px 40px;">
  <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px;">
    Привіт, <strong>{{.CustomerName}}</strong>! Ваше бронювання прийнято та очікує обробки. Ми зв'яжемося з вами найближчим часом.
  </p>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:13px;font-weight:600;">Тур</td>
        <td style="padding:8px 0;color:#1e293b;font-size:15px;font-weight:700;text-align:right;">{{.TourTitle}}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #fde68a;color:#64748b;font-size:13px;font-weight:600;">Бронювання</td>
        <td style="padding:8px 0;border-top:1px solid #fde68a;color:#1e293b;font-size:15px;font-weight:700;text-align:right;">#{{.BookingID}}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #fde68a;color:#64748b;font-size:13px;font-weight:600;">Кількість</td>
        <td style="padding:8px 0;border-top:1px solid #fde68a;color:#1e293b;font-size:15px;font-weight:700;text-align:right;">{{.Seats}} {{.SeatsWord}}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #fde68a;color:#64748b;font-size:13px;font-weight:600;">Сума</td>
        <td style="padding:8px 0;border-top:1px solid #fde68a;color:#92400e;font-size:18px;font-weight:900;text-align:right;">{{.TotalPrice}}</td>
      </tr>
    </table>
  </td></tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:16px;">
  <tr><td style="padding:14px 18px;">
    <p style="color:#92400e;font-size:14px;font-weight:600;margin:0;">⏳ Статус: Очікує оплату</p>
  </td></tr>
  </table>

  {{if .PaymentURL}}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
  <tr><td align="center" style="padding:8px 0 4px;">
    <a href="{{.PaymentURL}}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;box-shadow:0 4px 12px rgba(99,102,241,0.3);">
      Переглянути бронювання
    </a>
  </td></tr>
  <tr><td align="center" style="padding-top:10px;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">За цим посиланням можна оплатити або скасувати бронювання. Діє 7 днів.</p>
  </td></tr>
  </table>
  {{else}}
  <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0;">
    Ви можете переглянути статус бронювання та оплатити його в особистому кабінеті на сайті.
  </p>
  {{end}}
</td></tr>

<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
  <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">© 2026 OpenWorld — Ваш провідник у світ подорожей</p>
  <p style="color:#94a3b8;font-size:12px;margin:0;">Цей лист відправлено автоматично.</p>
</td></tr>

</table></td></tr></table></body></html>`