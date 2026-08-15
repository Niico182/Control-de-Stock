import { deleteProductAction } from "@/lib/actions/company-actions";
import { ProductForm } from "@/components/products/product-form";
import { ProductTable } from "@/components/products/product-table";
import { prisma } from "@/lib/db";
import { getCompanyContext } from "@/lib/tenant";
import { Card, CardHeader } from "@/components/ui/card";

export default async function ProductsPage() {
  const { companyId, permissions } = await getCompanyContext();

  const products = await prisma.product.findMany({
    where: { companyId: companyId! },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Productos</h2>
        <p className="text-slate-600">Gestioná nombre, precio, cantidad e ID único.</p>
      </div>

      {permissions.canManageProducts ? (
        <Card>
          <CardHeader title="Nuevo producto" />
          <ProductForm />
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Inventario" description={`${products.length} productos registrados`} />
        <ProductTable
          products={products.map((product) => ({
            ...product,
            price: Number(product.price),
          }))}
          canManage={permissions.canManageProducts}
          onDelete={deleteProductAction}
        />
      </Card>
    </div>
  );
}
