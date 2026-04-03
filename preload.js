const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('booksAPI', {
  // Data
  getAllData: () => ipcRenderer.invoke('get-all-data'),
  createBook: (name, collectionId) => ipcRenderer.invoke('create-book', name, collectionId),
  createCollection: (prefix) => ipcRenderer.invoke('create-collection', prefix),
  getNextBookName: (collectionId) => ipcRenderer.invoke('get-next-book-name', collectionId),
  setActiveBook: (bookId) => ipcRenderer.invoke('set-active-book', bookId),
  deletePage: (bookId, pageId) => ipcRenderer.invoke('delete-page', bookId, pageId),
  reorderPages: (bookId, pageIds) => ipcRenderer.invoke('reorder-pages', bookId, pageIds),
  deleteBook: (bookId) => ipcRenderer.invoke('delete-book', bookId),
  deleteCollection: (collectionId) => ipcRenderer.invoke('delete-collection', collectionId),
  updateCollection: (collectionId, prefix) => ipcRenderer.invoke('update-collection', collectionId, prefix),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),

  // File I/O
  showSaveDialog: (defaultPath) => ipcRenderer.invoke('show-save-dialog', defaultPath),
  writeFile: (filePath, base64) => ipcRenderer.invoke('write-file', filePath, base64),
  readImageBase64: (imgPath) => ipcRenderer.invoke('read-image-base64', imgPath),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  exportBookPdf: (bookId) => ipcRenderer.invoke('export-book-pdf', bookId),
  importImages: (bookId, filePaths) => ipcRenderer.invoke('import-images', bookId, filePaths),

  // Events from main process
  onPageAdded: (cb) => {
    const fn = (_, payload) => cb(payload.bookId, payload.page)
    ipcRenderer.on('page-added', fn)
    return () => ipcRenderer.removeListener('page-added', fn)
  },
  onActiveBookChanged: (cb) => {
    const fn = (_, bookId) => cb(bookId)
    ipcRenderer.on('active-book-changed', fn)
    return () => ipcRenderer.removeListener('active-book-changed', fn)
  },
  onNoActiveBook: (cb) => {
    const fn = () => cb()
    ipcRenderer.on('no-active-book', fn)
    return () => ipcRenderer.removeListener('no-active-book', fn)
  },
  onBookCreated: (cb) => {
    const fn = (_, book) => cb(book)
    ipcRenderer.on('book-created', fn)
    return () => ipcRenderer.removeListener('book-created', fn)
  },
})
