-- 0010 — public.reseed_demo_data(): wraps the demo seed as a callable RPC so
-- `npm run seed` / `npm run smoke` can (re)load it over the network, without
-- needing a direct Postgres connection or the CLI. seed.sql calls this once;
-- the API can call it any time to reset to a known state.

create or replace function public.reseed_demo_data(
  p_admin_password_hash text,
  p_user_password_hash  text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  colors jsonb := jsonb_build_object(
    'Black','#111111','White','#F7F7F5','Navy','#1F2A44','Olive Green','#5A5F3C',
    'Charcoal','#3A3A3A','Beige','#D8C7A9','Sky Blue','#8FB8DE','Maroon','#5E1F2B',
    'Forest Green','#2E4034','Rust','#A5522D','Powder Pink','#E7C6C9','Lilac','#C3B1D9'
  );
  cat_names text[] := array[
    'T-Shirts','Polo','Tees','Shirts','Linen Shirts','Sportswear','Sweatshirts','Hoodies'
  ];
  apparel_sizes text[] := array['XS','S','M','L','XL','XXL'];

  -- [category, name, gender, price, discount_price(0=none), featured, colors csv]
  blueprints jsonb := $j$[
    ["T-Shirts","Everyday Supima Crew Tee","men",1299,999,true,"Black,White,Navy"],
    ["T-Shirts","Heavyweight Boxy Tee","men",1499,0,false,"Charcoal,Beige"],
    ["T-Shirts","Relaxed Pima Crew Tee","women",1299,1049,true,"White,Powder Pink,Sky Blue"],
    ["T-Shirts","Pima Scoop-Neck Tee","women",1199,0,false,"Black,Lilac"],
    ["T-Shirts","Organic Cotton Pocket Tee","unisex",1399,1119,false,"Olive Green,White"],
    ["Polo","Pique Cotton Polo","men",1999,1599,true,"Navy,White,Maroon"],
    ["Polo","Textured Knit Polo","men",2499,0,false,"Forest Green,Charcoal"],
    ["Polo","Slim Stretch Polo","women",1899,1519,false,"Black,Sky Blue"],
    ["Polo","Tipped Collar Polo","unisex",2199,0,true,"White,Navy"],
    ["Tees","Vintage Wash Graphic Tee","men",1599,1279,true,"Black,Rust"],
    ["Tees","Ringer Retro Tee","men",1499,0,false,"White,Navy"],
    ["Tees","Slub Cotton Curved-Hem Tee","women",1449,1159,false,"Beige,Black"],
    ["Tees","Acid Wash Oversized Tee","unisex",1699,0,true,"Charcoal,Olive Green"],
    ["Shirts","Oxford Button-Down Shirt","men",2799,2239,true,"Sky Blue,White,Navy"],
    ["Shirts","Brushed Flannel Overshirt","men",3299,0,false,"Maroon,Forest Green"],
    ["Shirts","Poplin Relaxed Shirt","women",2599,2079,false,"White,Powder Pink"],
    ["Shirts","Corduroy Utility Shirt","unisex",3499,2799,true,"Rust,Charcoal"],
    ["Linen Shirts","Pure Linen Resort Shirt","men",2999,2399,true,"White,Beige,Sky Blue"],
    ["Linen Shirts","Linen-Blend Band Collar Shirt","men",2699,0,false,"Olive Green,Navy"],
    ["Linen Shirts","Breezy Linen Shirt","women",2799,2239,true,"White,Lilac"],
    ["Linen Shirts","Linen Camp-Collar Shirt","unisex",3099,0,false,"Beige,Rust"],
    ["Sportswear","Performance Training Tee","men",1799,1439,true,"Black,Charcoal"],
    ["Sportswear","Seamless Run Shorts","men",1999,0,false,"Black,Navy"],
    ["Sportswear","High-Rise Compression Leggings","women",2499,1999,true,"Black,Maroon"],
    ["Sportswear","Featherweight Track Jacket","unisex",3499,2799,false,"Charcoal,Forest Green"],
    ["Sweatshirts","Loopback Crew Sweatshirt","men",2599,2079,true,"Charcoal,Navy,Beige"],
    ["Sweatshirts","Raglan Fleece Sweatshirt","men",2799,0,false,"Forest Green,Black"],
    ["Sweatshirts","Cropped Boxy Sweatshirt","women",2399,1919,true,"Powder Pink,White"],
    ["Sweatshirts","Half-Zip Funnel Sweatshirt","unisex",3199,0,false,"Olive Green,Charcoal"],
    ["Hoodies","Heavyweight Pullover Hoodie","men",3299,2639,true,"Black,Charcoal,Olive Green"],
    ["Hoodies","Brushed-Back Zip Hoodie","men",3499,0,false,"Navy,Maroon"],
    ["Hoodies","Oversized Fleece Hoodie","women",2999,2399,true,"Beige,Lilac"],
    ["Hoodies","Tech Sherpa-Lined Hoodie","unisex",3999,3199,false,"Charcoal,Forest Green"]
  ]$j$::jsonb;

  cat_id_by_name jsonb := '{}'::jsonb;
  cname text;
  bp jsonb;
  p_name text; p_gender text; p_cat text; p_price numeric; p_disc numeric;
  p_featured boolean; p_colors text[];
  p_slug text; p_id uuid;
  r_avg numeric; r_count integer;
  colr text; v_id uuid; v_idx integer;
  sz text; stk integer;
  img_n integer;
  n_categories int; n_products int;
begin
  truncate
    public.coupon_redemptions, public.order_items, public.orders,
    public.cart_items, public.carts, public.wishlist_items,
    public.reviews, public.addresses, public.recently_viewed,
    public.stock_notifications, public.email_outbox,
    public.variant_sizes, public.variant_images, public.product_variants,
    public.products, public.categories, public.coupons,
    public.auth_tokens, public.users,
    public.newsletter_subscribers, public.contact_messages
  restart identity cascade;

  insert into public.users (name, email, password_hash, role, email_verified) values
    ('Admin', 'admin@s2vestis.com', p_admin_password_hash, 'admin', true),
    ('Demo User', 'user@s2vestis.com', p_user_password_hash, 'customer', true);

  insert into public.coupons
    (code, description, discount_type, discount_value, min_subtotal, max_discount, is_active)
  values
    ('WELCOME10', '10% off your first order', 'percent', 10, 0, 500, true),
    ('FLAT200',   '₹200 off orders over ₹1999', 'fixed', 200, 1999, null, true);

  foreach cname in array cat_names loop
    insert into public.categories (name, slug, gender, image_url, is_active, sort_order)
    values (
      cname, public.slugify(cname), 'unisex',
      'https://picsum.photos/seed/s2v-cat-' || public.slugify(cname) || '-1/600/750',
      true, array_position(cat_names, cname)
    )
    returning id into p_id;
    cat_id_by_name := cat_id_by_name || jsonb_build_object(cname, p_id::text);
  end loop;
  n_categories := array_length(cat_names, 1);
  n_products := 0;

  for bp in select * from jsonb_array_elements(blueprints) loop
    p_cat      := bp->>0;
    p_name     := bp->>1;
    p_gender   := bp->>2;
    p_price    := (bp->>3)::numeric;
    p_disc     := nullif((bp->>4)::numeric, 0);
    p_featured := (bp->>5)::boolean;
    p_colors   := string_to_array(bp->>6, ',');
    p_slug     := public.slugify(p_name || '-' || p_gender);

    r_avg   := least(3.6 + (length(p_name) % 12) / 10.0, 5.0);
    r_count := 8 + (length(p_name) * 7) % 180;

    insert into public.products
      (name, slug, description, category_id, gender, price, discount_price,
       is_featured, is_active, rating_avg, rating_count)
    values (
      p_name, p_slug,
      'The ' || p_name || ' from S2VESTIS. Cut for a modern ' ||
        (case p_gender when 'women' then 'women''s' when 'men' then 'men''s' else 'unisex' end) ||
        ' fit in premium fabric with clean finishing and durable stitching. Part of the ' ||
        p_cat || ' line — easy to layer, built to last wash after wash.',
      (cat_id_by_name->>p_cat)::uuid, p_gender::gender_target,
      p_price, p_disc, p_featured, true, round(r_avg, 2), r_count
    )
    returning id into p_id;

    v_idx := 0;
    foreach colr in array p_colors loop
      insert into public.product_variants (product_id, color, color_hex, position)
      values (p_id, colr, coalesce(colors->>colr, '#888888'), v_idx)
      returning id into v_id;

      for img_n in 1..3 loop
        insert into public.variant_images (variant_id, url, position)
        values (
          v_id,
          'https://picsum.photos/seed/s2v-' || public.slugify(p_name) || '-' ||
            public.slugify(colr) || '-' || img_n || '/900/1200',
          img_n - 1
        );
      end loop;

      foreach sz in array apparel_sizes loop
        if sz = 'XS' and v_idx = 0 then
          stk := 0;
        elsif sz = 'XXL' then
          stk := case when (v_idx + 1) % 3 = 0 then 2 else 6 end;
        else
          stk := 4 + ((length(p_name) + ascii(substr(sz, 1, 1)) + v_idx) % 12);
        end if;

        insert into public.variant_sizes (variant_id, size, stock)
        values (v_id, sz, stk);
      end loop;

      v_idx := v_idx + 1;
    end loop;

    n_products := n_products + 1;
  end loop;

  return jsonb_build_object('categories', n_categories, 'products', n_products);
end;
$$;

-- callable by the API's service-role client only
revoke execute on function public.reseed_demo_data(text, text) from anon, authenticated;
grant execute on function public.reseed_demo_data(text, text) to service_role;
