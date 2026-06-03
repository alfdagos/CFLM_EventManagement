// Stampa e download PDF della versione "biglietto".
// - printTicket: apre una finestra con layout chiaro e lancia la stampa del browser.
// - downloadTicketPdf: genera un vero PDF scaricabile (jsPDF, import dinamico).

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

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // rimuove i diacritici (accenti)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'biglietto'
  );
}

// ---------------------------------------------------------------------------
// STAMPA — apre una finestra con il biglietto e invoca window.print()
// ---------------------------------------------------------------------------
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
      setTimeout(function () { window.print(); }, 350);
    };
  </script>
</body>
</html>`);
  w.document.close();
}

// ---------------------------------------------------------------------------
// DOWNLOAD PDF — genera un file PDF (A6) scaricabile
// ---------------------------------------------------------------------------
export async function downloadTicketPdf(d: PrintTicketData): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a6' }); // 105 x 148.5 mm
  const W = doc.internal.pageSize.getWidth();

  // Intestazione rossa
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, W, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('CFLM', W / 2, 9, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text(doc.splitTextToSize(d.eventTitle.toUpperCase(), W - 16), W / 2, 17, {
    align: 'center',
  });

  // Intestatario
  let y = 38;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text('Biglietto di', W / 2, y, { align: 'center' });
  y += 6;
  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(20, 20, 20);
  doc.text(d.holderName, W / 2, y, { align: 'center' });
  y += 8;

  // Dettagli evento
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  for (const line of [
    d.eventDate ? `Data:  ${d.eventDate}` : null,
    d.eventTime ? `Orario:  ${d.eventTime}` : null,
    d.eventLocation ? `Luogo:  ${d.eventLocation}` : null,
  ]) {
    if (!line) continue;
    doc.text(line, W / 2, y, { align: 'center' });
    y += 5.5;
  }
  y += 2;

  // QR
  const qrSize = 46;
  doc.addImage(d.qrDataUrl, 'PNG', (W - qrSize) / 2, y, qrSize, qrSize);
  y += qrSize + 6;
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  doc.text("Presenta questo QR all'ingresso", W / 2, y, { align: 'center' });
  y += 6;

  // Link di fallback
  doc.setFont('courier', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(90, 90, 90);
  doc.text(doc.splitTextToSize(d.url, W - 12), W / 2, y, { align: 'center' });

  doc.save(`biglietto-${slug(d.holderName)}.pdf`);
}
