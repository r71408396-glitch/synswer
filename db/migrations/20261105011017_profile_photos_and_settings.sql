create table profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  avatar_url text,
  cover_url text,
  visibility text not null default 'everyone' check (visibility in ('everyone','followers')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into profile_photos (user_id, avatar_url, cover_url)
  select user_id, avatar_url, cover_url from profiles where avatar_url is not null or cover_url is not null;
update profiles set avatar_url = null, cover_url = null;
alter table profiles drop constraint if exists profiles_dm_policy_check;
alter table profiles add constraint profiles_dm_policy_check check (dm_policy in ('everyone','followers','none'));
alter table profiles add column hide_from_suggestions boolean not null default false;
alter table profiles add column notify_likes boolean not null default true;
alter table profiles add column notify_comments boolean not null default true;
alter table profiles add column notify_follows boolean not null default true;
alter table profiles add column notify_mentions boolean not null default true;