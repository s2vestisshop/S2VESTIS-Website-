-- 0011 — product read RPCs: shape a product (+ variants/images/sizes/category)
-- into exactly the JSON the frontend already expects, and centralise the
-- gallery filter logic (which needs "product has at least one matching
-- variant" semantics that plain PostgREST embedding can't express cleanly).

create or replace function public.product_json(p public.products)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    '_id', p.id,
    'name', p.name,
    'slug', p.slug,
    'description', p.description,
    'price', p.price,
    'discountPrice', p.discount_price,
    'discountPercent', p.discount_percent,
    'effectivePrice', p.effective_price,
    'gender', p.gender,
    'isFeatured', p.is_featured,
    'isActive', p.is_active,
    'rating', jsonb_build_object('avg', p.rating_avg, 'count', p.rating_count),
    'createdAt', p.created_at,
    'updatedAt', p.updated_at,
    'category', (
      select jsonb_build_object('_id', c.id, 'name', c.name, 'slug', c.slug, 'gender', c.gender)
      from public.categories c where c.id = p.category_id
    ),
    'variants', coalesce((
      select jsonb_agg(jsonb_build_object(
        '_id', v.id,
        'color', v.color,
        'colorHex', v.color_hex,
        'images', coalesce((
          select jsonb_agg(vi.url order by vi.position)
          from public.variant_images vi where vi.variant_id = v.id
        ), '[]'::jsonb),
        'sizes', coalesce((
          select jsonb_agg(jsonb_build_object('size', vs.size, 'stock', vs.stock) order by vs.size)
          from public.variant_sizes vs where vs.variant_id = v.id
        ), '[]'::jsonb)
      ) order by v.position)
      from public.product_variants v where v.product_id = p.id
    ), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- Shared filter: matching product ids for the gallery / admin table.
-- ---------------------------------------------------------------------------
create or replace function public._product_filter_ids(
  p_category_slug text,
  p_gender        gender_target,
  p_search        text,
  p_min_price     numeric,
  p_max_price     numeric,
  p_sizes         text[],
  p_colors        text[],
  p_ids           uuid[],
  p_featured      boolean,
  p_include_inactive boolean default false
)
returns table (id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.products p
  where (p_include_inactive or p.is_active)
    and (p_gender is null or p.gender = p_gender)
    and (p_featured is null or p.is_featured = p_featured)
    and (p_min_price is null or p.effective_price >= p_min_price)
    and (p_max_price is null or p.effective_price <= p_max_price)
    and (p_ids is null or p.id = any(p_ids))
    and (
      p_category_slug is null
      or p.category_id = (select c.id from public.categories c where c.slug = p_category_slug)
    )
    and (
      p_search is null or p_search = '' or (
        p.search_tsv @@ websearch_to_tsquery('simple', p_search)
        or p.name ilike '%' || p_search || '%'
      )
    )
    and (
      p_colors is null or exists (
        select 1 from public.product_variants v
        where v.product_id = p.id and v.color = any(p_colors)
      )
    )
    and (
      p_sizes is null or exists (
        select 1
        from public.product_variants v
        join public.variant_sizes vs on vs.variant_id = v.id
        where v.product_id = p.id and vs.size = any(p_sizes)
      )
    );
$$;

-- ---------------------------------------------------------------------------
-- Public gallery: one page of fully-shaped products + a matching count.
-- ---------------------------------------------------------------------------
create or replace function public.list_products(
  p_category_slug text default null,
  p_gender        gender_target default null,
  p_search        text default null,
  p_min_price     numeric default null,
  p_max_price     numeric default null,
  p_sizes         text[] default null,
  p_colors        text[] default null,
  p_ids           uuid[] default null,
  p_featured      boolean default null,
  p_sort          text default 'newest',
  p_page          integer default 1,
  p_limit         integer default 12
)
returns table (item jsonb, total bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 12), 60));
  v_page  integer := greatest(1, coalesce(p_page, 1));
  v_offset integer := (v_page - 1) * v_limit;
  v_total bigint;
begin
  select count(*) into v_total
  from public._product_filter_ids(
    p_category_slug, p_gender, p_search, p_min_price, p_max_price,
    p_sizes, p_colors, p_ids, p_featured, false
  );

  return query
  select public.product_json(p), v_total
  from public.products p
  join public._product_filter_ids(
    p_category_slug, p_gender, p_search, p_min_price, p_max_price,
    p_sizes, p_colors, p_ids, p_featured, false
  ) f on f.id = p.id
  order by
    case when p_sort = 'price-asc'  then p.effective_price end asc,
    case when p_sort = 'price-desc' then p.effective_price end desc,
    case when p_sort = 'popularity' then p.rating_avg end desc,
    case when p_sort = 'popularity' then p.rating_count end desc,
    p.created_at desc
  limit v_limit offset v_offset;
end;
$$;

-- ---------------------------------------------------------------------------
-- Single product by slug (public: only active).
-- ---------------------------------------------------------------------------
create or replace function public.get_product_detail(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public.product_json(p) from public.products p
  where p.slug = p_slug and p.is_active;
$$;

-- ---------------------------------------------------------------------------
-- Related products: same category, excludes itself, up to 8, best-rated first.
-- ---------------------------------------------------------------------------
create or replace function public.related_products(p_slug text, p_limit integer default 8)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(public.product_json(p) order by p.rating_avg desc, p.created_at desc), '[]'::jsonb)
  from public.products p
  where p.is_active
    and p.category_id = (select p2.category_id from public.products p2 where p2.slug = p_slug)
    and p.slug <> p_slug
  limit greatest(1, least(coalesce(p_limit, 8), 24));
$$;

-- ---------------------------------------------------------------------------
-- Admin: includes inactive products, search/category/status filters.
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_products(
  p_search   text default null,
  p_category_id uuid default null,
  p_status   text default null,   -- 'active' | 'inactive' | null (all)
  p_page     integer default 1,
  p_limit    integer default 20
)
returns table (item jsonb, total bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 20), 100));
  v_page  integer := greatest(1, coalesce(p_page, 1));
  v_offset integer := (v_page - 1) * v_limit;
  v_total bigint;
