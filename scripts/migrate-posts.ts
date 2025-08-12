import fs from 'node:fs/promises';
import path from 'node:path';

const POSTS_DIR = 'src/content/posts';
const SOURCE_LANG = 'zh';

async function migratePosts() {
  console.log('Starting post migration...');

  const allFiles = await fs.readdir(POSTS_DIR);

  for (const file of allFiles) {
    const sourcePath = path.join(POSTS_DIR, file);
    const stats = await fs.stat(sourcePath);

    if (!stats.isFile() || !file.endsWith('.md')) {
      continue;
    }

    const match = file.match(/^(.*?)-(\w{2}(?:-\w{2})?)\.md$/);

    if (match) {
      const baseName = match[1];
      const lang = match[2];

      if (lang === SOURCE_LANG) {
        // Rename source file: e.g., post-zh.md -> post.md
        const newPath = path.join(POSTS_DIR, `${baseName}.md`);
        console.log(`- Renaming ${file} to ${baseName}.md`);
        await fs.rename(sourcePath, newPath);
      } else {
        // Move translation to subdirectory: e.g., post-en.md -> en/post.md
        const targetDir = path.join(POSTS_DIR, lang);
        await fs.mkdir(targetDir, { recursive: true });
        const newPath = path.join(targetDir, `${baseName}.md`);
        console.log(`- Moving ${file} to ${path.join(lang, `${baseName}.md`)}`);
        await fs.rename(sourcePath, newPath);
      }
    }
  }

  console.log('\nMigration finished.');
  console.log('Please review the changes in the "src/content/posts" directory.');
  console.log('You can now run "pnpm translate" to use the new structure.');
}

migratePosts().catch(console.error);