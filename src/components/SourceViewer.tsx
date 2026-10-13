import { useEffect } from 'react';
import type { ProcessedIcon } from '../types';
import { copyText } from '../utils/fileDownload';

interface SourceViewerProps {
  icon: ProcessedIcon;
  mode: 'raw' | 'clean';
  onModeChange: (mode: 'raw' | 'clean') => void;
  onClose: () => void;
  onFeedback: (message: string) => void;
}

export function SourceViewer({
  icon,
  mode,
  onModeChange,
  onClose,
  onFeedback,
}: SourceViewerProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const source = mode === 'raw' ? icon.raw : icon.cleanSvg;

  async function handleCopy() {
    try {
      const copied = await copyText(source);
      onFeedback(copied ? '已复制 SVG 源码' : '复制失败，请检查浏览器权限');
    } catch {
      onFeedback('复制失败，请检查浏览器权限');
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="source-dialog" role="dialog" aria-modal="true" aria-labelledby="source-title">
        <header className="source-header">
          <div>
            <span className="eyebrow">SOURCE VIEW</span>
            <h2 id="source-title">{icon.id}</h2>
            <p>{icon.fileName} · 内容仅以文本形式展示，不会执行脚本。</p>
          </div>
          <button className="icon-button dialog-close" type="button" onClick={onClose} aria-label="关闭">×</button>
        </header>
        <div className="source-tabs">
          <button className={mode === 'raw' ? 'is-active' : ''} type="button" onClick={() => onModeChange('raw')}>原始 SVG</button>
          <button className={mode === 'clean' ? 'is-active' : ''} type="button" onClick={() => onModeChange('clean')}>清理后 SVG</button>
          <button className="button button-ghost button-small source-copy" type="button" onClick={handleCopy}>复制源码</button>
        </div>
        <pre className="source-code">{source}</pre>
      </section>
    </div>
  );
}
