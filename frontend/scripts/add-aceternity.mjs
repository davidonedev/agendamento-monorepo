/**
 * Instala componentes do Aceternity UI sem tocar nos componentes base (src/components/ui).
 *
 *   npm run ui:add -- <nome> [<nome> ...]     ex.: npm run ui:add -- bento-grid spotlight
 *
 * O registro do Aceternity grava em src/components/ui/, onde já existem input, tabs, etc. do
 * painel. Este script (1) simula a instalação e aborta se algum arquivo seria sobrescrito,
 * (2) instala e (3) move os arquivos novos para src/components/aceternity/, ajustando os imports e marcando com @ts-nocheck (o código deles não passa no noUnusedLocals).
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const names = process.argv.slice(2);
if (names.length === 0) {
  console.error('Uso: npm run ui:add -- <componente> [<componente> ...]');
  process.exit(1);
}

const DEST = path.join('src', 'components', 'aceternity');
const TS_NOCHECK = '// @ts-nocheck (código da biblioteca Aceternity UI: não seguimos as regras estritas do projeto aqui)' + '\n';
const norm = p => p.replace(/\\/g, '/');
const sh = cmd => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

for (const name of names) {
  const target = `@aceternity/${name}`;

  // 1) simulação: nunca sobrescrever arquivos existentes
  const dry = sh(`npx shadcn@latest add ${target} --dry-run`);
  if (/overwrite/i.test(dry)) {
    console.error(`✖ ${name}: a instalação sobrescreveria arquivos existentes:\n${dry}\nAbortado. Instale manualmente com outro nome.`);
    process.exit(1);
  }
  const created = [...dry.matchAll(/\+\s+(src[\\/]\S+)\s+create/g)].map(m => m[1]);
  if (created.length === 0) { console.log(`• ${name}: nada novo para instalar (já existe?)`); continue; }

  // 2) instala
  sh(`npx shadcn@latest add ${target} -y`);

  // 3) move para a pasta da biblioteca e corrige imports entre arquivos movidos
  fs.mkdirSync(DEST, { recursive: true });
  const moved = [];
  for (const file of created) {
    const to = path.join(DEST, path.basename(file));
    fs.renameSync(file, to);
    moved.push(to);
  }
  for (const to of moved) {
    let src = fs.readFileSync(to, 'utf8');
    for (const m of moved) {
      const base = path.basename(m).replace(/\.[tj]sx?$/, '');
      src = src.replaceAll(`@/components/ui/${base}"`, `@/components/aceternity/${base}"`).replaceAll(`@/components/ui/${base}'`, `@/components/aceternity/${base}'`);
    }
    if (!src.startsWith('// @ts-nocheck')) src = TS_NOCHECK + src;
    fs.writeFileSync(to, src);
  }
  console.log(`✔ ${name} → ${moved.map(norm).join(', ')}`);
}
