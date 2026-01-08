# Configuration Cloudinary

## 📋 Variables d'environnement à ajouter dans `.env.local`

```bash
# Cloudinary (pour l'upload d'images)
CLOUDINARY_CLOUD_NAME="votre-nom-de-cloud"
CLOUDINARY_API_KEY="votre-api-key"
CLOUDINARY_API_SECRET="votre-api-secret"
```

## 🔑 Comment obtenir ces valeurs :

### 1. Créer un compte Cloudinary

- Allez sur https://cloudinary.com/
- Créez un compte gratuit
- Vérifiez votre email

### 2. Récupérer les clés API

- Connectez-vous à votre dashboard Cloudinary
- Allez dans "Account" → "Settings" → "Access Keys"
- Copiez les valeurs :
  - **Cloud Name** : Nom de votre cloud (ex: `dqg5xyz12`)
  - **API Key** : Clé API (ex: `123456789012345`)
  - **API Secret** : Secret API (ex: `abcdefghijklmnop`)

### 3. Ajouter dans votre `.env.local`

```bash
CLOUDINARY_CLOUD_NAME="dqg5xyz12"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="abcdefghijklmnop"
```

## ⚠️ Important

- Ne partagez jamais ces clés sur GitHub
- Le fichier `.env.local` est automatiquement ignoré par Git
- Testez d'abord en développement avant la production
