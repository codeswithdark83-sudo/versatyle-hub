CREATE TYPE public.return_kind AS ENUM ('return', 'replace');
CREATE TYPE public.return_status AS ENUM ('requested','approved','rejected','pickup_scheduled','received','refunded','replacement_shipped','completed','cancelled');

CREATE TABLE public.return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  kind public.return_kind NOT NULL DEFAULT 'return',
  status public.return_status NOT NULL DEFAULT 'requested',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  reason text NOT NULL DEFAULT '',
  comment text,
  admin_note text,
  restocked boolean NOT NULL DEFAULT false,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX return_requests_order_idx ON public.return_requests(order_id);
CREATE INDEX return_requests_user_idx ON public.return_requests(user_id);

GRANT SELECT, INSERT ON public.return_requests TO authenticated;
GRANT ALL ON public.return_requests TO service_role;

ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own return requests"
  ON public.return_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create return requests for own orders"
  ON public.return_requests FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "Admins view all return requests"
  ON public.return_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update return requests"
  ON public.return_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER return_requests_set_updated_at
  BEFORE UPDATE ON public.return_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.restock_return_request(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT jsonb_array_elements(r.items) FROM public.return_requests r WHERE r.id = _request_id
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

REVOKE ALL ON FUNCTION public.restock_return_request(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restock_return_request(uuid) TO service_role;