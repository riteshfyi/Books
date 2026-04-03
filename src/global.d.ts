import { AppData, Book, Collection, Page, AppSettings } from './types'

export interface BooksAPI {
  getAllData: () => Promise<AppData>
  createBook: (name: string, collectionId: string | null) => Promise<Book>
  createCollection: (prefix: string) => Promise<Collection>
  getNextBookName: (collectionId: string) => Promise<string | null>
  setActiveBook: (bookId: string | null) => Promise<string | null>
  deletePage: (bookId: string, pageId: string) => Promise<Book>
  reorderPages: (bookId: string, pageIds: string[]) => Promise<Book>
  deleteBook: (bookId: string) => Promise<void>
  deleteCollection: (collectionId: string) => Promise<void>
  updateCollection: (collectionId: string, prefix: string) => Promise<Collection>
  updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>
  showSaveDialog: (defaultPath: string) => Promise<{ canceled: boolean; filePath?: string }>
  writeFile: (filePath: string, base64: string) => Promise<void>
  readImageBase64: (imgPath: string) => Promise<string | null>
  openFile: (filePath: string) => Promise<void>
  exportBookPdf: (bookId: string) => Promise<{ canceled?: boolean; error?: string; filePath?: string; pageCount?: number }>
  importImages: (bookId: string, filePaths: string[]) => Promise<Page[]>
  onPageAdded: (cb: (bookId: string, page: Page) => void) => () => void
  onActiveBookChanged: (cb: (bookId: string) => void) => () => void
  onNoActiveBook: (cb: () => void) => () => void
  onBookCreated: (cb: (book: Book) => void) => () => void
}

declare global {
  interface Window {
    booksAPI: BooksAPI
  }
}
