import data from "@/data/data.json";
import type { Category, Product, SiteData } from "./types";

const siteData = data as SiteData;

export function getAllCategories(): Category[] {
  return siteData.categories;
}

export function getCategoryById(id: string): Category | undefined {
  return siteData.categories.find((c) => c.id === id);
}

export function getAllProducts(): Product[] {
  return siteData.products;
}

export function getFeaturedProducts(): Product[] {
  return siteData.products.filter((p) => p.featured);
}

export function getLatestProducts(limit?: number): Product[] {
  const sorted = [...siteData.products].sort((a, b) =>
    (b.publishedAt ?? b.createdAt ?? "").localeCompare(a.publishedAt ?? a.createdAt ?? "")
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

export function getProductsByCategory(categoryId: string): Product[] {
  return siteData.products.filter((p) => p.categoryId === categoryId);
}

export function getProductDate(product: Product): string {
  return product.publishedAt ?? product.createdAt ?? "";
}
