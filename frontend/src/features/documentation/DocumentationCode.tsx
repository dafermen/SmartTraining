import { useRef, useState, type ReactNode } from 'react';

/** Copy only the code, never the label or status. Clipboard failure stays visible. */
export function DocumentationCode({ children, className, language = 'es' }: { children?: ReactNode; className?: string; language?: 'es' | 'en' }) {
  const pre = useRef<HTMLPreElement>(null);
  const [status, setStatus] = useState('');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pre.current?.textContent ?? '');
      setStatus(language === 'es' ? 'Copiado' : 'Copied');
    } catch {
      setStatus(language === 'es' ? 'Selecciona el código para copiar' : 'Select the code to copy');
    }
  };
  return <div className="innova-code"><button type="button" onClick={() => void copy()}>{language === 'es' ? 'Copiar código' : 'Copy code'}</button><span role="status">{status}</span><pre ref={pre} className={className}>{children}</pre></div>;
}
