export async function copyText(text: string): Promise<boolean> {
  // Run the legacy copy during the click, before any await. iOS Safari and
  // Android Chrome drop clipboard permission after the user gesture ends.
  const legacyOk = copyWithSelection(text);
  try {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied. The selection copy above may already have succeeded.
  }
  return legacyOk;
}

function copyWithSelection(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("aria-hidden", "true");
  area.tabIndex = -1;
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.width = "2em";
  area.style.height = "2em";
  area.style.padding = "0";
  area.style.border = "none";
  area.style.outline = "none";
  area.style.boxShadow = "none";
  area.style.background = "transparent";
  area.style.fontSize = "16px";
  const selection = document.getSelection();
  const previous = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  let ok = false;
  try {
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, area.value.length);
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  } finally {
    area.remove();
    if (previous && selection) {
      try {
        selection.removeAllRanges();
        selection.addRange(previous);
      } catch {
        selection.removeAllRanges();
      }
    }
  }
  return ok;
}
