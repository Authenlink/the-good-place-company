import cloudinary from "@/lib/cloudinary";

async function testCloudinary() {
  try {
    console.log("🔍 Test de la configuration Cloudinary...\n");

    // Test de la configuration
    console.log("📋 Configuration chargée:");
    console.log(
      "- Cloud Name:",
      process.env.CLOUDINARY_CLOUD_NAME ? "✅ Défini" : "❌ Manquant"
    );
    console.log(
      "- API Key:",
      process.env.CLOUDINARY_API_KEY ? "✅ Défini" : "❌ Manquant"
    );
    console.log(
      "- API Secret:",
      process.env.CLOUDINARY_API_SECRET ? "✅ Défini" : "❌ Manquant"
    );

    // Test de connexion
    console.log("\n🔗 Test de connexion à Cloudinary...");

    // Créer un fichier de test simple
    const testImageBuffer = Buffer.from(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#3b82f6"/>
        <text x="50" y="55" text-anchor="middle" fill="white" font-size="12">Test</text>
      </svg>
    `);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "thegoodplace/test",
            public_id: "test-image",
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(testImageBuffer);
    });

    console.log("✅ Upload réussi !");
    console.log("- URL:", (result as any).secure_url);
    console.log("- Public ID:", (result as any).public_id);

    // Supprimer l'image de test
    await cloudinary.uploader.destroy((result as any).public_id);
    console.log("🗑️ Image de test supprimée");

    console.log("\n🎉 Configuration Cloudinary validée !");
  } catch (error) {
    console.error("\n❌ Erreur lors du test:", error);
    console.log("\n🔧 Vérifiez:");
    console.log("1. Vos variables d'environnement dans .env.local");
    console.log("2. Votre compte Cloudinary est actif");
    console.log("3. Les clés API sont correctes");
  }
}

testCloudinary();
