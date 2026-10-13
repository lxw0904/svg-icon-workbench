import { useEffect, useMemo, useState } from 'react';
import { DropZone } from './components/DropZone';
import { ExportPanel } from './components/ExportPanel';
import { IconListPanel } from './components/IconListPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { SourceViewer } from './components/SourceViewer';
import { dedupeIconIds, iconIdFromFileName, makeUniqueIconId } from './svg/iconIds';
import { parseSvg } from './svg/parseSvg';
import { processIcons } from './svg/processIcons';
import type { IconSource, ImportError, ProcessedIcon } from './types';

const MAX_FILE_COUNT = 50;
const MAX_FILE_SIZE = 1024 * 1024;
let fallbackKey = 0;

function createKey(fileName: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  fallbackKey += 1;
  return `${fileName}-${fallbackKey}`;
}

function readError(error: unknown): string {
  return error instanceof Error ? error.message : '无法读取文件';
}

interface ViewerState {
  key: string;
  mode: 'raw' | 'clean';
}

function App() {
  const [sources, setSources] = useState<IconSource[]>([]);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [loading, setLoading] = useState(false);
  const [preserveColor, setPreserveColor] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const [previewSearch, setPreviewSearch] = useState('');
  const [zoom, setZoom] = useState(112);
  const [darkBackground, setDarkBackground] = useState(false);
  const [showNames, setShowNames] = useState(true);
  const [viewer, setViewer] = useState<ViewerState | null>(null);
  const [feedback, setFeedback] = useState('');

  const processed = useMemo(
    () => processIcons(sources, { preserveColor }),
    [sources, preserveColor],
  );

  const warningCount = processed.icons.reduce((total, icon) => total + icon.warnings.length, 0);
  const selectedViewerIcon = viewer
    ? processed.icons.find((icon) => icon.key === viewer.key) ?? null
    : null;

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(''), 2800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  async function handleFiles(files: File[]) {
    if (!files.length) return;
    setLoading(true);

    const capacity = Math.max(0, MAX_FILE_COUNT - sources.length);
    const limitedFiles = files.slice(0, MAX_FILE_COUNT);
    const overCountFiles = files.slice(MAX_FILE_COUNT);
    const capacityFiles = limitedFiles.slice(0, capacity);
    const capacityOverflowFiles = limitedFiles.slice(capacity);
    const localErrors: ImportError[] = [
      ...overCountFiles,
      ...capacityOverflowFiles,
    ].map((file, index) => ({
      id: `limit-${Date.now()}-${index}`,
      fileName: file.name,
      reason: `超过一次最多 ${MAX_FILE_COUNT} 个文件的限制`,
    }));

    const results = await Promise.all(
      capacityFiles.map(async (file) => {
        if (!/\.svg$/i.test(file.name)) {
          return {
            error: {
              id: createKey(file.name),
              fileName: file.name,
              reason: '文件扩展名不是 .svg',
            } satisfies ImportError,
          };
        }

        if (file.size > MAX_FILE_SIZE) {
          return {
            error: {
              id: createKey(file.name),
              fileName: file.name,
              reason: `文件超过 1 MB（${Math.ceil(file.size / 1024)} KB）`,
            } satisfies ImportError,
          };
        }

        let raw = '';
        try {
          raw = await file.text();
        } catch (error) {
          return {
            error: {
              id: createKey(file.name),
              fileName: file.name,
              reason: readError(error),
            } satisfies ImportError,
          };
        }

        try {
          parseSvg(raw);
        } catch (error) {
          return {
            error: {
              id: createKey(file.name),
              fileName: file.name,
              reason: readError(error),
            } satisfies ImportError,
          };
        }

        return {
          source: {
            key: createKey(file.name),
            id: iconIdFromFileName(file.name),
            fileName: file.name,
            raw,
          } satisfies IconSource,
        };
      }),
    );

    const validSources = results
      .map((result) => result.source)
      .filter((source): source is IconSource => Boolean(source));

    for (const result of results) {
      if (result.error) localErrors.push(result.error);
    }

    if (validSources.length) {
      setSources((current) => {
        const used = new Set(current.map((icon) => icon.id));
        const additions = validSources.map((source) => {
          const id = makeUniqueIconId(source.id, used);
          used.add(id);
          return { ...source, id };
        });
        return [...current, ...additions];
      });
    }

    if (localErrors.length) {
      setImportErrors((current) => [...current, ...localErrors]);
      setFeedback(`导入完成：${validSources.length} 个成功，${localErrors.length} 个失败`);
    } else if (validSources.length) {
      setFeedback(`已导入 ${validSources.length} 个 SVG`);
    }

    setLoading(false);
  }

  function handleRename(key: string, value: string) {
    setSources((current) =>
      dedupeIconIds(current.map((source) => (source.key === key ? { ...source, id: value } : source))),
    );
    setFeedback('图标 ID 已更新，并重新检查了重复');
  }

  function handleRemove(key: string) {
    setSources((current) => current.filter((source) => source.key !== key));
    setFeedback('已移除图标');
  }

  function handleClear() {
    if (!sources.length) return;
    if (!window.confirm('确定清空所有图标吗？此操作不会删除原始文件。')) return;
    setSources([]);
    setImportErrors([]);
    setPreviewSearch('');
    setListSearch('');
    setFeedback('已清空工作区');
  }

  function handleViewSource(icon: ProcessedIcon, mode: 'raw' | 'clean') {
    setViewer({ key: icon.key, mode });
  }

  const hasErrors = importErrors.length > 0 || processed.errors.length > 0;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <span className="eyebrow">LOCAL SVG STUDIO</span>
            <h1>SVG 图标工作台</h1>
          </div>
        </div>
        <div className="header-meta">
          <span className="offline-pill"><i /> 完全本地运行</span>
          <span>{processed.icons.length} 图标</span>
          <span>{warningCount} 警告</span>
        </div>
      </header>

      {hasErrors && (
        <div className="global-banner">
          <strong>部分文件未进入工作区</strong>
          <span>请查看右侧错误列表，损坏或不符合要求的文件不会影响其他图标。</span>
        </div>
      )}

      <main className="workspace">
        <aside className="sidebar">
          <section className="panel import-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">STEP 01</span>
                <h2>导入文件</h2>
              </div>
            </div>
            <DropZone onFiles={handleFiles} loading={loading} />
          </section>
          <IconListPanel
            icons={processed.icons}
            search={listSearch}
            warningCount={warningCount}
            onSearchChange={setListSearch}
            onRename={handleRename}
            onRemove={handleRemove}
            onClear={handleClear}
          />
        </aside>

        <PreviewPanel
          icons={processed.icons}
          search={previewSearch}
          zoom={zoom}
          darkBackground={darkBackground}
          showNames={showNames}
          onSearchChange={setPreviewSearch}
          onZoomChange={setZoom}
          onDarkBackgroundChange={setDarkBackground}
          onShowNamesChange={setShowNames}
          onViewSource={handleViewSource}
        />

        <aside className="sidebar export-sidebar">
          <ExportPanel
            icons={processed.icons}
            importErrors={importErrors}
            processErrors={processed.errors}
            preserveColor={preserveColor}
            onPreserveColorChange={(value) => {
              setPreserveColor(value);
              setFeedback(value ? '将保留图标原色' : '将对无颜色图标使用 currentColor');
            }}
            onFeedback={setFeedback}
          />
        </aside>
      </main>

      {loading && (
        <div className="loading-overlay" aria-live="polite">
          <span className="spinner" />
          <span>正在检查并清理 SVG…</span>
        </div>
      )}

      {selectedViewerIcon && viewer && (
        <SourceViewer
          icon={selectedViewerIcon}
          mode={viewer.mode}
          onModeChange={(mode) => setViewer({ ...viewer, mode })}
          onClose={() => setViewer(null)}
          onFeedback={setFeedback}
        />
      )}

      {feedback && <div className="toast" role="status">{feedback}</div>}
    </div>
  );
}

export default App;
