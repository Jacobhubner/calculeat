import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const sizes = [
  { width: 512, height: 200, filename: 'logo-512.png' },
  { width: 256, height: 100, filename: 'logo-256.png' },
  { width: 1024, height: 400, filename: 'logo-1024.png' },
]

// SVG template for the logo
const createSVG = (width, height) => `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="white"/>
    <text x="${width * 0.08}" y="${height * 0.5}"
          font-family="'Fredoka One', sans-serif"
          font-size="${Math.floor(width * 0.65)}"
          font-weight="700"
          font-style="italic"
          fill="#22c55e"
          dominant-baseline="middle">Calculeat</text>
  </svg>
`

async function generateLogos() {
  for (const { width, height, filename } of sizes) {
    try {
      const svg = createSVG(width, height)
      const filePath = path.join(process.cwd(), 'public', filename)

      await sharp(Buffer.from(svg)).png().toFile(filePath)

      console.log(`✓ Generated ${filename} (${width}x${height})`)
    } catch (error) {
      console.error(`✗ Error generating ${filename}:`, error.message)
    }
  }
  console.log('✅ All logos generated successfully!')
}

generateLogos()
