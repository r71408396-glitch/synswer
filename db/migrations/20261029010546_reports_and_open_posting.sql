alter table posts alter column status set default 'approved';
update posts set status = 'approved' where status in ('pending','rejected');
create table reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  reporter_id uuid not null,
  reason text not null default 'Other' check (char_length(reason) <= 120),
  status text not null default 'open',
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);