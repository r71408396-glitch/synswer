alter table messages add column if not exists media_type text;
alter table posts add column if not exists media_type text;
alter table scores add column if not exists user_id uuid;
create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null,
  blocked_id uuid not null,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);
create table if not exists mutes (
  id uuid primary key default gen_random_uuid(),
  muter_id uuid not null,
  muted_id uuid not null,
  created_at timestamptz not null default now(),
  unique (muter_id, muted_id)
);