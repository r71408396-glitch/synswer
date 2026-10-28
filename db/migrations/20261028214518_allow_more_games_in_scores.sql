alter table scores drop constraint if exists scores_game_check;
alter table scores add constraint scores_game_check check (game ~ '^[a-z0-9_]{2,30}$');