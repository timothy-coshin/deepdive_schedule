import fs from 'node:fs/promises';
await fs.rm('dist',{force:true,recursive:true});
await fs.mkdir('dist/data',{recursive:true});
await Promise.all([
  fs.copyFile('index.html','dist/index.html'),
  fs.copyFile('data/availability.json','dist/data/availability.json'),
]);
await fs.writeFile('dist/.nojekyll','');
console.log('Static GitHub Pages output generated in dist/');
