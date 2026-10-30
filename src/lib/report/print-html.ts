/**
 * Writes a self-contained HTML document into a hidden iframe and opens the
 * browser print dialog for it (print or save as PDF), once the document's
 * fonts and layout are ready. The iframe is removed after printing, with a
 * long fallback so it never leaks if `afterprint` doesn't fire.
 */
export function printHtmlDocument(html: string): void {
  if (typeof window === "undefined") return;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.appendChild(iframe);

  const frameWin = iframe.contentWindow;
  const frameDoc = frameWin?.document;
  if (!frameWin || !frameDoc) {
    iframe.remove();
    return;
  }

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    // Defer slightly so we never tear down while the dialog is mid-open.
    window.setTimeout(() => iframe.remove(), 500);
  };
  frameWin.addEventListener("afterprint", cleanup);

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  const print = () => {
    try {
      frameWin.focus();
      frameWin.print();
    } catch (err) {
      console.error("[report] print failed:", err);
      cleanup();
    }
  };

  // Wait for fonts, then one frame so layout has settled, instead of a fixed delay.
  const fontsReady = frameDoc.fonts?.ready ?? Promise.resolve();
  fontsReady.then(() => frameWin.requestAnimationFrame(print), print);
  window.setTimeout(cleanup, 60000);
}
