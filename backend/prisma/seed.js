const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to get random element from array
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
// Helper to get random int
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. CLEANUP
  await prisma.transaction.deleteMany({});
  await prisma.userPromotion.deleteMany({});
  await prisma.eventGuest.deleteMany({});
  await prisma.eventOrganizer.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.promotion.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Database cleaned.');

  // 2. CREATE USERS
  const commonPassword = 'Password123!';

  // Create Staff
  const superuser = await prisma.user.create({
    data: {
      utorid: 'admin001',
      name: 'System Admin',
      email: 'admin.sys@mail.utoronto.ca',
      password: commonPassword,
      role: 'superuser',
      verified: true,
      points: 10000,
    }
  });

  const manager = await prisma.user.create({
    data: {
      utorid: 'manag001',
      name: 'Store Manager',
      email: 'store.manager@mail.utoronto.ca',
      password: commonPassword,
      role: 'manager',
      verified: true,
      points: 5000,
    }
  });

  const cashier = await prisma.user.create({
    data: {
      utorid: 'cash001',
      name: 'Front Desk Cashier',
      email: 'cashier.desk@mail.utoronto.ca',
      password: commonPassword,
      role: 'cashier',
      verified: true,
      points: 500,
    }
  });

  // Create Regular Students
  const students = [];
  const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];

  for (let i = 0; i < 15; i++) {
    const fname = firstNames[i % firstNames.length];
    const lname = lastNames[i % lastNames.length];
    const user = await prisma.user.create({
      data: {
        utorid: `${fname.toLowerCase().substring(0, 3)}${lname.toLowerCase().substring(0, 3)}${randomInt(10, 99)}`,
        name: `${fname} ${lname}`,
        email: `${fname.toLowerCase()}.${lname.toLowerCase()}@mail.utoronto.ca`,
        password: commonPassword,
        role: 'regular',
        verified: true,
        points: randomInt(100, 5000),
      }
    });
    students.push(user);
  }

  console.log(`👥 Created ${students.length + 3} users.`);

  // 3. CREATE PROMOTIONS
  const promotions = [];

  for (let i = 1; i <= 15; i++) {
    const isAuto = i % 2 === 0;
    const promo = await prisma.promotion.create({
      data: {
        name: isAuto ? `Automatic Deal ${i}` : `One-Time Bonus ${i}`,
        description: `This is generated promotion number ${i}. Get points now!`,
        type: isAuto ? 'automatic' : 'onetime',
        startTime: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
        endTime: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
        minSpending: isAuto ? randomInt(5, 50) : null,
        rate: isAuto ? 0.1 : null,
        points: !isAuto ? 500 : null,
      }
    });
    promotions.push(promo);
  }
  console.log(`🏷️  Created ${promotions.length} promotions.`);

  // 4. CREATE EVENTS (Updated with Lat/Long)
  const events = [];

  const predefinedLocations = [
    { name: 'Bahen Centre', lat: 43.6598045, lng: -79.3972980 },
    { name: 'Sidney Smith', lat: 43.6625230, lng: -79.3985425 },
    { name: 'Exam Centre', lat: 43.6585451, lng: -79.3929245 },
    { name: 'Student Commons', lat: 43.6585682, lng: -79.3978995 },
    { name: 'Varsity Stadium', lat: 43.6670529, lng: -79.3972706 }
  ];

  for (let i = 1; i <= 15; i++) {
    const locData = random(predefinedLocations);

    const event = await prisma.event.create({
      data: {
        name: `UofT Social Event ${i}`,
        description: `Come join us for event ${i}. Free food and drinks!`,
        location: locData.name,
        latitude: locData.lat,
        longitude: locData.lng,
        startTime: new Date(new Date().setDate(new Date().getDate() + i)).toISOString(),
        endTime: new Date(new Date().setDate(new Date().getDate() + i + 1)).toISOString(),
        capacity: 100,
        points: 200,
        pointsRemain: 200,
        pointsAwarded: 0,
        published: true,
        organizers: {
          create: { userId: manager.id }
        }
      }
    });
    events.push(event);
  }
  console.log(`📅 Created ${events.length} events with coordinates.`);

  // 5. CREATE TRANSACTIONS
  console.log('💸 Generating transactions...');

  // A. Purchases
  for (let i = 0; i < 10; i++) {
    const student = random(students);
    const spent = randomInt(10, 100);
    const awarded = Math.floor(spent * 4);

    await prisma.transaction.create({
      data: {
        type: 'purchase',
        userId: student.id,
        createdById: cashier.id,
        spent: spent,
        awarded: awarded,
        remark: 'Bookstore purchase',
        suspicious: false,
        processed: true,
      }
    });
    await prisma.user.update({ where: { id: student.id }, data: { points: { increment: awarded } } });
  }

  // B. Transfers
  for (let i = 0; i < 6; i++) {
    const sender = students[i];
    const recipient = students[students.length - 1 - i];
    const amount = 50;

    await prisma.transaction.create({
      data: {
        type: 'transfer',
        userId: sender.id,
        relatedId: recipient.id,
        createdById: sender.id,
        redeemed: amount,
        remark: 'Paying you back for lunch',
      }
    });
    await prisma.transaction.create({
      data: {
        type: 'transfer',
        userId: recipient.id,
        relatedId: sender.id,
        createdById: sender.id,
        awarded: amount,
        remark: 'Paying you back for lunch',
      }
    });

    await prisma.user.update({ where: { id: sender.id }, data: { points: { decrement: amount } } });
    await prisma.user.update({ where: { id: recipient.id }, data: { points: { increment: amount } } });
  }

  // C. Redemptions
  for (let i = 0; i < 8; i++) {
    const student = random(students);
    const cost = 100;
    const isProcessed = i % 2 === 0;

    await prisma.transaction.create({
      data: {
        type: 'redemption',
        userId: student.id,
        createdById: student.id,
        redeemed: cost,
        remark: 'Hoodie redemption',
        processed: isProcessed,
        processedById: isProcessed ? manager.id : null
      }
    });
    await prisma.user.update({ where: { id: student.id }, data: { points: { decrement: cost } } });
  }

  // D. Event Attendance
  const targetEvent = events[0];
  for (let i = 0; i < 4; i++) {
    const student = students[i];

    await prisma.eventGuest.create({
      data: { eventId: targetEvent.id, userId: student.id }
    });

    const pointsAwarded = 10;
    await prisma.transaction.create({
      data: {
        type: 'event',
        userId: student.id,
        relatedId: targetEvent.id,
        createdById: manager.id,
        awarded: pointsAwarded,
        remark: 'Attended Workshop',
      }
    });
    await prisma.user.update({ where: { id: student.id }, data: { points: { increment: pointsAwarded } } });
  }

  // E. Adjustments
  const purchaseTx = await prisma.transaction.findFirst({ where: { type: 'purchase' } });

  if (purchaseTx) {
    await prisma.transaction.create({
      data: {
        type: 'adjustment',
        userId: purchaseTx.userId,
        relatedId: purchaseTx.id,
        createdById: manager.id,
        awarded: 50,
        remark: 'Correction: Forgot student discount',
      }
    });
    await prisma.user.update({ where: { id: purchaseTx.userId }, data: { points: { increment: 50 } } });

    await prisma.transaction.create({
      data: {
        type: 'adjustment',
        userId: purchaseTx.userId,
        relatedId: purchaseTx.id,
        createdById: manager.id,
        redeemed: 20,
        remark: 'Correction: Over-awarded points',
      }
    });
    await prisma.user.update({ where: { id: purchaseTx.userId }, data: { points: { decrement: 20 } } });
  }

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });