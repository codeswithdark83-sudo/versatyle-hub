-- 1) Product images now live in the app's /public/images folder (no Lovable asset hosting).
UPDATE public.products SET image_url = CASE slug
  WHEN 'oversized-box-tee'            THEN '/images/product-tee.jpg'
  WHEN 'everyday-crew-tee'            THEN '/images/product-tee.jpg'
  WHEN 'tailored-wool-trousers'       THEN '/images/product-trousers.jpg'
  WHEN 'tailored-wool-trousers-women' THEN '/images/product-trousers.jpg'
  WHEN 'studio-leather-boot'          THEN '/images/product-boots.jpg'
  WHEN 'chelsea-boot-womens'          THEN '/images/product-boots.jpg'
  WHEN 'architectural-form-ring'      THEN '/images/product-ring.jpg'
  WHEN 'heavy-knit-crewneck'          THEN '/images/product-sweatshirt.jpg'
  ELSE image_url
END
WHERE image_url LIKE '/__l5e/%';

-- 2) The review-media bucket was never created by earlier migrations (only its policies were).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('review-media', 'review-media', false, 52428800, ARRAY['image/*', 'video/*'])
ON CONFLICT (id) DO NOTHING;
