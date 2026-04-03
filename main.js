// Main process — entry point
const { app, BrowserWindow, Tray, Menu, nativeImage, globalShortcut, ipcMain, Notification, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')

// ─── State ────────────────────────────────────────────────────────────────────
let mainWindow = null
let tray = null
let appData = null   // loaded after app ready

const DATA_FILE = () => path.join(app.getPath('userData'), 'data.json')
const IMAGES_DIR = () => path.join(app.getPath('userData'), 'images')

const DEFAULT_DATA = () => ({
  books: {},
  collections: {},
  activeBookId: null,
  settings: { shortcut: 'CommandOrControl+Alt+S', exportDir: app.getPath('downloads') },
  recentBookIds: [],
})

// ─── Data helpers ─────────────────────────────────────────────────────────────
function loadData() {
  const def = DEFAULT_DATA()
  try {
    if (fs.existsSync(DATA_FILE())) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE(), 'utf8'))
      return { ...def, ...parsed, settings: { ...def.settings, ...(parsed.settings || {}) } }
    }
  } catch (_) {}
  return def
}

function saveData() {
  fs.writeFileSync(DATA_FILE(), JSON.stringify(appData, null, 2), 'utf8')
}

// ─── Window ───────────────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1100, height: 740, minWidth: 800, minHeight: 580,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f0f1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
    show: false,
  })

  win.once('ready-to-show', () => win.show())
  win.on('close', (e) => { e.preventDefault(); win.hide() })

  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, 'renderer', 'index.html'))
  }

  return win
}

// ─── Tray ─────────────────────────────────────────────────────────────────────
function buildTrayMenu() {
  const active = appData.activeBookId ? appData.books[appData.activeBookId] : null
  const bookItems = Object.values(appData.books).slice(0, 10).map(b => ({
    label: b.name,
    type: 'radio',
    checked: b.id === appData.activeBookId,
    click: () => {
      appData.activeBookId = b.id
      addToRecent(b.id)
      saveData()
      tray.setToolTip(`Books — ${b.name}`)
      tray.setContextMenu(buildTrayMenu())
      mainWindow && mainWindow.webContents.send('active-book-changed', b.id)
    },
  }))

  const template = [
    { label: active ? `Active: ${active.name}` : 'No active book', enabled: false },
    { type: 'separator' },
    { label: 'Open Books', click: () => { mainWindow || (mainWindow = createWindow()); mainWindow.show(); mainWindow.focus() } },
    { type: 'separator' },
    ...(bookItems.length > 0 ? [{ label: 'Switch Book', enabled: false }, ...bookItems, { type: 'separator' }] : []),
    { label: 'Quit', click: () => app.quit() },
  ]
  return Menu.buildFromTemplate(template)
}

function createTray() {
  const img = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA' +
    'BmJLR0QA/wD/AP+gvaeTAAAAMklEQVQ4jWNgGAWDHfz//5+BgYGBgZqGMNBiACMtBjDS' +
    'YgAjLQYw0mIAIy0GADGaB8sN2vf3AAAAAElFTkSuQmCC'
  ).resize({ width: 16, height: 16 })
  tray = new Tray(img)
  tray.setToolTip('Books')
  tray.setContextMenu(buildTrayMenu())
  tray.on('click', () => { mainWindow || (mainWindow = createWindow()); mainWindow.show(); mainWindow.focus() })
}

// ─── Shortcut ─────────────────────────────────────────────────────────────────
function registerShortcut(shortcut) {
  globalShortcut.unregisterAll()
  const ok = globalShortcut.register(shortcut, async () => {
    console.log(`[Books] Shortcut ${shortcut} triggered!`)
    if (!appData.activeBookId) {
      mainWindow || (mainWindow = createWindow())
      mainWindow.show(); mainWindow.focus()
      mainWindow.webContents.send('no-active-book')
      return
    }
    try {
      const imgPath = await captureScreen()
      const page = addPage(appData.activeBookId, imgPath)
      const book = appData.books[appData.activeBookId]
      new Notification({ title: 'Books', body: `Page ${book.pages.length} added to "${book.name}"`, silent: true }).show()
      mainWindow && mainWindow.webContents.send('page-added', { bookId: appData.activeBookId, page })
      tray.setContextMenu(buildTrayMenu())
    } catch (err) {
      console.error('Screenshot error:', err)
    }
  })
  console.log(`[Books] Shortcut "${shortcut}" registered: ${ok ? 'SUCCESS' : 'FAILED'}`)
  if (!ok) console.error(`[Books] Failed to register shortcut "${shortcut}" — it may be taken by another app or need Accessibility permission`)

  // ⌘⌥D — complete current book, create next in collection, make it active
  const ok2 = globalShortcut.register('CommandOrControl+Alt+D', async () => {
    console.log('[Books] Next-book shortcut triggered!')
    const currentBook = appData.activeBookId ? appData.books[appData.activeBookId] : null
    if (!currentBook) {
      new Notification({ title: 'Books', body: 'No active book to complete', silent: true }).show()
      return
    }
    if (!currentBook.collectionId || !appData.collections[currentBook.collectionId]) {
      new Notification({ title: 'Books', body: `"${currentBook.name}" is not in a collection — can't auto-create next book`, silent: true }).show()
      return
    }
    const col = appData.collections[currentBook.collectionId]
    const nextName = `${col.prefix}_${col.nextCounter}`
    col.nextCounter++
    const newBook = createBook(nextName, col.id)
    appData.activeBookId = newBook.id
    addToRecent(newBook.id)
    saveData()
    tray.setToolTip(`Books — ${newBook.name}`)
    tray.setContextMenu(buildTrayMenu())
    new Notification({ title: 'Books', body: `Done with "${currentBook.name}" → now on "${newBook.name}"`, silent: true }).show()
    mainWindow && mainWindow.webContents.send('active-book-changed', newBook.id)
    mainWindow && mainWindow.webContents.send('book-created', newBook)
  })
  console.log(`[Books] Next-book shortcut "CommandOrControl+Alt+D" registered: ${ok2 ? 'SUCCESS' : 'FAILED'}`)
}

