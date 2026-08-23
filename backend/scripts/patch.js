const fs = require('fs');
const files = [
  'scripts/test-phase25.ts',
  'scripts/test-phase26.ts',
  'scripts/test-phase31.ts',
  'scripts/test-phase32.ts',
  'scripts/test-phase33.ts'
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/role: "Admin", status: "Active"/g, 'role: "Admin", status: "Active", permissions: ["homepage.view", "homepage.edit", "homepage.publish", "homepage.schedule", "homepage.rollback", "homepage.preview", "homepage.revisions.view", "homepage.campaigns.manage", "homepage.audit.view"]');
  fs.writeFileSync(f, c);
});
console.log('Patched');
