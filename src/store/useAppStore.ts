import { create } from 'zustand'
import { AppData, Book, Collection, Page, AppSettings } from '../types'

interface AppStore extends AppData {
  isLoading: boolean
  loadData: () => Promise<void>
  createBook: (name: string, collectionId: string | null) => Promise<Book>
  setActiveBook: (bookId: string | null) => Promise<void>
  deleteBook: (bookId: string) => Promise<void>
  createCollection: (prefix: string) => Promise<Collection>
  updateCollection: (id: string, prefix: string) => Promise<void>
  deleteCollection: (id: string) => Promise<void>
  getNextBookName: (id: string) => Promise<string | null>
  deletePage: (bookId: string, pageId: string) => Promise<void>
  reorderPages: (bookId: string, pageIds: string[]) => Promise<void>
  handlePageAdded: (bookId: string, page: Page) => void
  updateSettings: (s: Partial<AppSettings>) => Promise<void>
}

export const useAppStore = create<AppStore>((set, get) => ({
  books: {},
  collections: {},
  activeBookId: null,
  settings: { shortcut: 'CommandOrControl+Shift+S', exportDir: '' },
  recentBookIds: [],
  isLoading: true,

  loadData: async () => {
    const data: AppData = await window.booksAPI.getAllData()
    set({ ...data, isLoading: false })
  },

  createBook: async (name, collectionId) => {
    const book = await window.booksAPI.createBook(name, collectionId)
    set(s => ({
      books: { ...s.books, [book.id]: book },
      activeBookId: book.id,
      recentBookIds: [book.id, ...s.recentBookIds.filter(id => id !== book.id)].slice(0, 20),
      ...(collectionId && s.collections[collectionId] ? {
        collections: {
          ...s.collections,
          [collectionId]: { ...s.collections[collectionId], bookIds: [...s.collections[collectionId].bookIds, book.id] },
        }
      } : {}),
    }))
    return book
  },

  setActiveBook: async (bookId) => {
    await window.booksAPI.setActiveBook(bookId)
    set(s => ({
      activeBookId: bookId,
      recentBookIds: bookId ? [bookId, ...s.recentBookIds.filter(id => id !== bookId)].slice(0, 20) : s.recentBookIds,
    }))
  },

  deleteBook: async (bookId) => {
    await window.booksAPI.deleteBook(bookId)
    set(s => {
      const books = { ...s.books }
      const book = books[bookId]
      delete books[bookId]
      const collections = { ...s.collections }
      if (book?.collectionId && collections[book.collectionId]) {
        collections[book.collectionId] = { ...collections[book.collectionId], bookIds: collections[book.collectionId].bookIds.filter(id => id !== bookId) }
      }
      return { books, collections, activeBookId: s.activeBookId === bookId ? null : s.activeBookId, recentBookIds: s.recentBookIds.filter(id => id !== bookId) }
    })
  },

  createCollection: async (prefix) => {
    const col = await window.booksAPI.createCollection(prefix)
    set(s => ({ collections: { ...s.collections, [col.id]: col } }))
    return col
  },

  updateCollection: async (id, prefix) => {
    const updated = await window.booksAPI.updateCollection(id, prefix)
    set(s => ({ collections: { ...s.collections, [id]: updated } }))
  },

  deleteCollection: async (id) => {
    await window.booksAPI.deleteCollection(id)
    set(s => { const c = { ...s.collections }; delete c[id]; return { collections: c } })
  },

  getNextBookName: (id) => window.booksAPI.getNextBookName(id),

  deletePage: async (bookId, pageId) => {
    const updated = await window.booksAPI.deletePage(bookId, pageId)
    set(s => ({ books: { ...s.books, [bookId]: updated } }))
  },

  reorderPages: async (bookId, pageIds) => {
    const updated = await window.booksAPI.reorderPages(bookId, pageIds)
    set(s => ({ books: { ...s.books, [bookId]: updated } }))
  },

  handlePageAdded: (bookId, page) => {
    set(s => {
      const book = s.books[bookId]
      if (!book) return s
      return {
        books: { ...s.books, [bookId]: { ...book, pages: [...book.pages, page] } },
        recentBookIds: [bookId, ...s.recentBookIds.filter(id => id !== bookId)].slice(0, 20),
      }
    })
  },

  updateSettings: async (settings) => {
    const updated = await window.booksAPI.updateSettings(settings)
    set({ settings: updated })
  },
}))
