import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLES_DIR = path.resolve(__dirname, '../sample-workspaces');
const PUBLIC_SAMPLES_DIR = path.resolve(__dirname, '../public/samples');

// Ensure output directory exists
if (!fs.existsSync(PUBLIC_SAMPLES_DIR)) {
    fs.mkdirSync(PUBLIC_SAMPLES_DIR, { recursive: true });
}

const samples = [];
const items = fs.readdirSync(SAMPLES_DIR);

console.log(`Processing samples from: ${SAMPLES_DIR}`);

for (const item of items) {
    const itemPath = path.join(SAMPLES_DIR, item);
    // Ignore hidden files like .DS_Store at the root level if they are iterated
    if (item.startsWith('.')) continue;

    if (fs.statSync(itemPath).isDirectory()) {
        console.log(`\nPackaging sample: ${item}`);

        // 1. Verify build
        try {
            console.log(`  Verifying build for ${item}...`);
            // Run vyasac build using absolute path
            const vyasacPath = '/Users/anand/Projects/project-vyasa/vyasa/vyasac/target/release/vyasac';
            execSync(`${vyasacPath} build`, { cwd: itemPath, stdio: 'inherit' });
            console.log(`  Build verified.`);
        } catch (error) {
            console.error(`  Build FAILED for ${item}. Skipping packaging.`);
            // Continue to next sample, or exit?
            // "If build fails, the script should fail" -> implied for strict CI,
            // but maybe we just want to skip broken samples?
            // Let's fail hard for now as per "make sure... actually build".
            process.exit(1);
        }

        // Output zip file path
        const zipPath = path.join(PUBLIC_SAMPLES_DIR, `${item}.zip`);

        // Remove existing zip if present
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

        // 2. Zip folder contents
        // Exclude .DS_Store and output/ directory
        try {
            // -r: recursive
            // -x: exclude
            // Exclude pattern: "*.DS_Store" "output/*"
            // Note: zip command patterns are shell glob patterns
            console.log(`  Zipping to ${zipPath}...`);
            execSync(`zip -r "${zipPath}" . -x "*.DS_Store" "dist/*"`, { cwd: itemPath, stdio: 'inherit' });

            // Calculate hash for cache busting
            const fileBuffer = fs.readFileSync(zipPath);
            const hash = crypto.createHash('md5').update(fileBuffer).digest('hex').substring(0, 8);

            samples.push({
                id: item,
                name: item,
                file: `${item}.zip`,
                hash: hash
            });
            console.log(`  Package created (Hash: ${hash}).`);
        } catch (error) {
            console.error(`  Failed to package ${item}:`, error);
            process.exit(1);
        }
    }
}

// Write index.json
const indexJsonPath = path.join(PUBLIC_SAMPLES_DIR, 'index.json');
fs.writeFileSync(indexJsonPath, JSON.stringify(samples, null, 2));

console.log('\nPackaging complete.');
console.log('Available samples:', samples);
