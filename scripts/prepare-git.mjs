import { spawnSync } from 'node:child_process';
import process from 'node:process';

const args = new Set(process.argv.slice(2));
const skipBuild = args.has('--no-build');
const runTests = args.has('--with-test');

function runStep(command, commandArgs, description) {
  console.log(`\n> ${description}`);
  console.log(`$ ${[command, ...commandArgs].join(' ')}`);

  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function readCommandOutput(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    encoding: 'utf8',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    return null;
  }

  return result.stdout.trim();
}

function printFinalStatus() {
  const isGitRepo = readCommandOutput('git', ['rev-parse', '--is-inside-work-tree']) === 'true';

  if (!isGitRepo) {
    console.log('\nAviso: diretorio atual nao e um repositorio git.');
    return;
  }

  const shortStatus = readCommandOutput('git', ['status', '--short']) ?? '';

  console.log('\nResumo de alteracoes:');

  if (!shortStatus) {
    console.log('- Nenhuma alteracao pendente (working tree limpo).');
    return;
  }

  console.log(shortStatus);
  console.log('\nProximos passos sugeridos:');
  console.log('1. git add -p');
  console.log('2. git commit -m "sua mensagem"');
  console.log('3. git push');
}

function main() {
  console.log('Preparando projeto para commit/push...');

  runStep('npm', ['run', 'templates:build'], 'Gerar templates/index.json');

  if (!skipBuild) {
    runStep('npm', ['run', 'build'], 'Validar build da aplicacao');
  } else {
    console.log('\n> Build ignorado (--no-build).');
  }

  if (runTests) {
    runStep('npm', ['run', 'test', '--', '--watch=false'], 'Executar testes');
  }

  printFinalStatus();
}

main();
