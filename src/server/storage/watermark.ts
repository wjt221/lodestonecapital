import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'
import { randomBytes } from 'crypto'

export interface WatermarkOptions {
  userName: string
  userEmail: string
  timestamp: Date
  ipAddress: string
  watermarkId?: string
}

/**
 * Generate a unique watermark ID for tracking document access.
 */
export function generateWatermarkId(): string {
  return randomBytes(12).toString('hex')
}

/**
 * Apply a dynamic diagonal watermark to every page of a PDF.
 * The watermark contains the user's name, email, timestamp, and IP address.
 * This is applied to ALL LP document downloads — the original PDF is never sent directly.
 *
 * Uses pdf-lib for pure-JS PDF manipulation (no native dependencies).
 */
export async function applyPdfWatermark(
  pdfBuffer: Buffer,
  options: WatermarkOptions,
): Promise<{ watermarkedBuffer: Buffer; watermarkId: string }> {
  const watermarkId = options.watermarkId ?? generateWatermarkId()

  const pdfDoc = await PDFDocument.load(pdfBuffer, {
    ignoreEncryption: false,
  })

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const watermarkLines = [
    options.userName,
    options.userEmail,
    options.timestamp.toISOString(),
    `IP: ${options.ipAddress}`,
    `ID: ${watermarkId}`,
  ]

  const pages = pdfDoc.getPages()

  for (const page of pages) {
    const { width, height } = page.getSize()

    // Draw watermark text diagonally across the page
    // Using a semi-transparent gray color
    const fontSize = Math.min(width, height) * 0.025
    const lineSpacing = fontSize * 1.5
    const centerX = width / 2
    const centerY = height / 2
    const totalTextHeight = watermarkLines.length * lineSpacing
    const startY = centerY + totalTextHeight / 2

    watermarkLines.forEach((line, index) => {
      const textWidth = font.widthOfTextAtSize(line, fontSize)
      page.drawText(line, {
        x: centerX - textWidth / 2,
        y: startY - index * lineSpacing,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.35,
        rotate: degrees(45),
      })
    })

    // Second watermark instance for additional coverage
    watermarkLines.forEach((line, index) => {
      const textWidth = font.widthOfTextAtSize(line, fontSize)
      page.drawText(line, {
        x: centerX - textWidth / 2 + width * 0.15,
        y: startY - index * lineSpacing - height * 0.3,
        size: fontSize * 0.8,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.2,
        rotate: degrees(45),
      })
    })
  }

  const watermarkedBytes = await pdfDoc.save()
  const watermarkedBuffer = Buffer.from(watermarkedBytes)

  return { watermarkedBuffer, watermarkId }
}

/**
 * Apply a text-based watermark to non-PDF documents (images, etc.).
 * For non-PDF files, we return the original with a note.
 * Full image watermarking would require sharp/canvas (add if needed).
 */
export async function applyWatermarkByType(
  buffer: Buffer,
  mimeType: string,
  options: WatermarkOptions,
): Promise<{ watermarkedBuffer: Buffer; watermarkId: string }> {
  if (mimeType === 'application/pdf') {
    return applyPdfWatermark(buffer, options)
  }

  // For non-PDF files, return original buffer with a new watermark ID logged
  // (watermark tracking still occurs via DocumentAccessLog)
  const watermarkId = options.watermarkId ?? generateWatermarkId()
  return { watermarkedBuffer: buffer, watermarkId }
}
