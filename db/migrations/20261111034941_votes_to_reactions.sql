insert into post_reactions (post_id, user_id, kind)
select v.post_id, v.user_id, 'like' from post_votes v
where v.value = 1 and not exists (select 1 from post_reactions r where r.post_id = v.post_id and r.user_id = v.user_id);