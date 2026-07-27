export const lightTheme = {
  mode: "light",
  bg: "#F3F6F5",
  surface: "#FFFFFF",
  surfaceAlt: "#EDF2F0",
  border: "#DCE4E1",
  ink: "#152420",
  inkMuted: "#5C6B67",
  inkFaint: "#8B9793",
  teal: "#2F6F62",
  tealDark: "#1E4A40",
  tealPale: "#E3EFEC",
  low: "#3F8F6F",
  lowPale: "#E4F2EB",
  mod: "#C48A3D",
  modPale: "#F7EDDC",
  high: "#AE4438",
  highPale: "#F5E2DF",
  mono: "'IBM Plex Mono', monospace",
  serif: "'IBM Plex Serif', serif",
  sans: "'IBM Plex Sans', sans-serif",
  shadowSm: "0 1px 2px rgba(21,36,32,0.05), 0 1px 1px rgba(21,36,32,0.04)",
  shadowMd: "0 10px 24px rgba(21,36,32,0.10), 0 2px 6px rgba(21,36,32,0.06)",
};

export const darkTheme = {
  mode: "dark",
  bg: "#0E1512",
  surface: "#17211D",
  surfaceAlt: "#1E2A25",
  border: "#2A3A34",
  ink: "#E9F1ED",
  inkMuted: "#9FB3AC",
  inkFaint: "#6C7F78",
  teal: "#4FAE92",
  tealDark: "#8FD9C0",
  tealPale: "#1D3830",
  low: "#4FAE92",
  lowPale: "#173229",
  mod: "#D9A24F",
  modPale: "#3A2E17",
  high: "#DD7768",
  highPale: "#3A211D",
  mono: "'IBM Plex Mono', monospace",
  serif: "'IBM Plex Serif', serif",
  sans: "'IBM Plex Sans', sans-serif",
  shadowSm: "0 1px 2px rgba(0,0,0,0.3), 0 1px 1px rgba(0,0,0,0.2)",
  shadowMd: "0 10px 26px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)",
};

const FONT_LINK_ID = "ibm-plex-fonts";
if (typeof document !== "undefined" && !document.getElementById(FONT_LINK_ID)) {
  const link = document.createElement("link");
  link.id = FONT_LINK_ID;
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(link);
}
