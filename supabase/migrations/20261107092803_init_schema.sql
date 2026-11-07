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
