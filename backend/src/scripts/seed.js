const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function initAndSeed() {
  console.log('🚀 Initializing Shahyog Kart database...');

  // 1. Connect without database to ensure database exists
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'shahyog_kart'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  console.log(`✅ Database ${process.env.DB_NAME || 'shahyog_kart'} ready.`);
  await connection.end();

  // 2. Connect to the database and run schema.sql
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shahyog_kart',
    multipleStatements: true
  });

  const schemaPath = path.join(__dirname, '../config/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await db.query(schemaSql);
  console.log('✅ Tables created successfully.');

  // 3. Seed Users
  const passwordAdmin = await bcrypt.hash('Admin@123', 10);
  const passwordSeller = await bcrypt.hash('Seller@123', 10);
  const passwordCustomer = await bcrypt.hash('Customer@123', 10);
  const passwordNgo = await bcrypt.hash('Ngo@123', 10);
  const passwordDelivery = await bcrypt.hash('Delivery@123', 10);

  const users = [
    {
      name: 'Super Admin',
      email: 'admin@shahyogkart.com',
      password: passwordAdmin,
      role: 'admin',
      phone: '+91 9876543210',
      status: 'approved',
      organization_name: 'Shahyog Kart HQ'
    },
    {
      name: 'Ramesh Patel',
      email: 'seller@shahyogkart.com',
      password: passwordSeller,
      role: 'seller',
      phone: '+91 9823456781',
      status: 'approved',
      organization_name: 'Gramin Khadi & Handicrafts'
    },
    {
      name: 'Aarav Sharma',
      email: 'customer@shahyogkart.com',
      password: passwordCustomer,
      role: 'customer',
      phone: '+91 9811223344',
      status: 'approved',
      organization_name: null
    },
    {
      name: 'Dr. Sunita Deshmukh',
      email: 'ngo@shahyogkart.com',
      password: passwordNgo,
      role: 'ngo',
      phone: '+91 9877001122',
      status: 'approved',
      organization_name: 'Pratham Shiksha Foundation'
    },
    {
      name: 'Vikram Singh',
      email: 'delivery@shahyogkart.com',
      password: passwordDelivery,
      role: 'delivery',
      phone: '+91 9844556677',
      status: 'approved',
      organization_name: 'SwiftExpress Logistics'
    },
    {
      name: 'Pooja Verma (Pending Seller)',
      email: 'pendingseller@shahyogkart.com',
      password: passwordSeller,
      role: 'seller',
      phone: '+91 9899112233',
      status: 'pending',
      organization_name: 'Himalayan Herbal Soaps'
    },
    {
      name: 'Green Future Trust (Pending NGO)',
      email: 'pendingngo@shahyogkart.com',
      password: passwordNgo,
      role: 'ngo',
      phone: '+91 9833445566',
      status: 'pending',
      organization_name: 'Green Future Trust'
    }
  ];

  for (const u of users) {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [u.email]);
    if (existing.length === 0) {
      await db.query(
        'INSERT INTO users (name, email, password, role, phone, status, organization_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [u.name, u.email, u.password, u.role, u.phone, u.status, u.organization_name]
      );
    }
  }
  console.log('✅ Users seeded.');

  // Fetch seller user id
  const [sellerRows] = await db.query("SELECT id FROM users WHERE email = 'seller@shahyogkart.com'");
  const sellerId = sellerRows[0]?.id;

  // Fetch customer user id
  const [customerRows] = await db.query("SELECT id FROM users WHERE email = 'customer@shahyogkart.com'");
  const customerId = customerRows[0]?.id;

  // 4. Seed Categories
  const categories = [
    {
      name: 'Handloom & Khadi',
      slug: 'handloom-khadi',
      description: 'Handcrafted authentic cotton and silk fabrics made by rural weaver collectives.',
      image_url: 'https://images.unsplash.com/photo-1606744888344-493238955dd5?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Organic & Nutrition',
      slug: 'organic-nutrition',
      description: 'Pure, chemical-free forest honey, cold-pressed oils, and farm-fresh spices.',
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Eco Pottery & Crafts',
      slug: 'eco-pottery-crafts',
      description: 'Terracotta dinnerware, organic clay cookware, and bamboo artisanal goods.',
      image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Education & Stationery',
      slug: 'education-stationery',
      description: 'Recycled paper notebooks, plantable seed pens, and student study kits.',
      image_url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Care & Hygiene Kits',
      slug: 'care-hygiene-kits',
      description: 'Essential sanitization, biodegradable care packages for donation or personal use.',
      image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'
    }
  ];

  for (const cat of categories) {
    const [exist] = await db.query('SELECT id FROM categories WHERE slug = ?', [cat.slug]);
    if (exist.length === 0) {
      await db.query(
        'INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)',
        [cat.name, cat.slug, cat.description, cat.image_url]
      );
    }
  }
  console.log('✅ Categories seeded.');

  // Fetch category IDs
  const [catRows] = await db.query('SELECT id, slug FROM categories');
  const catMap = {};
  catRows.forEach(c => { catMap[c.slug] = c.id; });

  // 5. Seed Products
  const products = [
    {
      name: 'Pure Khadi Hand-Spun Kurta',
      slug: 'pure-khadi-hand-spun-kurta',
      category_id: catMap['handloom-khadi'],
      price: 899.00,
      stock: 45,
      donation_percentage: 10,
      description: 'Ethically crafted 100% breathable organic hand-spun Khadi cotton kurta by women weavers in Wardha. Includes natural coconut shell buttons.',
      image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Raw Forest Wild Honey (500g)',
      slug: 'raw-forest-wild-honey-500g',
      category_id: catMap['organic-nutrition'],
      price: 450.00,
      stock: 60,
      donation_percentage: 8,
      description: 'Unfiltered, unpasteurized natural honey sustainably harvested by tribal beekeepers in the Nilgiri biosphere. Rich in trace minerals and antioxidants.',
      image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Handcrafted Terracotta Water Carafe with Cup',
      slug: 'handcrafted-terracotta-water-carafe',
      category_id: catMap['eco-pottery-crafts'],
      price: 599.00,
      stock: 30,
      donation_percentage: 12,
      description: 'Traditional alkaline red clay jug that naturally cools drinking water and balances body pH. Hand-molded by master potters of Rajasthan.',
      image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Plantable Seed Pens & Notebook Pack',
      slug: 'plantable-seed-pens-notebook-pack',
      category_id: catMap['education-stationery'],
      price: 299.00,
      stock: 120,
      donation_percentage: 15,
      description: 'Contains 5 recycled paper seed pens (tomato, marigold, basil) and 1 tree-free handmade cotton paper notebook. Plant the caps after use!',
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Essential Social Care & Nutrition Family Kit',
      slug: 'essential-social-care-nutrition-kit',
      category_id: catMap['care-hygiene-kits'],
      price: 1199.00,
      stock: 50,
      donation_percentage: 20,
      description: 'A comprehensive donation-ready package containing fortified lentils, cold-pressed cooking oil, jaggery, antibacterial soaps, and sanitary essentials for a family of 4.',
      image_url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Cold-Pressed Virgin Mustard Oil (1 Litre)',
      slug: 'cold-pressed-virgin-mustard-oil-1l',
      category_id: catMap['organic-nutrition'],
      price: 260.00,
      stock: 80,
      donation_percentage: 5,
      description: 'Traditional wooden kachi ghani extracted mustard oil from organically grown seeds without any heat processing or chemical bleaching.',
      image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Handwoven Bamboo Desk Organizer & Planter',
      slug: 'handwoven-bamboo-desk-organizer',
      category_id: catMap['eco-pottery-crafts'],
      price: 380.00,
      stock: 40,
      donation_percentage: 10,
      description: 'Sturdy eco-friendly desk accessory woven by tribal artisans in Assam. Perfect for holding stationery and small indoor succulents.',
      image_url: 'https://images.unsplash.com/photo-1591129841117-3adfd313e34f?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Artisan Pashmina Wool Shawl',
      slug: 'artisan-pashmina-wool-shawl',
      category_id: catMap['handloom-khadi'],
      price: 2499.00,
      stock: 15,
      donation_percentage: 10,
      description: 'Luxuriously soft hand-spun fine wool shawl with delicate border needlework from Kashmiri weavers.',
      image_url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=600&q=80'
    }
  ];

  if (sellerId) {
    for (const p of products) {
      const [exist] = await db.query('SELECT id FROM products WHERE slug = ?', [p.slug]);
      if (exist.length === 0) {
        await db.query(
          `INSERT INTO products (seller_id, category_id, name, slug, description, price, stock, image_url, donation_percentage, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [sellerId, p.category_id, p.name, p.slug, p.description, p.price, p.stock, p.image_url, p.donation_percentage]
        );
      }
    }
    console.log('✅ Products seeded.');
  }

  // 6. Seed NGOs
  const ngos = [
    {
      organization_name: 'Pratham Shiksha Foundation',
      registration_number: 'NGO-DEL-2018-88741',
      cause_area: 'Child Education',
      description: 'Dedicated to providing high-quality primary education, digital literacy, and free midday nutrition to over 12,000 underprivileged children in rural and urban slums.',
      target_amount: 500000.00,
      raised_amount: 342500.00,
      website: 'https://prathamshiksha.org',
      image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
      address: 'Plot 42, Sector 14, New Delhi - 110025'
    },
    {
      organization_name: 'Annam Hunger Relief Trust',
      registration_number: 'NGO-MUM-2020-55129',
      cause_area: 'Hunger & Nutrition',
      description: 'Operating community kitchens and food distribution vans that serve over 5,000 hot wholesome meals daily to hospital patients and daily wage earners.',
      target_amount: 750000.00,
      raised_amount: 589000.00,
      website: 'https://annamrelief.org',
      image_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80',
      address: '22 Bandra Reclamation, Mumbai - 400050'
    },
    {
      organization_name: 'Vriksha Dharini Greening Mission',
      registration_number: 'NGO-BLR-2021-33419',
      cause_area: 'Environment & Forestry',
      description: 'Restoring degraded native forest lands through community Miyawaki planting. Planted and nurtured over 150,000 native tree saplings across Karnataka and Maharashtra.',
      target_amount: 300000.00,
      raised_amount: 215000.00,
      website: 'https://vrikshadharini.org',
      image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
      address: '15 Indiranagar, Bengaluru - 560038'
    },
    {
      organization_name: 'Mahila Shakti Artisan Collective',
      registration_number: 'NGO-RAJ-2019-11234',
      cause_area: 'Women Empowerment',
      description: 'Skilling rural women in handloom weaving, block printing, and micro-entrepreneurship, directly empowering 2,400 rural families with dignified livelihoods.',
      target_amount: 400000.00,
      raised_amount: 310000.00,
      website: 'https://mahilashakti.org',
      image_url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=600&q=80',
      address: 'B-8 Gandhi Path, Jaipur, Rajasthan - 302021'
    }
  ];

  for (const n of ngos) {
    const [exist] = await db.query('SELECT id FROM ngos WHERE registration_number = ?', [n.registration_number]);
    if (exist.length === 0) {
      await db.query(
        `INSERT INTO ngos (organization_name, registration_number, cause_area, description, target_amount, raised_amount, website, image_url, address, verified_by_admin)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [n.organization_name, n.registration_number, n.cause_area, n.description, n.target_amount, n.raised_amount, n.website, n.image_url, n.address]
      );
    }
  }
  console.log('✅ NGOs seeded.');

  // 7. Seed Sample Address for Customer
  if (customerId) {
    const [existAddr] = await db.query('SELECT id FROM addresses WHERE user_id = ?', [customerId]);
    if (existAddr.length === 0) {
      await db.query(
        `INSERT INTO addresses (user_id, full_name, phone, street, city, state, postal_code, country, is_default)
         VALUES (?, 'Aarav Sharma', '+91 9811223344', 'Flat 402, Lotus Heights, MG Road', 'Bengaluru', 'Karnataka', '560001', 'India', 1)`,
        [customerId]
      );
    }
  }

  // 8. Seed Sample Cart for Customer
  if (customerId) {
    const [existCart] = await db.query('SELECT id FROM carts WHERE user_id = ?', [customerId]);
    let cartId;
    if (existCart.length === 0) {
      const [res] = await db.query('INSERT INTO carts (user_id) VALUES (?)', [customerId]);
      cartId = res.insertId;
    } else {
      cartId = existCart[0].id;
    }

    const [prodRows] = await db.query('SELECT id FROM products LIMIT 2');
    if (prodRows.length >= 2) {
      const [existItems] = await db.query('SELECT id FROM cart_items WHERE cart_id = ?', [cartId]);
      if (existItems.length === 0) {
        await db.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)', [cartId, prodRows[0].id, 1]);
        await db.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)', [cartId, prodRows[1].id, 2]);
      }
    }
  }

  await db.end();
  console.log('🎉 Database initialization and seeding completed successfully!');
}

initAndSeed().catch(err => {
  console.error('❌ Error initializing database:', err);
  process.exit(1);
});
