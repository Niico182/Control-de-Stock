"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProductCategoryAction,
  deleteProductCategoryAction,
  updateProductCategoryAction,
} from "@/lib/actions/category-actions";
import { CategorySearchInput } from "@/components/products/category-search-input";
import {
  categoryListScrollClass,
  filterCategoriesByQuery,
  type ProductCategoryOption,
} from "@/lib/products/categories";
import type { ProductCatalogType } from "@/lib/products/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ProductCategoryManager({
  catalogType,
  categories,
}: {
  catalogType: ProductCatalogType;
  categories: ProductCategoryOption[];
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredCategories = useMemo(
    () => filterCategoriesByQuery(categories, searchQuery),
    [categories, searchQuery],
  );

  function startEditing(category: ProductCategoryOption) {
    setEditingId(category.id);
    setEditingName(category.name);
    setError(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName("");
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Crear categoría
        </p>
        <form
          action={(formData) => {
            formData.set("catalogType", catalogType);
            startTransition(async () => {
              setError(null);
              const result = await createProductCategoryAction(formData);
              if (result.error) {
                setError(result.error);
                return;
              }

              router.refresh();
            });
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="catalogType" value={catalogType} />
          <div className="min-w-[220px] flex-1">
            <Label htmlFor="category-name">Nombre</Label>
            <Input
              id="category-name"
              name="name"
              placeholder="Ej. Cristalería"
              required
            />
          </div>
          <Button type="submit" variant="secondary" disabled={isPending}>
            {isPending ? "Creando..." : "Agregar"}
          </Button>
        </form>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Categorías existentes
        </p>
        {categories.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500 dark:border-slate-700">
            Todavía no hay categorías. Creá la primera con el formulario de arriba.
          </p>
        ) : (
          <>
            <CategorySearchInput value={searchQuery} onChange={setSearchQuery} />
            {filteredCategories.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500 dark:border-slate-700">
                No se encontraron categorías con &quot;{searchQuery.trim()}&quot;.
              </p>
            ) : (
              <ul
                className={cn(
                  "divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700",
                  categoryListScrollClass(filteredCategories.length),
                )}
              >
                {filteredCategories.map((category) => (
                  <li
                    key={category.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    {editingId === category.id ? (
                      <form
                        className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          startTransition(async () => {
                            setError(null);
                            const formData = new FormData();
                            formData.set("categoryId", category.id);
                            formData.set("name", editingName);
                            const result = await updateProductCategoryAction(formData);
                            if (result.error) {
                              setError(result.error);
                              return;
                            }

                            cancelEditing();
                            router.refresh();
                          });
                        }}
                      >
                        <Input
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          className="min-w-[180px] flex-1"
                          required
                          autoFocus
                        />
                        <Button type="submit" size="sm" disabled={isPending}>
                          Guardar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={cancelEditing}
                        >
                          Cancelar
                        </Button>
                      </form>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1">{category.name}</span>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() => startEditing(category)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() =>
                              startTransition(async () => {
                                if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) {
                                  return;
                                }

                                setError(null);
                                const result = await deleteProductCategoryAction(category.id);
                                if (result.error) {
                                  setError(result.error);
                                  return;
                                }

                                router.refresh();
                              })
                            }
                          >
                            Eliminar
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
