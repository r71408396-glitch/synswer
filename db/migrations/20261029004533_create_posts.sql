create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  content text not null check (char_length(content) between 1 and 280),
  created_at timestamptz not null default now()
);
create index posts_created_at_idx on posts (created_at desc);