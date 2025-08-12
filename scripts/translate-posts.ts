import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import matter from 'gray-matter'
import OpenAI from 'openai'
import { allLocales } from '../src/config'
import 'dotenv/config'

// --- Configuration ---
const POSTS_DIR = 'src/content/posts'
const SOURCE_LANG = 'zh' // Source language files are in the root of POSTS_DIR
const TARGET_LANGS = allLocales.filter(lang => lang !== SOURCE_LANG)

const model = process.env.OPENAI_MODEL
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL?.replace(/\/$/, ''),
  fetch: (url, options) => {
    console.log(`- Sending API request to: ${url}`)
    return fetch(url, options)
  },
})

/**
 * Finds all source language post files in the posts directory.
 * @returns A promise that resolves to an array of source post file paths.
 */
async function findSourcePosts(): Promise<string[]> {
  const allEntries = await fs.readdir(POSTS_DIR, { withFileTypes: true })
  const sourceFiles = allEntries
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => path.join(POSTS_DIR, entry.name))
  return sourceFiles
}

/**
 * Translates a single post to all target languages.
 * @param sourcePath - The path to the source post file.
 */
async function translatePost(sourcePath: string) {
  console.log(`\nProcessing: ${sourcePath}`)
  let sourceContent = await fs.readFile(sourcePath, 'utf-8')
  const { data: sourceFrontmatter, content: sourceBody } = matter(sourceContent)

  const sourceFileName = path.basename(sourcePath, path.extname(sourcePath))

  // Ensure the source post has the correct language tag, abbrlink, and translationKey
  let needsUpdate = false
  if (sourceFrontmatter.lang !== SOURCE_LANG) {
    sourceFrontmatter.lang = SOURCE_LANG
    needsUpdate = true
  }
  if (!sourceFrontmatter.abbrlink) {
    sourceFrontmatter.abbrlink = sourceFileName
    needsUpdate = true
  }
  if (!sourceFrontmatter.translationKey) {
    sourceFrontmatter.translationKey = sourceFileName
    needsUpdate = true
  }

  if (needsUpdate) {
    console.log(`- Updating frontmatter for source file: ${sourcePath}`)
    sourceContent = matter.stringify(sourceBody, sourceFrontmatter)
    await fs.writeFile(sourcePath, sourceContent)
  }

  const translationPromises = TARGET_LANGS.map(async (lang) => {
    const targetDir = path.join(POSTS_DIR, lang)
    const targetPath = path.join(targetDir, path.basename(sourcePath))

    // Ensure target directory exists
    await fs.mkdir(targetDir, { recursive: true })

    let needsTranslation = false
    try {
      const sourceStats = await fs.stat(sourcePath)
      const targetStats = await fs.stat(targetPath)
      if (sourceStats.mtime > targetStats.mtime) {
        needsTranslation = true
        console.log(`- Source is newer than '${lang}' translation. Queuing for translation.`)
      }
    }
    catch {
      needsTranslation = true
      console.log(`- Translation for '${lang}' not found. Queuing for translation.`)
    }

    if (needsTranslation) {
      console.log(`  - Translating to ${lang}...`)
      const translatedContent = await translateText(sourceContent, lang, model!)

      if (translatedContent) {
        const { data: translatedFrontmatter, content: translatedBody } = matter(translatedContent)

        // Ensure title and description are properly quoted if they contain special characters
        if (translatedFrontmatter.title && typeof translatedFrontmatter.title === 'string' && translatedFrontmatter.title.includes(':')) {
          translatedFrontmatter.title = `"${translatedFrontmatter.title.replace(/"/g, '\\"')}"`
        }
        if (translatedFrontmatter.description && typeof translatedFrontmatter.description === 'string' && translatedFrontmatter.description.includes(':')) {
          translatedFrontmatter.description = `"${translatedFrontmatter.description.replace(/"/g, '\\"')}"`
        }

        // Re-parse the potentially fixed frontmatter
        const fixedContent = matter.stringify(translatedBody, translatedFrontmatter)
        const { data: finalFrontmatter, content: finalBody } = matter(fixedContent)

        finalFrontmatter.lang = lang
        finalFrontmatter.abbrlink = sourceFrontmatter.abbrlink
        finalFrontmatter.translationKey = sourceFrontmatter.translationKey
        const newContent = matter.stringify(finalBody, finalFrontmatter)

        await fs.writeFile(targetPath, newContent)
        console.log(`  - Successfully wrote translation to: ${targetPath}`)
      }
      else {
        console.error(`  - Failed to translate to ${lang}. Please check your API key, model name, and endpoint URL.`)
      }
    }
    else {
      console.log(`- Translation for '${lang}' is up to date. Skipping.`)
    }
  })

  await Promise.all(translationPromises)
}

/**
 * Translates text using the OpenAI API.
 * @param text - The text to translate (including frontmatter).
 * @param targetLang - The target language code.
 * @returns A promise that resolves to the translated text, or null if an error occurs.
 */
async function translateText(text: string, targetLang: string, model: string): Promise<string | null> {
  try {
    const stream = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following Markdown content into ${targetLang}. Preserve the Markdown formatting and all frontmatter fields. Only translate the values of the frontmatter fields (like 'title' and 'description'), not the keys. Do not add any extra text or explanations before or after the markdown content. Ensure that if a frontmatter value contains a colon, it is properly quoted.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.7,
      stream: true,
    })

    let translatedContent = ''
    for await (const chunk of stream) {
      process.stdout.write('.')
      translatedContent += chunk.choices[0]?.delta?.content || ''
    }
    process.stdout.write('\n')
    return translatedContent
  }
  catch (error) {
    console.error('\nError during OpenAI API call:', error)
    return null
  }
}

// --- Main Function ---
async function main() {
  if (!process.env.OPENAI_API_KEY || !model) {
    console.error(
      'Error: Make sure OPENAI_API_KEY and OPENAI_MODEL are set in your .env file.',
    )
    return
  }

  console.log('Starting translation process...')
  const sourcePosts = await findSourcePosts()

  if (sourcePosts.length === 0) {
    console.log('No source posts found to translate.')
    return
  }

  console.log(`Found ${sourcePosts.length} source post(s).`)

  const allPromises = sourcePosts.map(postPath => translatePost(postPath))
  await Promise.all(allPromises)

  console.log('\nTranslation process finished.')
}

main().catch(console.error)
