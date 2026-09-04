const fs = require('fs');
let content = fs.readFileSync('src/components/LegalPagesModal.tsx', 'utf8');
content = content.replace("All product orders undergo a comprehensive 10-point movement & battery quality inspection", "All product orders undergo a comprehensive quality inspection");
fs.writeFileSync('src/components/LegalPagesModal.tsx', content);
