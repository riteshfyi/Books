import { PDFDocument } from 'pdf-lib'
import { Book } from '../types'

function uint8ToBase64(bytes: Uint8Array): string {
  const chunk = 8192
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export async function exportBookToPdf(book: Book): Promise<void> {
  const sorted = [...book.pages].sort((a, b) => a.order - b.order)
  if (sorted.length === 0) { alert('This book has no pages.'); return }

  const result = await window.booksAPI.showSaveDialog(`${book.name}.pdf`)
  if (result.canceled || !result.filePath) return

  try {
    const pdf = await PDFDocument.create()
    for (const page of sorted) {
      const b64 = await window.booksAPI.readImageBase64(page.imagePath)
      if (!b64) continue
      const raw = atob(b64)
      const bytes = new Uint8Array(raw.length)
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
      const img = await pdf.embedPng(bytes)
      const { width, height } = img.scale(1)
      const p = pdf.addPage([width, height])
      p.drawImage(img, { x: 0, y: 0, width, height })
    }

    const pdfBytes = await pdf.save()
    const b64Pdf = uint8ToBase64(new Uint8Array(pdfBytes))
    await window.booksAPI.writeFile(result.filePath, b64Pdf)
    await window.booksAPI.openFile(result.filePath)
  } catch (err) {
    console.error('PDF export error:', err)
    alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}
