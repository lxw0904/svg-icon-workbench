import { useEffect, useState } from 'react';
import type { ProcessedIcon } from '../types';
import { AppIcon } from './AppIcon';

interface IconListProps {
  icons: ProcessedIcon[];
  onRename: (currentId: string, nextId: string) => void;
  onDelete: (id: string) => void;
}

function IconListRow({
  icon,
  onRename,
  onDelete,
}: {
  icon: ProcessedIcon;
  onRename: (currentId: string, nextId: string) => void;
  onDelete: (id: string) => void;
}) {
  const [draftId, setDraftId] = useState(icon.id);

  useEffect(() => {
    setDraftId(icon.id);
  }, [icon.id]);

  const commit = () => {
    if (draftId !== icon.id) {
      onRename(icon.id, draftId);
    }
  };

  return (
    <li className="icon-row">
      <div className="icon-row__mark" aria-hidden="true">
        <AppIcon name="file" size={17} />
      </div>
      <div className="icon-row__body">
        <label className="sr-only" htmlFor={`icon-id-${icon.id}`}>
          重命名 {icon.fileName}
        </label>
        <input
          className="icon-row__id"
          id={`icon-id-${icon.id}`}
          value={draftId}
          onChange={(event) => setDraftId(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
            if (event.key === 'Escape') {
              setDraftId(icon.id);
              event.currentTarget.blur();
            }
          }}
        />
        <div className="icon-row__meta">
          <span className="truncate" title={icon.fileName}>{icon.fileName}</span>
          <span>{icon.viewBox}</span>
          {icon.warnings.length > 0 && (
            <span className="warning-count" title={`${icon.warnings.length} 条警告`}>
              <AppIcon name="alert" size={12} /> {icon.warnings.length}
            </span>
          )}
        </div>
      </div>
      <button
        className="icon-button icon-button--danger"
        type="button"
        aria-label={`删除 ${icon.fileName}`}
        title="删除图标"
        onClick={() => onDelete(icon.id)}
      >
        <AppIcon name="trash" size={16} />
      </button>
    </li>
  );
}

export function IconList({ icons, onRename, onDelete }: IconListProps) {
  if (icons.length === 0) {
    return <p className="panel-empty panel-empty--compact">暂无可显示的图标</p>;
  }

  return (
    <ul className="icon-list">
      {icons.map((icon) => (
        <IconListRow key={icon.id} icon={icon} onRename={onRename} onDelete={onDelete} />
      ))}
    </ul>
  );
}
