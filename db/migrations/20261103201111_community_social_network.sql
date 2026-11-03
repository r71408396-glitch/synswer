
alter table posts drop constraint posts_content_check;
alter table posts drop constraint posts_content_len;
alter table posts add constraint posts_content_len500 check (char_length(btrim(content)) <= 500);
alter table posts add column image_url text;
alter table posts add column category text not null default 'general' check (category in ('general','question','ai_tech','education'));
alter table posts add column repost_of uuid references posts(id) on delete cascade;
alter table posts add column poll_options jsonb;
alter table posts add column edited_at timestamptz;
create index posts_created_idx on posts(created_at desc);
create index posts_repost_idx on posts(repost_of);

alter table post_replies drop constraint post_replies_content_check;
alter table post_replies add constraint post_replies_content_len check (char_length(btrim(content)) between 1 and 500);
alter table post_replies add column parent_id uuid references post_replies(id) on delete cascade;

alter table member_standing drop constraint member_standing_status_check;
alter table member_standing add constraint member_standing_status_check check (status in ('active','banned','suspended'));
alter table member_standing add column warnings int not null default 0;
alter table member_standing add column until timestamptz;

create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) <= 40),
  bio text check (char_length(bio) <= 200),
  avatar_url text,
  cover_url text,
  dm_policy text not null default 'everyone' check (dm_policy in ('everyone','none')),
  created_at timestamptz not null default now()
);
create unique index profiles_username_lower on profiles(lower(username));

create table post_tags (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  tag text not null check (tag ~ '^[a-z0-9_]{2,30}$'),
  created_at timestamptz not null default now(),
  unique (post_id, tag)
);
create index post_tags_tag_idx on post_tags(tag, created_at desc);

create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  post_id uuid not null references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create table follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null,
  followee_id uuid not null,
  created_at timestamptz not null default now(),
  unique (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on follows(followee_id);

create table poll_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null,
  option_index int not null check (option_index between 0 and 5),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  actor_id uuid not null,
  type text not null check (type in ('like','comment','reply','follow','mention','repost','message')),
  post_id uuid references posts(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications(user_id, created_at desc);

create table messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null,
  recipient_id uuid not null,
  content text not null check (char_length(btrim(content)) between 1 and 1000),
  read boolean not null default false,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index messages_recipient_idx on messages(recipient_id, created_at desc);
create index messages_sender_idx on messages(sender_id, created_at desc);

create table appeals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  message text not null check (char_length(btrim(message)) between 5 and 1000),
  status text not null default 'open' check (status in ('open','accepted','declined')),
  created_at timestamptz not null default now()
);
