create table if not exists video_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create index if not exists video_views_post_idx on video_views(post_id);