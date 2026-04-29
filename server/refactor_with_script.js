const fs = require('fs');

function refactorFile(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Skip if already refactored
  if (content.includes('asyncHandler')) return;

  content = `import { asyncHandler } from '../../utils/asyncHandler';\nimport { AppError } from '../../utils/appError';\n` + content;

  // export const funcName = async (req: Request, res: Response) => {
  content = content.replace(/export const (\w+) = async \(([^)]+)\) => \{/g, 'export const $1 = asyncHandler(async ($2) => {');

  // Replace `try {` block
  content = content.replace(/try\s*\{\n/g, '');

  content = content.replace(/\s*\}\s*catch\s*\(([^)]+)\)\s*\{\n\s*return\s*res\.status\([^)]+\)\.json\([^)]+\);\n\s*\}\n/g, '\n');
  content = content.replace(/\s*\}\s*catch\s*\(([^)]+)\)\s*\{\n\s*res\.status\([^)]+\)\.json\([^)]+\);\n\s*\}\n/g, '\n');

  // Sometimes there's no newline on '}'
  content = content.replace(/\s*\}\s*catch\s*\(([^)]+)\)\s*\{\s*\n?\s*(?:return\s*)?res\.status\([^)]+\)\.json\([^)]+\);\s*\n?\s*\}/g, '');

  // Wait, my regex might be fragile. Let's do string replacement line by line instead!
  
  let lines = content.split('\n');
  let output = [];
  let indentLevel = 0;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.match(/^\s*try\s*\{\s*$/)) {
      continue;
    }
    if (line.match(/^\s*\}\s*catch\s*\w*\s*\([^)]*\)\s*\{\s*$/)) {
      // skip catch block contents
      while(!lines[i].match(/^\s*\}\s*$/) && !lines[i].includes('res.status(')) {
        i++;
      }
      if(lines[i].includes('res.status(')) {
         i++; // skip the res.status line
         while(!lines[i].match(/^\s*\}\s*$/)) i++; // skip until } of catch block
      }
      // now we are at `}` of catch block
      continue;
    }

    if (line.match(/^};$/)) {
      output.push('});');
      continue;
    }
    
    // De-indent by 2 spaces if we'd matched `try` previously, but it's fine without that for now
    if (line.startsWith('  ') && !line.match(/^export const/) && !line.match(/^import /) && !line.match(/^};/)) {
       // it's probably indented due to try
       if(line.startsWith('    ')) {
           line = "  " + line.substring(4);
       }
    }
    
    output.push(line);
  }

  // Restore the indentation properly if we want, or just rely on linter.
  fs.writeFileSync(path, output.join('\n'));
}

refactorFile('server/src/modules/auth/auth.controller.ts');
refactorFile('server/src/modules/report/report.controller.ts');
console.log('done');
