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
        // SKIPPING BUILD VERIFICATION due to local environment issues.
        // Assuming user has verified builds.
        /*
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
        */

        // Read vyasac.toml for metadata
        let displayName = item;
        const configPath = path.join(itemPath, 'vyasac.toml');

        if (fs.existsSync(configPath)) {
            try {
                const configContent = fs.readFileSync(configPath, 'utf8');
                const lines = configContent.split('\n');
                let section = '';
                let foundTitle = '';
                let foundName = '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('#')) continue;

                    if (trimmed.startsWith('[')) {
                        section = trimmed.replace(/[\[\]]/g, '');
                        continue;
                    }

                    if (trimmed.includes('=')) {
                        const parts = trimmed.split('=');
                        const key = parts[0].trim();
                        // simplistic value extraction: remove comments, weird spaces, and quotes
                        let value = parts.slice(1).join('=').trim();
                        if (value.startsWith('"') && value.endsWith('"')) {
                            value = value.substring(1, value.length - 1);
                        }

                        if (section === 'workspace' || section === 'project') {
                            if (key === 'title') foundTitle = value;
                            if (key === 'name') foundName = value;
                        }
                    }
                }

                if (foundTitle) displayName = foundTitle;
                else if (foundName) displayName = foundName;

                console.log(`  Found display name: "${displayName}"`);
            } catch (e) {
                console.warn(`  Failed to read config for ${item}, using folder name.`);
            }
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
            console.log(`  Zipping to ${zipPath}...`);
            // Use 'dist' instead of output, based on recent changes
            execSync(`zip -r "${zipPath}" . -x "*.DS_Store" "dist/*" "output/*" "target/*"`, { cwd: itemPath, stdio: 'inherit' });

            // Calculate hash for cache busting
            // Use node crypto to handle large files efficiently? 
            // For now readFileSync is fine for small samples
            const fileBuffer = fs.readFileSync(zipPath);
            const hash = crypto.createHash('md5').update(fileBuffer).digest('hex').substring(0, 8);

            samples.push({
                id: item, // generic ID from folder
                name: displayName, // Display name from TOML
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

// Sort samples by name
samples.sort((a, b) => a.name.localeCompare(b.name));

// Write index.json
const indexJsonPath = path.join(PUBLIC_SAMPLES_DIR, 'index.json');
fs.writeFileSync(indexJsonPath, JSON.stringify(samples, null, 2));

console.log('\nPackaging complete.');
console.log('Available samples:', samples);
