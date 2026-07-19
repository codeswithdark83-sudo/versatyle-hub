import tee from "@/assets/product-tee.jpg";
import trousers from "@/assets/product-trousers.jpg";
import boots from "@/assets/product-boots.jpg";
import ring from "@/assets/product-ring.jpg";
import sweatshirt from "@/assets/product-sweatshirt.jpg";

export type Product = {
  slug: string;
  name: string;
  price: number;
  category: "Men" | "Women" | "Accessories" | "Kids";
  tags: string[];
  image: string;
  description: string;
  sizes: string[];
  colors: string[];
  material: string;
};

export const products: Product[] = [
  {
    slug: "oversized-box-tee",
    name: "Oversized Box Tee",
    price: 75,
    category: "Men",
    tags: ["New Arrival", "Essentials"],
    image: tee,
    description:
      "A relaxed-fit heavyweight tee cut from 260gsm long-staple cotton. Boxed silhouette, dropped shoulders, garment-washed for a lived-in hand.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Bone", "Charcoal", "Sand"],
    material: "100% Long-staple cotton",
  },
  {
    slug: "tailored-wool-trousers",
    name: "Tailored Wool Trousers",
    price: 195,
    category: "Men",
    tags: ["New Arrival"],
    image: trousers,
    description:
      "Softly tailored trousers in mid-weight Italian virgin wool. A single forward pleat, straight leg, and a lightly tapered ankle for a modern silhouette.",
    sizes: ["28", "30", "32", "34", "36"],
    colors: ["Charcoal", "Black"],
    material: "100% Italian virgin wool",
  },
  {
    slug: "studio-leather-boot",
    name: "Studio Leather Boot",
    price: 320,
    category: "Accessories",
    tags: ["Best Seller"],
    image: boots,
    description:
      "Hand-lasted chelsea boot in full-grain calf leather with an elastic gore. Leather insole, blake-stitched sole, made in a small Portuguese atelier.",
    sizes: ["7", "8", "9", "10", "11", "12"],
    colors: ["Black"],
    material: "Full-grain calf leather",
  },
  {
    slug: "architectural-form-ring",
    name: "Architectural Form Ring",
    price: 110,
    category: "Accessories",
    tags: ["New Arrival"],
    image: ring,
    description:
      "A geometric signet ring in solid recycled sterling silver. Brushed square top, high-polished band, weighted for a substantial feel.",
    sizes: ["6", "7", "8", "9", "10"],
    colors: ["Silver"],
    material: "Recycled sterling silver",
  },
  {
    slug: "heavy-knit-crewneck",
    name: "Heavy Knit Crewneck",
    price: 165,
    category: "Women",
    tags: ["Winter", "Essentials"],
    image: sweatshirt,
    description:
      "A chunky fisherman's rib crewneck in undyed organic cotton. Ribbed cuffs and hem, roomy through the body, warm without weight.",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Oatmeal", "Ecru"],
    material: "Undyed organic cotton",
  },
  {
    slug: "tailored-wool-trousers-women",
    name: "Fluid Wide-Leg Trouser",
    price: 210,
    category: "Women",
    tags: ["New Arrival"],
    image: trousers,
    description:
      "High-rise wide-leg trousers with a flat front and belt loops. A fluid drape in mid-weight wool suiting, tailored in a small European workshop.",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Charcoal"],
    material: "Italian virgin wool",
  },
  {
    slug: "everyday-crew-tee",
    name: "Everyday Crew Tee",
    price: 55,
    category: "Women",
    tags: ["Essentials"],
    image: tee,
    description:
      "A perfectly weighted crewneck in soft-hand cotton jersey. Classic fit, ribbed collar, made to layer.",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Bone", "Black"],
    material: "Pima cotton",
  },
  {
    slug: "chelsea-boot-womens",
    name: "Chelsea Boot",
    price: 340,
    category: "Women",
    tags: ["Best Seller"],
    image: boots,
    description:
      "Sleek chelsea silhouette on a slightly lifted stacked heel. Full-grain leather, elasticated side panels, cushioned insole.",
    sizes: ["5", "6", "7", "8", "9", "10"],
    colors: ["Black"],
    material: "Full-grain leather",
  },
];

export const getProduct = (slug: string) =>
  products.find((p) => p.slug === slug);

export const productsByCategory = (category?: string) =>
  category && category !== "all"
    ? products.filter((p) => p.category.toLowerCase() === category.toLowerCase())
    : products;
