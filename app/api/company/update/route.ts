import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// Fonction pour géocoder une adresse
async function geocodeAddress(
  address: string,
  city: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    console.log(`🗺️ Géocodage de l'adresse: ${address}, ${city}`);

    // D'abord essayer avec Google Maps si la clé API est disponible
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (googleApiKey) {
      const googleQuery = encodeURIComponent(`${address}, ${city}, France`);
      const googleResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${googleQuery}&key=${googleApiKey}&region=fr&language=fr`
      );

      if (googleResponse.ok) {
        const googleData = await googleResponse.json();
        if (googleData.status === "OK" && googleData.results.length > 0) {
          const location = googleData.results[0].geometry.location;
          console.log(`✅ Google Maps: ${location.lat}, ${location.lng}`);
          return { lat: location.lat, lng: location.lng };
        }
      }
    }

    // Fallback vers Nominatim (OpenStreetMap)
    const nominatimQuery = encodeURIComponent(`${address}, ${city}, France`);
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${nominatimQuery}&limit=1&countrycodes=fr&addressdetails=1`
    );

    if (nominatimResponse.ok) {
      const nominatimData = await nominatimResponse.json();
      if (
        nominatimData.length > 0 &&
        nominatimData[0].lat &&
        nominatimData[0].lon
      ) {
        console.log(
          `✅ Nominatim: ${nominatimData[0].lat}, ${nominatimData[0].lon}`
        );
        return {
          lat: parseFloat(nominatimData[0].lat),
          lng: parseFloat(nominatimData[0].lon),
        };
      }
    }

    console.log(`❌ Géocodage échoué pour: ${address}, ${city}`);
    return null;
  } catch (error) {
    console.error("Erreur lors du géocodage:", error);
    return null;
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("🧪 API /api/company/update appelée");

    const body = await request.json();
    console.log("📦 Données reçues:", JSON.stringify(body, null, 2));

    const {
      name,
      description,
      logo,
      background,
      areaId,
      values,
      email,
      phone,
      address,
      city,
      website,
      founded,
      size,
    } = body;

    // Validation basique
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Le nom de l'entreprise est requis" },
        { status: 400 }
      );
    }

    // Récupérer la session utilisateur
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "business") {
      return NextResponse.json(
        { error: "Accès réservé aux comptes entreprise" },
        { status: 403 }
      );
    }

    const userId = parseInt(session.user.id);
    console.log("👤 UserID récupéré:", userId);

    // Géocodage automatique si l'adresse et la ville sont fournies
    let coordinates = null;
    if (address && city && address.trim() !== "" && city.trim() !== "") {
      coordinates = await geocodeAddress(address.trim(), city.trim());
      if (coordinates) {
        console.log(
          `📍 Coordonnées obtenues: Lat ${coordinates.lat}, Lng ${coordinates.lng}`
        );
      }
    }

    // Préparer les données pour la mise à jour
    const updateData: any = {
      name: name.trim(),
      description: description?.trim() || null,
      logo: logo || null,
      background: background || null,
      areaId: areaId ? parseInt(areaId) : null,
      values: values || [],
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      website: website?.trim() || null,
      founded: founded?.trim() || null,
      size: size || null,
      updatedAt: new Date(),
    };

    // Ajouter les coordonnées seulement si elles ont été géocodées
    if (coordinates) {
      updateData.coordinates = coordinates;
    }

    console.log("💾 Mise à jour de l'entreprise dans la base de données...");
    console.log(
      "📋 Données à mettre à jour:",
      JSON.stringify(updateData, null, 2)
    );

    // Mettre à jour l'entreprise dans la base de données
    const result = await db
      .update(companies)
      .set(updateData)
      .where(eq(companies.userId, userId))
      .returning();

    console.log(
      "📊 Résultat de la requête UPDATE:",
      JSON.stringify(result, null, 2)
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Entreprise non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    const updatedCompany = result[0];
    console.log("✅ Entreprise mise à jour avec succès:", updatedCompany);

    return NextResponse.json({
      success: true,
      message: "Entreprise mise à jour avec succès",
      company: updatedCompany,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'entreprise:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
