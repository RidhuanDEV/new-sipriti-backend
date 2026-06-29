import fs from 'node:fs';

const files = [
  'new_sipriti_backend/src/modules/berita/berita.controller.ts',
  'new_sipriti_backend/src/modules/bidangfokus/bidangfokus.controller.ts',
  'new_sipriti_backend/src/modules/hki/hki.controller.ts',
  'new_sipriti_backend/src/modules/landingslider/landingslider.controller.ts',
  'new_sipriti_backend/src/modules/official-signatures/official-signatures.controller.ts',
  'new_sipriti_backend/src/modules/panduan/panduan.controller.ts',
  'new_sipriti_backend/src/modules/pengumuman/pengumuman.controller.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8').trim();
  if (!content.endsWith('}')) {
    content += '\n}\n';
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed: ${file}`);
  } else {
    console.log(`Already ends with } : ${file}`);
  }
}
