-- Search and listing indexes.

create extension if not exists pg_trgm with schema extensions;

create unique index profiles_username_lower_idx
on public.profiles (lower(username));

create index profiles_status_idx on public.profiles (status);

create index posts_status_published_at_idx
on public.posts (status, published_at desc);

create index posts_author_id_idx on public.posts (author_id);

create index posts_created_at_idx on public.posts (created_at desc);

create index posts_title_trgm_idx
on public.posts using gin (title extensions.gin_trgm_ops);

create index posts_summary_trgm_idx
on public.posts using gin (summary extensions.gin_trgm_ops);

create index posts_content_trgm_idx
on public.posts using gin (content_md extensions.gin_trgm_ops);

create unique index tags_name_lower_idx on public.tags (lower(name));

create index post_tags_tag_id_idx on public.post_tags (tag_id);

create index moderation_actions_target_idx
on public.moderation_actions (target_type, target_id, created_at desc);

create index moderation_actions_actor_idx
on public.moderation_actions (actor_id, created_at desc);
