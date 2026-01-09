import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, areas, companyValues } from "@/lib/schema";
import { eq, desc, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // Récupérer les associations avec leur secteur d'activité
    const associations = await db
      .select({
        id: companies.id,
        name: companies.name,
        description: companies.description,
        logo: companies.logo,
        background: companies.background,
        areaId: companies.areaId,
        areaName: areas.name,
        values: companies.values,
        website: companies.website,
        address: companies.address,
        createdAt: companies.createdAt,
      })
      .from(companies)
      .leftJoin(areas, eq(companies.areaId, areas.id))
      .where(
        category && category !== "all" ? eq(areas.name, category) : undefined
      )
      .orderBy(desc(companies.createdAt));

    // Récupérer les noms des valeurs pour chaque association
    const associationsWithValues = await Promise.all(
      associations.map(async (association) => {
        let valueNames: { name: string; color: string }[] = [];

        if (association.values && association.values.length > 0) {
          try {
            // Pour le débogage, essayons de récupérer toutes les valeurs d'abord
            const allValues = await db
              .select({
                id: companyValues.id,
                name: companyValues.name,
                color: companyValues.color,
              })
              .from(companyValues);

            console.log("All available values:", allValues);

            const valuesData = await db
              .select({ name: companyValues.name, color: companyValues.color })
              .from(companyValues)
              .where(
                inArray(
                  companyValues.id,
                  association.values.map((v) => parseInt(v))
                )
              )
              .limit(3); // Maximum 3 valeurs

            console.log(
              "Values for association",
              association.name,
              ":",
              valuesData
            );

            valueNames = valuesData.map((v) => ({
              name: v.name,
              color: v.color,
            }));
          } catch (error) {
            console.error("Erreur lors de la récupération des valeurs:", error);
          }
        }

        return {
          ...association,
          valueNames,
        };
      })
    );

    // Transformer les données pour correspondre au format attendu par le frontend
    const formattedAssociations = associationsWithValues.map((association) => ({
      id: association.id,
      name: association.name,
      description: association.description || "",
      logo: association.logo,
      banner: association.background, // background devient banner pour le frontend
      category: association.areaName || "Autre",
      location: association.address || "",
      website: association.website,
      values: association.valueNames || [],
      createdAt: association.createdAt?.toISOString() || "",
    }));

    // TEMP: Ajouter des valeurs de test si aucune valeur n'est trouvée
    if (
      formattedAssociations.length > 0 &&
      (!formattedAssociations[0].values ||
        formattedAssociations[0].values.length === 0)
    ) {
      formattedAssociations[0].values = [
        { name: "Innovation", color: "bg-blue-500" },
        { name: "Durabilité", color: "bg-green-500" },
      ];
    }

    return NextResponse.json(formattedAssociations);
  } catch (error) {
    console.error("Erreur lors de la récupération des associations:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
