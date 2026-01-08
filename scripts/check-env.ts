console.log("🔍 Vérification des variables d'environnement Cloudinary...\n");

// Vérifier les variables d'environnement
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log("📋 Variables d'environnement:");
console.log(
  `- CLOUDINARY_CLOUD_NAME: ${
    cloudName ? "✅ Défini (" + cloudName + ")" : "❌ Non défini"
  }`
);
console.log(
  `- CLOUDINARY_API_KEY: ${
    apiKey ? "✅ Défini (" + apiKey.substring(0, 8) + "...)" : "❌ Non défini"
  }`
);
console.log(
  `- CLOUDINARY_API_SECRET: ${
    apiSecret
      ? "✅ Défini (" + apiSecret.substring(0, 8) + "...)"
      : "❌ Non défini"
  }`
);

console.log("\n📁 Fichiers d'environnement vérifiés:");
console.log("- .env.local: Présent");
console.log("- .env: Présent (mais .env.local est prioritaire)");

if (!cloudName || !apiKey || !apiSecret) {
  console.log(
    "\n❌ Problème détecté: Une ou plusieurs variables sont manquantes."
  );
  console.log("\n🔧 Solutions:");
  console.log(
    "1. Vérifiez que votre fichier .env.local contient bien ces lignes:"
  );
  console.log('   CLOUDINARY_CLOUD_NAME="votre-cloud-name"');
  console.log('   CLOUDINARY_API_KEY="votre-api-key"');
  console.log('   CLOUDINARY_API_SECRET="votre-api-secret"');
  console.log("");
  console.log(
    "2. Redémarrez votre serveur Next.js après avoir modifié .env.local"
  );
  console.log("3. Assurez-vous qu'il n'y a pas d'espaces autour du signe =");
  console.log("4. Vérifiez que les guillemets sont bien présents");
} else {
  console.log("\n✅ Toutes les variables sont définies !");
  console.log("🎉 Vous pouvez maintenant tester l'upload d'images.");
}
