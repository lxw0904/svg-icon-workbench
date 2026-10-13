import { useEffect, useState } from 'react';
import type { ProcessedIcon } from '../types';

interface RenameFieldProps {
  icon: ProcessedIcon;
  onRename: (key: string, value: string) => void;
}

function RenameField({ icon, onRename }: RenameFieldProps) {
  const [draft, setDraft] = useState(icon.id);

  useEffect(() => {
    setDraft(icon.id);
  }, [icon.id]);

  function commit() {
    if (draft !== icon.id) onRename(icon.key, draft);
  }

  return (
    <input
      id={`rename-${icon.key}`}
      className="field-input rename-input"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur();
        }
        if (event.key === 'Escape') {
          setDraft(icon.id);
          event.currentTarget.blur();
        }
      }}
    />
  );
}

interface IconListPanelProps {
  icons: ProcessedIcon[];
  search: string;
  warningCount: number;
  onSearchChange: (value: string) => void;
  onRename: (key: string, value: string) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
}

export function IconListPanel({
  icons,
  search,
  warningCount,
  onSearchChange,
  onRename,
  onRemove,
  onClear,
}: IconListPanelProps) {
  const normalizedSearch = search.trim().toLowerCase();
  const visibleIcons = normalizedSearch
    ? icons.filter(
        (icon) =>
          icon.id.toLowerCase().includes(normalizedSearch) ||
          icon.fileName.toLowerCase().includes(normalizedSearch),
      )
    : icons;

  return (
    <section className="panel icon-list-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">STEP 02</span>
          <h2>图标清单</h2>
        </div>
        <span className="count-badge">{icons.length}</span>
      </div>

      <div className="list-toolbar">
        <label className="search-field">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            placeholder="搜索 ID 或文件名"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
        <button className="button button-ghost button-small" type="button" onClick={onClear} disabled={!icons.length}>
          清空
        </button>
      </div>

      <div className="list-meta">
        <span>显示 {visibleIcons.length} / {icons.length}</span>
        <span className={warningCount ? 'warning-text' : 'muted-text'}>
          {warningCount} 条警告
        </span>
      </div>

      {visibleIcons.length ? (
        <div className="icon-list">
          {visibleIcons.map((icon, index) => (
            <article className="icon-list-item" key={icon.key}>
              <div className="icon-list-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="icon-list-main">
                <label className="field-label" htmlFor={`rename-${icon.key}`}>图标 ID</label>
                <RenameField icon={icon} onRename={onRename} />
                <div className="list-file-name" title={icon.fileName}>{icon.fileName}</div>
                <div className="list-tags">
                  <span>{icon.viewBox}</span>
                  {icon.warnings.length > 0 && <span className="tag-warning">{icon.warnings.length} 警告</span>}
                </div>
              </div>
              <button
                className="icon-button danger-hover"
                type="button"
                title={`删除 ${icon.id}`}
                aria-label={`删除 ${icon.id}`}
                onClick={() => onRemove(icon.key)}
              >
                ×
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-block compact-empty">
          <strong>{icons.length ? '没有匹配的图标' : '还没有图标'}</strong>
          <span>{icons.length ? '换个关键词试试' : '导入 SVG 后会显示在这里'}</span>
        </div>
      )}
    </section>
  );
}
