-- 0012 — remaining shaped-JSON RPCs: categories, cart, wishlist, admin stats,
-- and atomic admin product create/update (replaces the whole variant tree).

-- ---- categories ----------------------------------------------------
create or replace function public.list_categories(p_with_counts boolean default false)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    '_id', c.id, 'name', c.name, 'slug', c.slug, 'gender', c.gender,
    'image', c.image_url, 'isActive', c.is_active,
    'productCount', case when p_with_counts then (
      select count(*) from public.products p where p.category_id = c.id and p.is_active
    ) end
  ) order by c.name), '[]'::jsonb)
  from public.categories c
  where c.is_active;
$$;

create or replace function public.admin_list_categories()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    '_id', c.id, 'name', c.name, 'slug', c.slug, 'gender', c.gender,
    'image', c.image_url, 'isActive', c.is_active
  ) order by c.name), '[]'::jsonb)
  from public.categories c;
$$;

-- ---- cart ------------------------------------------------------
create or replace function public.get_cart_state(p_user_id uuid default null, p_guest_token text default null)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_cart_id uuid;
  v_items jsonb;
  v_subtotal numeric := 0;
  v_count integer := 0;
begin
  if p_user_id is not null then
    select id into v_cart_id from public.carts where user_id = p_user_id;
  elsif p_guest_token is not null then
    select id into v_cart_id from public.carts where guest_token = p_guest_token;
  end if;

  if v_cart_id is null then
    return jsonb_build_object('_id', null, 'items', '[]'::jsonb, 'subtotal', 0, 'count', 0);
  end if;

  select
    coalesce(jsonb_agg(jsonb_build_object(
      '_id', ci.id,
      'product', public.product_json(p),
      'color', pv.color,
      'size', vs.size,
      'quantity', ci.quantity,
      'priceAtAdd', ci.price_at_add,
      'lineTotal', ci.price_at_add * ci.quantity
    ) order by ci.created_at), '[]'::jsonb),
    coalesce(sum(ci.price_at_add * ci.quantity), 0),
    coalesce(sum(ci.quantity), 0)
  into v_items, v_subtotal, v_count
  from public.cart_items ci
  join public.variant_sizes vs on vs.id = ci.variant_size_id
  join public.product_variants pv on pv.id = vs.variant_id
  join public.products p on p.id = pv.product_id
  where ci.cart_id = v_cart_id;

  return jsonb_build_object('_id', v_cart_id, 'items', v_items, 'subtotal', v_subtotal, 'count', v_count);
end;
$$;

-- ---- wishlist ---------------------------------------------------
create or replace function public.get_wishlist_state(p_user_id uuid)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    '_id', p_user_id,
    'products', coalesce((
      select jsonb_agg(public.product_json(p) order by wi.created_at desc)
      from public.wishlist_items wi
      join public.products p on p.id = wi.product_id
      where wi.user_id = p_user_id and p.is_active
    ), '[]'::jsonb)
  );
$$;

-- ---- admin dashboard --------------------------------------------
create or replace function public.admin_stats()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_total_products int; v_active_products int; v_total_categories int;
  v_total_users int; v_demo_orders int; v_low_stock jsonb;
begin
  select count(*) into v_total_products from public.products;
  select count(*) into v_active_products from public.products where is_active;
  select count(*) into v_total_categories from public.categories;
  select count(*) into v_total_users from public.users;
  select count(*) into v_demo_orders from public.orders;

  select coalesce(jsonb_agg(jsonb_build_object(
      '_id', x.id, 'name', x.name, 'slug', x.slug, 'stock', x.stock
    ) order by x.stock asc), '[]'::jsonb)
  into v_low_stock
  from (
    select p.id, p.name, p.slug, sum(vs.stock) as stock
    from public.products p
    join public.product_variants v on v.product_id = p.id
    join public.variant_sizes vs on vs.variant_id = v.id
    group by p.id, p.name, p.slug
    having sum(vs.stock) <= 5
    order by sum(vs.stock) asc
    limit 20
  ) x;

  return jsonb_build_object(
    'totalProducts', v_total_products,
    'activeProducts', v_active_products,
    'inactiveProducts', v_total_products - v_active_products,
    'totalCategories', v_total_categories,
    'totalUsers', v_total_users,
    'demoOrders', v_demo_orders,
    'lowStockThreshold', 5,
    'lowStockCount', jsonb_array_length(v_low_stock),
    'lowStock', v_low_stock
  );
end;
$$;

