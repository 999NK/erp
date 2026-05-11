import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.ENABLE_DEV_SEED !== 'true' && process.env.NODE_ENV === 'production') {
     console.log('Skipping seed. Set ENABLE_DEV_SEED=true to run seeds in production.');
     return;
  }
  const companyId = '11111111-1111-1111-1111-111111111111';
  
  const company = await prisma.company.upsert({
    where: { document: '00000000000100' },
    update: {},
    create: {
      id: companyId,
      businessName: 'My Awesome Company',
      tradeName: 'Awesome Store',
      document: '00000000000100',
    },
  });

  const passwordHash = await bcrypt.hash('admin123', 8);

  const admin = await prisma.user.upsert({
    where: {
      email_companyId: {
        email: 'admin@company.com',
        companyId: company.id
      }
    },
    update: {},
    create: {
      companyId: company.id,
      name: 'System Admin',
      email: 'admin@company.com',
      passwordHash: passwordHash,
      requirePasswordChange: false,
    },
  });

  const location = await prisma.stockLocation.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      companyId: company.id,
      name: 'Main Warehouse',
      isDefault: true,
      isActive: true,
    }
  });

  const products = [
    { name: 'MacBook Pro 16', sku: 'MBP16-001', barcode: '1234567890123', price: 2499.00 },
    { name: 'iPhone 15 Pro', sku: 'IP15P-128', barcode: '1234567890124', price: 999.00 },
    { name: 'Magic Keyboard', sku: 'MK-001', barcode: '1234567890125', price: 299.00 },
    { name: 'AirPods Pro', sku: 'APP-002', barcode: '1234567890126', price: 249.00 },
  ];

  for (const prod of products) {
    let existingProduct = await prisma.product.findFirst({
        where: { sku: prod.sku, companyId: company.id }
    });
    
    if (!existingProduct) {
        existingProduct = await prisma.product.create({
            data: {
                companyId: company.id,
                name: prod.name,
                sku: prod.sku,
                barcode: prod.barcode,
                price: prod.price
            }
        });

        // Add 100 units initially for each created product
        await prisma.stockMovement.create({
            data: {
                companyId: company.id,
                productId: existingProduct.id,
                locationId: location.id,
                userId: admin.id,
                type: 'IN',
                quantity: 100,
                unitCost: prod.price * 0.7, // Assume cost is 70% of price
                notes: 'Initial stock from system seed'
            }
        });

        await prisma.stockSnapshot.create({
            data: {
                companyId: company.id,
                productId: existingProduct.id,
                locationId: location.id,
                quantity: 100,
                lastCost: prod.price * 0.7
            }
        });
    }
  }

  // Seed Financial Data
  const financialAccount = await prisma.financialAccount.upsert({
    where: { id: '33333333-3333-3333-3333-333333333333' },
    update: {},
    create: {
      id: '33333333-3333-3333-3333-333333333333',
      companyId: company.id,
      name: 'Caixa Principal',
      type: 'CASH',
      balance: 0,
    }
  });

  const incomeCat = await prisma.financialCategory.upsert({
    where: { id: '44444444-4444-4444-4444-444444444444' },
    update: {},
    create: {
      id: '44444444-4444-4444-4444-444444444444',
      companyId: company.id,
      name: 'Vendas',
      type: 'INCOME',
    }
  });

  const expenseCat = await prisma.financialCategory.upsert({
    where: { id: '55555555-5555-5555-5555-555555555555' },
    update: {},
    create: {
      id: '55555555-5555-5555-5555-555555555555',
      companyId: company.id,
      name: 'Despesas Gerais',
      type: 'EXPENSE',
    }
  });

  console.log('Seed completed successfully!');
  console.log(`Company ID: ${company.id}`);
  console.log(`Admin email: admin@company.com / admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
