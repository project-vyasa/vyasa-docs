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

const targetWorkspaces = ['vyasa-bg', 'vedabase-bg', 'bible', 'intimate-note'];
const samples = [];

console.log(`Processing selected samples from: ${SAMPLES_DIR}`);

for (const item of targetWorkspaces) {
    const itemPath = path.join(SAMPLES_DIR, item);
    
    if (fs.existsSync(itemPath) && fs.statSync(itemPath).isDirectory()) {
        console.log(`\nPackaging sample: ${item}`);

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

        const vyviewPath = path.join(PUBLIC_SAMPLES_DIR, `${item}.sqlite`);
        if (fs.existsSync(vyviewPath)) fs.unlinkSync(vyviewPath);
        
        const zipPath = path.join(PUBLIC_SAMPLES_DIR, `${item}.zip`);
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

        try {
            console.log(`  Zipping source to ${zipPath}...`);
            execSync(`zip -r "${zipPath}" . -x "*.DS_Store" "dist/*" "output/*" "target/*"`, { cwd: itemPath, stdio: 'inherit' });
            
            console.log(`  Building view target for ${item}...`);
            // We use cargo run --manifest-path from the root to ensure it always builds
            const cargoToml = path.resolve(__dirname, '../../../vyasa/vyasac/Cargo.toml');
            execSync(`cargo run --manifest-path "${cargoToml}" -- pack "${itemPath}" --target view -o "${vyviewPath}"`, { stdio: 'inherit' });
            
            // Calculate hash for cache busting based on zip
            const fileBuffer = fs.readFileSync(zipPath);
            const hash = crypto.createHash('md5').update(fileBuffer).digest('hex').substring(0, 8);

            samples.push({
                id: item,
                name: displayName,
                file: `${item}.zip`,
                payloadUrl: `${item}.sqlite`,
                hash: hash
            });
            console.log(`  Package created (Hash: ${hash}).`);
        } catch (error) {
            console.error(`  Failed to package ${item}:`, error);
            process.exit(1);
        }
    } else {
        console.warn(`  Workspace ${item} not found or is not a directory.`);
    }
}

// Sort samples by name
samples.sort((a, b) => a.name.localeCompare(b.name));

// Write catalog.json
const catalogObj = {
  catalog: {
    urn: "urn:vyasa:catalog:examples",
    publisher: "Project Vyasa Examples",
    description: "Sample packages for the Vyasa project."
  },
  items: samples
};
const catalogJsonPath = path.join(PUBLIC_SAMPLES_DIR, 'catalog.json');
fs.writeFileSync(catalogJsonPath, JSON.stringify(catalogObj, null, 2));

console.log('\nPackaging complete.');
console.log('Available samples:', samples);

