import fs from 'fs';

const colors = {
  'Agad Tantra evam Vidhi Vaidyaka': { main: '#E11D48', glow: '#881337', text: '#FDA4AF' },
  'Charak Samhita': { main: '#F59E0B', glow: '#78350F', text: '#FDE68A' },
  'Dravyaguna Vigyan': { main: '#4F46E5', glow: '#312E81', text: '#C7D2FE' }
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
