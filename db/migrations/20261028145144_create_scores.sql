create table scores (
  id uuid primary key default gen_random_uuid(),
  game text not null check (game in ('snake','tetris','shooter')),
  player text not null check (char_length(player) between 1 and 20),
  score integer not null check (score between 0 and 10000000),
  created_at timestamptz not null default now()
);
create index scores_game_score_idx on scores (game, score desc);