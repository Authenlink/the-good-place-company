-- Script SQL pour ajouter la colonne coordinates à la table companies
-- Exécutez ce script dans votre base de données PostgreSQL

-- Vérifier si la colonne existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'companies'
        AND table_schema = 'public'
        AND column_name = 'coordinates'
    ) THEN
        -- Ajouter la colonne coordinates
        ALTER TABLE companies ADD COLUMN coordinates jsonb;
        RAISE NOTICE '✅ Colonne coordinates ajoutée à la table companies';
    ELSE
        RAISE NOTICE 'ℹ️ La colonne coordinates existe déjà';
    END IF;
END $$;

-- Vérification finale
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
AND table_schema = 'public'
ORDER BY ordinal_position;
