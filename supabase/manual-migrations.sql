-- Campus writing platform: combined migrations
-- Run once in the Supabase SQL Editor (fresh project).

-- Core schema for the campus writing platform.

create type public.user_role as enum ('reader', 'author', 'admin');
create type public.user_status as enum ('active', 'banned');
create type public.post_status as enum (
  'draft',
  'pending',
  'published',
  'rejected',
  'removed'
);
create type public.moderation_target as enum ('post', 'user');
create type public.moderation_action as enum (
  'approve',
  'reject',
  'remove',
  'ban',
  'unban'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null default '新作者',
  bio text not null default '',
  avatar_url text,
  role public.user_role not null default 'author',
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username ~ '^[a-zA-Z0-9_-]{3,30}$'
  ),
  constraint profiles_display_name_not_blank check (
    length(trim(display_name)) > 0
  )
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  slug text not null unique,
  summary text not null default '',
  content_md text not null default '',
  cover_url text,
  status public.post_status not null default 'draft',
  published_at timestamptz,
  submitted_at timestamptz,
  moderation_reason text,
  moderated_by uuid references public.profiles (id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_title_length check (char_length(title) between 1 and 200),
  constraint posts_summary_length check (char_length(summary) <= 500),
  constraint posts_content_length check (char_length(content_md) <= 100000),
  constraint posts_published_at_required check (
    status <> 'published' or published_at is not null
  )
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  constraint tags_name_not_blank check (length(trim(name)) > 0)
);

create table public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id) on delete restrict,
  target_type public.moderation_target not null,
  target_id uuid not null,
  action public.moderation_action not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  constraint moderation_reason_required check (
    action in ('approve', 'unban') or char_length(trim(reason)) > 0
  )
);

-- Keep updated_at fresh on every update.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

-- Every auth user gets a profile with a unique generated username.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
begin
  base := regexp_replace(
    split_part(coalesce(new.email, ''), '@', 1),
    '[^a-zA-Z0-9_-]',
    '',
    'g'
  );

  if length(base) < 3 then
    base := 'author';
  end if;

  base := left(base, 20);
  candidate := base || '_' || substr(replace(new.id::text, '-', ''), 1, 6);

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    candidate,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      '新作者'
    )
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
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
-- Authorization helpers, row level security and storage policies.

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

create function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'active'
  );
$$;

create function public.is_active_author(author_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = author_id
      and status = 'active'
  );
$$;

create function public.can_read_post(post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.posts p
    join public.profiles pr on pr.id = p.author_id
    where p.id = post_id
      and (
        (p.status = 'published' and pr.status = 'active')
        or p.author_id = auth.uid()
        or public.is_admin()
      )
  );
$$;

create function public.can_edit_post(post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = post_id
      and (p.author_id = auth.uid() or public.is_admin())
  );
$$;

-- Only admins (or the service role) may change role and status.
create function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' and not public.is_admin() then
    if new.role is distinct from old.role
      or new.status is distinct from old.status then
      raise exception 'Only admins can change role or status';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_protect_fields
before update on public.profiles
for each row execute function public.protect_profile_fields();

-- Authors may not change moderation fields on their posts.
create function public.protect_post_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' and not public.is_admin() then
    if new.author_id is distinct from old.author_id
      or new.published_at is distinct from old.published_at
      or new.moderated_by is distinct from old.moderated_by
      or new.moderated_at is distinct from old.moderated_at
      or new.moderation_reason is distinct from old.moderation_reason then
      raise exception 'Only admins can change moderation fields';
    end if;
  end if;

  return new;
end;
$$;

create trigger posts_protect_fields
before update on public.posts
for each row execute function public.protect_post_fields();

