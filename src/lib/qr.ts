import QRCode from "qrcode";

export async function qrPngDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 720,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#15202b", light: "#ffffff" },
  });
}

export async function qrSvgString(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#15202b", light: "#ffffff" },
  });
}

export function downloadDataUrl(filename: string, dataUrl: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function downloadText(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(filename, url);
  URL.revokeObjectURL(url);
}
