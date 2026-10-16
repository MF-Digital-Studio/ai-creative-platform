export function ThemeInitScript() {
  const script = `(()=>{try{const k="klay-theme-preference",v=localStorage.getItem(k),s=["system","dark","light"].includes(v),p=s?v:"system",d=p==="system"?matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":p,r=document.documentElement;r.dataset.theme=d;r.dataset.themePreference=p;r.dataset.themePreferenceSource=s?"stored":"default"}catch{}})()`;
  return <script id="theme-init" dangerouslySetInnerHTML={{ __html: script }} />;
}
