// Test rapide de l'API upload
async function testAPI() {
  try {
    console.log("🧪 Test de l'API upload...\n");

    // Créer un fichier de test (SVG simple)
    const testFile = new File(
      [
        `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#3b82f6"/>
        <text x="50" y="55" text-anchor="middle" fill="white" font-size="12">Test</text>
      </svg>`,
      ],
      "test.svg",
      { type: "image/svg+xml" }
    );

    const formData = new FormData();
    formData.append("file", testFile);
    formData.append("type", "avatar");

    console.log("📤 Envoi du fichier de test...");

    const response = await fetch("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Upload réussi !");
      console.log("- URL:", result.url);
      console.log("- Public ID:", result.publicId);
      console.log("\n🎉 Cloudinary fonctionne parfaitement !");
      console.log(
        "Vous pouvez maintenant uploader des images depuis l'interface."
      );
    } else {
      console.log("❌ Erreur API:", result.error);
      console.log("\n🔧 Vérifiez:");
      console.log("1. Le serveur Next.js est démarré");
      console.log("2. Vos variables Cloudinary sont correctes");
      console.log("3. Votre compte Cloudinary est actif");
    }
  } catch (error) {
    console.log(
      "❌ Erreur de connexion:",
      error instanceof Error ? error.message : error
    );
    console.log("\n🔧 Assurez-vous que:");
    console.log("1. Le serveur Next.js est démarré: npm run dev");
    console.log("2. Il écoute sur le port 3000");
  }
}

testAPI();
