import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        bio: users.bio,
        location: users.location,
        website: users.website,
        banner: users.banner,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, parseInt(session.user.id)))
      .limit(1);

    if (!user.length) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(user[0]);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { name, bio, location, website, banner, image } = body;

    // Validation basique
    if (name && (typeof name !== "string" || name.trim().length === 0)) {
      return NextResponse.json(
        { error: "Le nom ne peut pas être vide" },
        { status: 400 }
      );
    }

    if (bio && typeof bio !== "string") {
      return NextResponse.json(
        { error: "La description doit être une chaîne de caractères" },
        { status: 400 }
      );
    }

    if (location && typeof location !== "string") {
      return NextResponse.json(
        { error: "La localisation doit être une chaîne de caractères" },
        { status: 400 }
      );
    }

    if (website && typeof website !== "string") {
      return NextResponse.json(
        { error: "Le site web doit être une chaîne de caractères" },
        { status: 400 }
      );
    }

    // Mise à jour du profil
    const updateData: {
      name?: string;
      bio?: string;
      location?: string;
      website?: string;
      banner?: string;
      image?: string;
    } = {};
    if (name !== undefined) updateData.name = name.trim();
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (banner !== undefined) updateData.banner = banner;
    if (image !== undefined) updateData.image = image;

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, parseInt(session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
