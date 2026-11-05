create table topic_spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  title text not null,
  description text not null default '',
  icon text not null default 'T',
  created_at timestamptz not null default now()
);

create table threads (
  id uuid primary key default gen_random_uuid(),
  topic_space_id uuid not null references topic_spaces(id) on delete cascade,
  author_id uuid,
  is_anonymous boolean not null default false,
  title text not null check (char_length(title) between 5 and 200),
  content text not null check (char_length(content) between 1 and 10000),
  media_attachments text[] not null default '{}',
  ai_summary text check (ai_summary is null or char_length(ai_summary) <= 3000),
  upvote_count int not null default 0,
  downvote_count int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now(),
  check (is_anonymous = (author_id is null))
);
create index threads_space_idx on threads(topic_space_id, created_at desc);

create table thread_comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references threads(id) on delete cascade,
  parent_id uuid references thread_comments(id) on delete cascade,
  author_id uuid,
  is_anonymous boolean not null default false,
  content text not null check (char_length(content) between 1 and 5000),
  upvote_count int not null default 0,
  downvote_count int not null default 0,
  is_synswer_verified boolean not null default false,
  created_at timestamptz not null default now(),
  check (is_anonymous = (author_id is null))
);
create index thread_comments_thread_idx on thread_comments(thread_id, created_at);

create table community_profiles (
  user_id uuid primary key,
  reputation_score int not null default 0,
  bookmarks uuid[] not null default '{}'
);

create table thread_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  target_type text not null check (target_type in ('thread','comment')),
  target_id uuid not null,
  value smallint not null check (value in (1,-1)),
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create table reputation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  delta int not null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index reputation_events_idx on reputation_events(created_at, user_id);

-- private link from an anonymous post to its real author: only that author can read it
create table anon_authors (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('thread','comment')),
  target_id uuid not null,
  user_id uuid not null,
  unique (target_type, target_id)
);

-- reputation utility: one place that changes a score and logs the change
create or replace function add_reputation(uid uuid, d int, why text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if uid is null or d = 0 then return; end if;
  insert into community_profiles(user_id, reputation_score) values (uid, d)
    on conflict (user_id) do update set reputation_score = community_profiles.reputation_score + d;
  insert into reputation_events(user_id, delta, reason) values (uid, d, why);
end $$;

create or replace function comment_real_author(cid uuid) returns uuid
language sql security definer set search_path = public as $$
  select coalesce(c.author_id, (select a.user_id from anon_authors a where a.target_type='comment' and a.target_id=c.id))
  from thread_comments c where c.id = cid
$$;

-- votes: recount the target and apply +10 / -2 reputation to the answer's author
create or replace function thread_votes_apply() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  tt text; tid uuid; voter uuid; oldv int := 0; newv int := 0; auth uuid; delta int;
begin
  if tg_op = 'DELETE' then tt := old.target_type; tid := old.target_id; voter := old.user_id; oldv := old.value;
  elsif tg_op = 'INSERT' then tt := new.target_type; tid := new.target_id; voter := new.user_id; newv := new.value;
  else tt := new.target_type; tid := new.target_id; voter := new.user_id; oldv := old.value; newv := new.value; end if;

  if tt = 'thread' then
    update threads set
      upvote_count = (select count(*) from thread_votes where target_type='thread' and target_id=tid and value=1),
      downvote_count = (select count(*) from thread_votes where target_type='thread' and target_id=tid and value=-1)
    where id = tid;
  else
    update thread_comments set
      upvote_count = (select count(*) from thread_votes where target_type='comment' and target_id=tid and value=1),
      downvote_count = (select count(*) from thread_votes where target_type='comment' and target_id=tid and value=-1)
    where id = tid;
    auth := comment_real_author(tid);
    if auth is not null and auth <> voter then
      delta := (case newv when 1 then 10 when -1 then -2 else 0 end) - (case oldv when 1 then 10 when -1 then -2 else 0 end);
      perform add_reputation(auth, delta, 'vote');
    end if;
  end if;
  return null;
end $$;
create trigger thread_votes_after after insert or update or delete on thread_votes
  for each row execute function thread_votes_apply();

-- Synswer Verified: +50 when toggled on, -50 when toggled off
create or replace function comment_verified_apply() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.is_synswer_verified is distinct from old.is_synswer_verified then
    perform add_reputation(comment_real_author(new.id), case when new.is_synswer_verified then 50 else -50 end, 'verified');
  end if;
  return null;
end $$;
create trigger thread_comments_verified after update on thread_comments
  for each row execute function comment_verified_apply();

create or replace function thread_comment_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then update threads set comment_count = comment_count + 1 where id = new.thread_id;
  else update threads set comment_count = greatest(0, comment_count - 1) where id = old.thread_id; end if;
  return null;
end $$;
create trigger thread_comments_count after insert or delete on thread_comments
  for each row execute function thread_comment_count();