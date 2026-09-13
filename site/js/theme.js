export function resolveTheme(savedTheme,prefersDark){if(savedTheme==="light"||savedTheme==="dark")return savedTheme; return prefersDark?"dark":"light";}
export function applyTheme(theme,root=document.documentElement){root.dataset.theme=theme;}
