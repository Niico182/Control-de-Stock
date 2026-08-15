import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  title: { fontSize: 18, marginBottom: 4 },
  subtitle: { fontSize: 12, color: "#555" },
  section: { marginTop: 16, marginBottom: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1px solid #eee",
    paddingVertical: 6,
  },
  label: { fontWeight: "bold" },
  total: { marginTop: 12, fontSize: 14, fontWeight: "bold" },
});

type RentalPdfProps = {
  companyName: string;
  order: {
    id: string;
    clientName: string;
    address: string;
    rentalDate: Date;
    totalPrice: number | string;
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number | string;
    }>;
  };
};

export function RentalOrderPdfDocument({ companyName, order }: RentalPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Pedido de alquiler</Text>
          <Text style={styles.subtitle}>{companyName}</Text>
          <Text style={styles.subtitle}>ID: {order.id}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Cliente</Text>
            <Text>{order.clientName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dirección</Text>
            <Text>{order.address}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha</Text>
            <Text>{formatDate(order.rentalDate)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Productos</Text>
          {order.items.map((item, index) => (
            <View style={styles.row} key={`${item.name}-${index}`}>
              <Text>
                {item.name} x{item.quantity}
              </Text>
              <Text>{formatCurrency(Number(item.unitPrice) * item.quantity)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.total}>Total: {formatCurrency(order.totalPrice)}</Text>
      </Page>
    </Document>
  );
}
