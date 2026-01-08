import { NextRequest, NextResponse } from "next/server";
import {
  uploadAvatar,
  uploadBanner,
  uploadPostImage,
  uploadEventImage,
  uploadProjectImage,
} from "@/lib/cloudinary";
// Pour l'instant, on utilise une vérification basique
// TODO: Importer auth depuis le bon chemin quand disponible

// Validation des types de fichiers et tailles
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_BANNER_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_POST_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_EVENT_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PROJECT_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    // TODO: Vérifier l'authentification
    // const session = await auth();
    // if (!session?.user) {
    //   return NextResponse.json(
    //     { error: 'Non autorisé' },
    //     { status: 401 }
    //   );
    // }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // 'avatar', 'banner', ou 'post'

    if (!file || !type) {
      return NextResponse.json(
        { error: "Fichier et type requis" },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé. Utilisez JPG, PNG ou WebP." },
        { status: 400 }
      );
    }

    // Validation de la taille
    const maxSize =
      type === "avatar"
        ? MAX_AVATAR_SIZE
        : type === "post"
        ? MAX_POST_IMAGE_SIZE
        : type === "event"
        ? MAX_EVENT_IMAGE_SIZE
        : type === "project"
        ? MAX_PROJECT_IMAGE_SIZE
        : MAX_BANNER_SIZE;
    if (file.size > maxSize) {
      const maxSizeMB = type === "avatar" ? "2MB" : "5MB";
      return NextResponse.json(
        { error: `Fichier trop volumineux. Maximum ${maxSizeMB}.` },
        { status: 400 }
      );
    }

    // Upload selon le type
    let result;
    if (type === "avatar") {
      result = await uploadAvatar(file);
    } else if (type === "banner") {
      result = await uploadBanner(file);
    } else if (type === "post") {
      result = await uploadPostImage(file);
    } else if (type === "event") {
      result = await uploadEventImage(file);
    } else if (type === "project") {
      result = await uploadProjectImage(file);
    } else {
      return NextResponse.json(
        { error: "Type d'upload invalide" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Erreur upload:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}
