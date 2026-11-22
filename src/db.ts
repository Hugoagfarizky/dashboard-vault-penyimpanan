import type { Folder, VaultItem } from './types'

const DB_NAME = 'vaultly-db'
const DB_VERSION = 1
const FOLDERS = 'folders'
const ITEMS = 'items'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(FOLDERS)) db.createObjectStore(FOLDERS, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(ITEMS)) {
        const store = db.createObjectStore(ITEMS, { keyPath: 'id' })
        store.createIndex('folderId', 'folderId')
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const request = transaction.objectStore(storeName).getAll()
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
  })
}

async function put<T>(storeName: string, value: T): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).put(value)
    transaction.oncomplete = () => { db.close(); resolve() }
    transaction.onerror = () => reject(transaction.error)
  })
}

async function remove(storeName: string, id: string): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).delete(id)
    transaction.oncomplete = () => { db.close(); resolve() }
    transaction.onerror = () => reject(transaction.error)
  })
}

export const vaultDb = {
  folders: () => getAll<Folder>(FOLDERS),
  items: () => getAll<VaultItem>(ITEMS),
  saveFolder: (folder: Folder) => put(FOLDERS, folder),
  saveItem: (item: VaultItem) => put(ITEMS, item),
  deleteFolder: (id: string) => remove(FOLDERS, id),
  deleteItem: (id: string) => remove(ITEMS, id),
}