-- ---- admin: atomic product create / update (replaces variant tree) ----
create or replace function public.admin_create_product(p_payload jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_slug text;
  v_variant jsonb;
  v_variant_id uuid;
  v_image text;
  v_size jsonb;
  v_pos int := 0;
  v_img_pos int;
begin
  v_slug := public.slugify((p_payload->>'name') || '-' || coalesce(p_payload->>'gender', 'unisex'));
  while exists (select 1 from public.products where slug = v_slug) loop
    v_slug := v_slug || '-' || substr(md5(random()::text), 1, 4);
  end loop;

  insert into public.products
    (name, slug, description, category_id, gender, price, discount_price, is_featured, is_active)
  values (
    p_payload->>'name', v_slug, coalesce(p_payload->>'description', ''),
    (p_payload->>'category')::uuid,
    coalesce(p_payload->>'gender', 'unisex')::gender_target,
    (p_payload->>'price')::numeric,
    nullif(p_payload->>'discountPrice', '')::numeric,
    coalesce((p_payload->>'isFeatured')::boolean, false),
    coalesce((p_payload->>'isActive')::boolean, true)
  )
  returning id into v_id;

  for v_variant in select * from jsonb_array_elements(coalesce(p_payload->'variants', '[]'::jsonb)) loop
    insert into public.product_variants (product_id, color, color_hex, position)
    values (v_id, v_variant->>'color', coalesce(v_variant->>'colorHex', '#000000'), v_pos)
    returning id into v_variant_id;

    v_img_pos := 0;
    for v_image in select * from jsonb_array_elements_text(coalesce(v_variant->'images', '[]'::jsonb)) loop
      insert into public.variant_images (variant_id, url, position) values (v_variant_id, v_image, v_img_pos);
      v_img_pos := v_img_pos + 1;
    end loop;

    for v_size in select * from jsonb_array_elements(coalesce(v_variant->'sizes', '[]'::jsonb)) loop
      insert into public.variant_sizes (variant_id, size, stock)
      values (v_variant_id, v_size->>'size', coalesce((v_size->>'stock')::int, 0));
    end loop;

    v_pos := v_pos + 1;
  end loop;

  return (select public.product_json(p) from public.products p where p.id = v_id);
end;
$$;

create or replace function public.admin_update_product(p_id uuid, p_payload jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_variant jsonb;
  v_variant_id uuid;
  v_image text;
  v_size jsonb;
  v_pos int := 0;
  v_img_pos int;
  v_new_name text;
  v_old_name text;
begin
  select name into v_old_name from public.products where id = p_id;
  if not found then
    raise exception 'PRODUCT_NOT_FOUND' using errcode = 'P0001';
  end if;

  update public.products p set
    name           = coalesce(p_payload->>'name', p.name),
    description    = coalesce(p_payload->>'description', p.description),
    category_id    = coalesce((p_payload->>'category')::uuid, p.category_id),
    gender         = coalesce((p_payload->>'gender')::gender_target, p.gender),
    price          = coalesce((p_payload->>'price')::numeric, p.price),
    discount_price = case when p_payload ? 'discountPrice'
                       then nullif(p_payload->>'discountPrice', '')::numeric
                       else p.discount_price end,
    is_featured    = coalesce((p_payload->>'isFeatured')::boolean, p.is_featured),
    is_active      = coalesce((p_payload->>'isActive')::boolean, p.is_active)
  where p.id = p_id
  returning name into v_new_name;

  if p_payload ? 'name' and v_new_name is distinct from v_old_name then
    update public.products set slug = (
      select case when exists (
        select 1 from public.products where slug = public.slugify(v_new_name || '-' || gender::text) and id <> p_id
      ) then public.slugify(v_new_name || '-' || gender::text) || '-' || substr(md5(random()::text), 1, 4)
      else public.slugify(v_new_name || '-' || gender::text) end
    ) where id = p_id;
  end if;

  -- variants: only replace if the payload includes them
  if p_payload ? 'variants' then
    delete from public.product_variants where product_id = p_id; -- cascades images/sizes

    for v_variant in select * from jsonb_array_elements(p_payload->'variants') loop
      insert into public.product_variants (product_id, color, color_hex, position)
      values (p_id, v_variant->>'color', coalesce(v_variant->>'colorHex', '#000000'), v_pos)
      returning id into v_variant_id;

      v_img_pos := 0;
      for v_image in select * from jsonb_array_elements_text(coalesce(v_variant->'images', '[]'::jsonb)) loop
        insert into public.variant_images (variant_id, url, position) values (v_variant_id, v_image, v_img_pos);
        v_img_pos := v_img_pos + 1;
      end loop;

      for v_size in select * from jsonb_array_elements(coalesce(v_variant->'sizes', '[]'::jsonb)) loop
        insert into public.variant_sizes (variant_id, size, stock)
        values (v_variant_id, v_size->>'size', coalesce((v_size->>'stock')::int, 0));
      end loop;

      v_pos := v_pos + 1;
    end loop;
  end if;

  return (select public.product_json(p) from public.products p where p.id = p_id);
end;
$$;

revoke execute on function
  public.list_categories(boolean), public.admin_list_categories(),
  public.get_cart_state(uuid, text), public.get_wishlist_state(uuid),
  public.admin_stats(), public.admin_create_product(jsonb), public.admin_update_product(uuid, jsonb)
from public, anon, authenticated;

grant execute on function
  public.list_categories(boolean), public.admin_list_categories(),
  public.get_cart_state(uuid, text), public.get_wishlist_state(uuid),
  public.admin_stats(), public.admin_create_product(jsonb), public.admin_update_product(uuid, jsonb)
to service_role;
