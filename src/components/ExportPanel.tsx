import { useEffect, useMemo, useState } from 'react';
import type { IconProcessError, ImportError, ProcessedIcon } from '../types';
import { generateManifest } from '../svg/manifest';
import { generateSprite, generateSymbol } from '../svg/sprite';
import { copyText, downloadTextFile } from '../utils/fileDownload';

interface ExportPanelProps {
  icons: ProcessedIcon[];
  importErrors: ImportError[];
  processErrors: IconProcessError[];
  preserveColor: boolean;
  onPreserveColorChange: (value: boolean) => void;
  onFeedback: (message: string) => void;
}

export function ExportPanel({
  icons,
  importErrors,
  processErrors,
  preserveColor,
  onPreserveColorChange,
  onFeedback,
}: ExportPanelProps) {
  const [generatedSprite, setGeneratedSprite] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const warnings = useMemo(
    () => icons.flatMap((icon) => icon.warnings.map((message) => ({ id: icon.id, message }))),
    [icons],
  );
  const errors = useMemo(
    () => [
      ...importErrors.map((error) => ({ fileName: error.fileName, reason: error.reason })),
      ...processErrors,
    ],
    [importErrors, processErrors],
  );

  useEffect(() => {
    setGeneratedSprite('');
  }, [icons]);

  useEffect(() => {
    if (!icons.length) {
      setSelectedId('');
      return;
    }
    if (!icons.some((icon) => icon.id === selectedId)) {
      setSelectedId(icons[0].id);
    }
  }, [icons, selectedId]);

  const selectedIcon = icons.find((icon) => icon.id === selectedId) ?? icons[0];
  const spriteSize = generatedSprite ? new Blob([generatedSprite]).size : 0;

  function handleGenerate() {
    const nextSprite = generateSprite(
      icons.map((icon) => ({ id: icon.id, viewBox: icon.viewBox, content: icon.symbolContent, attributes: icon.symbolAttributes })),
    );
    setGeneratedSprite(nextSprite);
    onFeedback(`已生成 ${icons.length} 个 symbol`);
  }

  function handleDownloadSprite() {
    if (!generatedSprite) return;
    downloadTextFile('sprite.svg', generatedSprite, 'image/svg+xml');
    onFeedback('正在下载 sprite.svg');
  }

  function handleDownloadManifest() {
    downloadTextFile('icons.json', generateManifest(icons), 'application/json');
    onFeedback('正在下载 icons.json');
  }

  async function handleCopySymbol() {
    if (!selectedIcon) return;
    const symbol = generateSymbol({
      id: selectedIcon.id,
      viewBox: selectedIcon.viewBox,
      content: selectedIcon.symbolContent,
      attributes: selectedIcon.symbolAttributes,
    });
    try {
      const copied = await copyText(symbol);
      onFeedback(copied ? `已复制 ${selectedIcon.id} 的 symbol` : '复制失败，请检查浏览器权限');
    } catch {
      onFeedback('复制失败，请检查浏览器权限');
    }
  }

  return (
    <section className="panel export-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">STEP 04</span>
          <h2>生成与导出</h2>
        </div>
        <span className="status-dot" title={icons.length ? '可以生成' : '等待图标'} />
      </div>

      <div className="option-card">
        <div>
          <strong>颜色规范化</strong>
          <span>关闭时，没有颜色的图标自动使用 currentColor</span>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={preserveColor}
            onChange={(event) => onPreserveColorChange(event.target.checked)}
          />
          <span className="toggle-track"><span /></span>
          <span>{preserveColor ? '保留原色' : 'currentColor'}</span>
        </label>
      </div>

      <div className="export-actions">
        <button className="button button-primary button-wide" type="button" onClick={handleGenerate} disabled={!icons.length}>
          生成 Sprite
        </button>
        <div className="button-row">
          <button className="button button-secondary" type="button" onClick={handleDownloadSprite} disabled={!generatedSprite}>
            下载 sprite.svg
          </button>
          <button className="button button-secondary" type="button" onClick={handleDownloadManifest} disabled={!icons.length}>
            下载 icons.json
          </button>
        </div>
      </div>

      <div className="symbol-copy-card">
        <label className="field-label" htmlFor="symbol-select">复制单个 symbol</label>
        <div className="inline-control">
          <select
            id="symbol-select"
            className="field-input"
            value={selectedIcon?.id ?? ''}
            onChange={(event) => setSelectedId(event.target.value)}
            disabled={!icons.length}
          >
            {icons.map((icon) => <option key={icon.key} value={icon.id}>{icon.id}</option>)}
          </select>
          <button className="button button-secondary button-small" type="button" onClick={handleCopySymbol} disabled={!selectedIcon}>
            复制
          </button>
        </div>
      </div>

      <div className="summary-card">
        <div className="section-label">导出摘要</div>
        <div className="summary-grid">
          <div><span>图标</span><strong>{icons.length}</strong></div>
          <div><span>警告</span><strong className={warnings.length ? 'warning-text' : ''}>{warnings.length}</strong></div>
          <div><span>错误</span><strong className={errors.length ? 'error-text' : ''}>{errors.length}</strong></div>
          <div><span>Sprite</span><strong>{spriteSize ? `${Math.ceil(spriteSize / 1024)} KB` : '—'}</strong></div>
        </div>
      </div>

      <div className="output-card">
        <div className="output-heading">
          <span className="section-label">Sprite 输出</span>
          <span>{generatedSprite ? '已生成' : '未生成'}</span>
        </div>
        <pre className="code-preview">{generatedSprite || '点击“生成 Sprite”后在这里查看输出。'}</pre>
      </div>

      <div className="issue-card">
        <div className="issue-heading">
          <span className="section-label">错误列表</span>
          <span className="count-badge danger-badge">{errors.length}</span>
        </div>
        {errors.length ? (
          <div className="issue-list">
            {errors.map((error, index) => (
              <div className="issue-item issue-error" key={`${error.fileName}-${index}`}>
                <strong>{error.fileName}</strong>
                <span>{error.reason}</span>
              </div>
            ))}
          </div>
        ) : <p className="empty-note">没有导入或处理错误。</p>}
      </div>

      <div className="issue-card">
        <div className="issue-heading">
          <span className="section-label">警告列表</span>
          <span className="count-badge warning-badge">{warnings.length}</span>
        </div>
        {warnings.length ? (
          <div className="issue-list">
            {warnings.map((warning, index) => (
              <div className="issue-item issue-warning" key={`${warning.id}-${index}`}>
                <strong>{warning.id}</strong>
                <span>{warning.message}</span>
              </div>
            ))}
          </div>
        ) : <p className="empty-note">没有清理警告。</p>}
      </div>
    </section>
  );
}


