-- Migration: Gestione Utenti Fornitori
-- Data: 2025-11-30

-- 1. Abilita estensione pgcrypto per hash password
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Crea tabella provider_users
CREATE TABLE IF NOT EXISTS public.provider_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_provider_user UNIQUE(provider_id, user_id)
);

-- 3. Indici per performance
CREATE INDEX IF NOT EXISTS idx_provider_users_provider_id ON provider_users(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_users_user_id ON provider_users(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_users_active ON provider_users(provider_id, is_active);

-- 4. Trigger per updated_at
CREATE OR REPLACE FUNCTION update_provider_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_provider_users_updated_at ON provider_users;
CREATE TRIGGER trigger_provider_users_updated_at
    BEFORE UPDATE ON provider_users
    FOR EACH ROW
    EXECUTE FUNCTION update_provider_users_updated_at();

-- 5. Funzione get_provider_users
CREATE OR REPLACE FUNCTION public.get_provider_users(p_provider_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Verifica che il provider esista
    IF NOT EXISTS (SELECT 1 FROM provider_profiles WHERE id = p_provider_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Provider non trovato'
        );
    END IF;

    -- Recupera utenti
    SELECT jsonb_build_object(
        'success', true,
        'data', COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', pu.id,
                'user_id', pu.user_id,
                'first_name', pu.first_name,
                'last_name', pu.last_name,
                'email', u.email,
                'is_active', pu.is_active,
                'created_at', pu.created_at,
                'updated_at', pu.updated_at
            ) ORDER BY pu.last_name, pu.first_name
        ), '[]'::jsonb)
    )
    INTO v_result
    FROM provider_users pu
    JOIN users u ON pu.user_id = u.id
    WHERE pu.provider_id = p_provider_id
    AND pu.is_active = true;

    RETURN v_result;
END;
$$;

-- 6. Funzione create_provider_user
CREATE OR REPLACE FUNCTION public.create_provider_user(
    p_provider_id UUID,
    p_first_name VARCHAR(100),
    p_last_name VARCHAR(100),
    p_email VARCHAR(255),
    p_password VARCHAR(255),
    p_created_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_provider_user_id UUID;
    v_password_hash TEXT;
BEGIN
    -- Validazione nome
    IF p_first_name IS NULL OR LENGTH(TRIM(p_first_name)) = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Il nome è obbligatorio',
            'field', 'first_name'
        );
    END IF;

    -- Validazione cognome
    IF p_last_name IS NULL OR LENGTH(TRIM(p_last_name)) = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Il cognome è obbligatorio',
            'field', 'last_name'
        );
    END IF;

    -- Validazione email
    IF p_email IS NULL OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email non valida',
            'field', 'email'
        );
    END IF;

    -- Validazione password
    IF p_password IS NULL OR LENGTH(p_password) < 8 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'La password deve essere di almeno 8 caratteri',
            'field', 'password'
        );
    END IF;

    -- Verifica provider esista
    IF NOT EXISTS (SELECT 1 FROM provider_profiles WHERE id = p_provider_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Provider non trovato'
        );
    END IF;

    -- Verifica email univoca in users
    IF EXISTS (SELECT 1 FROM users WHERE email = LOWER(p_email)) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email già registrata',
            'field', 'email'
        );
    END IF;

    -- Hash password
    v_password_hash := crypt(p_password, gen_salt('bf', 10));

    -- Genera UUID per nuovo utente
    v_user_id := gen_random_uuid();

    -- Crea utente in auth.users
    INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at)
    VALUES (v_user_id, LOWER(p_email), v_password_hash, NOW(), NOW());

    -- Crea utente in users
    INSERT INTO users (id, email, user_type, created_at, updated_at)
    VALUES (v_user_id, LOWER(p_email), 'provider', NOW(), NOW());

    -- Crea associazione provider_users
    INSERT INTO provider_users (
        provider_id,
        user_id,
        first_name,
        last_name,
        created_by
    )
    VALUES (
        p_provider_id,
        v_user_id,
        TRIM(p_first_name),
        TRIM(p_last_name),
        p_created_by
    )
    RETURNING id INTO v_provider_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'provider_user_id', v_provider_user_id,
            'user_id', v_user_id,
            'email', LOWER(p_email),
            'first_name', TRIM(p_first_name),
            'last_name', TRIM(p_last_name)
        )
    );

EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Utente già associato a questo fornitore'
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Errore durante la creazione: ' || SQLERRM
        );
END;
$$;

-- 7. Funzione deactivate_provider_user
CREATE OR REPLACE FUNCTION public.deactivate_provider_user(
    p_provider_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE provider_users
    SET is_active = false, updated_at = NOW()
    WHERE id = p_provider_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Utente non trovato'
        );
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 8. Grant permessi per PostgREST
GRANT EXECUTE ON FUNCTION public.get_provider_users(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_provider_user(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_provider_user(UUID) TO anon, authenticated;

-- 9. Grant permessi sulla tabella
GRANT SELECT, INSERT, UPDATE ON public.provider_users TO anon, authenticated;
