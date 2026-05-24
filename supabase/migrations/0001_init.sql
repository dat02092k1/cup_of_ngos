create extension if not exists "pgcrypto";

create table public.posts (
  id                    uuid        primary key default gen_random_uuid(),
  title                 text        not null,
  slug                  text        not null unique,
  content_json          jsonb       not null,
  content_html          text        not null default '',
  excerpt               text        not null default '',
  cover_image_url       text,
  status                text        not null default 'draft' check (status in ('draft', 'published')),
  published_at          timestamptz,
  tags                  text[]      not null default '{}'::text[],
  reading_time_minutes  integer     not null default 1,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index posts_status_published_at_idx on public.posts (status, published_at desc);

create index posts_tags_idx on public.posts using gin (tags);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_set_updated_at
  before update on public.posts
  for each row
  execute function public.set_updated_at();

alter table public.posts enable row level security;

drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts
  for select
  to anon, authenticated
  using (status = 'published');

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict do nothing;

drop policy if exists "blog_images_public_read" on storage.objects;
create policy "blog_images_public_read" on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'blog-images');
