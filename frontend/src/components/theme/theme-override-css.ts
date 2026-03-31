export type ThemeOverridePayload = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  radius: string;
  primaryTitleColor: string;
  secondaryTextColor: string;
  linkAccentColor: string;
  navLinkColor: string;
  navLinkHoverColor: string;
  navLinkActiveColor: string;
  mutedTextColor: string;
  fontFamily: string;
  primaryButtonBg: string;
  primaryButtonHover: string;
  primaryButtonText: string;
  secondaryButtonBg: string;
  secondaryButtonHover: string;
  secondaryButtonText: string;
  cardBgDefault: string;
  cardBgHover: string;
  inputBorderColor: string;
  backgroundImage: string;
  logoImage: string;
  backgroundOpacity: number;
};

export function buildThemeOverrideCss(settings: ThemeOverridePayload): string {
  return `
      :root {
        --background: ${settings.background};
        --foreground: ${settings.foreground};
        --card: ${settings.card};
        --card-foreground: ${settings.cardForeground};
        --popover: ${settings.popover};
        --popover-foreground: ${settings.popoverForeground};
        --primary: ${settings.primary};
        --primary-foreground: ${settings.primaryForeground};
        --secondary: ${settings.secondary};
        --secondary-foreground: ${settings.secondaryForeground};
        --muted: ${settings.muted};
        --muted-foreground: ${settings.mutedForeground};
        --accent: ${settings.accent};
        --accent-foreground: ${settings.accentForeground};
        --destructive: ${settings.destructive};
        --destructive-foreground: ${settings.destructiveForeground};
        --border: ${settings.border};
        --input: ${settings.input};
        --ring: ${settings.ring};
        --radius: ${settings.radius};
      }

      * {
        font-family: ${settings.fontFamily} !important;
      }

      h1, h2, h3, h4, h5, h6 {
        color: ${settings.primaryTitleColor} !important;
      }

      p, span:not(button span), div:not(button div):not(a div) {
        color: ${settings.secondaryTextColor} !important;
      }

      a:not(nav a) {
        color: ${settings.linkAccentColor} !important;
      }

      nav a {
        color: ${settings.navLinkColor} !important;
      }

      nav a:hover {
        color: ${settings.navLinkHoverColor} !important;
      }

      nav a.active, nav a[aria-current] {
        color: ${settings.navLinkActiveColor} !important;
      }

      button:not([class*="secondary"]):not([class*="outline"]):not([class*="ghost"]):not([class*="destructive"]):not([class*="link"]),
      .bg-primary {
        background-color: ${settings.primaryButtonBg} !important;
        color: ${settings.primaryButtonText} !important;
      }

      button:not([class*="secondary"]):not([class*="outline"]):not([class*="ghost"]):not([class*="destructive"]):not([class*="link"]):hover,
      .bg-primary:hover {
        background-color: ${settings.primaryButtonHover} !important;
      }

      button[class*="secondary"],
      .bg-secondary {
        background-color: ${settings.secondaryButtonBg} !important;
        color: ${settings.secondaryButtonText} !important;
      }

      button[class*="secondary"]:hover,
      .bg-secondary:hover {
        background-color: ${settings.secondaryButtonHover} !important;
      }

      .card, [class*="card"] {
        background-color: ${settings.cardBgDefault} !important;
      }

      .card:hover, [class*="card"]:hover {
        background-color: ${settings.cardBgHover} !important;
      }

      input, textarea, select {
        border-color: ${settings.inputBorderColor} !important;
      }

      .text-muted, .text-muted-foreground, [class*="muted"] {
        color: ${settings.mutedTextColor} !important;
      }
    `;
}

export function applyThemeMediaToDocument(doc: Document, win: Window | null, settings: ThemeOverridePayload): void {
  const header = doc.querySelector("header");
  if (header) {
    header.querySelectorAll("img").forEach((img) => {
      const imgElement = img as HTMLImageElement;
      if (
        imgElement.alt.toLowerCase().includes("logo") ||
        imgElement.alt.toLowerCase().includes("server") ||
        imgElement.src.includes("logo")
      ) {
        imgElement.src = settings.logoImage || "/images/logo.png";
        imgElement.setAttribute("src", settings.logoImage || "/images/logo.png");
      }
    });
  }

  doc.querySelectorAll("img").forEach((img) => {
    const imgElement = img as HTMLImageElement;
    if (imgElement.alt.toLowerCase().includes("logo") || imgElement.alt.toLowerCase().includes("server")) {
      imgElement.src = settings.logoImage || "/images/logo.png";
      imgElement.setAttribute("src", settings.logoImage || "/images/logo.png");
    }
  });

  doc.querySelectorAll("div").forEach((div) => {
    const divElement = div as HTMLElement;
    const computedStyle = win?.getComputedStyle(divElement);
    const inlineStyle = divElement.getAttribute("style") || "";

    const isBackgroundDiv =
      (computedStyle?.position === "fixed" &&
        (parseInt(computedStyle.zIndex || "0", 10) < 0 || computedStyle.zIndex === "-2")) ||
      inlineStyle.includes("backgroundImage") ||
      inlineStyle.includes("background-image") ||
      (divElement.classList.toString().includes("bg-cover") && computedStyle?.position === "fixed");

    if (isBackgroundDiv) {
      divElement.style.backgroundImage = `url('${settings.backgroundImage || "/images/background.jpg"}')`;
      divElement.style.backgroundPosition = "center";
      divElement.style.backgroundRepeat = "no-repeat";
      divElement.style.backgroundSize = "cover";
      divElement.style.opacity = `${(settings.backgroundOpacity ?? 10) / 100}`;
    }
  });
}
