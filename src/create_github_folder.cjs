const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..'); // Points to juz-amin-recite-main
const destDir = path.join(projectRoot, '..', 'JuzAmin_GitHub'); // Points to Downloads/JuzAmin_GitHub

// Exclude build artifacts, node_modules, IDE folders, and personal keystores
const excludedNames = [
    'node_modules',
    'dist',
    '.git',
    '.idea',
    '.DS_Store',
    '.next',
    'build',
    '.gradle',
    'juzamin-release.jks',
    'Full_Codebase.md',
    'generate_codebase.cjs'
];

function copyDirIterative(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const stack = [{ src, dest }];

    while (stack.length > 0) {
        const current = stack.pop();
        const items = fs.readdirSync(current.src);

        for (const item of items) {
            if (excludedNames.includes(item)) continue;

            const srcPath = path.join(current.src, item);
            const destPath = path.join(current.dest, item);
            const stat = fs.statSync(srcPath);

            if (stat.isDirectory()) {
                // Additional precise exclusions
                if (item === 'build' && current.src.includes('android')) continue;
                if (item === '.gradle' && current.src.includes('android')) continue;

                if (!fs.existsSync(destPath)) {
                    fs.mkdirSync(destPath);
                }
                stack.push({ src: srcPath, dest: destPath });
            } else {
                // Skip some extra files
                if (item === 'juzamin-release.jks' || item.endsWith('.log')) continue;
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
}

try {
    console.log('Starting copy process...');
    copyDirIterative(projectRoot, destDir);
    console.log(`Success! Clean project folder created at: ${destDir}`);
} catch (err) {
    console.error('Error during copy:', err);
}
