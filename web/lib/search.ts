import Fuse from "fuse.js";
import type { Product } from "./types";

export function createSearchIndex(products: Product[]): Fuse<Product> {
  return new Fuse(products, {
    keys: [
      { name: "name", weight: 0.4 },
      { name: "description", weight: 0.3 },
      { name: "tags", weight: 0.3 },
    ],
    threshold: 0.4,
    includeScore: true,
  });
}