// ─── Screenshot ───────────────────────────────────────────────────────────────
async function captureScreen() {
  const dir = IMAGES_DIR()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const { v4: uuidv4 } = require('uuid')
  const fname = `${uuidv4()}.png`
  const fpath = path.join(dir, fname)
  const screenshot = require('screenshot-desktop')
  const buf = await screenshot({ format: 'png' })
  fs.writeFileSync(fpath, buf)
  return fpath
}

// ─── Data mutations ───────────────────────────────────────────────────────────
function addToRecent(bookId) {
  appData.recentBookIds = [bookId, ...appData.recentBookIds.filter(id => id !== bookId)].slice(0, 20)
}

function createBook(name, collectionId) {
  const { v4: uuidv4 } = require('uuid')
  const book = { id: uuidv4(), name, collectionId: collectionId || null, createdAt: new Date().toISOString(), pages: [] }
  appData.books[book.id] = book
  if (collectionId && appData.collections[collectionId]) {
    appData.collections[collectionId].bookIds.push(book.id)
  }
  addToRecent(book.id)
  saveData()
  return book
}

function addPage(bookId, imgPath) {
  const { v4: uuidv4 } = require('uuid')
  const book = appData.books[bookId]
  const page = { id: uuidv4(), imagePath: imgPath, capturedAt: new Date().toISOString(), order: book.pages.length }
  book.pages.push(page)
  saveData()
  return page
}

function deletePage(bookId, pageId) {
  const book = appData.books[bookId]
  const idx = book.pages.findIndex(p => p.id === pageId)
  if (idx !== -1) {
    const [removed] = book.pages.splice(idx, 1)
    try { if (fs.existsSync(removed.imagePath)) fs.unlinkSync(removed.imagePath) } catch (_) {}
    book.pages.forEach((p, i) => { p.order = i })
    saveData()
  }
  return book
}

function reorderPages(bookId, pageIds) {
  const book = appData.books[bookId]
  const map = new Map(book.pages.map(p => [p.id, p]))
  book.pages = pageIds.map((id, i) => { const p = map.get(id); p.order = i; return p })
  saveData()
  return book
}

function deleteBook(bookId) {
  const book = appData.books[bookId]
  if (!book) return
  book.pages.forEach(p => { try { if (fs.existsSync(p.imagePath)) fs.unlinkSync(p.imagePath) } catch (_) {} })
  if (book.collectionId && appData.collections[book.collectionId]) {
    appData.collections[book.collectionId].bookIds = appData.collections[book.collectionId].bookIds.filter(id => id !== bookId)
  }
  appData.recentBookIds = appData.recentBookIds.filter(id => id !== bookId)
  if (appData.activeBookId === bookId) appData.activeBookId = null
  delete appData.books[bookId]
  saveData()
}

