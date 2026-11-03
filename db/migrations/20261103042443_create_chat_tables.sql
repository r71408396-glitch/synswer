create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null default 'New chat',
  mode text not null default 'general',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index conversations_user_idx on conversations(user_id, updated_at desc);
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('user','assistant')),
  content text not null default '',
  image_url text,
  sources jsonb,
  feedback text,
  created_at timestamptz not null default now()
);
create index chat_messages_conv_idx on chat_messages(conversation_id, created_at);