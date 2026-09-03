const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (v: string) => EMAIL_RE.test(v.trim());

export const required = (v: string) => v.trim().length > 0;

export const minLen = (v: string, n: number) => v.length >= n;
