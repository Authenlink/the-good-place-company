import { v2 as cloudinary } from "cloudinary";

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Fonction pour uploader une image
export const uploadImage = async (
  file: File,
  folder: string = "thegoodplace",
  transformation?: any[]
): Promise<{ url: string; public_id: string }> => {
  try {
    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload vers Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            transformation,
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    return {
      url: (result as any).secure_url,
      public_id: (result as any).public_id,
    };
  } catch (error) {
    console.error("Erreur lors de l'upload Cloudinary:", error);
    throw new Error("Échec de l'upload de l'image");
  }
};

// Fonction pour supprimer une image
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Erreur lors de la suppression Cloudinary:", error);
    throw new Error("Échec de la suppression de l'image");
  }
};

// Fonctions spécifiques pour les avatars et bannières
export const uploadAvatar = async (
  file: File
): Promise<{ url: string; public_id: string }> => {
  return uploadImage(file, "thegoodplace/avatars", [
    { width: 200, height: 200, crop: "fill", gravity: "face" },
    { quality: "auto" },
    { fetch_format: "auto" },
  ]);
};

export const uploadBanner = async (
  file: File
): Promise<{ url: string; public_id: string }> => {
  return uploadImage(file, "thegoodplace/banners", [
    { width: 1200, height: 400, crop: "fill" },
    { quality: "auto" },
    { fetch_format: "auto" },
  ]);
};

export const uploadPostImage = async (
  file: File
): Promise<{ url: string; public_id: string }> => {
  return uploadImage(file, "thegoodplace/posts", [
    { width: 800, height: 600, crop: "limit" },
    { quality: "auto" },
    { fetch_format: "auto" },
  ]);
};

export const uploadEventImage = async (
  file: File
): Promise<{ url: string; public_id: string }> => {
  return uploadImage(file, "thegoodplace/events", [
    { width: 1200, height: 630, crop: "fill" },
    { quality: "auto" },
    { fetch_format: "auto" },
  ]);
};

export const uploadProjectImage = async (
  file: File
): Promise<{ url: string; public_id: string }> => {
  return uploadImage(file, "thegoodplace/projects", [
    { width: 1200, height: 800, crop: "fill" },
    { quality: "auto" },
    { fetch_format: "auto" },
  ]);
};
