-- Messages and message recipients schema for email notifications
-- Run this in Supabase SQL editor

create extension if not exists "uuid-ossp";

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  subject text not null,
  body text not null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.message_recipients (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.messages(id) on delete cascade,
  personnel_id uuid not null references public.personnel(id) on delete cascade,
  email text not null,
  status text not null default 'pending', -- pending | sent | failed
  error text,
  created_at timestamptz not null default now()
);

-- Helper index
create index if not exists idx_message_recipients_message on public.message_recipients(message_id);

