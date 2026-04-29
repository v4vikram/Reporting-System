const fs = require('fs');

const files = [
  'server/src/modules/auth/auth.controller.ts',
  'server/src/modules/project/project.controller.ts',
  'server/src/modules/public/public.controller.ts',
  'server/src/modules/report/report.controller.ts',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Add import for asyncHandler and AppError
  if (!content.includes('asyncHandler')) {
    content = `import { asyncHandler } from '../../utils/asyncHandler';\nimport { AppError } from '../../utils/appError';\n` + content;
  }

  // Regex to match: export const name = async (req: Type, res: Response) => {
  content = content.replace(/export const (\w+) = async \(([^)]+)\) => \{/g, 'export const $1 = asyncHandler(async ($2) => {');

  // Regex to remove try { ... } catch
  // Warning: naive regex might fail with nested try-catch, but looking at our code, it's mostly single level
  // Let's replace:
  // try {
  // catch (err: any) {
  //   res.status(...).json({ message: err.message });
  // }
  // We can just remove `try {` and the catch block.
  content = content.replace(/try\s*\{/g, '');
  content = content.replace(/\}\s*catch\s*\(['"a-zA-Z\s:,_]+\)\s*\{\s*res\.status\([^)]+\)\.json\([^)]+\);\s*\}/g, '');
  content = content.replace(/\}\s*catch\s*\(['"a-zA-Z\s:,_]+\)\s*\{\s*console\.error\([^)]+\);\s*res\.status\([^)]+\)\.json\([^)]+\);\s*\}/g, '');
  content = content.replace(/\}\s*catch\s*\(['"a-zA-Z\s:,_]+\)\s*\{\s*return\s*res\.status\([^)]+\)\.json\([^)]+\);\s*\}/g, '');
  
  // also need to close the parenthesis of asyncHandler: }; => }); for the export.
  // Actually, since we replaced `=> {` with `asyncHandler(... => {`, the end of the function is just `};`.
  // Because we removed the try/catch, we lost pairs of {}. `try {` added 1, `} catch {...}` removed and added, so overall it balances. 
  // We just need to change `};` at the top level of the file ends.
  
  // Actually, string replacement like this is risky. Let's do it manually using the tool call for each file!
  // It's safer.
}
