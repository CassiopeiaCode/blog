import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import matter from 'gray-matter'
import OpenAI from 'openai'
import { supportedLangs } from '../src/i18n/config'
import 'dotenv/config'

// --- Configuration ---
const POSTS_DIR = 'src/content/posts'
const SOURCE_LANG = 'zh'
const TARGET_LANGS = supportedLangs.filter(lang => lang !== SOURCE_LANG)

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
  const allFiles = await fs.readdir(POSTS_DIR)
  return allFiles
    .filter(file => file.endsWith(`-${SOURCE_LANG}.md`))
    .map(file => path.join(POSTS_DIR, file))
}

/**
 * Translates a single post to all target languages.
 * @param sourcePath - The path to the source post file.
 */
async function translatePost(sourcePath: string) {
  console.log(`\nProcessing: ${sourcePath}`)
  const sourceContent = await fs.readFile(sourcePath, 'utf-8')

  for (const lang of TARGET_LANGS) {
    const targetPath = sourcePath.replace(`-${SOURCE_LANG}.md`, `-${lang}.md`)

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
        await fs.writeFile(targetPath, translatedContent)
        console.log(`  - Successfully wrote translation to: ${targetPath}`)
      }
      else {
        console.error(`  - Failed to translate to ${lang}. Please check your API key, model name, and endpoint URL.`)
      }
    }
    else {
      console.log(`- Translation for '${lang}' is up to date. Skipping.`)
    }
  }
}

/**
 * Translates text using the OpenAI API.
 * @param text - The text to translate (including frontmatter).
 * @param targetLang - The target language code.
 * @returns A promise that resolves to the translated text, or null if an error occurs.
 */
async function translateText(text: string, targetLang: string, model: string): Promise<string | null> {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following Markdown content into ${targetLang}. Preserve the Markdown formatting and translate the frontmatter fields (like title and description) as well. Do not add any extra text or explanations.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.7,
    })
    return response.choices[0].message.content
  }
  catch (error) {
    console.error('Error during OpenAI API call:', error)
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

  for (const postPath of sourcePosts) {
    await translatePost(postPath)
  }

  console.log('\nTranslation process finished.')
}

main().catch(console.error)
