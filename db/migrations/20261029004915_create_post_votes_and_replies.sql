create table post_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null,
  value smallint not null check (value in (1, -1)),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create index post_votes_post_idx on post_votes(post_id);
create table post_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null,
  content text not null check (char_length(content) between 1 and 280),
  created_at timestamptz not null default now()
);
create index post_replies_post_idx on post_replies(post_id, created_at);