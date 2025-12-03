const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to get random element from array
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
// Helper to get random int
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. CLEANUP: Delete existing data in reverse order of dependency
  // Note: We use deleteMany to clear tables.
  await prisma.transaction.deleteMany({});
  await prisma.userPromotion.deleteMany({});
  await prisma.eventGuest.deleteMany({});
  await prisma.eventOrganizer.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.promotion.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Database cleaned.');

  // 2. CREATE USERS
  // Password note: Your backend compares plain text (user.password !== password).
  // For a real app, hash this! For this seed matching your code, we use plain text.
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

  // Create Regular Students (15 users to trigger pagination later)
  const students = [];
  const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];

  for (let i = 0; i < 15; i++) {
    const fname = firstNames[i % firstNames.length];
    const lname = lastNames[i % lastNames.length];
    const user = await prisma.user.create({
      data: {
        utorid: `${fname.toLowerCase().substring(0, 3)}${lname.toLowerCase().substring(0, 3)}${randomInt(10, 99)}`, // e.g., jamwil99
        name: `${fname} ${lname}`,
        email: `${fname.toLowerCase()}.${lname.toLowerCase()}@mail.utoronto.ca`,
        password: commonPassword,
        role: 'regular',
        verified: true,
        points: randomInt(100, 5000), // Give them points so they can transfer/redeem
      }
    });
    students.push(user);
  }

  console.log(`👥 Created ${students.length + 3} users.`);

  // 3. CREATE PROMOTIONS (15 items to test pagination)
  const promotions = [];
  const promoTypes = ['automatic', 'onetime'];

  for (let i = 1; i <= 15; i++) {
    const isAuto = i % 2 === 0; // Alternate types
    const promo = await prisma.promotion.create({
      data: {
        name: isAuto ? `Automatic Deal ${i}` : `One-Time Bonus ${i}`,
        description: `This is generated promotion number ${i}. Get points now!`,
        type: isAuto ? 'automatic' : 'onetime',
        startTime: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), // Started 5 days ago
        endTime: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(), // Ends in 30 days
        minSpending: isAuto ? randomInt(5, 50) : null,
        rate: isAuto ? 0.1 : null, // 10% bonus
        points: !isAuto ? 500 : null, // Flat 500 points
      }
    });
    promotions.push(promo);
  }
  console.log(`🏷️  Created ${promotions.length} promotions.`);

  // 4. CREATE EVENTS (15 items to test pagination)
  const events = [];
  const locations = ['Bahen Centre', 'Sidney Smith', 'Exam Centre', 'Student Commons', 'Varsity Stadium'];

  for (let i = 1; i <= 15; i++) {
    const event = await prisma.event.create({
      data: {
        name: `UofT Social Event ${i}`,
        description: `Come join us for event ${i}. Free food and drinks!`,
        location: random(locations),
        startTime: new Date(new Date().setDate(new Date().getDate() + i)).toISOString(), // Future dates
        endTime: new Date(new Date().setDate(new Date().getDate() + i + 1)).toISOString(),
        capacity: 100,
        points: 200, // Budget
        pointsRemain: 200,
        pointsAwarded: 0,
        published: true,
        organizers: {
          create: { userId: manager.id } // Manager organizes them
        }
      }
    });
    events.push(event);
  }
  console.log(`📅 Created ${events.length} events.`);

  // 5. CREATE TRANSACTIONS (Mix of types)
  console.log('💸 Generating transactions...');

  // A. Purchases (10 transactions)
  // Scenario: Cashier rings up students
  for (let i = 0; i < 10; i++) {
    const student = random(students);
    const spent = randomInt(10, 100);
    const awarded = Math.floor(spent * 4); // Base rate from your code

    await prisma.transaction.create({
      data: {
        type: 'purchase',
        userId: student.id,
        createdById: cashier.id,
        spent: spent,
        awarded: awarded,
        remark: 'Bookstore purchase',
        suspicious: false,
        processed: true, // Purchases are auto-processed
      }
    });
    // Update user points
    await prisma.user.update({ where: { id: student.id }, data: { points: { increment: awarded } } });
  }

  // B. Transfers (6 transactions)
  // Scenario: Student A sends points to Student B
  for (let i = 0; i < 6; i++) {
    const sender = students[i];
    const recipient = students[students.length - 1 - i]; // Pick someone else
    const amount = 50;

    // Sender Debit
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
    // Recipient Credit
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

    // Update balances
    await prisma.user.update({ where: { id: sender.id }, data: { points: { decrement: amount } } });
    await prisma.user.update({ where: { id: recipient.id }, data: { points: { increment: amount } } });
  }

  // C. Redemptions (8 transactions)
  // Scenario: Students redeeming points for prizes
  for (let i = 0; i < 8; i++) {
    const student = random(students);
    const cost = 100;

    // Half are processed, half are pending
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

    // Code subtracts points immediately upon request? 
    // Usually yes, to prevent double spend. We'll decrement.
    await prisma.user.update({ where: { id: student.id }, data: { points: { decrement: cost } } });
  }

  // D. Event Attendance (4 transactions)
  // Scenario: Student attended an event
  const targetEvent = events[0];
  for (let i = 0; i < 4; i++) {
    const student = students[i];

    // 1. Add as guest
    await prisma.eventGuest.create({
      data: { eventId: targetEvent.id, userId: student.id }
    });

    // 2. Award points (Transaction)
    const pointsAwarded = 10;
    await prisma.transaction.create({
      data: {
        type: 'event',
        userId: student.id,
        relatedId: targetEvent.id, // Links to event
        createdById: manager.id,
        awarded: pointsAwarded,
        remark: 'Attended Workshop',
      }
    });

    // Update balances
    await prisma.user.update({ where: { id: student.id }, data: { points: { increment: pointsAwarded } } });
  }

  // E. Adjustments (4 transactions)
  // Scenario: Manager fixes a mistake (Refund or Penalty)
  // We need to link to a previous transaction. Let's grab the first purchase.
  const purchaseTx = await prisma.transaction.findFirst({ where: { type: 'purchase' } });

  if (purchaseTx) {
    // 1. Positive Adjustment (We owe them points)
    await prisma.transaction.create({
      data: {
        type: 'adjustment',
        userId: purchaseTx.userId,
        relatedId: purchaseTx.id, // Linked to the purchase
        createdById: manager.id,
        awarded: 50,
        remark: 'Correction: Forgot student discount',
      }
    });
    await prisma.user.update({ where: { id: purchaseTx.userId }, data: { points: { increment: 50 } } });

    // 2. Negative Adjustment (They were overpaid)
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