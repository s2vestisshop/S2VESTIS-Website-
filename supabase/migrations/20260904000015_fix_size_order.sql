-- 0015 — product_json ordered variant sizes alphabetically (L, M, S, XL, XS,
-- XXL) instead of apparel order (XS, S, M, L, XL, XXL). Order by a canonical
-- rank instead of the raw text column.

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
          select jsonb_agg(jsonb_build_object('size', vs.size, 'stock', vs.stock) order by
            case vs.size
              when 'XS' then 1 when 'S' then 2 when 'M' then 3
              when 'L' then 4 when 'XL' then 5 when 'XXL' then 6
              else 7
            end, vs.size)
          from public.variant_sizes vs where vs.variant_id = v.id
        ), '[]'::jsonb)
      ) order by v.position)
      from public.product_variants v where v.product_id = p.id
    ), '[]'::jsonb)
  );
$$;
