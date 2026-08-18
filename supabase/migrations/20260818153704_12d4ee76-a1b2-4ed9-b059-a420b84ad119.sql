CREATE TYPE public.fulfillment_status AS ENUM (
  'pending','confirmed','packed','shipped','out_for_delivery','delivered','cancelled','returned'
);

ALTER TABLE public.orders
  ADD COLUMN fulfillment_status public.fulfillment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN carrier text,
  ADD COLUMN tracking_number text,
  ADD COLUMN tracking_url text,
  ADD COLUMN estimated_delivery date,
  ADD COLUMN admin_note text,
  ADD COLUMN shipped_at timestamptz,
  ADD COLUMN delivered_at timestamptz;

UPDATE public.orders SET fulfillment_status = 'confirmed' WHERE status = 'paid';
UPDATE public.orders SET fulfillment_status = 'cancelled' WHERE status IN ('failed','refunded');

CREATE TABLE public.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  actor_id uuid,
  event_type text NOT NULL,
  fulfillment_status public.fulfillment_status,
  payment_status public.order_status,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX order_events_order_id_created_at_idx ON public.order_events (order_id, created_at DESC);

GRANT SELECT ON public.order_events TO authenticated;
GRANT ALL ON public.order_events TO service_role;

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view events for own orders"
ON public.order_events FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = order_events.order_id AND o.user_id = auth.uid()
));

CREATE POLICY "Admins view all order events"
ON public.order_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));