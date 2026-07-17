import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const STAMP_PDF_COLORS: Record<string, [number, number, number]> = {
  reviewed:     [0.12, 0.62, 0.25],
  approved:     [0.08, 0.48, 0.78],
  certified:    [0.45, 0.08, 0.70],
  confidential: [0.78, 0.10, 0.10],
  court_filed:  [0.80, 0.46, 0.08],
  original_copy:[0.06, 0.45, 0.65],
}

const STAMP_CSS_COLORS: Record<string, string> = {
  reviewed:     '#1e9e40',
  approved:     '#1470c4',
  certified:    '#7010b4',
  confidential: '#c41414',
  court_filed:  '#c47410',
  original_copy:'#105c9e',
}

function b64ToUint8(b64: string): Uint8Array {
  const stripped = b64.replace(/^data:image\/\w+;base64,/, '')
  const raw = atob(stripped)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

// ── PDF baking ────────────────────────────────────────────────────────────────
export async function bakeSignatureIntoPdf(
  originalBlob: Blob,
  signerName: string,
  signatureType: 'draw' | 'typed' | 'stamp',
  signatureData: string,     // base64 PNG | typed text | stamp key
  stampType?: string,
  drawOnStamp?: string,      // optional base64 drawn sig overlaid on stamp
): Promise<Blob> {
  const buf = await originalBlob.arrayBuffer()
  const pdfDoc = await PDFDocument.load(buf)

  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Pre-embed images outside the page loop (can only embed once per document)
  let drawPng   = signatureType === 'draw' && signatureData.startsWith('data:') ? await pdfDoc.embedPng(b64ToUint8(signatureData)) : null
  let stampPng  = drawOnStamp?.startsWith('data:') ? await pdfDoc.embedPng(b64ToUint8(drawOnStamp)) : null

  const BX = 40, BY = 30, BW = 230, BH = 100

  for (const page of pdfDoc.getPages()) {
    // Outer border
    page.drawRectangle({ x: BX, y: BY, width: BW, height: BH, borderColor: rgb(0.55, 0.55, 0.55), borderWidth: 0.75 })

    // Header label
    page.drawText("LAWYER'S SIGNATURE", { x: BX + 8, y: BY + BH - 13, size: 6.5, font: boldFont, color: rgb(0.4, 0.4, 0.4) })

    // Rule
    page.drawLine({ start: { x: BX + 6, y: BY + BH - 18 }, end: { x: BX + BW - 6, y: BY + BH - 18 }, thickness: 0.4, color: rgb(0.75, 0.75, 0.75) })

    if (signatureType === 'stamp' && stampType) {
      const [r, g, b] = STAMP_PDF_COLORS[stampType] ?? [0.3, 0.3, 0.3]
      const label = stampType.replace(/_/g, ' ').toUpperCase()
      const sX = BX + 12, sY = BY + 22, sW = BW - 24, sH = 48

      page.drawRectangle({ x: sX, y: sY, width: sW, height: sH, borderColor: rgb(r, g, b), borderWidth: 2.2, color: rgb(r * 0.07, g * 0.07, b * 0.07) })

      const textSize = 14
      const textW = boldFont.widthOfTextAtSize(label, textSize)
      page.drawText(label, { x: sX + (sW - textW) / 2, y: sY + (sH - textSize) / 2 + 2, size: textSize, font: boldFont, color: rgb(r, g, b) })

      if (stampPng) {
        page.drawImage(stampPng, { x: sX + 4, y: sY + 2, width: sW - 8, height: sH - 4, opacity: 0.6 })
      }
    } else if (signatureType === 'typed') {
      page.drawText(signatureData.slice(0, 28), { x: BX + 8, y: BY + 46, size: 22, font, color: rgb(0.10, 0.10, 0.40) })
    } else if (signatureType === 'draw' && drawPng) {
      page.drawImage(drawPng, { x: BX + 8, y: BY + 22, width: 140, height: 52 })
    }

    // Signer name + date footer
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    page.drawText(signerName || 'Lawyer', { x: BX + 8, y: BY + 6, size: 7, font, color: rgb(0.5, 0.5, 0.5) })
    page.drawText(dateStr, { x: BX + BW - font.widthOfTextAtSize(dateStr, 7) - 8, y: BY + 6, size: 7, font, color: rgb(0.5, 0.5, 0.5) })
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

// ── Image baking (canvas) ─────────────────────────────────────────────────────
export function bakeSignatureIntoImage(
  originalBlob: Blob,
  signerName: string,
  signatureType: 'draw' | 'typed' | 'stamp',
  signatureData: string,
  stampType?: string,
  drawOnStamp?: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const blobUrl = URL.createObjectURL(originalBlob)

    img.onload = () => {
      const EXTRA = 120
      const canvas = document.createElement('canvas')
      canvas.width  = img.naturalWidth
      canvas.height = img.naturalHeight + EXTRA
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      // White strip
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, img.naturalHeight, canvas.width, EXTRA)

      const BX = 30, BY = img.naturalHeight + 10
      const BW = 260, BH = 100

      ctx.strokeStyle = '#888'
      ctx.lineWidth = 0.8
      ctx.strokeRect(BX, BY, BW, BH)

      // Header
      ctx.fillStyle = '#666'
      ctx.font = 'bold 8px Helvetica, Arial, sans-serif'
      ctx.fillText("LAWYER'S SIGNATURE", BX + 8, BY + 14)

      // Rule
      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.moveTo(BX + 6, BY + 20); ctx.lineTo(BX + BW - 6, BY + 20); ctx.stroke()

      const drawFooter = () => {
        ctx.fillStyle = '#999'
        ctx.font = '8px Helvetica, Arial, sans-serif'
        ctx.fillText(signerName || 'Lawyer', BX + 8, BY + BH - 8)
        ctx.fillText(new Date().toLocaleDateString('en-GB'), BX + BW - 72, BY + BH - 8)
      }

      const finish = () => {
        drawFooter()
        canvas.toBlob(b => { URL.revokeObjectURL(blobUrl); resolve(b!) }, originalBlob.type || 'image/jpeg', 0.95)
      }

      if (signatureType === 'stamp' && stampType) {
        const color = STAMP_CSS_COLORS[stampType] ?? '#555'
        const label = stampType.replace(/_/g, ' ').toUpperCase()
        const sX = BX + 16, sY = BY + 24, sW = BW - 32, sH = 52

        ctx.strokeStyle = color; ctx.lineWidth = 2.5
        ctx.strokeRect(sX, sY, sW, sH)
        ctx.fillStyle = color + '18'
        ctx.fillRect(sX, sY, sW, sH)
        ctx.fillStyle = color
        ctx.font = 'bold 16px Helvetica, Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(label, sX + sW / 2, sY + sH / 2 + 6)
        ctx.textAlign = 'left'

        if (drawOnStamp) {
          const si = new Image()
          si.onload = () => {
            ctx.globalAlpha = 0.6
            ctx.drawImage(si, sX + 4, sY + 4, sW - 8, sH - 8)
            ctx.globalAlpha = 1
            finish()
          }
          si.onerror = finish
          si.src = drawOnStamp
          return
        }
      } else if (signatureType === 'typed') {
        ctx.fillStyle = '#1a1a5e'
        ctx.font = 'italic 24px Georgia, serif'
        ctx.fillText(signatureData, BX + 8, BY + 68)
      } else if (signatureType === 'draw') {
        const si = new Image()
        si.onload = () => { ctx.drawImage(si, BX + 8, BY + 26, 150, 58); finish() }
        si.onerror = finish
        si.src = signatureData
        return
      }

      finish()
    }

    img.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error('Failed to load image')) }
    img.src = blobUrl
  })
}

// ── Main entry point ──────────────────────────────────────────────────────────
export async function bakeSignatureIntoDocument(
  originalBlob: Blob,
  signerName: string,
  signatureType: 'draw' | 'typed' | 'stamp',
  signatureData: string,
  stampType?: string,
  drawOnStamp?: string,
): Promise<Blob | null> {
  const type = originalBlob.type
  if (type.includes('pdf')) {
    return bakeSignatureIntoPdf(originalBlob, signerName, signatureType, signatureData, stampType, drawOnStamp)
  }
  if (type.startsWith('image/')) {
    return bakeSignatureIntoImage(originalBlob, signerName, signatureType, signatureData, stampType, drawOnStamp)
  }
  return null  // unsupported type — caller should skip re-upload
}
