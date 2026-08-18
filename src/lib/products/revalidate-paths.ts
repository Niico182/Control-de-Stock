import { revalidatePath } from "next/cache";
import { PRODUCT_REVALIDATE_PATHS } from "@/lib/products/catalog";

export function revalidateProductPaths() {
  for (const path of PRODUCT_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}
