import fs from "fs";
import path from "path";

const businessPagesDir = path.join(__dirname, "..", "app", "business");

// Fonction récursive pour trouver tous les fichiers .tsx
function findTsxFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && item !== "node_modules") {
        traverse(fullPath);
      } else if (stat.isFile() && item.endsWith(".tsx")) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

// Fonction pour mettre à jour un fichier
function updateFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // Vérifier si le fichier utilise déjà useScroll
  if (content.includes("useScroll")) {
    console.log(
      `⚠️  ${path.relative(businessPagesDir, filePath)} - déjà mis à jour`
    );
    return;
  }

  // Vérifier si le fichier a un header sticky
  if (!content.includes("sticky top-0")) {
    console.log(
      `⏭️  ${path.relative(businessPagesDir, filePath)} - pas de header sticky`
    );
    return;
  }

  console.log(`🔄 Mise à jour de ${path.relative(businessPagesDir, filePath)}`);

  // 1. Ajouter l'import useScroll
  if (content.includes('import { useToast } from "@/hooks/use-toast";')) {
    content = content.replace(
      'import { useToast } from "@/hooks/use-toast";',
      'import { useToast } from "@/hooks/use-toast";\nimport { useScroll } from "@/hooks/use-scroll";'
    );
  } else if (content.includes('from "react";')) {
    // Trouver la ligne d'import React et ajouter useScroll après
    content = content.replace(
      /(import.*from "react";)/,
      '$1\nimport { useScroll } from "@/hooks/use-scroll";'
    );
  }

  // 2. Ajouter le state hasScrolled
  // Trouver la déclaration des states
  const statePattern = /(const \[.*?\] = useState\(.*?\);?)$/gm;
  let lastStateMatch;
  let match;
  while ((match = statePattern.exec(content)) !== null) {
    lastStateMatch = match;
  }

  if (lastStateMatch) {
    content = content.replace(
      lastStateMatch[0],
      lastStateMatch[0] + "\n  const hasScrolled = useScroll();"
    );
  }

  // 3. Modifier la classe du header pour utiliser la logique conditionnelle
  content = content.replace(
    /className="([^"]*?)transition-\[width,height\] ease-linear([^"]*?)"/g,
    "className={`$1transition-[width,height] ease-linear$2 ${hasScrolled ? 'border-b' : ''}`}"
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ ${path.relative(businessPagesDir, filePath)} - mis à jour`);
}

// Exécuter le script
console.log("🚀 Mise à jour automatique des headers...\n");

const files = findTsxFiles(businessPagesDir);
let updatedCount = 0;

for (const file of files) {
  try {
    updateFile(file);
    updatedCount++;
  } catch (error) {
    console.error(
      `❌ Erreur avec ${path.relative(businessPagesDir, file)}:`,
      error.message
    );
  }
}

console.log(`\n✨ Mise à jour terminée ! ${updatedCount} fichiers traités.`);