begin
  select count(*) into v_total
  from public.products p
  where (p_search is null or p_search = '' or p.name ilike '%' || p_search || '%')
    and (p_category_id is null or p.category_id = p_category_id)
    and (p_status is null or (p_status = 'active' and p.is_active) or (p_status = 'inactive' and not p.is_active));

  return query
  select
    public.product_json(p) || jsonb_build_object(
      'totalStock', coalesce((
        select sum(vs.stock) from public.product_variants v
        join public.variant_sizes vs on vs.variant_id = v.id
        where v.product_id = p.id
      ), 0)
    ),
    v_total
  from public.products p
  where (p_search is null or p_search = '' or p.name ilike '%' || p_search || '%')
    and (p_category_id is null or p.category_id = p_category_id)
    and (p_status is null or (p_status = 'active' and p.is_active) or (p_status = 'inactive' and not p.is_active))
  order by p.created_at desc
  limit v_limit offset v_offset;
end;
$$;

-- All of these are internal query helpers for the Express API only.
-- `_product_filter_ids` in particular accepts p_include_inactive, which must
-- never be reachable by anon/authenticated.
revoke execute on function
  public.product_json(public.products),
  public._product_filter_ids(text, gender_target, text, numeric, numeric, text[], text[], uuid[], boolean, boolean),
  public.list_products(text, gender_target, text, numeric, numeric, text[], text[], uuid[], boolean, text, integer, integer),
  public.get_product_detail(text),
  public.related_products(text, integer),
  public.admin_list_products(text, uuid, text, integer, integer)
from public, anon, authenticated;

grant execute on function
  public.product_json(public.products),
  public._product_filter_ids(text, gender_target, text, numeric, numeric, text[], text[], uuid[], boolean, boolean),
  public.list_products(text, gender_target, text, numeric, numeric, text[], text[], uuid[], boolean, text, integer, integer),
  public.get_product_detail(text),
  public.related_products(text, integer),
  public.admin_list_products(text, uuid, text, integer, integer)
to service_role;
