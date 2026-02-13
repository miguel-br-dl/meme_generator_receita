import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const cwd = process.cwd();
const templatesDir = path.join(cwd, 'templates');
const outputPath = path.join(templatesDir, 'index.json');
const checkMode = process.argv.includes('--check');

function fail(message) {
  console.error(`Erro: ${message}`);
  process.exit(1);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizeAssetPublicPath(slug, assetPath) {
  if (typeof assetPath !== 'string' || !assetPath.trim()) {
    throw new Error('asset invalido. Esperado caminho nao vazio.');
  }

  if (assetPath.startsWith('http://') || assetPath.startsWith('https://') || assetPath.startsWith('/')) {
    return assetPath;
  }

  const cleaned = assetPath.replace(/^\.\//, '');
  return `/templates/${slug}/${cleaned}`;
}

async function assertAssetExists(slug, assetPath) {
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return;
  }

  let targetFile;

  if (assetPath.startsWith('/templates/')) {
    const relative = assetPath.replace(/^\/templates\//, '');
    targetFile = path.join(templatesDir, relative);
  } else if (assetPath.startsWith('/')) {
    return;
  } else {
    const cleaned = assetPath.replace(/^\.\//, '');
    targetFile = path.join(templatesDir, slug, cleaned);
  }

  if (!(await fileExists(targetFile))) {
    throw new Error(`arquivo de asset nao encontrado: ${targetFile}`);
  }
}

function getString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`campo obrigatorio invalido: ${fieldName}`);
  }

  return value;
}

function validateFields(fields) {
  if (!Array.isArray(fields) || fields.length === 0) {
    throw new Error('fields deve ser uma lista com pelo menos 1 item');
  }

  const seen = new Set();

  fields.forEach((field, index) => {
    if (!field || typeof field !== 'object') {
      throw new Error(`fields[${index}] deve ser objeto`);
    }

    const key = getString(field.key, `fields[${index}].key`);

    if (seen.has(key)) {
      throw new Error(`campo duplicado em fields: ${key}`);
    }

    seen.add(key);

    getString(field.label, `fields[${index}].label`);

    if (field.type !== 'text' && field.type !== 'textarea') {
      throw new Error(`fields[${index}].type deve ser "text" ou "textarea"`);
    }
  });

  return seen;
}

function normalizeDefaults(defaults, fieldKeys) {
  const normalized = {};

  const source = defaults && typeof defaults === 'object' ? defaults : {};

  for (const key of fieldKeys) {
    const value = source[key];

    if (value === undefined) {
      normalized[key] = '';
      continue;
    }

    if (typeof value !== 'string') {
      throw new Error(`defaults.${key} precisa ser string`);
    }

    normalized[key] = value;
  }

  return normalized;
}

function validateNotifications(notifications, fieldKeys) {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    throw new Error('notifications deve ser uma lista com pelo menos 1 item');
  }

  notifications.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`notifications[${index}] deve ser objeto`);
    }

    const titleKey = getString(item.titleKey, `notifications[${index}].titleKey`);
    const textKey = getString(item.textKey, `notifications[${index}].textKey`);

    if (!fieldKeys.has(titleKey)) {
      throw new Error(`notifications[${index}].titleKey referencia campo inexistente: ${titleKey}`);
    }

    if (!fieldKeys.has(textKey)) {
      throw new Error(`notifications[${index}].textKey referencia campo inexistente: ${textKey}`);
    }

    if (item.timeLabel !== undefined && typeof item.timeLabel !== 'string') {
      throw new Error(`notifications[${index}].timeLabel precisa ser string quando informado`);
    }
  });
}

function validatePreview(preview) {
  if (!preview || typeof preview !== 'object') {
    throw new Error('preview e obrigatorio');
  }

  getString(preview.time, 'preview.time');
  getString(preview.subtitle, 'preview.subtitle');
  getString(preview.battery, 'preview.battery');
  getString(preview.notificationTime, 'preview.notificationTime');
}

async function loadTemplateManifest(slug) {
  const folderPath = path.join(templatesDir, slug);
  const manifestPath = path.join(folderPath, 'template.json');
  const raw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);

  const id = getString(manifest.id, `${slug}.id`);
  const name = getString(manifest.name, `${slug}.name`);
  const description = getString(manifest.description, `${slug}.description`);

  if (!manifest.assets || typeof manifest.assets !== 'object') {
    throw new Error('assets e obrigatorio');
  }

  const backgroundAsset = getString(manifest.assets.background, `${slug}.assets.background`);
  const appIconAsset = getString(manifest.assets.appIcon, `${slug}.assets.appIcon`);

  await assertAssetExists(slug, backgroundAsset);
  await assertAssetExists(slug, appIconAsset);

  const fieldKeys = validateFields(manifest.fields);
  const defaults = normalizeDefaults(manifest.defaults, fieldKeys);
  validateNotifications(manifest.notifications, fieldKeys);
  validatePreview(manifest.preview);

  const normalizedAssets = {
    background: normalizeAssetPublicPath(slug, backgroundAsset),
    appIcon: normalizeAssetPublicPath(slug, appIconAsset)
  };

  if (manifest.assets.preview) {
    const previewAsset = getString(manifest.assets.preview, `${slug}.assets.preview`);
    await assertAssetExists(slug, previewAsset);
    normalizedAssets.preview = normalizeAssetPublicPath(slug, previewAsset);
  }

  return {
    id,
    name,
    description,
    assets: normalizedAssets,
    fields: manifest.fields,
    defaults,
    notifications: manifest.notifications,
    preview: manifest.preview
  };
}

async function loadTemplates() {
  if (!(await fileExists(templatesDir))) {
    fail(`pasta templates nao encontrada em ${templatesDir}`);
  }

  const entries = await fs.readdir(templatesDir, { withFileTypes: true });

  const slugs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const templates = [];
  const usedIds = new Set();

  for (const slug of slugs) {
    const manifestPath = path.join(templatesDir, slug, 'template.json');

    if (!(await fileExists(manifestPath))) {
      continue;
    }

    const template = await loadTemplateManifest(slug);

    if (usedIds.has(template.id)) {
      fail(`id duplicado detectado em templates: ${template.id}`);
    }

    usedIds.add(template.id);
    templates.push(template);
  }

  if (templates.length === 0) {
    fail('nenhum templates/<slug>/template.json encontrado');
  }

  return templates;
}

async function run() {
  const templates = await loadTemplates();
  const json = `${JSON.stringify(templates, null, 2)}\n`;

  if (checkMode) {
    if (!(await fileExists(outputPath))) {
      fail('templates/index.json nao existe. Rode npm run templates:build');
    }

    const current = await fs.readFile(outputPath, 'utf8');

    if (current !== json) {
      fail('templates/index.json esta desatualizado. Rode npm run templates:build');
    }

    console.log('templates/index.json esta atualizado.');
    return;
  }

  await fs.writeFile(outputPath, json, 'utf8');
  console.log(`templates/index.json gerado com ${templates.length} template(s).`);
}

run().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
