insert into public.posts (title, slug, content_json, content_html, excerpt, status, published_at, tags, reading_time_minutes)
values (
  'Chào mừng đến với cupofngos',
  'chao-mung-den-voi-cupofngos',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Đây là bài viết đầu tiên trên blog của mình. Một tách cà phê, một dòng code, một suy nghĩ — mình sẽ ghi lại ở đây."}]}]}'::jsonb,
  '<p>Đây là bài viết đầu tiên trên blog của mình. Một tách cà phê, một dòng code, một suy nghĩ — mình sẽ ghi lại ở đây.</p>',
  'Đây là bài viết đầu tiên trên blog của mình.',
  'published',
  now(),
  '{welcome}'::text[],
  1
)
on conflict (slug) do nothing;
