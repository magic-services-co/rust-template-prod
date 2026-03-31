export interface ElementEdit {
  id: string;
  pageSlug: string;
  selector: string;
  editType: string;
  content?: string;
  styles?: Record<string, string>;
  icon?: string;
}

export function pathnameToPageSlug(pathname: string): string {
  if (!pathname || pathname === "/") return "home";
  return pathname.replace(/^\//, "").split("/")[0] ?? "home";
}

export function getComponentType(element: HTMLElement): string {
  if (element.tagName === "BUTTON") return "button";
  if (element.tagName === "A") return "link";
  if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") return "input";
  if (element.classList.contains("card") || element.closest('[class*="card"]')) return "card";
  if (element.tagName.match(/^H[1-6]$/)) return "heading";
  if (element.tagName === "P") return "paragraph";
  if (element.tagName === "SVG" || element.querySelector("svg") || element.classList.contains("lucide")) return "icon";
  return "element";
}

export function isIconElement(element: HTMLElement): boolean {
  return (
    element.tagName === "SVG" ||
    element.querySelector("svg") !== null ||
    element.classList.contains("lucide") ||
    element.closest("svg") !== null
  );
}

export function isSelectableElement(element: HTMLElement): boolean {
  return !!element && element.tagName !== "BODY" && element.tagName !== "HTML";
}

export function findBestSelectableElement(element: HTMLElement): HTMLElement {
  const priorityTags = ["BUTTON", "A", "INPUT", "TEXTAREA", "H1", "H2", "H3", "H4", "H5", "H6", "P", "SPAN", "LABEL"];
  if (priorityTags.includes(element.tagName)) {
    return element;
  }
  return element;
}

export function generateSelector(element: HTMLElement, forceClass = false): string {
  if (element.id) return `#${CSS.escape(element.id)}`;

  if (!forceClass) {
    const path: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current.tagName !== "BODY") {
      let selector = current.tagName.toLowerCase();

      if (current.className) {
        const classes = Array.from(current.classList)
          .filter((c) => !c.startsWith("editor-"))
          .filter((c) => /^[a-zA-Z_-]/.test(c))
          .slice(0, 2)
          .map((c) => CSS.escape(c))
          .join(".");
        if (classes) selector += `.${classes}`;
      }

      const parent: HTMLElement | null = current.parentElement;
      if (parent) {
        const sameTagSiblings = Array.from(parent.children).filter((e) => e.tagName === current!.tagName);
        if (sameTagSiblings.length > 1) {
          const childIndex = Array.from(parent.children).indexOf(current) + 1;
          selector += `:nth-child(${childIndex})`;
        }
      }

      path.unshift(selector);
      current = parent;
    }

    return path.slice(-3).join(" > ");
  }

  if (element.className) {
    const classes = Array.from(element.classList)
      .filter((c) => !c.startsWith("editor-"))
      .filter((c) => /^[a-zA-Z_-]/.test(c))
      .map((c) => CSS.escape(c))
      .join(".");
    if (classes) return `.${classes}`;
  }

  return element.tagName.toLowerCase();
}

export function isTextEditable(element: HTMLElement): boolean {
  if (element.classList.contains("select-none")) return false;
  if (element.classList.contains("inline-flex")) return false;
  if (element.closest("button")) return false;
  if (element.tagName === "BUTTON") return false;
  if (element.tagName === "A") return false;
  if (element.classList.length > 10) return false;

  const textEditableTags = ["P", "H1", "H2", "H3", "H4", "H5", "H6", "SPAN", "DIV", "LABEL"];
  return textEditableTags.includes(element.tagName);
}

export function rgbToHex(rgb: string): string {
  if (!rgb || !rgb.includes("rgb")) return rgb;
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return "#000000";
  const r = parseInt(match[1], 10).toString(16).padStart(2, "0");
  const g = parseInt(match[2], 10).toString(16).padStart(2, "0");
  const b = parseInt(match[3], 10).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

export function buildDraftEditsCss(pageSlug: string, edits: Map<string, ElementEdit>): string {
  let css = "";
  const forPage = Array.from(edits.values()).filter((e) => e.pageSlug === pageSlug && e.styles);

  for (const edit of forPage) {
    if (!edit.styles) continue;
    const cssProperties = Object.entries(edit.styles)
      .map(([prop, value]) => {
        const cssProp = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
        return `  ${cssProp}: ${value} !important;`;
      })
      .join("\n");

    if (!cssProperties) continue;

    css += `${edit.selector} {\n${cssProperties}\n}\n\n`;
    css += `${edit.selector} * {\n${cssProperties}\n}\n\n`;

    if (edit.styles.color) {
      const c = edit.styles.color;
      css += `${edit.selector} svg,\n${edit.selector} svg * {\n  fill: ${c} !important;\n  color: ${c} !important;\n}\n\n`;
    }
    if (edit.styles.backgroundColor) {
      const c = edit.styles.backgroundColor;
      css += `${edit.selector},\n${edit.selector} * {\n  background-color: ${c} !important;\n}\n\n`;
    }
    if (edit.styles.borderColor) {
      const c = edit.styles.borderColor;
      css += `${edit.selector},\n${edit.selector} * {\n  border-color: ${c} !important;\n}\n\n`;
    }
  }

  return css;
}
