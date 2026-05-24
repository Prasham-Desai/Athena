import fs from 'fs';

const colors = {
  'Agad Tantra evam Vidhi Vaidyaka': { main: '#3B82F6', glow: '#1E3A8A', text: '#93C5FD' },
  'Charak Samhita': { main: '#10B981', glow: '#064E3B', text: '#6EE7B7' },
  'Dravyaguna Vigyan': { main: '#EC4899', glow: '#831843', text: '#F9A8D4' }
};

let content = fs.readFileSync('src/lib/curriculum-data.ts', 'utf-8');

for (const [name, palette] of Object.entries(colors)) {
  const nameRegex = new RegExp(`"name": "${name}"`);
  const match = nameRegex.exec(content);
  if (match) {
    let index = match.index;
    let nextChapters = content.indexOf('"chapters":', index);
    
    let snippet = content.substring(index, nextChapters);
    
    // Find color
    const colorRegex = /"color": "#[A-Fa-f0-9]+"/;
    snippet = snippet.replace(colorRegex, `"color": "${palette.main}"`);
    
    // Replace details secondaryGlow and textAccent
    snippet = snippet.replace(/"secondaryGlow": "#[A-Fa-f0-9]+"/, `"secondaryGlow": "${palette.glow}"`);
    snippet = snippet.replace(/"textAccent": "#[A-Fa-f0-9]+"/, `"textAccent": "${palette.text}"`);
    
    content = content.substring(0, index) + snippet + content.substring(nextChapters);
  }
}

fs.writeFileSync('src/lib/curriculum-data.ts', content);
