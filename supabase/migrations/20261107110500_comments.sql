-- Built-in comments for published articles.

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  constraint comments_content_length check (
    char_length(trim(content)) between 1 and 1000
  )
);

create index comments_post_created_idx
on public.comments (post_id, created_at asc);

create index comments_author_idx on public.comments (author_id);

alter table public.comments enable row level security;

create policy "comments are readable with their post"
on public.comments for select
using (public.can_read_post(post_id));

create policy "active users can comment on published posts"
on public.comments for insert
to authenticated
with check (
  auth.uid() = author_id
  and public.is_active_user()
  and exists (
    select 1
    from public.posts p
    where p.id = post_id
      and p.status = 'published'
      and public.is_active_author(p.author_id)
  )
);

create policy "authors and admins can delete comments"
on public.comments for delete
using (auth.uid() = author_id or public.is_admin());

grant select on public.comments to anon, authenticated;
grant insert, delete on public.comments to authenticated;
grant all on public.comments to service_role;
