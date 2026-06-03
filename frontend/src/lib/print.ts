// Apre una finestra con una versione stampabile del biglietto e lancia la stampa.
// Layout chiaro (sfondo bianco) ottimizzato per la carta, indipendente dal tema
// scuro dell'app. Il QR è un data-URL, quindi è già disponibile (nessun caricamento).

export interface PrintTicketData {
  holderName: string;
  qrDataUrl: string;
  url: string;
  eventTitle: string;
  eventDate?: string | null;
  eventTime?: string | null;
  eventLocation?: string | null;
}

function esc(s: string | null | undefined): string {
  return (s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );
}

export function printTicket(d: PrintTicketData): void {
  const w = window.open('', '_blank', 'width=460,height=760');
  if (!w) {
    alert('Impossibile aprire la finestra di stampa: consenti i pop-up per questo sito.');
    return;
  }

  const meta = [
    d.eventDate ? `<li><span>📅</span> ${esc(d.eventDate)}</li>` : '',
    d.eventTime ? `<li><span>🕘</span> ${esc(d.eventTime)}</li>` : '',
    d.eventLocation ? `<li><span>📍</span> ${esc(d.eventLocation)}</li>` : '',
  ].join('');

  w.document.write(`<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8" />
<title>Biglietto — ${esc(d.eventTitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Inter:wght@400;600&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #111; font-family: 'Inter', system-ui, sans-serif; }
  .ticket {
    width: 360px; margin: 24px auto; border: 2px solid #111; border-radius: 16px; overflow: hidden;
  }
  .head { background: #dc2626; color: #fff; padding: 16px 18px; text-align: center; }
  .head .brand { font-size: 12px; letter-spacing: 3px; text-transform: uppercase; opacity: .9; }
  .head h1 {
    margin: 6px 0 0; font-family: 'Cinzel', serif; font-weight: 800; text-transform: uppercase;
    letter-spacing: 2px; font-size: 22px; line-height: 1.15;
  }
  .body { padding: 18px; text-align: center; }
  .holder { font-size: 13px; color: #666; }
  .holder b { display: block; font-size: 20px; color: #111; margin-top: 2px; }
  ul.meta { list-style: none; padding: 0; margin: 14px 0; text-align: left; display: inline-block; }
  ul.meta li { padding: 4px 0; font-size: 14px; }
  ul.meta li span { display: inline-block; width: 22px; }
  .qr { margin: 10px auto 6px; padding: 12px; border: 1px dashed #bbb; border-radius: 12px; display: inline-block; }
  .qr img { display: block; width: 240px; height: 240px; }
  .hint { font-size: 12px; color: #666; margin: 4px 0 0; }
  .perf { border-top: 2px dashed #111; margin: 0; }
  .foot { padding: 12px 18px; text-align: center; }
  .foot .code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11px; color: #444; word-break: break-all; }
  @media print {
    @page { margin: 8mm; }
    .ticket { margin: 0 auto; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
  <div class="ticket">
    <div class="head">
      <div class="brand">CFLM</div>
      <h1>${esc(d.eventTitle)}</h1>
    </div>
    <div class="body">
      <div class="holder">Biglietto di<b>${esc(d.holderName)}</b></div>
      ${meta ? `<ul class="meta">${meta}</ul>` : ''}
      <div class="qr"><img src="${d.qrDataUrl}" alt="QR Code" /></div>
      <p class="hint">Presenta questo QR all'ingresso</p>
    </div>
    <div class="perf"></div>
    <div class="foot">
      <div class="code">${esc(d.url)}</div>
    </div>
  </div>
  <script>
    window.onload = function () {
      window.focus();
      // piccolo ritardo per dare tempo ai font di caricarsi
      setTimeout(function () { window.print(); }, 350);
    };
  </script>
</body>
</html>`);
  w.document.close();
}
