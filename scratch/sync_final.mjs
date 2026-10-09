import fs from 'fs';

// Copy the latest working implementation to scripts/build_matrixmax_dashboard.mjs
const latestCode = fs.readFileSync('scratch/deploy_responsive_matrix_with_links.mjs', 'utf8');
fs.writeFileSync('scripts/build_matrixmax_dashboard.mjs', latestCode, 'utf8');
console.log('Synchronized scripts/build_matrixmax_dashboard.mjs successfully!');
