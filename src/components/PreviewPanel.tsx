import type { CSSProperties } from 'react';
import type { ProcessedIcon } from '../types';

interface PreviewPanelProps {
  icons: ProcessedIcon[];
  search: string;
  zoom: number;
  darkBackground: boolean;
  showNames: boolean;
  onSearchChange: (value: string) => void;
  onZoomChange: (value: number) => void;
  onDarkBackgroundChange: (value: boolean) => void;
  onShowNamesChange: (value: boolean) => void;
  onViewSource: (icon: ProcessedIcon, mode: 'raw' | 'clean') => void;
}

function previewSvg(svg: string, color: string): string {
  return svg.replace(/<svg\b([^>]*)>/, (_match, attributes: string) => {
    const withoutColor = attributes.replace(/\scolor="[^"]*"/gi, '');
    return `<svg${withoutColor} color="${color}">`;
  });
}

function dataUri(svg: string, darkBackground: boolean): string {
  const coloredSvg = previewSvg(svg, darkBackground ? '#f8fafc' : '#0f172a');
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(coloredSvg)}`;
}

export function PreviewPanel({
  icons,
  search,
  zoom,
  darkBackground,
  showNames,
  onSearchChange,
  onZoomChange,
  onDarkBackgroundChange,
  onShowNamesChange,
  onViewSource,
}: PreviewPanelProps) {
  const normalizedSearch = search.trim().toLowerCase();
  const visibleIcons = normalizedSearch
    ? icons.filter(
        (icon) =>
          icon.id.toLowerCase().includes(normalizedSearch) ||
          icon.fileName.toLowerCase().includes(normalizedSearch),
      )
    : icons;
  const gridStyle = { '--preview-size': `${zoom}px` } as CSSProperties;

  return (
    <section className={`panel preview-panel ${darkBackground ? 'preview-dark' : 'preview-light'}`}>
      <div className="panel-heading preview-heading">
        <div>
          <span className="eyebrow">STEP 03</span>
          <h2>预览工作区</h2>
        </div>
        <span className="count-badge">{visibleIcons.length}</span>
      </div>

      <div className="preview-toolbar">
        <label className="search-field preview-search">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            placeholder="过滤预览"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
        <label className="zoom-control">
          <span>缩放</span>
          <input
            type="range"
            min="64"
            max="184"
            value={zoom}
            onChange={(event) => onZoomChange(Number(event.target.value))}
          />
          <span className="zoom-value">{zoom}px</span>
        </label>
        <div className="segmented-control" aria-label="预览背景">
          <button
            className={!darkBackground ? 'is-active' : ''}
            type="button"
            onClick={() => onDarkBackgroundChange(false)}
          >
            浅色
          </button>
          <button
            className={darkBackground ? 'is-active' : ''}
            type="button"
            onClick={() => onDarkBackgroundChange(true)}
          >
            深色
          </button>
        </div>
        <label className="toggle-control">
          <input
            type="checkbox"
            checked={showNames}
            onChange={(event) => onShowNamesChange(event.target.checked)}
          />
          <span>显示名称与 viewBox</span>
        </label>
      </div>

      {visibleIcons.length ? (
        <div className="preview-grid" style={gridStyle}>
          {visibleIcons.map((icon) => (
            <article className="preview-card" key={icon.key}>
              <div className="preview-canvas">
                <img src={dataUri(icon.cleanSvg, darkBackground)} alt={`${icon.id} 清理后预览`} />
              </div>
              {showNames && (
                <div className="preview-meta">
                  <strong title={icon.id}>{icon.id}</strong>
                  <span>{icon.viewBox}</span>
                </div>
              )}
              <div className="preview-actions">
                <button type="button" onClick={() => onViewSource(icon, 'raw')}>原始</button>
                <button type="button" onClick={() => onViewSource(icon, 'clean')}>清理后</button>
              </div>
              {icon.warnings.length > 0 && <span className="preview-warning-dot" title={`${icon.warnings.length} 条警告`} />}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-block preview-empty">
          <span className="empty-illustration" aria-hidden="true">◇</span>
          <strong>{icons.length ? '没有匹配的预览' : '从左侧导入 SVG 开始'}</strong>
          <span>{icons.length ? '调整过滤条件或缩放试试' : '清理、重命名并生成 Sprite'}</span>
        </div>
      )}
    </section>
  );
}
