export type RentalCatalogItem = {
  code: string;
  name: string;
  price: number;
  quantity: number;
};

/** Catálogo de alquiler: vajilla, cristalería y mobiliario para eventos */
export const RENTAL_CATALOG: RentalCatalogItem[] = [
  { code: "ALQ-0001", name: "Plato playo", price: 450, quantity: 200 },
  { code: "ALQ-0002", name: "Plato postre", price: 350, quantity: 200 },
  { code: "ALQ-0003", name: "Plato hondo", price: 400, quantity: 150 },
  { code: "ALQ-0004", name: "Tenedor", price: 120, quantity: 300 },
  { code: "ALQ-0005", name: "Cuchillo", price: 120, quantity: 300 },
  { code: "ALQ-0006", name: "Cuchara", price: 120, quantity: 300 },
  { code: "ALQ-0007", name: "Cuchara de postre", price: 100, quantity: 250 },
  { code: "ALQ-0008", name: "Copa de vino", price: 280, quantity: 180 },
  { code: "ALQ-0009", name: "Copa de champagne", price: 320, quantity: 120 },
  { code: "ALQ-0010", name: "Vaso de agua", price: 180, quantity: 220 },
  { code: "ALQ-0011", name: "Vaso highball", price: 200, quantity: 180 },
  { code: "ALQ-0012", name: "Jarra de vidrio 1.5 L", price: 650, quantity: 40 },
  { code: "ALQ-0013", name: "Bandeja rectangular", price: 900, quantity: 30 },
  { code: "ALQ-0014", name: "Mantel blanco 2.5 m", price: 850, quantity: 60 },
  { code: "ALQ-0015", name: "Servilleta de tela", price: 150, quantity: 300 },
  { code: "ALQ-0016", name: "Silla Tiffany", price: 1200, quantity: 80 },
  { code: "ALQ-0017", name: "Mesa redonda 1.50 m", price: 4500, quantity: 25 },
  { code: "ALQ-0018", name: "Mesa rectangular 2.40 m", price: 5500, quantity: 15 },
  { code: "ALQ-0019", name: "Centro de mesa", price: 750, quantity: 40 },
  { code: "ALQ-0020", name: "Candelabro", price: 1100, quantity: 20 },
];
