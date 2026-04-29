const fs = require('fs');
let content = fs.readFileSync('server/src/modules/auth/auth.service.ts', 'utf8');

content = content.replace(/await User\.findOne\(\{ email \}\)/g, 'await authRepository.findUserByEmail(email)');
content = content.replace(/await User\.findOne\([\s\S]*?\}\)\.select\('\+resetPasswordToken \+resetPasswordExpires'\)/g, 'await authRepository.findUserByResetToken(hashedToken)');
content = content.replace(/await User\.findOne\(\{ email \}\)\.select\('\+password'\)/g, 'await authRepository.findUserByEmailWithPassword(email)');
content = content.replace(/new User\(userData\);\s+await user\.save\(\);/g, 'await authRepository.createUser(userData);');
content = content.replace(/await user\.save\(\)/g, 'await authRepository.saveUser(user)');
content = content.replace(/await User\.findById\(id\)\.select\('\+password'\)/g, 'await authRepository.findUserByIdWithPassword(id)');
content = content.replace(/await User\.findByIdAndDelete\(id\)/g, 'await authRepository.deleteUserById(id)');
content = content.replace(/await User\.findById\(id\)/g, 'await authRepository.findUserById(id)');
content = content.replace(/await User\.find\(\)\.select\('-password'\)/g, 'await authRepository.findAllUsers()');
content = content.replace(/await User\.find\(\{ role: 'client' \}\)\.select\('-password'\)/g, 'await authRepository.findClients()');
content = content.replace(/await User\.find\(\{ role: 'employee' \}\)\.select\('-password'\)/g, 'await authRepository.findEmployees()');

fs.writeFileSync('server/src/modules/auth/auth.service.ts', content);

let projectContent = fs.readFileSync('server/src/modules/project/project.service.ts', 'utf8');
projectContent = projectContent.replace(/import Project from '.\/project.model';/g, "import * as projectRepository from './project.repository';");
projectContent = projectContent.replace(/await Project\.find\(\{ client: userId \}\)\.populate\('client'\)/g, "await projectRepository.findProjectsByRole('client', userId)");
projectContent = projectContent.replace(/await Project\.find\(\)\.populate\('client'\)/g, "await projectRepository.findProjectsByRole('admin', userId)");
projectContent = projectContent.replace(/const project = new Project\(data\);\s+return await project\.save\(\);/g, "return await projectRepository.createProject(data);");
projectContent = projectContent.replace(/await Project\.findByIdAndUpdate\(id, data, \{ new: true \}\)/g, "await projectRepository.updateProjectById(id, data)");
projectContent = projectContent.replace(/await Project\.findByIdAndDelete\(id\)/g, "await projectRepository.deleteProjectById(id)");
fs.writeFileSync('server/src/modules/project/project.service.ts', projectContent);

let publicContent = fs.readFileSync('server/src/modules/public/public.service.ts', 'utf8');
publicContent = publicContent.replace(/import PublicContent from '.\/public.model';/g, "import * as publicRepository from './public.repository';");
publicContent = publicContent.replace(/await PublicContent\.find\(\{ clientId, isActive: true \}\)/g, "await publicRepository.findPublicContentByClient(clientId)");
publicContent = publicContent.replace(/const content = new PublicContent\(\{[\s\S]*?\}\);\s+await content\.save\(\);\s+return content;/g, "return await publicRepository.createPublicContent(data, clientId);");
fs.writeFileSync('server/src/modules/public/public.service.ts', publicContent);

let reportContent = fs.readFileSync('server/src/modules/report/report.service.ts', 'utf8');
reportContent = reportContent.replace(/import Report from '.\/models\/report.model';\nimport Section from '.\/models\/section.model';\nimport CoverageTable from '.\/models\/coverageTable.model';/g, "import * as reportRepository from './report.repository';");
reportContent = reportContent.replace(/await Report\.find\(query\)/g, "await reportRepository.findReportsByQuery(query)");
reportContent = reportContent.replace(/await Report\.findById\(reportId\)/g, "await reportRepository.findReportById(reportId)");
reportContent = reportContent.replace(/await Section\.find\(\{ reportId: \{ \$in: reportIds \} \}\)/g, "await reportRepository.findSectionsByReportIds(reportIds)");
reportContent = reportContent.replace(/await CoverageTable\.find\(\{ sectionId: \{ \$in: sectionIds \} \}\)\n\s*\.sort\(\{ updatedAt: -1 \}\)\n\s*\.limit\(50\)/g, "await reportRepository.findTablesBySectionIds(sectionIds, { updatedAt: -1 }, 50)");
reportContent = reportContent.replace(/await CoverageTable\.find\(\{ sectionId: \{ \$in: sectionIds \} \}\)/g, "await reportRepository.findTablesBySectionIds(sectionIds)");
// For sections and tables creation
reportContent = reportContent.replace(/new Report\(\{/g, "await reportRepository.createReport({");
reportContent = reportContent.replace(/await newReport\.save\(\);/g, ""); // They will be created and saved by repo
reportContent = reportContent.replace(/await Section\.find\(\{ reportId: \w+\._id \}\)\.sort\('order'\)/g, "await reportRepository.findSectionsByReportId(originalReport._id)");
reportContent = reportContent.replace(/await Section\.find\(\{ reportId: \w+ \}\)\.sort\('order'\)/g, "await reportRepository.findSectionsByReportId(sectionToDuplicate.reportId)");
reportContent = reportContent.replace(/new Section\(\{/g, "await reportRepository.createSection({");
reportContent = reportContent.replace(/await newSection\.save\(\);/g, "");
reportContent = reportContent.replace(/await CoverageTable\.find\(\{ sectionId: \w+\._id \}\)\.sort\('order'\)/g, "await reportRepository.findTablesBySectionId(section._id)");
reportContent = reportContent.replace(/await CoverageTable\.find\(\{ sectionId: \w+\._id \}\)/g, "await reportRepository.findTablesBySectionId((sectionToDuplicate as any)._id || sectionToDuplicate._id)");
reportContent = reportContent.replace(/new CoverageTable\(\{/g, "await reportRepository.createTable({");
reportContent = reportContent.replace(/await newTable\.save\(\);/g, "");
reportContent = reportContent.replace(/await Section\.findById\(sectionId\)/g, "await reportRepository.findSectionById(sectionId)");
reportContent = reportContent.replace(/await Section\.countDocuments\(\{ reportId: \w+\.reportId \}\)/g, "await reportRepository.countSectionsByReportId(sectionToDuplicate.reportId)");
fs.writeFileSync('server/src/modules/report/report.service.ts', reportContent);

console.log("Rewrite done");
