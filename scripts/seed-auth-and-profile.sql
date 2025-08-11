-- Seed a user in auth.users and a linked profile in public.profiles
-- - Run this in Supabase SQL Editor
-- - Replace the placeholder values below before running
-- - This sets email_confirmed_at so login works immediately

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_email text := 'dev@example.com';         -- <- replace
  v_username text := 'devuser';              -- <- replace
  v_full_name text := 'Developer Name';      -- <- replace
  v_role text := 'district_commander';       -- <- replace to a valid role
  v_badge text := 'DEV001';                  -- optional
  v_phone text := NULL;                      -- optional
  v_avatar_url text := NULL;                 -- optional
  v_plain_password text := 'ChangeMe123!';   -- <- replace; will be hashed
  v_password_hash text;
BEGIN
  v_password_hash := crypt(v_plain_password, gen_salt('bf', 10));

  -- Upsert into auth.users (email provider)
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    UPDATE auth.users
       SET encrypted_password = v_password_hash,
           email_confirmed_at = now(),
           updated_at = now(),
           raw_app_meta_data = COALESCE(raw_app_meta_data, '{"provider":"email","providers":["email"]}'::jsonb)
     WHERE email = v_email
     RETURNING id INTO v_user_id;
  ELSE
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_email,
      v_password_hash,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}'::jsonb,
      false,
      now(),
      now()
    );
  END IF;

  -- Ensure matching identity exists for email provider
  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user_id AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (id, user_id, provider, identity_data, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_user_id,
      'email',
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      now(),
      now()
    );
  END IF;

  -- Upsert into public.profiles with FK to auth.users(id)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    UPDATE public.profiles
       SET email = v_email,
           username = v_username,
           encrypted_password = v_password_hash,
           full_name = v_full_name,
           badge_number = v_badge,
           role = v_role,
           phone = v_phone,
           avatar_url = v_avatar_url,
           updated_at = now()
     WHERE id = v_user_id;
  ELSE
    INSERT INTO public.profiles (
      id, email, username, encrypted_password,
      full_name, badge_number, role, phone, avatar_url,
      created_at, updated_at
    ) VALUES (
      v_user_id,
      v_email,
      v_username,
      v_password_hash,
      v_full_name,
      v_badge,
      v_role,
      v_phone,
      v_avatar_url,
      now(),
      now()
    );
  END IF;
END $$;

