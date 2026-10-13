import type { ProcessedIcon } from '../types';
import { AppIcon } from './AppIcon';
import { SvgPreview } from './SvgPreview';

export type PreviewMode = 'cleaned' | 'original';

interface PreviewModalProps {
  icon: ProcessedIcon;
  mode: PreviewMode;
  dark: boolean;
  onClose: () => void;
  onModeChange: (mode: PreviewMode) => void;
}

export function PreviewModal({
  icon,
  mode,
  dark,
  onClose,
  onModeChange,
}: PreviewModalProps) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="preview-modal-title"
        aria-modal="true"
        className="modal"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <div>
            <p className="eyebrow">SVG 源码检查</p>
            <h2 id="preview-modal-title">{icon.id}</h2>
            <p className="modal__file">{icon.fileName}</p>
          </div>
          <button className="icon-button" type="button" aria-label="关闭" onClick={onClose}>
            <AppIcon name="close" />
          </button>
        </header>

        <div className="tabs" role="tablist" aria-label="SVG 版本">
          <button
            aria-selected={mode === 'original'}
            className={`tab ${mode === 'original' ? 'tab--active' : ''}`}
            role="tab"
            type="button"
            onClick={() => onModeChange('original')}
          >
            原始 SVG
          </button>
          <button
            aria-selected={mode === 'cleaned'}
            className={`tab ${mode === 'cleaned' ? 'tab--active' : ''}`}
            role="tab"
            type="button"
            onClick={() => onModeChange('cleaned')}
          >
            清理后 SVG
          </button>
        </div>

        <div className="modal__preview-row">
          <div className={`modal__preview-surface ${dark ? 'preview-surface--dark' : ''}`}>
            {mode === 'cleaned' ? (
              <SvgPreview
                dark={dark}
                fileName={icon.fileName}
                size={144}
                svg={icon.cleanedSvg}
              />
            ) : (
              <div className="raw-preview-placeholder">
                <AppIcon name="code" size={24} />
                <strong>原始内容仅显示源码</strong>
                <span>为避免执行未处理内容，不直接渲染原始 SVG。</span>
              </div>
            )}
          </div>
          <div className="modal__facts">
            <span>viewBox</span>
            <strong>{icon.viewBox}</strong>
            <span>清理警告</span>
            <strong>{icon.warnings.length} 条</strong>
          </div>
        </div>

        <pre className="source-code" tabIndex={0}>
          <code>{mode === 'original' ? icon.originalSvg : icon.cleanedSvg}</code>
        </pre>
      </section>
    </div>
  );
}
