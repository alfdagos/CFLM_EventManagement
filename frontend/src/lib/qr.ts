import QRCode from 'qrcode';

// URL pubblico del biglietto (HashRouter → usa "#/t/<token>").
// Questo è ciò che viene codificato nel QR: scansionato da una fotocamera
// qualsiasi apre direttamente la pagina del biglietto.
export function ticketUrl(token: string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/t/${token}`;
}

// Estrae il token sia da un URL completo (.../#/t/<token>) sia da un token grezzo.
// Usato dallo scanner della reception, che può ricevere l'uno o l'altro.
export function extractToken(scanned: string): string {
  const trimmed = scanned.trim();
  const match = trimmed.match(/\/t\/([A-Za-z0-9_-]+)/);
  if (match) return match[1];
  return trimmed;
}

// Genera un data-URL PNG del QR a partire dal contenuto.
export async function qrDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#16213e', light: '#ffffff' },
  });
}
