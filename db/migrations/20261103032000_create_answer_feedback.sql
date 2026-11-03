create table if not exists answer_feedback (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  rating text not null check (rating in ('up','down')),
  note text,
  user_id uuid,
  created_at timestamptz not null default now()
);