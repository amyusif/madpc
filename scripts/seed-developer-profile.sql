

-- Enable required extensions (Supabase usually has these, but this is safe)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Upsert developer profile by email
DO $$
DECLARE
  v_email TEXT := '';      
  v_username TEXT := '';            -- <- replace
  v_full_name TEXT := '';          -- <- replace
  v_phone TEXT := '';                  -- optional, replace or set NULL
  v_badge TEXT := '';                  -- optional, replace or set NULL
  v_role TEXT := '';          -- <- replace to a valid role in your app
  v_avatar_url TEXT := NULL;                    -- optional, replace or keep NULL
  v_plain_password TEXT := '';-- <- replace with your password; it will be hashed
  v_id UUID := gen_random_uuid();               -- If FK to auth.users exists, set this to an existing auth.users.id
BEGIN
  -- Update if email exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = v_email) THEN
    UPDATE public.profiles
       SET username = v_username,
           full_name = v_full_name,
           phone = v_phone,
           badge_number = v_badge,
           role = v_role,
           avatar_url = v_avatar_url,
           encrypted_password = crypt(v_plain_password, gen_salt('bf', 10)),
           updated_at = NOW()
     WHERE email = v_email;
  ELSE
    INSERT INTO public.profiles (
      id,        -- beware FK to auth.users if present
      email,
      username,
      encrypted_password,
      full_name,
      badge_number,
      role,
      phone,
      avatar_url,
      created_at,
      updated_at
    ) VALUES (
      v_id,
      v_email,
      v_username,
      crypt(v_plain_password, gen_salt('bf', 10)),
      v_full_name,
      v_badge,
      v_role,
      v_phone,
      v_avatar_url,
      NOW(),
      NOW()
    );
  END IF;
END $$;