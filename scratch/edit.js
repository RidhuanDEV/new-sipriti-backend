import fs from 'node:fs';

const [filePath, recipePath] = process.argv.slice(2);

if (!filePath || !recipePath) {
  console.error("Usage: node edit.js <filePath> <recipePath>");
  process.exit(1);
}

try {
  let content = fs.readFileSync(filePath, 'utf8');
  const recipe = JSON.parse(fs.readFileSync(recipePath, 'utf8'));

  for (const [index, chunk] of recipe.entries()) {
    const { target, replacement } = chunk;
    if (!target) {
      console.error(`Error: target missing at index ${index}`);
      process.exit(1);
    }
    if (!content.includes(target)) {
      console.error(`Error: Target content not found for chunk ${index} in ${filePath}`);
      console.error("Target expected:\n" + target);
      process.exit(1);
    }
    const occurrences = content.split(target).length - 1;
    if (occurrences > 1) {
      console.error(`Error: Target content occurs ${occurrences} times (not unique) for chunk ${index} in ${filePath}`);
      process.exit(1);
    }
    content = content.replace(target, replacement);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully updated ${filePath}`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
