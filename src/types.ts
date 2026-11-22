export type ItemType = 'file' | 'note' | 'link'
export type Language = 'id' | 'en'

export interface Folder {
  id: string
  name: string
  parentId: string | null
  createdAt: string
  updatedAt: string
}

export interface VaultFile {
  blob: Blob
  name: string
  mimeType: string
  size: number
}

export interface VaultItem {
  id: string
  type: ItemType
  title: string
  folderId: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
  file?: VaultFile
  content?: string
  url?: string
  description?: string
}

export interface BackupManifest {
  formatVersion: 1
  exportedAt: string
  folders: Folder[]
  items: Array<Omit<VaultItem, 'file'> & { file?: Omit<VaultFile, 'blob'> & { path: string } }>
}

export interface ImportSnapshot {
  folders: Folder[]
  items: VaultItem[]
}

export type ConflictResolution = 'local' | 'backup' | 'copy'

export interface ModalState {
  kind: 'folder' | 'file' | 'note' | 'link' | 'preview' | 'import' | 'rename-folder'
  item?: VaultItem
  folder?: Folder
}
