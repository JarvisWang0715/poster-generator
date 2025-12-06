import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Parse filename to extract text (use -- as newline separator)
function parsePresetFilename(filename) {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg|webp|gif)$/i, '')
  // Replace -- with newlines
  const text = nameWithoutExt.replace(/--/g, '\n')
  return text
}

export async function GET() {
  try {
    const presetsDir = path.join(process.cwd(), 'public/img/presets')

    // Check if directory exists
    if (!fs.existsSync(presetsDir)) {
      return NextResponse.json({ presets: [] })
    }

    // Read directory and filter for image files
    const files = fs.readdirSync(presetsDir)
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif']

    const presets = files
      .filter(file => imageExtensions.some(ext => file.toLowerCase().endsWith(ext)))
      .sort() // Sort alphabetically
      .map(file => ({
        url: `/img/presets/${encodeURIComponent(file)}`,
        text: parsePresetFilename(file),
      }))

    return NextResponse.json({ presets })
  } catch (error) {
    console.error('Error reading presets:', error)
    return NextResponse.json({ presets: [] })
  }
}
