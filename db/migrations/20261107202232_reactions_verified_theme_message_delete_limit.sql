alter table profiles add column if not exists verified boolean not null default false;
alter table profiles add column if not exists theme_accent text;
alter table profiles add column if not exists theme_mode text;

create table if not exists post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null,
  kind text not null check (kind in ('like','love','laugh','wow','sad')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create table if not exists profile_reactions (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null,
  target text not null check (target in ('avatar','cover')),
  user_id uuid not null,
  kind text not null check (kind in ('like','love','laugh','wow','sad')),
  created_at timestamptz not null default now(),
  unique (target_user_id, target, user_id)
);
create table if not exists message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  user_id uuid not null,
  kind text not null check (kind in ('like','love','laugh','wow','sad')),
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);
create index if not exists post_reactions_post on post_reactions(post_id);
create index if not exists profile_reactions_target on profile_reactions(target_user_id, target);
create index if not exists message_reactions_msg on message_reactions(message_id);

create or replace function enforce_message_delete_window() returns trigger as $$
begin
  if old.created_at < now() - interval '10 minutes' then
    raise exception 'Messages can only be deleted within 10 minutes of sending';
  end if;
  return old;
end;
$$ language plpgsql;
drop trigger if exists messages_delete_window on messages;
create trigger messages_delete_window before delete on messages for each row execute function enforce_message_delete_window();