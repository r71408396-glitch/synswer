alter table posts add column status text not null default 'pending' check (status in ('pending','approved','rejected','restricted'));
alter table posts add column reviewed_at timestamptz;
create index posts_status_created_idx on posts (status, created_at desc);
create table member_standing (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  status text not null default 'active' check (status in ('active','banned')),
  reason text,
  created_at timestamptz not null default now()
);