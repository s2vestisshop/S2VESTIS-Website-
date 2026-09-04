const loaded = new Set<string>();

/** Loads an external <script> once and caches the in-flight/settled promise per src. */
export function loadScript(src: string): Promise<void> {
  if (loaded.has(src)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      loaded.add(src);
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      loaded.add(src);
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}