function createCollection(prefix) {
  const { v4: uuidv4 } = require('uuid')
  const col = { id: uuidv4(), prefix, nextCounter: 1, bookIds: [], createdAt: new Date().toISOString() }
  appData.collections[col.id] = col
  saveData()
  return col
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────
function setupIPC() {
  ipcMain.handle('get-all-data', () => appData)

  ipcMain.handle('create-book', (_e, name, collectionId) => {
    const book = createBook(name, collectionId)
    tray.setContextMenu(buildTrayMenu())
    return book
  })

  ipcMain.handle('create-collection', (_e, prefix) => createCollection(prefix))

  ipcMain.handle('get-next-book-name', (_e, collectionId) => {
    const col = appData.collections[collectionId]
    if (!col) return null
    const name = `${col.prefix}_${col.nextCounter}`
    col.nextCounter++
    saveData()
    return name
  })

  ipcMain.handle('set-active-book', (_e, bookId) => {
    appData.activeBookId = bookId
    if (bookId) addToRecent(bookId)
    saveData()
    tray.setToolTip(bookId && appData.books[bookId] ? `Books — ${appData.books[bookId].name}` : 'Books')
    tray.setContextMenu(buildTrayMenu())
    return appData.activeBookId
  })

  ipcMain.handle('delete-page', (_e, bookId, pageId) => deletePage(bookId, pageId))
  ipcMain.handle('reorder-pages', (_e, bookId, pageIds) => reorderPages(bookId, pageIds))

  ipcMain.handle('delete-book', (_e, bookId) => {
    deleteBook(bookId)
    tray.setContextMenu(buildTrayMenu())
  })

  ipcMain.handle('delete-collection', (_e, collectionId) => {
    if (appData.collections[collectionId]) { delete appData.collections[collectionId]; saveData() }
  })

  ipcMain.handle('update-collection', (_e, collectionId, prefix) => {
    if (appData.collections[collectionId]) { appData.collections[collectionId].prefix = prefix; saveData() }
    return appData.collections[collectionId]
  })

  ipcMain.handle('update-settings', (_e, settings) => {
    appData.settings = { ...appData.settings, ...settings }
    saveData()
    if (settings.shortcut) registerShortcut(settings.shortcut)
    return appData.settings
  })

  ipcMain.handle('show-save-dialog', (_e, defaultPath) =>
    dialog.showSaveDialog({ defaultPath, filters: [{ name: 'PDF', extensions: ['pdf'] }] })
  )

  ipcMain.handle('write-file', (_e, filePath, base64) => {
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'))
  })

  ipcMain.handle('read-image-base64', (_e, imgPath) => {
    try { return fs.readFileSync(imgPath).toString('base64') } catch (_) { return null }
  })

  ipcMain.handle('open-file', (_e, filePath) => shell.openPath(filePath))

  ipcMain.handle('export-book-pdf', async (_e, bookId) => {
    const book = appData.books[bookId]
    if (!book || book.pages.length === 0) return { error: 'No pages to export' }

    const result = await dialog.showSaveDialog({
      defaultPath: `${book.name}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })
    if (result.canceled || !result.filePath) return { canceled: true }

    try {
      const { PDFDocument } = require('pdf-lib')
      const pdf = await PDFDocument.create()
      const sorted = [...book.pages].sort((a, b) => a.order - b.order)

      for (const page of sorted) {
        try {
          const imgBuf = fs.readFileSync(page.imagePath)
          const img = await pdf.embedPng(imgBuf)
          const { width, height } = img.scale(1)
          const p = pdf.addPage([width, height])
          p.drawImage(img, { x: 0, y: 0, width, height })
        } catch (pageErr) {
          console.error(`[Books] Skipping page ${page.id}:`, pageErr.message)
        }
      }

      const pdfBytes = await pdf.save()
      fs.writeFileSync(result.filePath, Buffer.from(pdfBytes))
      shell.openPath(result.filePath)
      return { filePath: result.filePath, pageCount: sorted.length }
    } catch (err) {
      console.error('[Books] PDF export error:', err)
      return { error: err.message }
    }
  })

  ipcMain.handle('import-images', async (_e, bookId, filePaths) => {
    const book = appData.books[bookId]
    if (!book) return []

    const dir = IMAGES_DIR()
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const { v4: uuidv4 } = require('uuid')
    const added = []

    for (const src of filePaths) {
      try {
        const ext = path.extname(src).toLowerCase()
        if (!['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'].includes(ext)) continue
        const fname = `${uuidv4()}${ext}`
        const dest = path.join(dir, fname)
        fs.copyFileSync(src, dest)
        const page = { id: uuidv4(), imagePath: dest, capturedAt: new Date().toISOString(), order: book.pages.length }
        book.pages.push(page)
        added.push(page)
      } catch (err) {
        console.error(`[Books] Failed to import ${src}:`, err.message)
      }
    }

    if (added.length > 0) saveData()
    return added
  })
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  appData = loadData()
  setupIPC()
  createTray()
  mainWindow = createWindow()
  registerShortcut(appData.settings.shortcut)

  app.on('activate', () => { mainWindow ? (mainWindow.show(), mainWindow.focus()) : (mainWindow = createWindow()) })
})

app.on('window-all-closed', () => { /* Keep running via tray on macOS */ })
app.on('will-quit', () => globalShortcut.unregisterAll())
