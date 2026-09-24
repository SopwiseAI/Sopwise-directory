export type Pricing = "free" | "freemium" | "paid" | "opensource";

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  url: string;
  categoryId: string;
  tags?: string[];
  icon?: string;
  pricing?: Pricing;
  featured?: boolean;
  publishedAt?: string;
  createdAt?: string;
}

export interface SiteData {
  categories: Category[];
  products: Product[];
}
