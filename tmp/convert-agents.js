const fs = require('fs');
const path = require('path');

const AGENTS_DIR = '/tmp/agency-agents';
const SKILLS_DIR = path.join(process.cwd(), '.reasonix', 'skills');

// Directories whose agents become subagents (independent workers that need tools)
const SUBAGENT_DIRS = new Set([
  'engineering',
  'testing',
  'game-development',
  'support',
]);

// Tool sets per directory for subagents
const TOOL_SETS = {
  engineering: [
    'read_file', 'write_file', 'edit_file', 'multi_edit', 'bash',
    'glob', 'grep', 'ls',
    'lsp_definition', 'lsp_diagnostics', 'lsp_hover', 'lsp_references',
    'web_fetch',
  ],
  testing: [
    'read_file', 'bash', 'glob', 'grep', 'ls',
    'lsp_diagnostics',
  ],
  'game-development': [
    'read_file', 'write_file', 'edit_file', 'multi_edit', 'bash',
    'glob', 'grep', 'ls',
  ],
  support: [
    'read_file', 'web_fetch', 'glob', 'grep', 'ls',
    'bash',
  ],
};

// Skip these directories
const SKIP_DIRS = new Set(['.github', 'scripts', 'integrations']);

function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!match) return {};
  const yaml = match[1];
  const meta = {};
  yaml.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      meta[key] = value;
    }
  });
  return meta;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/--+/g, '-');
}

function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

function buildSkillFile(meta, body, isSubagent, category) {
  const name = slugify(meta.name || 'unknown');
  const description = truncate(meta.description || `${meta.name} specialist`, 120);
  const runAs = isSubagent ? 'subagent' : 'inline';
  
  let frontmatter = `---
name: ${name}
description: ${description}
runAs: ${runAs}
`;
  
  if (isSubagent) {
    const tools = TOOL_SETS[category] || TOOL_SETS['engineering'];
    frontmatter += `allowed-tools: ${tools.join(', ')}
`;
  }
  
  frontmatter += `---
`;
  
  return frontmatter + '\n' + body;
}

// Main
if (!fs.existsSync(SKILLS_DIR)) {
  fs.mkdirSync(SKILLS_DIR, { recursive: true });
}

const stats = { subagent: 0, inline: 0, skipped: 0, errors: 0 };
const entries = fs.readdirSync(AGENTS_DIR, { withFileTypes: true });

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const dirName = entry.name;
  if (SKIP_DIRS.has(dirName)) continue;
  
  const dirPath = path.join(AGENTS_DIR, dirName);
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md') && f !== 'README.md');
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const meta = parseFrontmatter(content);
    
    if (!meta.name) {
      console.log(`SKIP (no frontmatter name): ${dirName}/${file}`);
      stats.skipped++;
      continue;
    }
    
    // Extract body (content after frontmatter)
    const bodyMatch = content.match(/^---\s*\n[\s\S]*?\n---\s*\n([\s\S]*)$/);
    const body = bodyMatch ? bodyMatch[1].trim() : content;
    
    const isSubagent = SUBAGENT_DIRS.has(dirName);
    const skillContent = buildSkillFile(meta, body, isSubagent, dirName);
    const skillName = slugify(meta.name) + '.md';
    const skillPath = path.join(SKILLS_DIR, skillName);
    
    fs.writeFileSync(skillPath, skillContent, 'utf-8');
    
    if (isSubagent) stats.subagent++;
    else stats.inline++;
    
    console.log(`${isSubagent ? '[SUB]' : '[INL]'} ${skillName} ← ${dirName}/${file}`);
  }
}

console.log('\n=== Conversion Complete ===');
console.log(`Subagents: ${stats.subagent}`);
console.log(`Inline:    ${stats.inline}`);
console.log(`Skipped:   ${stats.skipped}`);
console.log(`Errors:    ${stats.errors}`);
console.log(`Total:     ${stats.subagent + stats.inline}`);
