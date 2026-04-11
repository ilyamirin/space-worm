import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = ["src", "public", "index.html", "vite.config.ts"];
const skippedDirs = new Set([
  "dist",
  "node_modules",
  ".git",
  ".playwright-cli"
]);
const findings = [];

const disallowedPatterns = [
  {
    id: "SEC001",
    message: "Avoid dangerouslySetInnerHTML in frontend code.",
    regex: /dangerouslySetInnerHTML/g
  },
  {
    id: "SEC002",
    message: "Avoid insertAdjacentHTML with dynamic content.",
    regex: /insertAdjacentHTML\s*\(/g
  },
  {
    id: "SEC003",
    message: "Avoid document.write in shipped code.",
    regex: /document\.(write|writeln)\s*\(/g
  },
  {
    id: "SEC004",
    message: "Avoid eval in shipped code.",
    regex: /\beval\s*\(/g
  },
  {
    id: "SEC005",
    message: "Avoid new Function in shipped code.",
    regex: /new\s+Function\s*\(/g
  }
];

const trackedEnvFiles = fs
  .readdirSync(root)
  .filter((entry) => entry.startsWith(".env") && entry !== ".env.example");

if (trackedEnvFiles.length > 0) {
  findings.push(
    ...trackedEnvFiles.map((entry) => ({
      file: entry,
      line: 1,
      id: "SEC006",
      message: "Do not keep .env files in the repository root."
    }))
  );
}

for (const target of targets) {
  const absolutePath = path.join(root, target);
  walk(absolutePath);
}

if (findings.length > 0) {
  console.error("Security check failed:");
  for (const finding of findings) {
    console.error(
      `- [${finding.id}] ${finding.file}:${finding.line} ${finding.message}`
    );
  }
  process.exit(1);
}

console.log("Security check passed.");

function walk(absolutePath) {
  if (!fs.existsSync(absolutePath)) {
    return;
  }

  const stat = fs.statSync(absolutePath);

  if (stat.isDirectory()) {
    if (skippedDirs.has(path.basename(absolutePath))) {
      return;
    }

    for (const entry of fs.readdirSync(absolutePath)) {
      walk(path.join(absolutePath, entry));
    }
    return;
  }

  const relativePath = path.relative(root, absolutePath);
  const content = fs.readFileSync(absolutePath, "utf8");
  const lines = content.split("\n");

  for (const pattern of disallowedPatterns) {
    lines.forEach((line, index) => {
      if (pattern.regex.test(line)) {
        findings.push({
          file: relativePath,
          line: index + 1,
          id: pattern.id,
          message: pattern.message
        });
      }
      pattern.regex.lastIndex = 0;
    });
  }
}
