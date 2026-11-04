alter table follows add column hidden boolean not null default false;

create or replace function follows_set_hidden() returns trigger language plpgsql as $$
begin
  new.hidden := coalesce((select follows_private from profiles where user_id = new.follower_id), false)
             or coalesce((select follows_private from profiles where user_id = new.followee_id), false);
  return new;
end $$;
create trigger follows_hidden_ins before insert on follows for each row execute function follows_set_hidden();

create or replace function profiles_sync_follows_hidden() returns trigger language plpgsql as $$
begin
  if new.follows_private is distinct from old.follows_private then
    update follows f set hidden = coalesce((select follows_private from profiles p where p.user_id = f.follower_id), false)
                              or coalesce((select follows_private from profiles p where p.user_id = f.followee_id), false)
      where f.follower_id = new.user_id or f.followee_id = new.user_id;
  end if;
  return new;
end $$;
create trigger profiles_follows_hidden_upd after update on profiles for each row execute function profiles_sync_follows_hidden();