create table communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,39}$'),
  name text not null check (char_length(name) between 3 and 50),
  description text not null default '' check (char_length(description) <= 300),
  rules text not null default '' check (char_length(rules) <= 1500),
  created_by uuid not null,
  member_count integer not null default 0,
  created_at timestamptz not null default now()
);
create table community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member' check (role in ('member','moderator','owner')),
  created_at timestamptz not null default now(),
  unique (community_id, user_id)
);
create table community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities(id) on delete cascade,
  user_id uuid not null,
  content text not null check (char_length(content) between 1 and 2000),
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index community_posts_feed on community_posts (community_id, created_at desc);
create index community_members_user on community_members (user_id);

create function communities_add_owner() returns trigger language plpgsql as $$
begin
  insert into community_members (community_id, user_id, role) values (new.id, new.created_by, 'owner');
  return new;
end $$;
create trigger communities_owner after insert on communities for each row execute function communities_add_owner();

create function community_member_count() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update communities set member_count = member_count + 1 where id = new.community_id;
    return new;
  else
    update communities set member_count = greatest(member_count - 1, 0) where id = old.community_id;
    return old;
  end if;
end $$;
create trigger community_members_count after insert or delete on community_members for each row execute function community_member_count();