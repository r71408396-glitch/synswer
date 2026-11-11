alter table notifications add column if not exists kind text;
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check check (type = any (array['like','comment','reply','follow','mention','repost','message','react']));
alter table notifications add column if not exists message_id uuid;