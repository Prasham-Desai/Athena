import fs from 'fs';

const colors = {
  'Agad Tantra evam Vidhi Vaidyaka': { main: '#FF4D8D', glow: '#7A1CAC', text: '#FFB3C7' },
  'Charak Samhita': { main: '#00D1C7', glow: '#0061FF', text: '#8FFFEF' },
  'Dravyaguna Vigyan': { main: '#F7B500', glow: '#8A5A00', text: '#FFE28A' },
  'Rasashastra evam Bhaishajyakalpana': { main: '#A855F7', glow: '#4338CA', text: '#D8B4FE' },
  'Roga Nidan evam Vikriti Vigyan': { main: '#FF6B6B', glow: '#C44569', text: '#FFC2C2' },
  'Swasthavritta evam Yoga': { main: '#2DD4BF', glow: '#0F766E', text: '#99F6E4' },
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
    
    // Find details
    const detailsIndex = snippet.indexOf('"details": {');
    if (detailsIndex !== -1) {
      let insertPos = detailsIndex + '"details": {'.length;
      let newSnippet = snippet.slice(0, insertPos) + 
        `\n      "secondaryGlow": "${palette.glow}",\n      "textAccent": "${palette.text}",` + 
        snippet.slice(insertPos);
      content = content.substring(0, index) + newSnippet + content.substring(nextChapters);
    }
  }
}

fs.writeFileSync('src/lib/curriculum-data.ts', content);
