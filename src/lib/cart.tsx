import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (slug: string, size: string, color: string) => void;
  updateQuantity: (slug: string, size: string, color: string, quantity: number) => void;
  clear: () => void;
  /** "Buy now": a single item bought on its own, without touching the bag. */
  buyNowItem: CartItem | null;
  buyNow: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  clearBuyNow: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "versatile.cart.v1";
const BUY_NOW_KEY = "versatile.buynow.v1";

const keyOf = (i: Pick<CartItem, "slug" | "size" | "color">) =>
  `${i.slug}::${i.size}::${i.color}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    try {
      // sessionStorage: survives a refresh of the checkout page, but not a new visit.
      const rawBuy = sessionStorage.getItem(BUY_NOW_KEY);
      if (rawBuy) setBuyNowItem(JSON.parse(rawBuy));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  const addItem: CartContextValue["addItem"] = useCallback((item) => {
    const qty = item.quantity ?? 1;
    setItems((current) => {
      const idx = current.findIndex((c) => keyOf(c) === keyOf(item));
      if (idx > -1) {
        const next = [...current];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [...current, { ...item, quantity: qty }];
    });
    setOpen(true);
  }, []);

  const removeItem: CartContextValue["removeItem"] = useCallback(
    (slug, size, color) => {
      setItems((c) => c.filter((i) => keyOf(i) !== keyOf({ slug, size, color })));
    },
    [],
  );

  const updateQuantity: CartContextValue["updateQuantity"] = useCallback(
    (slug, size, color, quantity) => {
      if (quantity <= 0) {
        removeItem(slug, size, color);
        return;
      }
      setItems((c) =>
        c.map((i) => (keyOf(i) === keyOf({ slug, size, color }) ? { ...i, quantity } : i)),
      );
    },
    [removeItem],
  );

  const clear = useCallback(() => setItems([]), []);

  const buyNow: CartContextValue["buyNow"] = useCallback((item) => {
    const next: CartItem = { ...item, quantity: item.quantity ?? 1 };
    setBuyNowItem(next);
    try {
      sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const clearBuyNow = useCallback(() => {
    setBuyNowItem(null);
    try {
      sessionStorage.removeItem(BUY_NOW_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((n, i) => n + i.quantity, 0);
    const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
    return {
      items,
      itemCount,
      subtotal,
      isOpen,
      setOpen,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      buyNowItem,
      buyNow,
      clearBuyNow,
    };
  }, [items, isOpen, addItem, removeItem, updateQuantity, clear, buyNowItem, buyNow, clearBuyNow]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

/**
 * The ONE place prices are formatted for customers. Every product price in the
 * database is in Indian rupees, so anything added from the admin inventory panel
 * automatically shows as ₹ (with Indian digit grouping, e.g. ₹12,999).
 */
export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
