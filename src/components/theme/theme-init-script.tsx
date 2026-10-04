import Script from "next/script";

export function ThemeInitScript() {
  const script = `(()=>{try{const k="klay-theme-preference",v=localStorage.getItem(k),p=["system","dark","light"].includes(v)?v:"system",d=p==="system"?matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":p;document.documentElement.dataset.theme=d;document.documentElement.dataset.themePreference=p}catch{}})()`;
  return <Script id="theme-init" strategy="afterInteractive">{script}</Script>;
}
