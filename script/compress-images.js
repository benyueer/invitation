import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isMainThread, parentPort, Worker } from 'node:worker_threads'
import sharp from 'sharp'

/**
 * node script/compress-images.js inputdir webp 800 outdir
 */

const __filename = fileURLToPath(import.meta.url)

/**
 * 递归获取目录下的所有图片文件
 * @param {string} dir
 * @param {string[]} files
 */
function getFilesRecursively(dir, files = []) {
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const name = path.join(dir, file)
    if (fs.statSync(name).isDirectory()) {
      getFilesRecursively(name, files)
    }
    else {
      const ext = path.extname(name).toLowerCase()
      if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
        files.push(name)
      }
    }
  }
  return files
}

if (isMainThread) {
  async function main() {
    const inputDirArg = process.argv[2]
    const quality = process.argv[3] ? Number(process.argv[3]) : 70
    const format = (process.argv[4] || 'webp').toLowerCase()
    const shortEdge = process.argv[5] ? Number(process.argv[5]) : null
    const outputDir
      = process.argv[6]
        || `${inputDirArg}_${format}${shortEdge ? `_s${shortEdge}` : ''}`

    const supportedFormats = ['webp', 'jpeg', 'jpg', 'png', 'avif']
    if (!supportedFormats.includes(format)) {
      console.error(
        `❌ 不支持的格式: ${format}。支持的格式: ${supportedFormats.join(', ')}`,
      )
      process.exit(1)
    }

    if (!inputDirArg) {
      console.error(
        '❌ 请提供输入目录。用法: node script/compress-images.js <directory> [quality] [format] [shortEdge] [outputDir]',
      )
      process.exit(1)
    }

    const inputDir = path.resolve(inputDirArg)
    if (!fs.existsSync(inputDir)) {
      console.error(`❌ 目录不存在: ${inputDir}`)
      process.exit(1)
    }

    const files = getFilesRecursively(inputDir)

    if (files.length === 0) {
      console.warn('🔍 没有找到需要压缩的图片文件。')
      return
    }

    const maxWorkers = Math.min(files.length, os.cpus().length)
    console.warn(`🚀 开始多线程压缩 (并发限制: ${maxWorkers})...`)
    console.warn(`📂 输入目录: ${inputDir}`)
    console.warn(`📂 输出目录: ${outputDir}`)
    console.warn(`🔍 目标格式: ${format}`)
    if (shortEdge) {
      console.warn(`🔍 目标最短边: ${shortEdge}px`)
    }
    console.warn(`🔍 找到 ${files.length} 个图片文件`)

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const startTime = Date.now()
    const fileQueue = [...files]
    let successCount = 0
    let errorCount = 0
    let workersActive = maxWorkers

    const finishReport = () => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.warn(`\n✨ 任务完成! 耗时: ${duration}s`)
      console.warn(`✅ 成功: ${successCount}`)
      if (errorCount > 0) {
        console.warn(`❌ 失败: ${errorCount}`)
      }
    }

    for (let i = 0; i < maxWorkers; i++) {
      const worker = new Worker(__filename)

      const sendTask = () => {
        if (fileQueue.length > 0) {
          const file = fileQueue.shift()
          const relativePath = path.relative(inputDir, file)
          const ext = format === 'jpeg' ? 'jpg' : format
          const targetPath = `${relativePath.replace(/\.[^/.]+$/, '')}.${ext}`
          const outputFile = path.join(outputDir, targetPath)
          const outputSubDir = path.dirname(outputFile)

          if (!fs.existsSync(outputSubDir)) {
            fs.mkdirSync(outputSubDir, { recursive: true })
          }

          worker.postMessage({
            type: 'TASK',
            file,
            outputFile,
            quality,
            format,
            shortEdge,
            relativePath,
            targetPath,
          })
        }
        else {
          worker.postMessage({ type: 'EXIT' })
        }
      }

      worker.on('message', (msg) => {
        if (msg.type === 'RESULT') {
          if (msg.success) {
            successCount++
            console.warn(
              `✅ [${msg.ratio}%] ${msg.relativePath} -> ${msg.targetPath} (${msg.oldSize}KB -> ${msg.newSize}KB)`,
            )
          }
          else {
            errorCount++
            console.error(`❌ 转换失败: ${msg.relativePath}`, msg.error)
          }
          sendTask()
        }
        else if (msg.type === 'READY') {
          sendTask()
        }
      })

      worker.on('error', (err) => {
        console.error('❌ Worker 出现致命错误:', err.message)
      })

      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`❌ Worker 以代码 ${code} 退出`)
        }
        workersActive--
        if (workersActive === 0) {
          finishReport()
        }
      })
    }
  }
  main()
}
else {
  // Worker 逻辑
  parentPort.postMessage({ type: 'READY' })

  parentPort.on('message', async (task) => {
    if (task.type === 'EXIT') {
      process.exit(0)
    }

    if (task.type === 'TASK') {
      const {
        file,
        outputFile,
        quality,
        format,
        shortEdge,
        relativePath,
        targetPath,
      } = task
      try {
        // 在 Worker 中，我们将 sharp 内部并发设为 1，由 Node Worker 层提供并行度
        sharp.concurrency(1)

        let processor = sharp(file)

        if (shortEdge) {
          // fit: 'outside' 确保较短的一边达到 target size，同时保持比例
          processor = processor.resize({
            width: shortEdge,
            height: shortEdge,
            fit: 'outside',
            withoutEnlargement: true,
          })
        }

        if (format === 'webp') {
          await processor.webp({ quality, effort: 5 }).toFile(outputFile)
        }
        else if (format === 'jpeg' || format === 'jpg') {
          await processor.jpeg({ quality, mozjpeg: true }).toFile(outputFile)
        }
        else if (format === 'png') {
          await processor
            .png({ compressionLevel: 9, palette: true })
            .toFile(outputFile)
        }
        else if (format === 'avif') {
          await processor.avif({ quality, effort: 4 }).toFile(outputFile)
        }
        else {
          throw new Error(`Unsupported format: ${format}`)
        }

        const oldSize = (fs.statSync(file).size / 1024).toFixed(2)
        const newSize = (fs.statSync(outputFile).size / 1024).toFixed(2)
        const ratio = ((1 - newSize / oldSize) * 100).toFixed(1)

        parentPort.postMessage({
          type: 'RESULT',
          success: true,
          ratio,
          oldSize,
          newSize,
          relativePath,
          targetPath,
        })
      }
      catch (err) {
        parentPort.postMessage({
          type: 'RESULT',
          success: false,
          error: err.message,
          relativePath,
        })
      }
    }
  })
}
