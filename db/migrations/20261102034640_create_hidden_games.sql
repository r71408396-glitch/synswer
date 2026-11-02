create table hidden_games (
  id uuid primary key default gen_random_uuid(),
  game text not null unique,
  created_at timestamptz not null default now()
);