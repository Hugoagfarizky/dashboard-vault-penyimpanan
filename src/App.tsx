import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react'
import JSZip from 'jszip'
import {
  Archive,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  File as FileIcon,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Globe2,
  HardDrive,
  ImageIcon,
  Languages,
  Link2,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { vaultDb } from './db'
import { copy } from './i18n'
import type {
  BackupManifest,
  ConflictResolution,
  Folder as FolderType,
  ImportSnapshot,
  ItemType,
  Language,
  ModalState,
  VaultItem,
} from './types'

const ROOT_LABEL = '__root__'

function now() {
  return new Date().toISOString()
}

function createId() {
  return crypto.randomUUID()
}

function parseTags(input: string) {
  return [...new Set(input.split(',').map((tag) => tag.trim()).filter(Boolean))]
}

function formatBytes(bytes = 0) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 500)
}

function isPreviewable(item: VaultItem) {
  if (item.type !== 'file' || !item.file) return item.type !== 'link'
  return item.file.mimeType.startsWith('image/') || item.file.mimeType === 'application/pdf' || item.file.mimeType.startsWith('text/')
}

function itemIcon(item: VaultItem, size = 18) {
  if (item.type === 'note') return <FileText size={size} />
  if (item.type === 'link') return <Link2 size={size} />
  if (item.file?.mimeType.startsWith('image/')) return <ImageIcon size={size} />
  return <FileIcon size={size} />
}

function itemTypeName(type: ItemType, t: typeof copy.id) {
  return t[type]
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button>
        {children}
      </section>
    </div>
  )
}

function FolderForm({ folder, title, onCancel, onSave, t }: {
  folder?: FolderType
  title: string
  onCancel: () => void
  onSave: (name: string) => Promise<void>
  t: typeof copy.id
}) {
  const [name, setName] = useState(folder?.name ?? '')
  const [saving, setSaving] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onSave(name.trim())
    setSaving(false)
  }
  return <form onSubmit={submit}>
    <div className="modal-heading"><FolderPlus size={22} /><div><h2>{title}</h2><p>{t.folderName}</p></div></div>
    <label>{t.name}<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder={t.folderName} /></label>
    <div className="form-actions"><button type="button" className="button secondary" onClick={onCancel}>{t.cancel}</button><button className="button primary" disabled={saving}>{folder ? t.save : t.create}</button></div>
  </form>
}

