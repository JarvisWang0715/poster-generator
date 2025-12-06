import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Parse filename to extract text
// Use -- for newlines, - for spaces
function parsePresetFilename(filename) {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg|webp|gif)$/i, '')
  // Replace -- with a placeholder, then - with space, then restore newlines
  const text = nameWithoutExt
    .replace(/--/g, '\n')
    .replace(/-/g, ' ')
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
        url: `/img/presets/${file}`,
        text: parsePresetFilename(file),
      }))

    return NextResponse.json({ presets })
  } catch (error) {
    console.error('Error reading presets:', error)
    return NextResponse.json({ presets: [] })
  }
}
