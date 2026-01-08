import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { areas, companyValues, companies } from "@/lib/schema";

export async function POST() {
  try {
    console.log("🌱 Seeding company data via API...\n");

    // Seed areas
    console.log("📍 Seeding areas...");
    const areasData = [
      { name: "Technologie" },
      { name: "Finance" },
      { name: "Santé" },
      { name: "Éducation" },
      { name: "Commerce" },
      { name: "Industrie" },
      { name: "Services" },
      { name: "Tourisme" },
    ];

    for (const area of areasData) {
      await db.insert(areas).values(area).onConflictDoNothing();
    }
    console.log("✅ Areas seeded");

    // Seed company values
    console.log("💎 Seeding company values...");
    const valuesData = [
      { name: "Innovation" },
      { name: "Durabilité" },
      { name: "Excellence" },
      { name: "Intégrité" },
      { name: "Collaboration" },
      { name: "Responsabilité sociale" },
      { name: "Transparence" },
      { name: "Qualité" },
    ];

    for (const value of valuesData) {
      await db.insert(companyValues).values(value).onConflictDoNothing();
    }
    console.log("✅ Company values seeded");

    // Seed default company for userId 1 (temporary)
    console.log("🏢 Seeding default company...");
    await db
      .insert(companies)
      .values({
        userId: 1,
        name: "The Good Place Company",
        description:
          "Une entreprise dédiée à créer des expériences exceptionnelles pour nos clients et notre communauté.",
        email: "contact@thegoodplace.com",
        phone: "+33 1 23 45 67 89",
        address: "123 Rue de l'Innovation, 75001 Paris, France",
        website: "https://thegoodplace.com",
        founded: "2020",
        size: "11-50 employés",
        areaId: 1,
        values: ["1", "2", "3"],
      })
      .onConflictDoNothing();

    console.log("✅ Default company seeded");

    return NextResponse.json({
      success: true,
      message: "Données de seed ajoutées avec succès !",
    });
  } catch (error) {
    console.error("❌ Error seeding company data:", error);
    return NextResponse.json(
      { error: "Erreur lors du seeding" },
      { status: 500 }
    );
  }
}
