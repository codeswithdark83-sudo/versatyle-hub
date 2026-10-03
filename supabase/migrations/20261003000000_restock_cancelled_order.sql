-- Put a cancelled order's items back into stock (called once, by the server, after a customer cancels)
CREATE OR REPLACE FUNCTION public.restock_order_stock(_order_id uuid)
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
       SET stock = v.stock + COALESCE((item->>'quantity')::int, 1)
      FROM public.products p
     WHERE v.product_id = p.id
       AND p.slug = item->>'slug'
       AND v.size = COALESCE(item->>'size', v.size);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.restock_order_stock(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restock_order_stock(uuid) TO service_role;
