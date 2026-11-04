alter table profiles add column follows_private boolean not null default false;
alter table messages add column image_url text;
alter table messages drop constraint messages_content_check;
alter table messages add constraint messages_content_or_image check (image_url is not null or char_length(btrim(content)) between 1 and 1000);
alter table messages add constraint messages_content_len check (char_length(content) <= 1000);