-- Enforce the content state machine at the database layer.
create function public.enforce_post_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  actor_is_admin boolean := public.is_admin();
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if auth.role() = 'service_role' then
    if new.status = 'published' then
      new.published_at := coalesce(new.published_at, now());
    end if;
    if new.status in ('published', 'rejected', 'removed') then
      new.moderated_at := coalesce(new.moderated_at, now());
    end if;
    return new;
  end if;

  if old.status = 'draft' and new.status = 'pending' then
    if actor is distinct from old.author_id then
      raise exception 'Only the author can submit this post';
    end if;
    new.submitted_at := now();
    return new;
  end if;

  if old.status = 'pending' and new.status in ('published', 'rejected') then
    if not actor_is_admin then
      raise exception 'Only admins can review posts';
    end if;
    if new.status = 'rejected'
      and length(trim(coalesce(new.moderation_reason, ''))) = 0 then
      raise exception 'A rejection reason is required';
    end if;
    new.moderated_by := actor;
    new.moderated_at := now();
    if new.status = 'published' then
      new.published_at := coalesce(new.published_at, now());
    end if;
    return new;
  end if;

  if old.status = 'published' and new.status = 'removed' then
    if not actor_is_admin then
      raise exception 'Only admins can remove posts';
    end if;
    if length(trim(coalesce(new.moderation_reason, ''))) = 0 then
      raise exception 'A removal reason is required';
    end if;
    new.moderated_by := actor;
    new.moderated_at := now();
    return new;
  end if;

  if old.status in ('rejected', 'removed') and new.status = 'pending' then
    if actor is distinct from old.author_id then
      raise exception 'Only the author can resubmit this post';
    end if;
    new.submitted_at := now();
    return new;
  end if;

  raise exception 'Illegal post status transition: % -> %',
    old.status,
    new.status;
end;
$$;

create trigger posts_enforce_transition
before update of status on public.posts
for each row execute function public.enforce_post_transition();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.tags enable row level security;
alter table public.post_tags enable row level security;
alter table public.moderation_actions enable row level security;

-- Profiles: public read for active accounts, self edit, admin edit.
create policy "active profiles are publicly readable"
on public.profiles for select
using (
  status = 'active'
  or auth.uid() = id
  or public.is_admin()
);

create policy "users can update their own profile"
on public.profiles for update
using (auth.uid() = id and public.is_active_user())
with check (auth.uid() = id);

create policy "admins can update any profile"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

-- Posts: published and active authors for everyone; own posts for authors.
create policy "published posts are publicly readable"
on public.posts for select
using (status = 'published' and public.is_active_author(author_id));

create policy "authors can read their own posts"
on public.posts for select
using (auth.uid() = author_id);

create policy "admins can read all posts"
on public.posts for select
using (public.is_admin());

create policy "authors can create drafts"
on public.posts for insert
with check (
  auth.uid() = author_id
  and public.is_active_user()
  and status = 'draft'
);

create policy "authors and admins can update posts"
on public.posts for update
using (
  (auth.uid() = author_id and public.is_active_user())
  or public.is_admin()
)
with check (auth.uid() = author_id or public.is_admin());

create policy "authors can delete their own posts"
on public.posts for delete
using (
  auth.uid() = author_id
  and public.is_active_user()
  and status <> 'pending'
);

create policy "admins can delete any post"
on public.posts for delete
using (public.is_admin());

-- Tags.
create policy "tags are publicly readable"
on public.tags for select
using (true);

create policy "active users can create tags"
on public.tags for insert
with check (public.is_active_user());

create policy "admins can update tags"
on public.tags for update
using (public.is_admin())
with check (public.is_admin());

create policy "admins can delete tags"
on public.tags for delete
using (public.is_admin());

-- Post tags.
create policy "post tags are readable with their post"
on public.post_tags for select
using (public.can_read_post(post_id));

create policy "post authors can tag their posts"
on public.post_tags for insert
with check (public.can_edit_post(post_id));

create policy "post authors can remove tags"
on public.post_tags for delete
using (public.can_edit_post(post_id));

-- Moderation audit log is admin-only.
create policy "admins can read moderation actions"
on public.moderation_actions for select
using (public.is_admin());

create policy "admins can record moderation actions"
on public.moderation_actions for insert
with check (public.is_admin());

-- Storage buckets for avatars and cover images.
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('covers', 'covers', true)
on conflict (id) do nothing;

create policy "avatar images are publicly readable"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "cover images are publicly readable"
on storage.objects for select
using (bucket_id = 'covers');

create policy "users can upload their own images"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('avatars', 'covers')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users can update their own images"
on storage.objects for update
to authenticated
using (
  bucket_id in ('avatars', 'covers')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id in ('avatars', 'covers')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users can delete their own images"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('avatars', 'covers')
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Explicit table privileges for the API roles.
grant usage on schema public to anon, authenticated;

grant select
on public.profiles, public.posts, public.tags, public.post_tags
to anon, authenticated;

grant select, insert, update, delete
on public.profiles, public.posts, public.tags, public.post_tags,
  public.moderation_actions
to authenticated;

grant all
on public.profiles, public.posts, public.tags, public.post_tags,
  public.moderation_actions
to service_role;
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
