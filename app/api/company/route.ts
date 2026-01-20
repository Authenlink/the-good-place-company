import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, areas } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { generateRandomGradient } from "@/lib/gradient-generator";

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

export async function GET() {
  try {
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

    // Récupération des données de l'entreprise avec les informations de secteur
    const result = await db
      .select({
        id: companies.id,
        name: companies.name,
        description: companies.description,
        logo: companies.logo,
        background: companies.background,
        backgroundType: companies.backgroundType,
        backgroundGradient: companies.backgroundGradient,
        areaId: companies.areaId,
        areaName: areas.name,
        values: companies.values,
        email: companies.email,
        phone: companies.phone,
        address: companies.address,
        city: companies.city,
        website: companies.website,
        founded: companies.founded,
        size: companies.size,
        isOnline: companies.isOnline,
        instagramUrl: companies.instagramUrl,
        tiktokUrl: companies.tiktokUrl,
        linkedinUrl: companies.linkedinUrl,
        createdAt: companies.createdAt,
        updatedAt: companies.updatedAt,
      })
      .from(companies)
      .leftJoin(areas, eq(companies.areaId, areas.id))
      .where(eq(companies.userId, userId))
      .limit(1);

    if (result.length === 0) {
      // Si aucune entreprise n'existe, retourner un objet vide
      return NextResponse.json({
        id: null,
        name: "",
        description: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        website: "",
        founded: "",
        size: "",
        logo: "",
        background: "",
        backgroundType: null,
        backgroundGradient: null,
        areaId: null,
        areaName: null,
        values: [],
        isOnline: false,
        instagramUrl: null,
        tiktokUrl: null,
        linkedinUrl: null,
        createdAt: null,
        updatedAt: null,
      });
    }

    const company = result[0];

    return NextResponse.json({
      id: company.id,
      name: company.name || "",
      description: company.description || "",
      logo: company.logo || "",
      background: company.background || "",
      backgroundType: company.backgroundType || null,
      backgroundGradient: company.backgroundGradient || null,
      areaId: company.areaId?.toString() || "",
      areaName: company.areaName || "",
      values: company.values || [],
      email: company.email || "",
      phone: company.phone || "",
      address: company.address || "",
      city: company.city || "",
      website: company.website || "",
      founded: company.founded || "",
      size: company.size || "",
      isOnline: company.isOnline || false,
      instagramUrl: company.instagramUrl || null,
      tiktokUrl: company.tiktokUrl || null,
      linkedinUrl: company.linkedinUrl || null,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'entreprise:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🏗️ API /api/company appelée - Création d'entreprise");

    const body = await request.json();
    console.log("📦 Données reçues:", JSON.stringify(body, null, 2));

    const {
      name,
      description,
      logo,
      background,
      backgroundGradient: providedBackgroundGradient,
      backgroundType: providedBackgroundType,
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

    // Vérifier si l'utilisateur a déjà une entreprise
    const existingCompany = await db
      .select()
      .from(companies)
      .where(eq(companies.userId, userId))
      .limit(1);

    if (existingCompany.length > 0) {
      return NextResponse.json(
        { error: "Vous avez déjà une entreprise enregistrée" },
        { status: 400 }
      );
    }

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

    // Gérer le background et le gradient
    let backgroundType: "image" | "gradient" | null = null;
    let backgroundGradient = null;
    
    // Si un backgroundType et backgroundGradient sont fournis explicitement, les utiliser
    if (providedBackgroundType === "gradient" && providedBackgroundGradient) {
      backgroundType = "gradient";
      backgroundGradient = providedBackgroundGradient;
    } else if (background) {
      // Si un background (image) est fourni, utiliser "image"
      backgroundType = "image";
    } else {
      // Sinon, générer un gradient automatiquement
      const generatedGradient = generateRandomGradient();
      backgroundType = "gradient";
      backgroundGradient = generatedGradient;
    }

    // Préparer les données pour la création
    const createData: any = {
      userId,
      name: name.trim(),
      description: description?.trim() || null,
      logo: logo || null,
      background: background || null,
      backgroundType,
      backgroundGradient,
      areaId: areaId ? parseInt(areaId) : null,
      values: values || [],
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      website: website?.trim() || null,
      founded: founded?.trim() || null,
      size: size || null,
    };

    // Ajouter les coordonnées seulement si elles ont été géocodées
    if (coordinates) {
      createData.coordinates = coordinates;
    }

    console.log("💾 Création de l'entreprise dans la base de données...");
    console.log("📋 Données à créer:", JSON.stringify(createData, null, 2));

    // Créer l'entreprise dans la base de données
    const result = await db.insert(companies).values(createData).returning();

    console.log("📊 Résultat de la création:", JSON.stringify(result, null, 2));

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Erreur lors de la création de l'entreprise" },
        { status: 500 }
      );
    }

    const newCompany = result[0];
    console.log("✅ Entreprise créée avec succès:", newCompany);

    return NextResponse.json({
      success: true,
      message: "Entreprise créée avec succès",
      company: newCompany,
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'entreprise:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
