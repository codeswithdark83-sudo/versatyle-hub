ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'razorpay';

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check CHECK (payment_method IN ('razorpay', 'cod'));