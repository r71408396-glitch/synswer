create table if not exists tool_runs (
  id uuid primary key default gen_random_uuid(),
  tool text not null,
  status text not null default 'ok' check (status in ('ok','error')),
  signed_in boolean not null default false,
  error text,
  duration_ms integer,
  created_at timestamptz not null default now()
);
create index if not exists tool_runs_tool_idx on tool_runs (tool, created_at desc);
create table if not exists tool_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  tool text not null,
  title text not null,
  content text not null check (length(content) <= 20000),
  created_at timestamptz not null default now()
);