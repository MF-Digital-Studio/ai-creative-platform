import Script from "next/script";

/* eslint-disable @next/next/no-before-interactive-script-outside-document -- this component is rendered from the App Router's locale root layout before the first paint. */
export function ThemeInitScript() {
  const script = `(()=>{try{const k="klay-theme-preference",v=localStorage.getItem(k),s=["system","dark","light"].includes(v),p=s?v:"system",d=p==="system"?matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":p,r=document.documentElement;r.dataset.theme=d;r.dataset.themePreference=p;r.dataset.themePreferenceSource=s?"stored":"default"}catch{}})()`;
  return (
    <Script
      id="theme-init"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
/* eslint-enable @next/next/no-before-interactive-script-outside-document */
