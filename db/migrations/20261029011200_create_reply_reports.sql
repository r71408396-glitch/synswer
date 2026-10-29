create table reply_reports (
  id uuid primary key default gen_random_uuid(),
  reply_id uuid not null references post_replies(id) on delete cascade,
  reporter_id uuid not null,
  reason text not null check (char_length(reason) <= 120),
  status text not null default 'open' check (status in ('open','dismissed','actioned')),
  created_at timestamptz not null default now(),
  unique (reply_id, reporter_id)
);