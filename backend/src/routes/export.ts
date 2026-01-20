import { Router, Request, Response } from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { v4 as uuidv4 } from 'uuid'

const execAsync = promisify(exec)
const router = Router()

// Supported export formats
const exportFormats = ['html', 'pdf', 'docx', 'odt', 'rst', 'latex', 'epub']
const importFormats = ['docx', 'odt', 'html', 'rst', 'latex', 'epub']

// Export markdown to various formats using pandoc
router.post('/export', async (req: Request, res: Response) => {
  const { content, format, filename } = req.body

  if (!content) {
    return res.status(400).json({ success: false, error: 'No content provided' })
  }

  if (!format || !exportFormats.includes(format)) {
    return res.status(400).json({
      success: false,
      error: `Invalid format. Supported formats: ${exportFormats.join(', ')}`
    })
  }

  const id = uuidv4()
  const inputPath = join(tmpdir(), `${id}.md`)
  const outputPath = join(tmpdir(), `${id}.${format}`)

  try {
    // Write markdown to temp file
    await writeFile(inputPath, content, 'utf-8')

    // Build pandoc command
    let pandocArgs = [
      '-f', 'markdown',
      '-t', format === 'pdf' ? 'latex' : format,
      '-o', outputPath,
      inputPath
    ]

    // Add PDF-specific options (use wkhtmltopdf via HTML)
    if (format === 'pdf') {
      pandocArgs = [
        '-f', 'markdown',
        '-t', 'html5',
        '--pdf-engine=wkhtmltopdf',
        '--pdf-engine-opt=--enable-local-file-access',
        '-o', outputPath,
        inputPath
      ]
    }

    // Add HTML-specific options
    if (format === 'html') {
      pandocArgs = [
        '-f', 'markdown',
        '-t', 'html5',
        '--standalone',
        '--self-contained',
        '-o', outputPath,
        inputPath
      ]
    }

    // Execute pandoc
    await execAsync(`pandoc ${pandocArgs.join(' ')}`)

    // Read the output file
    const outputBuffer = await readFile(outputPath)

    // Set appropriate content type
    const contentTypes: Record<string, string> = {
      html: 'text/html',
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      odt: 'application/vnd.oasis.opendocument.text',
      rst: 'text/x-rst',
      latex: 'application/x-latex',
      epub: 'application/epub+zip'
    }

    const outputFilename = filename || `document.${format}`

    res.setHeader('Content-Type', contentTypes[format] || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(outputFilename)}"`)
    res.send(outputBuffer)

    // Cleanup temp files
    await unlink(inputPath).catch(() => {})
    await unlink(outputPath).catch(() => {})
  } catch (error) {
    console.error('Export error:', error)

    // Cleanup temp files
    await unlink(inputPath).catch(() => {})
    await unlink(outputPath).catch(() => {})

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    })
  }
})

// Import various formats to markdown using pandoc
router.post('/import', async (req: Request, res: Response) => {
  const { content, format, filename } = req.body

  // Handle base64 encoded file content
  if (!content) {
    return res.status(400).json({ success: false, error: 'No content provided' })
  }

  // Detect format from filename if not provided
  let inputFormat = format
  if (!inputFormat && filename) {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext && importFormats.includes(ext)) {
      inputFormat = ext
    }
  }

  if (!inputFormat) {
    return res.status(400).json({
      success: false,
      error: `Format not specified. Supported formats: ${importFormats.join(', ')}`
    })
  }

  const id = uuidv4()
  const inputPath = join(tmpdir(), `${id}.${inputFormat}`)
  const outputPath = join(tmpdir(), `${id}.md`)

  try {
    // Decode base64 content and write to temp file
    const fileBuffer = Buffer.from(content, 'base64')
    await writeFile(inputPath, fileBuffer)

    // Build pandoc command
    const pandocArgs = [
      '-f', inputFormat,
      '-t', 'markdown',
      '-o', outputPath,
      inputPath
    ]

    // Execute pandoc
    await execAsync(`pandoc ${pandocArgs.join(' ')}`)

    // Read the output file
    const markdown = await readFile(outputPath, 'utf-8')

    // Cleanup temp files
    await unlink(inputPath).catch(() => {})
    await unlink(outputPath).catch(() => {})

    res.json({ success: true, data: { markdown } })
  } catch (error) {
    console.error('Import error:', error)

    // Cleanup temp files
    await unlink(inputPath).catch(() => {})
    await unlink(outputPath).catch(() => {})

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Import failed'
    })
  }
})

// Get supported formats
router.get('/formats', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      export: exportFormats,
      import: importFormats
    }
  })
})

export default router
