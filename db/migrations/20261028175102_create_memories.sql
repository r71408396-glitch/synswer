create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists memories_user_idx on memories (user_id, created_at desc);