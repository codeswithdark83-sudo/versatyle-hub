export type ProductVariant = {
  size: string;
  stock: number;
  price: number | null;
};

export type Product = {
  id?: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  category: string;
  tags: string[];
  image: string;
  images: string[];
  description: string;
  material: string;
  colors: string[];
  sizes: string[];
  variants: ProductVariant[];
  totalStock: number;
  /** ISO timestamp the product was added; used to show the newest first. */
  createdAt?: string;
  inStock: boolean;
};

export const CATEGORIES = ["Men", "Women", "Accessories", "Kids"] as const;