function ItemForm({ kind, item, onCancel, onSave, t }: {
  kind: 'file' | 'note' | 'link'
  item?: VaultItem
  onCancel: () => void
  onSave: (data: { title: string; tags: string[]; file?: File; content?: string; url?: string; description?: string }) => Promise<void>
  t: typeof copy.id
}) {
  const [title, setTitle] = useState(item?.title ?? '')
  const [tags, setTags] = useState(item?.tags.join(', ') ?? '')
  const [content, setContent] = useState(item?.content ?? '')
  const [url, setUrl] = useState(item?.url ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [file, setFile] = useState<File>()
  const [saving, setSaving] = useState(false)
  const icons = { file: <Upload size={22} />, note: <FileText size={22} />, link: <Link2 size={22} /> }
  const titles = { file: item ? t.edit : t.uploadFile, note: item ? t.edit : t.newNote, link: item ? t.edit : t.newLink }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if ((kind === 'file' && !item && !file) || !title.trim() || (kind === 'link' && !url.trim())) return
    setSaving(true)
    await onSave({ title: title.trim(), tags: parseTags(tags), file, content, url: url.trim(), description: description.trim() })
    setSaving(false)
  }

  return <form onSubmit={submit}>
    <div className="modal-heading">{icons[kind]}<div><h2>{titles[kind]}</h2><p>{kind === 'file' ? t.chooseFile : kind === 'note' ? t.noteContent : t.url}</p></div></div>
    {kind === 'file' && <label className="file-picker"><span>{file ? `${t.selectedFile}: ${file.name}` : item?.file?.name ?? t.chooseFile}</span><input type="file" onChange={(event) => setFile(event.target.files?.[0])} /></label>}
    <label>{t.title}<input autoFocus={kind !== 'file'} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={kind === 'file' ? t.title : undefined} /></label>
    {kind === 'note' && <label>{t.noteContent}<textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder={t.noteContent} rows={9} /></label>}
    {kind === 'link' && <><label>{t.url}<input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" /></label><label>{t.description}<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /></label></>}
    <label>{t.tags}<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder={t.tagsHint} /></label>
    <div className="form-actions"><button type="button" className="button secondary" onClick={onCancel}>{t.cancel}</button><button className="button primary" disabled={saving}>{item ? t.save : t.create}</button></div>
  </form>
}

function FilePreview({ item, t }: { item: VaultItem; t: typeof copy.id }) {
  const [url, setUrl] = useState<string>()
  const [text, setText] = useState<string>()
  useEffect(() => {
    if (!item.file) return
    if (item.file.mimeType.startsWith('text/')) {
      item.file.blob.text().then(setText)
      return
    }
    if (item.file.mimeType.startsWith('image/') || item.file.mimeType === 'application/pdf') {
      const objectUrl = URL.createObjectURL(item.file.blob)
      setUrl(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    }
  }, [item])

  if (item.type === 'note') return <pre className="note-preview">{item.content || '—'}</pre>
  if (item.type === 'link') return <div className="link-preview"><Globe2 size={30} /><h3>{item.title}</h3><a href={item.url} target="_blank" rel="noreferrer">{item.url}</a>{item.description && <p>{item.description}</p>}<a className="button primary" href={item.url} target="_blank" rel="noreferrer">{t.openLink}<ChevronRight size={17} /></a></div>
  if (item.file?.mimeType.startsWith('image/')) return url ? <img className="image-preview" src={url} alt={item.title} /> : <div className="preview-loading">Loading…</div>
  if (item.file?.mimeType === 'application/pdf') return url ? <iframe className="pdf-preview" src={url} title={item.title} /> : <div className="preview-loading">Loading…</div>
  if (item.file?.mimeType.startsWith('text/')) return <pre className="note-preview">{text ?? 'Loading…'}</pre>
  return <div className="unsupported-preview"><FileIcon size={35} /><p>{item.file?.name}</p><p>{formatBytes(item.file?.size)}</p></div>
}

export default function App() {
  const [folders, setFolders] = useState<FolderType[]>([])
  const [items, setItems] = useState<VaultItem[]>([])
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('vaultly-language') as Language) || 'id')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [view, setView] = useState<'vault' | 'recent'>('vault')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | ItemType>('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [modal, setModal] = useState<ModalState>()
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [toast, setToast] = useState('')
  const [storage, setStorage] = useState<{ usage?: number; quota?: number }>({})
  const [pendingImport, setPendingImport] = useState<ImportSnapshot>()
  const [resolutions, setResolutions] = useState<Record<string, ConflictResolution>>({})
  const t = copy[language]

  async function reload() {
    const [nextFolders, nextItems] = await Promise.all([vaultDb.folders(), vaultDb.items()])
    setFolders(nextFolders.sort((a, b) => a.name.localeCompare(b.name)))
    setItems(nextItems.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
  }

  async function updateStorage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      setStorage({ usage: estimate.usage, quota: estimate.quota })
    }
  }

  useEffect(() => { void reload(); void updateStorage() }, [])
  useEffect(() => { localStorage.setItem('vaultly-language', language) }, [language])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId)
  const currentFolders = useMemo(() => folders.filter((folder) => folder.parentId === selectedFolderId), [folders, selectedFolderId])
  const allTags = useMemo(() => [...new Set(items.flatMap((item) => item.tags))].sort((a, b) => a.localeCompare(b)), [items])
  const isSearching = Boolean(search.trim() || typeFilter !== 'all' || tagFilter !== 'all')
  const scopedItems = useMemo(() => view === 'recent' || isSearching ? items : items.filter((item) => item.folderId === selectedFolderId), [items, selectedFolderId, view, isSearching])
  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim()
    return scopedItems.filter((item) => {
      const searchText = `${item.title} ${item.tags.join(' ')} ${item.content ?? ''} ${item.url ?? ''} ${item.description ?? ''}`.toLowerCase()
      return (!query || searchText.includes(query)) && (typeFilter === 'all' || item.type === typeFilter) && (tagFilter === 'all' || item.tags.includes(tagFilter))
    })
  }, [scopedItems, search, typeFilter, tagFilter])

  const breadcrumb = useMemo(() => {
    const result: FolderType[] = []
    let current = selectedFolder
    while (current) {
      result.unshift(current)
      current = folders.find((folder) => folder.id === current?.parentId)
    }
    return result
  }, [selectedFolder, folders])

  function notify(message: string) {
    setToast(message)
  }

  function selectFolder(id: string | null) {
    setSelectedFolderId(id)
    setView('vault')
    setSearch('')
    setTypeFilter('all')
    setTagFilter('all')
    setSidebarOpen(false)
  }

  async function saveFolder(name: string, existing?: FolderType) {
    const timestamp = now()
    await vaultDb.saveFolder(existing ? { ...existing, name, updatedAt: timestamp } : { id: createId(), name, parentId: selectedFolderId, createdAt: timestamp, updatedAt: timestamp })
    await reload()
    setModal(undefined)
    notify(existing ? t.saved : t.folderCreated)
  }

  async function saveItem(kind: ItemType, data: { title: string; tags: string[]; file?: File; content?: string; url?: string; description?: string }, existing?: VaultItem) {
    const timestamp = now()
    const base: VaultItem = existing ? { ...existing, title: data.title, tags: data.tags, updatedAt: timestamp } : {
      id: createId(), type: kind, title: data.title, folderId: selectedFolderId, tags: data.tags, createdAt: timestamp, updatedAt: timestamp,
    }
    if (kind === 'file') {
      if (data.file) base.file = { blob: data.file, name: data.file.name, mimeType: data.file.type || 'application/octet-stream', size: data.file.size }
    } else if (kind === 'note') {
      base.content = data.content ?? ''
    } else {
      base.url = data.url
      base.description = data.description
    }
    await vaultDb.saveItem(base)
    await reload()
    await updateStorage()
    setModal(undefined)
    notify(t.saved)
  }

  async function deleteItem(item: VaultItem) {
    if (!window.confirm(t.deleteItemConfirm)) return
    await vaultDb.deleteItem(item.id)
    await reload()
    await updateStorage()
    if (modal?.item?.id === item.id) setModal(undefined)
  }

  async function deleteFolder(folder: FolderType) {
    if (!window.confirm(t.deleteFolderConfirm)) return
    const containsItems = items.some((item) => item.folderId === folder.id)
    const containsFolders = folders.some((child) => child.parentId === folder.id)
    if (containsItems || containsFolders) return notify(t.folderNotEmpty)
    await vaultDb.deleteFolder(folder.id)
    if (selectedFolderId === folder.id) setSelectedFolderId(folder.parentId)
    await reload()
  }

  async function exportBackup() {
    const zip = new JSZip()
    const manifest: BackupManifest = { formatVersion: 1, exportedAt: now(), folders, items: [] }
    for (const item of items) {
      const { file, ...itemMetadata } = item
      const backupItem: BackupManifest['items'][number] = itemMetadata
      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `files/${item.id}-${safeName}`
        backupItem.file = { name: file.name, mimeType: file.mimeType, size: file.size, path }
        zip.file(path, file.blob)
      }
      manifest.items.push(backupItem)
    }
    zip.file('manifest.json', JSON.stringify(manifest, null, 2))
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(blob, `vaultly-backup-${new Date().toISOString().slice(0, 10)}.zip`)
    notify(t.backupReady)
  }

  async function prepareImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const zip = await JSZip.loadAsync(file)
      const manifestEntry = zip.file('manifest.json')
      if (!manifestEntry) throw new Error('Missing manifest')
      const manifest = JSON.parse(await manifestEntry.async('string')) as BackupManifest
      if (manifest.formatVersion !== 1 || !Array.isArray(manifest.folders) || !Array.isArray(manifest.items)) throw new Error('Incompatible manifest')
      const restoredItems = await Promise.all(manifest.items.map(async (item) => {
        if (!item.file) return item as VaultItem
        const entry = zip.file(item.file.path)
        if (!entry) throw new Error('Missing file')
        const blob = await entry.async('blob')
        return { ...item, file: { blob, name: item.file.name, mimeType: item.file.mimeType, size: item.file.size } } as VaultItem
      }))
      const snapshot = { folders: manifest.folders, items: restoredItems }
      const conflicts = restoredItems.filter((item) => items.some((local) => local.id === item.id))
      if (conflicts.length) {
        setPendingImport(snapshot)
        setResolutions(Object.fromEntries(conflicts.map((item) => [item.id, 'local'])))
        setModal({ kind: 'import' })
      } else {
        await applyImport(snapshot, {})
      }
    } catch {
      notify(t.importInvalid)
    }
  }

  async function applyImport(snapshot: ImportSnapshot, choices: Record<string, ConflictResolution>) {
    const existingFolders = new Set(folders.map((folder) => folder.id))
    const localItems = new Map(items.map((item) => [item.id, item]))
    for (const folder of snapshot.folders) if (!existingFolders.has(folder.id)) await vaultDb.saveFolder(folder)
    for (const item of snapshot.items) {
      const localItem = localItems.get(item.id)
      if (!localItem) {
        await vaultDb.saveItem(item)
        continue
      }
      const choice = choices[item.id] ?? 'local'
      if (choice === 'backup') await vaultDb.saveItem(item)
      if (choice === 'copy') await vaultDb.saveItem({ ...item, id: createId(), title: `${item.title} (copy)`, createdAt: now(), updatedAt: now() })
    }
    await reload()
    await updateStorage()
    setPendingImport(undefined)
    setModal(undefined)
    notify(t.importSuccess)
  }

  function renderFolderTree(parentId: string | null, depth = 0): React.ReactNode {
    return folders.filter((folder) => folder.parentId === parentId).map((folder) => {
      const childCount = folders.filter((child) => child.parentId === folder.id).length
      return <div key={folder.id} className="tree-entry">
        <button className={`tree-button ${selectedFolderId === folder.id && view === 'vault' ? 'active' : ''}`} style={{ paddingLeft: 14 + depth * 16 }} onClick={() => selectFolder(folder.id)}>
          {childCount > 0 ? <ChevronDown size={14} className="tree-chevron" /> : <span className="tree-placeholder" />}<Folder size={16} /><span>{folder.name}</span>
        </button>
        {renderFolderTree(folder.id, depth + 1)}
      </div>
    })
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand-row"><div className="brand-mark"><Archive size={20} /></div><div><strong>Vaultly</strong><span>{t.workspace}</span></div><button className="icon-button desktop-only" onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar"><PanelLeftClose size={18} /></button></div>
        <button className="new-button" onClick={() => setCreateMenuOpen((value) => !value)}><Plus size={18} />{t.new}<ChevronDown size={15} /></button>
        {createMenuOpen && <div className="create-menu sidebar-menu">
          <button onClick={() => { setModal({ kind: 'file' }); setCreateMenuOpen(false) }}><Upload size={16} />{t.uploadFile}</button>
          <button onClick={() => { setModal({ kind: 'note' }); setCreateMenuOpen(false) }}><FileText size={16} />{t.newNote}</button>
          <button onClick={() => { setModal({ kind: 'link' }); setCreateMenuOpen(false) }}><Link2 size={16} />{t.newLink}</button>
          <button onClick={() => { setModal({ kind: 'folder' }); setCreateMenuOpen(false) }}><FolderPlus size={16} />{t.newFolder}</button>
        </div>}
        <nav className="primary-nav">
          <button className={view === 'vault' && selectedFolderId === null ? 'active' : ''} onClick={() => selectFolder(null)}><Archive size={18} />{t.allItems}</button>
          <button className={view === 'recent' ? 'active' : ''} onClick={() => { setView('recent'); setSelectedFolderId(null); setSearch('') }}><HardDrive size={18} />{t.recent}</button>
        </nav>
        <div className="sidebar-section"><div className="section-label"><span>{t.folders}</span><button className="icon-button tiny" onClick={() => setModal({ kind: 'folder' })}><Plus size={15} /></button></div>{renderFolderTree(null)}</div>
        <div className="sidebar-bottom"><div className="storage-card"><div className="storage-title"><HardDrive size={16} /><span>{t.usedStorage}</span></div><strong>{storage.usage !== undefined ? `${formatBytes(storage.usage)}${storage.quota ? ` / ${formatBytes(storage.quota)}` : ''}` : t.storageUnknown}</strong><div className="storage-line"><span style={{ width: storage.usage && storage.quota ? `${Math.min((storage.usage / storage.quota) * 100, 100)}%` : '0%' }} /></div><small>{t.localOnly}</small></div>
          <button className="language-button" onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}><Languages size={16} />{language === 'id' ? 'English' : 'Bahasa Indonesia'}</button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={20} /></button><button className="icon-button collapsed-menu desktop-collapsed" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"><Menu size={20} /></button><div className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} /><kbd>⌘ K</kbd></div><div className="top-actions"><label className="button secondary import-label"><Upload size={16} />{t.import}<input type="file" accept=".zip,application/zip" onChange={prepareImport} /></label><button className="button secondary" onClick={() => void exportBackup()}><Download size={16} />{t.export}</button><button className="button primary header-new" onClick={() => { setSidebarOpen(true); setCreateMenuOpen(true) }}><Plus size={17} />{t.new}</button></div></header>

        <div className="content">
          <div className="breadcrumbs"><button onClick={() => selectFolder(null)}>{t.root}</button>{view === 'recent' && <><ChevronRight size={15} /><span>{t.recent}</span></>}{breadcrumb.map((folder) => <span key={folder.id} className="breadcrumb-part"><ChevronRight size={15} /><button onClick={() => selectFolder(folder.id)}>{folder.name}</button></span>)}</div>
          <div className="page-heading"><div><p className="eyebrow">{view === 'recent' ? t.recent : t.workspace}</p><h1>{view === 'recent' ? t.recent : selectedFolder?.name ?? t.allItems}</h1><p>{filteredItems.length} {t.items} · {folders.length} {t.folders.toLowerCase()}</p></div><button className="button secondary mobile-folder-button" onClick={() => setModal({ kind: 'folder' })}><FolderPlus size={16} />{t.newFolder}</button></div>

          {view === 'vault' && !isSearching && <section className="folder-section"><div className="section-heading"><h2>{t.foldersTitle}</h2><button className="text-action" onClick={() => setModal({ kind: 'folder' })}><Plus size={16} />{t.newFolder}</button></div>{currentFolders.length ? <div className="folder-grid">{currentFolders.map((folder) => {
            const count = items.filter((item) => item.folderId === folder.id).length
            return <article className="folder-card" key={folder.id}><button className="folder-open" onClick={() => selectFolder(folder.id)}><div className="folder-art"><FolderOpen size={39} /></div><div><h3>{folder.name}</h3><p>{count} {count === 1 ? t.items.replace(/s$/, '') : t.items}</p></div></button><div className="folder-card-actions"><button className="icon-button tiny" onClick={() => setModal({ kind: 'rename-folder', folder })} aria-label={t.rename}><Pencil size={15} /></button><button className="icon-button tiny danger" onClick={() => void deleteFolder(folder)} aria-label={t.delete}><Trash2 size={15} /></button></div></article>
          })}</div> : <div className="subtle-empty"><Folder size={19} />{t.noFolders}</div>}</section>}

          <section className="items-section"><div className="section-heading"><h2>{isSearching ? t.allItems : t.itemsTitle}</h2><div className="filters"><select aria-label={t.type} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'all' | ItemType)}><option value="all">{t.allTypes}</option><option value="file">{t.file}</option><option value="note">{t.note}</option><option value="link">{t.link}</option></select><select aria-label={t.tags} value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}><option value="all">{t.tagFilter}</option>{allTags.map((tag) => <option key={tag}>{tag}</option>)}</select></div></div>
            {filteredItems.length ? <div className="item-table"><div className="table-head"><span>{t.name}</span><span>{t.type}</span><span>{t.modified}</span><span>{t.size}</span><span /></div>{filteredItems.map((item) => <article className="item-row" key={item.id}><button className="item-main" onClick={() => setModal({ kind: 'preview', item })}><span className={`item-icon ${item.type}`}>{itemIcon(item)}</span><span className="item-name"><strong>{item.title}</strong><small>{item.tags.map((tag) => <em key={tag}>{tag}</em>)}</small></span></button><span className="item-type"><i className={`type-dot ${item.type}`} />{itemTypeName(item.type, t)}</span><span className="item-date">{new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium' }).format(new Date(item.updatedAt))}</span><span className="item-size">{item.file ? formatBytes(item.file.size) : '—'}</span><span className="row-actions"><button className="icon-button tiny" onClick={() => setModal({ kind: 'preview', item })} aria-label={t.view}><Eye size={16} /></button><button className="icon-button tiny" onClick={() => setModal({ kind: item.type, item })} aria-label={t.edit}><Pencil size={15} /></button><button className="icon-button tiny danger" onClick={() => void deleteItem(item)} aria-label={t.delete}><Trash2 size={15} /></button></span></article>)}</div> : <div className="empty-state"><div className="empty-icon"><Archive size={30} /></div><h3>{t.emptyTitle}</h3><p>{t.emptyDescription}</p><button className="button primary" onClick={() => { setSidebarOpen(true); setCreateMenuOpen(true) }}><Plus size={17} />{t.createFirst}</button></div>}
          </section>
        </div>
      </section>
      {toast && <div className="toast">{toast}</div>}

      {modal?.kind === 'folder' && <Modal onClose={() => setModal(undefined)}><FolderForm title={t.newFolder} t={t} onCancel={() => setModal(undefined)} onSave={(name) => saveFolder(name)} /></Modal>}
      {modal?.kind === 'rename-folder' && modal.folder && <Modal onClose={() => setModal(undefined)}><FolderForm folder={modal.folder} title={t.rename} t={t} onCancel={() => setModal(undefined)} onSave={(name) => saveFolder(name, modal.folder)} /></Modal>}
      {(modal?.kind === 'file' || modal?.kind === 'note' || modal?.kind === 'link') && <Modal onClose={() => setModal(undefined)}><ItemForm kind={modal.kind} item={modal.item} t={t} onCancel={() => setModal(undefined)} onSave={(data) => saveItem(modal.kind as ItemType, data, modal.item)} /></Modal>}
      {modal?.kind === 'preview' && modal.item && <Modal onClose={() => setModal(undefined)}><div className="preview-heading"><span className={`item-icon ${modal.item.type}`}>{itemIcon(modal.item)}</span><div><h2>{modal.item.title}</h2><p>{itemTypeName(modal.item.type, t)} · {new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium' }).format(new Date(modal.item.updatedAt))}</p></div></div><FilePreview item={modal.item} t={t} /><div className="form-actions preview-actions"><button className="button secondary" onClick={() => setModal({ kind: modal.item!.type, item: modal.item })}><Pencil size={16} />{t.edit}</button>{modal.item.file && <button className="button primary" onClick={() => downloadBlob(modal.item!.file!.blob, modal.item!.file!.name)}><Download size={16} />{t.download}</button>}</div></Modal>}
      {modal?.kind === 'import' && pendingImport && <Modal onClose={() => { setModal(undefined); setPendingImport(undefined) }}><div className="modal-heading"><Archive size={22} /><div><h2>{t.importTitle}</h2><p>{t.importDescription}</p></div></div><div className="conflict-list">{pendingImport.items.filter((item) => items.some((local) => local.id === item.id)).map((item) => <div className="conflict-row" key={item.id}><span>{itemIcon(item, 17)}<strong>{item.title}</strong></span><select value={resolutions[item.id] ?? 'local'} onChange={(event) => setResolutions((current) => ({ ...current, [item.id]: event.target.value as ConflictResolution }))}><option value="local">{t.keepLocal}</option><option value="backup">{t.useBackup}</option><option value="copy">{t.keepBoth}</option></select></div>)}</div><div className="form-actions"><button className="button secondary" onClick={() => { setModal(undefined); setPendingImport(undefined) }}>{t.cancel}</button><button className="button primary" onClick={() => void applyImport(pendingImport, resolutions)}>{t.applyImport}</button></div></Modal>}
    </main>
  )
}
