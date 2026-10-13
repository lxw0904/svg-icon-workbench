import { useRef, useState } from 'react';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  loading: boolean;
}

export function DropZone({ onFiles, loading }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    onFiles(Array.from(fileList));
  }

  return (
    <section
      className={`drop-zone ${dragging ? 'is-dragging' : ''} ${loading ? 'is-loading' : ''}`}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        if (event.currentTarget === event.target) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept=".svg,image/svg+xml"
        multiple
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <div className="drop-zone-icon" aria-hidden="true">
        <span>+</span>
      </div>
      <div className="drop-zone-copy">
        <strong>{loading ? '正在检查 SVG…' : '导入 SVG 图标'}</strong>
        <span>点击选择，或拖拽文件到这里</span>
      </div>
      <button className="button button-primary button-small" type="button" onClick={() => inputRef.current?.click()}>
        选择文件
      </button>
      <small>单个 ≤ 1 MB · 一次最多 50 个</small>
    </section>
  );
}
