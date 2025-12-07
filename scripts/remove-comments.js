const fs = require('fs');
const path = require('path');

// Function to remove comments from JavaScript/JSX files
function removeJSComments(content) {
    // State tracking
    let inString = false;
    let inTemplateLiteral = false;
    let inRegex = false;
    let stringChar = '';
    let escaped = false;
    let result = '';
    let i = 0;

    while (i < content.length) {
        const char = content[i];
        const nextChar = i + 1 < content.length ? content[i + 1] : '';

        // Handle escape sequences
        if (char === '\\' && !escaped) {
            result += char;
            escaped = true;
            i++;
            continue;
        }

        if (escaped) {
            result += char;
            escaped = false;
            i++;
            continue;
        }

        // Handle string literals
        if (!inString && !inTemplateLiteral && (char === '"' || char === "'" || char === '`')) {
            if (char === '`') {
                inTemplateLiteral = true;
            } else {
                inString = true;
            }
            stringChar = char;
            result += char;
            i++;
            continue;
        }

        if (inString && char === stringChar) {
            inString = false;
            stringChar = '';
            result += char;
            i++;
            continue;
        }

        if (inTemplateLiteral && char === '`') {
            inTemplateLiteral = false;
            stringChar = '';
            result += char;
            i++;
            continue;
        }

        // Handle template literal expressions
        if (inTemplateLiteral && char === '$' && nextChar === '{') {
            result += char + nextChar;
            i += 2;
            continue;
        }

        // Skip comments only when not in string or template literal
        if (!inString && !inTemplateLiteral) {
            // Handle single line comments
            if (char === '/' && nextChar === '/') {
                // Skip until end of line
                while (i < content.length && content[i] !== '\n') {
                    i++;
                }
                // Include the newline if it exists
                if (i < content.length && content[i] === '\n') {
                    result += '\n';
                    i++;
                }
                continue;
            }

            // Handle multi-line comments
            if (char === '/' && nextChar === '*') {
                // Skip until we find */
                i += 2;
                while (i < content.length - 1) {
                    if (content[i] === '*' && content[i + 1] === '/') {
                        i += 2;
                        break;
                    }
                    i++;
                }
                continue;
            }
        }

        result += char;
        i++;
    }

    return result;
}

// Function to remove comments from CSS files
function removeCSSComments(content) {
    // Simple regex approach for CSS since it's less complex than JS
    return content.replace(/\/\*[\s\S]*?\*\//g, '');
}

// Function to remove comments from .env files
function removeEnvComments(content) {
    return content.split('\n')
        .filter(line => !line.trim().startsWith('#'))
        .join('\n');
}

// Function to remove comments from JSON files (if any)
function removeJSONComments(content) {
    // Similar to JS comments but less likely to be present
    let inString = false;
    let stringChar = '';
    let escaped = false;
    let result = '';
    let i = 0;

    while (i < content.length) {
        const char = content[i];
        const nextChar = i + 1 < content.length ? content[i + 1] : '';

        // Handle escape sequences
        if (char === '\\' && !escaped) {
            result += char;
            escaped = true;
            i++;
            continue;
        }

        if (escaped) {
            result += char;
            escaped = false;
            i++;
            continue;
        }

        // Handle string literals
        if (!inString && (char === '"' || char === "'")) {
            inString = true;
            stringChar = char;
            result += char;
            i++;
            continue;
        }

        if (inString && char === stringChar) {
            inString = false;
            stringChar = '';
            result += char;
            i++;
            continue;
        }

        // Skip comments only when not in string
        if (!inString) {
            // Handle single line comments
            if (char === '/' && nextChar === '/') {
                // Skip until end of line
                while (i < content.length && content[i] !== '\n') {
                    i++;
                }
                // Include the newline if it exists
                if (i < content.length && content[i] === '\n') {
                    result += '\n';
                    i++;
                }
                continue;
            }

            // Handle multi-line comments
            if (char === '/' && nextChar === '*') {
                // Skip until we find */
                i += 2;
                while (i < content.length - 1) {
                    if (content[i] === '*' && content[i + 1] === '/') {
                        i += 2;
                        break;
                    }
                    i++;
                }
                continue;
            }
        }

        result += char;
        i++;
    }

    return result;
}

// Process a single file
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
            newContent = removeJSComments(content);
        } else if (filePath.endsWith('.css')) {
            newContent = removeCSSComments(content);
        } else if (filePath.endsWith('.env') || filePath.endsWith('.env.development') || filePath.endsWith('.env.production') || filePath.endsWith('.env.example')) {
            newContent = removeEnvComments(content);
        } else if (filePath.endsWith('.json')) {
            newContent = removeJSONComments(content);
        }

        // Only write if content has changed
        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Processed: ${filePath}`);
        }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

// Get all files to process
function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
        } else {
            // Only process specific file types
            if (
                filePath.includes('/src/') &&
                (filePath.endsWith('.js') || filePath.endsWith('.jsx') ||
                    filePath.endsWith('.css') || filePath.endsWith('.json') ||
                    filePath.endsWith('.env') || filePath.endsWith('.env.development') ||
                    filePath.endsWith('.env.production') || filePath.endsWith('.env.example'))
            ) {
                arrayOfFiles.push(filePath);
            }
        }
    });

    return arrayOfFiles;
}

// Main execution
function main() {
    console.log('Starting comment removal process...');

    // Process frontend and backend src directories
    const directories = [
        path.join(__dirname, '..', 'frontend', 'src'),
        path.join(__dirname, '..', 'backend', 'src')
    ];

    // Also process env files
    const envFiles = [
        path.join(__dirname, '..', 'frontend', '.env'),
        path.join(__dirname, '..', 'frontend', '.env.development'),
        path.join(__dirname, '..', 'frontend', '.env.production'),
        path.join(__dirname, '..', 'backend', '.env'),
        path.join(__dirname, '..', 'backend', '.env.example')
    ];

    let filesToProcess = [];

    // Get all source files
    directories.forEach(dir => {
        if (fs.existsSync(dir)) {
            filesToProcess = filesToProcess.concat(getAllFiles(dir));
        }
    });

    // Add env files
    envFiles.forEach(file => {
        if (fs.existsSync(file)) {
            filesToProcess.push(file);
        }
    });

    console.log(`Found ${filesToProcess.length} files to process`);

    // Process each file
    filesToProcess.forEach(processFile);

    console.log('Comment removal process completed!');
}

main();