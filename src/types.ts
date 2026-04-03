export interface Page {
  id: string
  imagePath: string
  capturedAt: string
  order: number
}

export interface Book {
  id: string
  name: string
  collectionId: string | null
  createdAt: string
  pages: Page[]
}

export interface Collection {
  id: string
  prefix: string
  nextCounter: number
  bookIds: string[]
  createdAt: string
}

export interface AppSettings {
  shortcut: string
  exportDir: string
}

export interface AppData {
  books: Record<string, Book>
  collections: Record<string, Collection>
  activeBookId: string | null
  settings: AppSettings
  recentBookIds: string[]
}
