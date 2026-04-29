const fs = require('fs');

function replaceErrors(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('AppError') && !file.includes('uploadRoutes')) {
      content = `import { AppError } from '../../utils/appError';\n` + content;
  }
  if (file.includes('upload.routes.ts') && !content.includes('AppError')) {
      content = `import { AppError } from '../../utils/appError';\n` + content;
  }

  // replace: return res.status(XYZ).json({ message: 'MSG' }); 
  // with: throw new AppError('MSG', XYZ);
  content = content.replace(/return\s+res\.status\((\d+)\)\.json\(\{\s*message:\s*'([^']+)'\s*\}\);/g, "throw new AppError('$2', $1);");
  content = content.replace(/return\s+res\.status\((\d+)\)\.json\(\{\s*message:\s*"([^"]+)"\s*\}\);/g, 'throw new AppError("$2", $1);');
  content = content.replace(/return\s+res\.status\((\d+)\)\.json\(\{\s*message:\s*`([^`]+)`\s*\}\);/g, 'throw new AppError(`$2`, $1);');

  fs.writeFileSync(file, content);
}

replaceErrors('server/src/modules/auth/auth.controller.ts');
replaceErrors('server/src/modules/report/report.controller.ts');
replaceErrors('server/src/modules/upload/upload.routes.ts');
