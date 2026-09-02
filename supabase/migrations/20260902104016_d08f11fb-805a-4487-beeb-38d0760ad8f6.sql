CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  compare_at_price integer CHECK (compare_at_price >= 0),
  category text NOT NULL DEFAULT 'Men',
  tags text[] NOT NULL DEFAULT '{}',
  colors text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  material text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text NOT NULL,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  price integer CHECK (price >= 0),
  sku text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, size)
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active products are public" ON public.products
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins view all products" ON public.products
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update products" ON public.products
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete products" ON public.products
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Variants of active products are public" ON public.product_variants
  FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variants.product_id AND p.is_active = true));
CREATE POLICY "Admins view all variants" ON public.product_variants
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert variants" ON public.product_variants
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update variants" ON public.product_variants
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete variants" ON public.product_variants
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER product_variants_set_updated_at BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX products_category_idx ON public.products (category);
CREATE INDEX product_variants_product_idx ON public.product_variants (product_id);

-- reduce stock for a paid order's items
CREATE OR REPLACE FUNCTION public.consume_order_stock(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT jsonb_array_elements(o.items) FROM public.orders o WHERE o.id = _order_id
  LOOP
    UPDATE public.product_variants v
       SET stock = GREATEST(0, v.stock - COALESCE((item->>'quantity')::int, 1))
      FROM public.products p
     WHERE v.product_id = p.id
       AND p.slug = item->>'slug'
       AND v.size = COALESCE(item->>'size', v.size);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_order_stock(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_order_stock(uuid) TO service_role;

INSERT INTO public.products (slug, name, price, category, tags, colors, description, material, image_url, sort_order) VALUES
('oversized-box-tee','Oversized Box Tee',75,'Men','{"New Arrival","Essentials"}','{"Bone","Charcoal","Sand"}','A relaxed-fit heavyweight tee cut from 260gsm long-staple cotton. Boxed silhouette, dropped shoulders, garment-washed for a lived-in hand.','100% Long-staple cotton','/__l5e/assets-v1/1ecac453-3cf2-4637-b6ff-4d02e6da97c6/product-tee.jpg',1),
('tailored-wool-trousers','Tailored Wool Trousers',195,'Men','{"New Arrival"}','{"Charcoal","Black"}','Softly tailored trousers in mid-weight Italian virgin wool. A single forward pleat, straight leg, and a lightly tapered ankle for a modern silhouette.','100% Italian virgin wool','/__l5e/assets-v1/3beb23ea-7044-4d79-9c39-872ba2e24213/product-trousers.jpg',2),
('studio-leather-boot','Studio Leather Boot',320,'Accessories','{"Best Seller"}','{"Black"}','Hand-lasted chelsea boot in full-grain calf leather with an elastic gore. Leather insole, blake-stitched sole, made in a small Portuguese atelier.','Full-grain calf leather','/__l5e/assets-v1/d6502a6a-8d1a-4687-ab9d-4143cac16be2/product-boots.jpg',3),
('architectural-form-ring','Architectural Form Ring',110,'Accessories','{"New Arrival"}','{"Silver"}','A geometric signet ring in solid recycled sterling silver. Brushed square top, high-polished band, weighted for a substantial feel.','Recycled sterling silver','/__l5e/assets-v1/75c3cd40-2ea5-4bc2-8bf3-8f8bc840dc95/product-ring.jpg',4),
('heavy-knit-crewneck','Heavy Knit Crewneck',165,'Women','{"Winter","Essentials"}','{"Oatmeal","Ecru"}','A chunky fisherman''s rib crewneck in undyed organic cotton. Ribbed cuffs and hem, roomy through the body, warm without weight.','Undyed organic cotton','/__l5e/assets-v1/9734b7da-f0d4-4c10-b1cf-839fa62be334/product-sweatshirt.jpg',5),
('tailored-wool-trousers-women','Fluid Wide-Leg Trouser',210,'Women','{"New Arrival"}','{"Charcoal"}','High-rise wide-leg trousers with a flat front and belt loops. A fluid drape in mid-weight wool suiting, tailored in a small European workshop.','Italian virgin wool','/__l5e/assets-v1/3beb23ea-7044-4d79-9c39-872ba2e24213/product-trousers.jpg',6),
('everyday-crew-tee','Everyday Crew Tee',55,'Women','{"Essentials"}','{"Bone","Black"}','A perfectly weighted crewneck in soft-hand cotton jersey. Classic fit, ribbed collar, made to layer.','Pima cotton','/__l5e/assets-v1/1ecac453-3cf2-4637-b6ff-4d02e6da97c6/product-tee.jpg',7),
('chelsea-boot-womens','Chelsea Boot',340,'Women','{"Best Seller"}','{"Black"}','Sleek chelsea silhouette on a slightly lifted stacked heel. Full-grain leather, elasticated side panels, cushioned insole.','Full-grain leather','/__l5e/assets-v1/d6502a6a-8d1a-4687-ab9d-4143cac16be2/product-boots.jpg',8);

INSERT INTO public.product_variants (product_id, size, stock, sort_order)
SELECT p.id, s.size, 12, s.ord FROM public.products p
JOIN (VALUES ('XS',1),('S',2),('M',3),('L',4),('XL',5)) AS s(size, ord) ON true
WHERE p.slug = 'oversized-box-tee';

INSERT INTO public.product_variants (product_id, size, stock, sort_order)
SELECT p.id, s.size, 8, s.ord FROM public.products p
JOIN (VALUES ('28',1),('30',2),('32',3),('34',4),('36',5)) AS s(size, ord) ON true
WHERE p.slug = 'tailored-wool-trousers';

INSERT INTO public.product_variants (product_id, size, stock, sort_order)
SELECT p.id, s.size, 5, s.ord FROM public.products p
JOIN (VALUES ('7',1),('8',2),('9',3),('10',4),('11',5),('12',6)) AS s(size, ord) ON true
WHERE p.slug = 'studio-leather-boot';

INSERT INTO public.product_variants (product_id, size, stock, sort_order)
SELECT p.id, s.size, 6, s.ord FROM public.products p
JOIN (VALUES ('6',1),('7',2),('8',3),('9',4),('10',5)) AS s(size, ord) ON true
WHERE p.slug = 'architectural-form-ring';

INSERT INTO public.product_variants (product_id, size, stock, sort_order)
SELECT p.id, s.size, 10, s.ord FROM public.products p
JOIN (VALUES ('XS',1),('S',2),('M',3),('L',4)) AS s(size, ord) ON true
WHERE p.slug IN ('heavy-knit-crewneck','tailored-wool-trousers-women','everyday-crew-tee');

INSERT INTO public.product_variants (product_id, size, stock, sort_order)
SELECT p.id, s.size, 4, s.ord FROM public.products p
JOIN (VALUES ('5',1),('6',2),('7',3),('8',4),('9',5),('10',6)) AS s(size, ord) ON true
WHERE p.slug = 'chelsea-boot-womens';