// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const shoes = [
  {
    name: "Air Zoom Runner",
    brand: "Nike",
    price: 129.99,
    size: 9.5,
    color: "Black/Red",
    stock: 45,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    description: "Lightweight running shoe with responsive cushioning for daily training and casual wear. Features breathable mesh upper and durable rubber outsole."
  },
  {
    name: "Ultra Boost Elite",
    brand: "Adidas",
    price: 149.99,
    size: 10.0,
    color: "White/Blue",
    stock: 32,
    imageUrl: "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb",
    description: "Premium running shoes with energy-returning boost technology. Perfect for long-distance runs and everyday comfort."
  },
  {
    name: "Classic Leather",
    brand: "Reebok",
    price: 79.99,
    size: 9.0,
    color: "White",
    stock: 58,
    imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a",
    description: "Timeless leather sneakers that blend heritage style with modern comfort. Versatile enough for any casual outfit."
  },
  {
    name: "Suede Classic",
    brand: "Puma",
    price: 69.99,
    size: 8.5,
    color: "Navy/White",
    stock: 37,
    imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5",
    description: "Iconic suede sneakers featuring the legendary Puma formstrip. A street style essential since 1968."
  },
  {
    name: "Old Skool",
    brand: "Vans",
    price: 59.99,
    size: 10.5,
    color: "Black/White",
    stock: 65,
    imageUrl: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77",
    description: "Iconic skate shoes with the signature side stripe. Durable canvas and suede upper with padded collars for support and flexibility."
  },
  {
    name: "Chuck Taylor All Star",
    brand: "Converse",
    price: 55.99,
    size: 8.0,
    color: "Red",
    stock: 42,
    imageUrl: "https://images.unsplash.com/photo-1607522370275-f14206abe5d3",
    description: "The original basketball shoe, now a cultural icon. Canvas upper with rubber toe cap and diamond pattern outsole."
  },
  {
    name: "574 Classic",
    brand: "New Balance",
    price: 89.99,
    size: 11.0,
    color: "Gray/Navy",
    stock: 29,
    imageUrl: "https://images.unsplash.com/photo-1539185441755-769473a23570",
    description: "Heritage-inspired casual sneakers with ENCAP midsole technology for support and durability. Perfect blend of style and comfort."
  },
  {
    name: "Oxford Wingtip",
    brand: "Cole Haan",
    price: 149.99,
    size: 10.0,
    color: "Brown",
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4",
    description: "Classic wingtip Oxford dress shoes with premium leather upper and cushioned footbed. Perfect for formal occasions."
  },
  {
    name: "Gel-Kayano 28",
    brand: "ASICS",
    price: 159.99,
    size: 9.5,
    color: "Blue/Orange",
    stock: 23,
    imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa",
    description: "High-performance running shoes with GEL technology cushioning and Dynamic DuoMax Support System. Ideal for long-distance runners."
  },
  {
    name: "Flex Experience Run",
    brand: "Nike",
    price: 79.99,
    size: 10.5,
    color: "Gray/Green",
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5",
    description: "Lightweight running shoes with flexible outsole and breathable mesh upper. Perfect for beginners and casual runners."
  },
  {
    name: "Superstar",
    brand: "Adidas",
    price: 89.99,
    size: 8.0,
    color: "White/Black",
    stock: 51,
    imageUrl: "https://images.unsplash.com/photo-1603787081207-362bcef7c144",
    description: "Iconic basketball shoes with the signature shell toe. A streetwear staple since the '70s."
  },
  {
    name: "Stan Smith",
    brand: "Adidas",
    price: 85.99,
    size: 9.0,
    color: "White/Green",
    stock: 47,
    imageUrl: "https://images.unsplash.com/photo-1585232004423-244e0e6904e3",
    description: "Minimalist tennis shoes with clean lines and perforated 3-Stripes. A timeless classic reimagined for today."
  },
  {
    name: "Classic Slip-On",
    brand: "Vans",
    price: 54.99,
    size: 8.5,
    color: "Black",
    stock: 68,
    imageUrl: "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95",
    description: "Laceless canvas shoes with padded collars and signature waffle outsoles. The epitome of effortless style."
  },
  {
    name: "Air Force 1",
    brand: "Nike",
    price: 99.99,
    size: 11.0,
    color: "White",
    stock: 55,
    imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a",
    description: "Legendary basketball shoes that transcend the court. Features Air cushioning and a durable cupsole for all-day comfort."
  },
  {
    name: "Chelsea Boot",
    brand: "Dr. Martens",
    price: 139.99,
    size: 10.0,
    color: "Black",
    stock: 22,
    imageUrl: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76",
    description: "Classic Chelsea boots with elastic side panels and signature air-cushioned sole. Durable and comfortable for everyday wear."
  },
  {
    name: "Fresh Foam 1080",
    brand: "New Balance",
    price: 149.99,
    size: 9.5,
    color: "Blue/White",
    stock: 31,
    imageUrl: "https://images.unsplash.com/photo-1539185441755-769473a23570",
    description: "Premium running shoes with Fresh Foam midsole technology for ultra-cushioned comfort. Designed for high mileage and daily training."
  },
  {
    name: "Authentic",
    brand: "Vans",
    price: 49.99,
    size: 8.0,
    color: "Red/White",
    stock: 59,
    imageUrl: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77",
    description: "The original Vans low top with canvas upper and signature waffle outsole. Simple, versatile, and always in style."
  },
  {
    name: "Chuck 70",
    brand: "Converse",
    price: 79.99,
    size: 10.5,
    color: "Black",
    stock: 43,
    imageUrl: "https://images.unsplash.com/photo-1607522370275-f14206abe5d3",
    description: "Premium version of the classic Chuck Taylor with enhanced cushioning, higher rubber foxing, and more durable canvas."
  },
  {
    name: "Gel-Nimbus 24",
    brand: "ASICS",
    price: 149.99,
    size: 9.0,
    color: "Black/Silver",
    stock: 27,
    imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa",
    description: "Premium neutral running shoes with GEL technology cushioning and FlyteFoam midsole. Designed for comfort on long-distance runs."
  },
  {
    name: "RS-X",
    brand: "Puma",
    price: 109.99,
    size: 10.0,
    color: "White/Blue/Red",
    stock: 35,
    imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5",
    description: "Chunky running shoes with RS technology and bold design. The perfect statement piece for any streetwear outfit."
  },
  {
    name: "Classic Loafer",
    brand: "Cole Haan",
    price: 129.99,
    size: 11.0,
    color: "Tan",
    stock: 19,
    imageUrl: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4",
    description: "Versatile penny loafers crafted from premium leather with cushioned footbed and flexible outsole. Perfect balance of comfort and style."
  },
  {
    name: "Air Max 90",
    brand: "Nike",
    price: 119.99,
    size: 9.5,
    color: "Wolf Gray",
    stock: 37,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    description: "Iconic sneakers with visible Air cushioning and waffle outsole. Timeless design that's been a streetwear staple for decades."
  },
  {
    name: "Yeezy Boost 350",
    brand: "Adidas",
    price: 219.99,
    size: 10.0,
    color: "Earth",
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb",
    description: "Fashion-forward sneakers with Primeknit upper and full-length Boost midsole. Designed for both style and comfort."
  },
  {
    name: "Sk8-Hi",
    brand: "Vans",
    price: 69.99,
    size: 8.5,
    color: "Black/White",
    stock: 48,
    imageUrl: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77",
    description: "High-top skate shoes with padded collars for ankle support. Features durable canvas and suede upper with signature side stripe."
  },
  {
    name: "990v5",
    brand: "New Balance",
    price: 179.99,
    size: 10.5,
    color: "Gray",
    stock: 21,
    imageUrl: "https://images.unsplash.com/photo-1539185441755-769473a23570",
    description: "Premium made-in-USA running shoes with ENCAP midsole cushioning and unparalleled comfort. A heritage style with modern technology."
  }
];

async function main() {
  console.log('Start seeding...');
  
  // Clean existing data (optional)
  await prisma.shoe.deleteMany({});
  
  // Insert shoes data
  for (const shoe of shoes) {
    const createdShoe = await prisma.shoe.create({
      data: shoe
    });
    console.log(`Created shoe with ID: ${createdShoe.id}`);
  }
  
  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });