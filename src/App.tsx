import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { AppIcon } from './components/AppIcon';
import { IconList } from './components/IconList';
import { PreviewModal, type PreviewMode } from './components/PreviewModal';
import { SvgPreview } from './components/SvgPreview';
import { copyText, downloadTextFile, JSON_MIME_TYPE, SVG_MIME_TYPE } from './lib/download';
import { MAX_FILE_BYTES, MAX_ICON_COUNT, readSvgFile } from './lib/fileImport';
import { buildProcessedIcon } from './lib/iconPipeline';
import { normalizeIconId, resolveUniqueIconId } from './lib/iconId';
import { generateManifest } from './lib/manifest';
import { generateSpriteDetailed, generateSymbol } from './lib/sprite';
import type { ImportError, ProcessedIcon } from './types';

interface Feedback {
  type: 'error' | 'info' | 'success';
  message: string;
}

interface GeneratedState {
  sprite: string;
  manifest: string;
  includedIds: string[];
  skipped: Array<{ id: string; reason: string }>;
}

function ImportZone({
  disabled,
  dragging,
  isImporting,
  onChoose,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: {
  disabled: boolean;
  dragging: boolean;
  isImporting: boolean;
  onChoose: () => void;
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      aria-label="导入 SVG 文件"
      className={`dropzone ${dragging ? 'dropzone--active' : ''} ${disabled ? 'dropzone--disabled' : ''}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onChoose()}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onKeyDown={(event) => {
        if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onChoose();
        }
      }}
    >
      <span className="dropzone__icon">
        <AppIcon name={isImporting ? 'grid' : 'upload'} size={23} />
      </span>
      <strong>{isImporting ? '正在读取并清理 SVG…' : dragging ? '松开以导入' : '点击或拖拽 SVG 到这里'}</strong>
      <span>单个 ≤ 1MB，一次最多 50 个，全程仅在本机处理</span>
    </div>
  );
}

export default function App() {
  const [icons, setIcons] = useState<ProcessedIcon[]>([]);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [preserveColors, setPreserveColors] = useState(false);
  const [query, setQuery] = useState('');
  const [zoom, setZoom] = useState(100);
  const [darkPreview, setDarkPreview] = useState(false);
  const [showNames, setShowNames] = useState(true);
  const [showViewBoxes, setShowViewBoxes] = useState(true);
  const [generated, setGenerated] = useState<GeneratedState | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [modalIconId, setModalIconId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('cleaned');
  const [copyIconId, setCopyIconId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredIcons = useMemo(
    () =>
      icons.filter(
        (icon) =>
          !normalizedQuery ||
          icon.id.toLowerCase().includes(normalizedQuery) ||
          icon.fileName.toLowerCase().includes(normalizedQuery),
      ),
    [icons, normalizedQuery],
  );
  const warningItems = useMemo(
    () =>
      icons.flatMap((icon) =>
        icon.warnings.map((warning) => ({
          iconId: icon.id,
          message: warning.message,
        })),
      ),
    [icons],
  );
  const modalIcon = modalIconId ? icons.find((icon) => icon.id === modalIconId) ?? null : null;
  const copyIcon = icons.find((icon) => icon.id === copyIconId) ?? icons[0] ?? null;
  const errorCount = importErrors.length + (generated?.skipped.length ?? 0);

  const invalidateGenerated = () => {
    setGenerated(null);
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setIsImporting(true);
    setFeedback({ type: 'info', message: `正在处理 ${files.length} 个文件…` });

    const nextIcons = [...icons];
    const nextErrors: ImportError[] = [];
    let accepted = 0;

    for (const file of files) {
      if (nextIcons.length >= MAX_ICON_COUNT) {
        nextErrors.push({
          fileName: file.name,
          reason: `最多只能保留 ${MAX_ICON_COUNT} 个图标`,
        });
        continue;
      }

      try {
        const content = await readSvgFile(file);
        const baseId = normalizeIconId(file.name);
        const id = resolveUniqueIconId(
          baseId,
          nextIcons.map((icon) => icon.id),
        );
        const icon = buildProcessedIcon(file.name, content, id, { preserveColors });
        nextIcons.push(icon);
        accepted += 1;
      } catch (error) {
        nextErrors.push({
          fileName: file.name,
          reason: error instanceof Error ? error.message : '未知导入错误',
        });
      }
    }

    setIcons(nextIcons);
    setImportErrors(nextErrors);
    setIsImporting(false);
    invalidateGenerated();

    if (accepted > 0 && nextErrors.length > 0) {
      setFeedback({
        type: 'info',
        message: `已导入 ${accepted} 个，${nextErrors.length} 个文件未加入，请查看右侧错误列表。`,
      });
    } else if (accepted > 0) {
      setFeedback({ type: 'success', message: `已导入并清理 ${accepted} 个 SVG。` });
    } else {
      setFeedback({ type: 'error', message: '没有文件被导入，请检查错误列表。' });
    }
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    void handleFiles(files);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void handleFiles(Array.from(event.dataTransfer.files));
  };

  const handleRename = (currentId: string, requestedId: string) => {
    const current = icons.find((icon) => icon.id === currentId);
    if (!current) {
      return;
    }

    const otherIds = icons.filter((icon) => icon.id !== currentId).map((icon) => icon.id);
    const nextId = resolveUniqueIconId(requestedId, otherIds);
    if (nextId === currentId) {
      return;
    }

    try {
      const rebuilt = buildProcessedIcon(current.fileName, current.originalSvg, nextId, {
        preserveColors,
      });
      setIcons((items) => items.map((icon) => (icon.id === currentId ? rebuilt : icon)));
      invalidateGenerated();
      setFeedback({
        type: 'success',
        message: `已重命名为 ${nextId}${nextId !== normalizeIconId(requestedId) ? '（已自动处理重复 ID）' : ''}。`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : '重命名失败',
      });
    }
  };

  const handleDelete = (id: string) => {
    setIcons((items) => items.filter((icon) => icon.id !== id));
    invalidateGenerated();
    setFeedback({ type: 'success', message: `已删除 ${id}。` });
  };

  const handleClear = () => {
    setIcons([]);
    setImportErrors([]);
    setGenerated(null);
    setCopyIconId('');
    setModalIconId(null);
    setFeedback({ type: 'success', message: '工作区已清空。' });
  };

  const handlePreserveColors = (value: boolean) => {
    try {
      const rebuilt = icons.map((icon) =>
        buildProcessedIcon(icon.fileName, icon.originalSvg, icon.id, {
          preserveColors: value,
        }),
      );
      setPreserveColors(value);
      setIcons(rebuilt);
      invalidateGenerated();
      setFeedback({
        type: 'success',
        message: value ? '已切换为保留原始颜色。' : '未设置颜色的图标已统一使用 currentColor。',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : '颜色设置应用失败',
      });
    }
  };

  const handleGenerate = () => {
    if (icons.length === 0) {
      setFeedback({ type: 'error', message: '请先导入至少一个 SVG 图标。' });
      return;
    }

    const result = generateSpriteDetailed(icons);
    const included = new Set(result.includedIds);
    const manifest = generateManifest(icons.filter((icon) => included.has(icon.id)));
    setGenerated({ sprite: result.svg, includedIds: result.includedIds, skipped: result.skipped, manifest });
    setFeedback({
      type: result.skipped.length > 0 ? 'info' : 'success',
      message:
        result.skipped.length > 0
          ? `Sprite 已生成，包含 ${result.includedIds.length} 个图标，跳过 ${result.skipped.length} 个异常图标。`
          : `Sprite 和 Manifest 已生成，共 ${result.includedIds.length} 个图标。`,
    });
  };

  const handleCopySymbol = async () => {
    if (!copyIcon) {
      setFeedback({ type: 'error', message: '没有可复制的图标。' });
      return;
    }

    try {
      await copyText(generateSymbol(copyIcon));
      setFeedback({ type: 'success', message: `已复制 ${copyIcon.id} 的 symbol。` });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : '复制失败',
      });
    }
  };

  const previewSize = Math.round(72 * (zoom / 100));

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <AppIcon name="grid" size={22} />
          </span>
          <div>
            <h1>SVG 图标清理与 Sprite 生成器</h1>
            <p>安全清洗、冲突处理、统一预览与离线导出</p>
          </div>
        </div>
        <div className="local-badge">
          <span className="local-badge__dot" />
          纯本地运行
        </div>
      </header>

      <main className="workspace">
        <aside className="panel panel--left" aria-label="图标导入与管理">
          <section className="panel__section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">STEP 01</p>
                <h2>导入图标</h2>
              </div>
              <span className="counter">{icons.length}/{MAX_ICON_COUNT}</span>
            </div>
            <input
              ref={fileInputRef}
              accept=".svg,image/svg+xml"
              className="sr-only"
              multiple
              type="file"
              onChange={handleFileInput}
            />
            <ImportZone
              disabled={isImporting || icons.length >= MAX_ICON_COUNT}
              dragging={isDragging}
              isImporting={isImporting}
              onChoose={() => fileInputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsDragging(false);
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={handleDrop}
            />
            <label className="switch-row">
              <span>
                <strong>保留原始颜色</strong>
                <small>关闭时，未声明颜色的图标使用 currentColor</small>
              </span>
              <input
                checked={preserveColors}
                type="checkbox"
                onChange={(event) => handlePreserveColors(event.target.checked)}
              />
            </label>
          </section>

          <section className="panel__section panel__section--grow">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="eyebrow">图标列表</p>
                <h2>{icons.length} 个项目</h2>
              </div>
              <button
                className="text-button text-button--danger"
                disabled={icons.length === 0}
                type="button"
                onClick={handleClear}
              >
                清空
              </button>
            </div>

            <label className="search-field">
              <AppIcon name="search" size={16} />
              <span className="sr-only">搜索图标</span>
              <input
                placeholder="按名称、ID 或文件名搜索"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <button type="button" aria-label="清除搜索" onClick={() => setQuery('')}>
                  <AppIcon name="close" size={14} />
                </button>
              )}
            </label>

            <div className="list-scroll">
              {icons.length === 0 ? (
                <div className="panel-empty panel-empty--compact">
                  <p>导入的 SVG 会按顺序显示在这里。</p>
                  <span>自动解决重名，点击 ID 可以重命名。</span>
                </div>
              ) : filteredIcons.length > 0 ? (
                <IconList icons={filteredIcons} onDelete={handleDelete} onRename={handleRename} />
              ) : (
                <p className="panel-empty panel-empty--compact">没有匹配“{query}”的图标。</p>
              )}
            </div>
          </section>
        </aside>

        <section className="panel panel--preview" aria-label="SVG 预览">
          <div className="preview-toolbar">
            <div>
              <p className="eyebrow">STEP 02</p>
              <h2>网格预览</h2>
            </div>
            <div className="toolbar-controls">
              <label className="zoom-control">
                <span>缩放</span>
                <input
                  aria-label="预览缩放"
                  max="180"
                  min="60"
                  step="10"
                  type="range"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                />
                <output>{zoom}%</output>
              </label>
              <div className="segmented" aria-label="预览背景">
                <button
                  className={!darkPreview ? 'segmented__active' : ''}
                  title="浅色背景"
                  type="button"
                  onClick={() => setDarkPreview(false)}
                >
                  <AppIcon name="sun" size={16} /> 浅色
                </button>
                <button
                  className={darkPreview ? 'segmented__active' : ''}
                  title="深色背景"
                  type="button"
                  onClick={() => setDarkPreview(true)}
                >
                  <AppIcon name="moon" size={16} /> 深色
                </button>
              </div>
            </div>
          </div>

          <div className="preview-options">
            <label>
              <input
                checked={showNames}
                type="checkbox"
                onChange={(event) => setShowNames(event.target.checked)}
              />
              显示名称
            </label>
            <label>
              <input
                checked={showViewBoxes}
                type="checkbox"
                onChange={(event) => setShowViewBoxes(event.target.checked)}
              />
              显示 viewBox
            </label>
            <span className="preview-options__result">
              显示 {filteredIcons.length} / {icons.length}
            </span>
          </div>

          {feedback && (
            <div className={`feedback feedback--${feedback.type}`} role="status">
              <AppIcon name={feedback.type === 'error' ? 'alert' : 'check'} size={16} />
              <span>{feedback.message}</span>
              <button type="button" aria-label="关闭提示" onClick={() => setFeedback(null)}>
                <AppIcon name="close" size={14} />
              </button>
            </div>
          )}

          <div className="preview-content">
            {isImporting && (
              <div className="loading-state" role="status">
                <span className="spinner" />
                <strong>正在清理 SVG…</strong>
                <p>解析、安全检查与属性规范化均在浏览器内完成。</p>
              </div>
            )}

            {!isImporting && icons.length === 0 && (
              <div className="empty-state">
                <span className="empty-state__icon">
                  <AppIcon name="upload" size={30} />
                </span>
                <h3>{importErrors.length > 0 ? '这些文件没有通过检查' : '工作区还是空的'}</h3>
                <p>
                  {importErrors.length > 0
                    ? '请查看右侧错误列表，修正文件后重新导入。'
                    : '从左侧选择或拖入 10 个 SVG，即可直接检查自动清理与 sprite 结果。'}
                </p>
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <AppIcon name="upload" size={16} /> 选择 SVG 文件
                </button>
              </div>
            )}

            {!isImporting && icons.length > 0 && filteredIcons.length === 0 && (
              <div className="empty-state empty-state--small">
                <AppIcon name="search" size={26} />
                <h3>没有搜索结果</h3>
                <p>尝试使用另一段 ID 或文件名。</p>
              </div>
            )}

            {!isImporting && filteredIcons.length > 0 && (
              <div className="icon-grid">
                {filteredIcons.map((icon) => (
                  <article className="icon-card" key={icon.id}>
                    <div
                      className={`icon-card__canvas ${
                        darkPreview ? 'icon-card__canvas--dark' : ''
                      }`}
                    >
                      <SvgPreview
                        dark={darkPreview}
                        fileName={icon.fileName}
                        size={previewSize}
                        svg={icon.cleanedSvg}
                      />
                      {icon.warnings.length > 0 && (
                        <span
                          className="icon-card__warning"
                          title={`${icon.warnings.length} 条清理警告`}
                        >
                          <AppIcon name="alert" size={13} /> {icon.warnings.length}
                        </span>
                      )}
                    </div>
                    <div className="icon-card__body">
                      {showNames && <strong title={icon.fileName}>{icon.id}</strong>}
                      {showViewBoxes && <code>{icon.viewBox}</code>}
                    </div>
                    <div className="icon-card__actions">
                      <button
                        type="button"
                        onClick={() => {
                          setModalIconId(icon.id);
                          setPreviewMode('original');
                        }}
                      >
                        <AppIcon name="eye" size={14} /> 原始
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModalIconId(icon.id);
                          setPreviewMode('cleaned');
                        }}
                      >
                        <AppIcon name="code" size={14} /> 清理后
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="panel panel--right" aria-label="生成与导出">
          <section className="panel__section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">STEP 03</p>
                <h2>生成与导出</h2>
              </div>
            </div>
            <button
              className="button button--primary button--wide"
              disabled={icons.length === 0}
              type="button"
              onClick={handleGenerate}
            >
              <AppIcon name="grid" size={17} /> 生成 Sprite
            </button>

            <div className="download-stack">
              <button
                className="button button--secondary button--wide"
                disabled={!generated}
                type="button"
                onClick={() =>
                  generated &&
                  downloadTextFile('sprite.svg', generated.sprite, SVG_MIME_TYPE)
                }
              >
                <AppIcon name="download" size={16} /> 下载 sprite.svg
              </button>
              <button
                className="button button--secondary button--wide"
                disabled={!generated}
                type="button"
                onClick={() =>
                  generated &&
                  downloadTextFile('icons.json', generated.manifest, JSON_MIME_TYPE)
                }
              >
                <AppIcon name="download" size={16} /> 下载 icons.json
              </button>
            </div>

            <div className="copy-box">
              <label htmlFor="copy-symbol">复制单个 symbol</label>
              <div className="copy-box__controls">
                <select
                  disabled={icons.length === 0}
                  id="copy-symbol"
                  value={copyIcon?.id ?? ''}
                  onChange={(event) => setCopyIconId(event.target.value)}
                >
                  {icons.map((icon) => (
                    <option key={icon.id} value={icon.id}>
                      {icon.id}
                    </option>
                  ))}
                </select>
                <button
                  className="icon-button icon-button--solid"
                  disabled={!copyIcon}
                  title="复制 symbol"
                  type="button"
                  onClick={() => void handleCopySymbol()}
                >
                  <AppIcon name="copy" size={16} />
                </button>
              </div>
            </div>
          </section>

          <section className="panel__section">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="eyebrow">诊断</p>
                <h2>警告与错误</h2>
              </div>
              <span className="counter counter--warning">{warningItems.length + errorCount}</span>
            </div>

            <div className="diagnostic-list">
              {warningItems.length === 0 && errorCount === 0 && (
                <p className="panel-empty panel-empty--compact">暂无诊断信息。</p>
              )}

              {warningItems.map((warning, index) => (
                <div className="diagnostic diagnostic--warning" key={`${warning.iconId}-${index}`}>
                  <AppIcon name="alert" size={15} />
                  <div>
                    <strong>{warning.iconId}</strong>
                    <p>{warning.message}</p>
                  </div>
                </div>
              ))}

              {importErrors.map((error, index) => (
                <div className="diagnostic diagnostic--error" key={`import-${error.fileName}-${index}`}>
                  <AppIcon name="close" size={15} />
                  <div>
                    <strong>{error.fileName}</strong>
                    <p>{error.reason}</p>
                  </div>
                </div>
              ))}

              {generated?.skipped.map((skip) => (
                <div className="diagnostic diagnostic--error" key={`skip-${skip.id}`}>
                  <AppIcon name="close" size={15} />
                  <div>
                    <strong>{skip.id}</strong>
                    <p>生成中被跳过：{skip.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel__section">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="eyebrow">导出摘要</p>
                <h2>{generated ? '结果已就绪' : '等待生成'}</h2>
              </div>
            </div>
            <dl className="summary-grid">
              <div>
                <dt>图标</dt>
                <dd>{icons.length}</dd>
              </div>
              <div>
                <dt>警告</dt>
                <dd>{warningItems.length}</dd>
              </div>
              <div>
                <dt>错误</dt>
                <dd>{errorCount}</dd>
              </div>
              <div>
                <dt>Sprite</dt>
                <dd>{generated ? `${new Blob([generated.sprite]).size} B` : '—'}</dd>
              </div>
            </dl>
            {generated && (
              <p className="summary-note">
                已包含 {generated.includedIds.length} 个 symbol；顺序按最终 ID 稳定排序。
              </p>
            )}
          </section>
        </aside>
      </main>

      {modalIcon && (
        <PreviewModal
          dark={darkPreview}
          icon={modalIcon}
          mode={previewMode}
          onClose={() => setModalIconId(null)}
          onModeChange={setPreviewMode}
        />
      )}
    </div>
  );
}


