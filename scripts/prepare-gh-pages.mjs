import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectName = 'meme-generator-receita';
const cwd = process.cwd();
const distRoot = path.join(cwd, 'dist');
const candidateBuildDirs = [
  path.join(distRoot, projectName, 'browser'),
  path.join(distRoot, projectName)
];
const artifactDir = path.join(distRoot, 'github-pages');

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const validDirs = [];

  for (const candidate of candidateBuildDirs) {
    const indexPath = path.join(candidate, 'index.html');

    if (await exists(indexPath)) {
      const stat = await fs.stat(indexPath);
      validDirs.push({ dir: candidate, mtimeMs: stat.mtimeMs });
    }
  }

  if (validDirs.length === 0) {
    console.error('Erro: nenhuma pasta de build valida encontrada.');
    console.error(`Caminhos verificados: ${candidateBuildDirs.join(', ')}`);
    console.error('Rode npm run build antes de preparar para GitHub Pages.');
    process.exit(1);
  }

  validDirs.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const sourceBuildDir = validDirs[0].dir;

  await fs.rm(artifactDir, { recursive: true, force: true });
  await fs.cp(sourceBuildDir, artifactDir, { recursive: true });

  const indexPath = path.join(artifactDir, 'index.html');
  const indexContent = await fs.readFile(indexPath, 'utf8');

  await Promise.all([
    fs.writeFile(path.join(artifactDir, '404.html'), indexContent, 'utf8'),
    fs.writeFile(path.join(artifactDir, '.nojekyll'), '', 'utf8')
  ]);

  console.log(`Build base: ${sourceBuildDir}`);
  console.log(`Artefato GitHub Pages preparado em ${artifactDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
