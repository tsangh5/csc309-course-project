const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  await prisma.transaction.deleteMany();
  await prisma.userPromotion.deleteMany();
  await prisma.eventGuest.deleteMany();
  await prisma.eventOrganizer.deleteMany();
  await prisma.event.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.user.deleteMany();

  const usersData = [
    { utorid: 'admin', name: 'Alice Admin', email: 'alice@mail.utoronto.ca', role: 'superuser', password: 'xK92ms' },
    { utorid: 'manager', name: 'Bob Manager', email: 'bob@mail.utoronto.ca', role: 'manager', password: 'pL41ox' },
    { utorid: 'cashier', name: 'Charlie Cashier', email: 'charlie@mail.utoronto.ca', role: 'cashier', password: 'mJ83wy' },
    { utorid: 'dave', name: 'Dave User', email: 'dave@mail.utoronto.ca', role: 'regular', password: 'qN25vz' },
    { utorid: 'eve', name: 'Eve User', email: 'eve@mail.utoronto.ca', role: 'regular', password: 'tB69rc' },
    { utorid: 'frank', name: 'Frank User', email: 'frank@mail.utoronto.ca', role: 'regular', password: 'yH14fd' },
    { utorid: 'grace', name: 'Grace User', email: 'grace@mail.utoronto.ca', role: 'regular', password: 'uG72jk' },
    { utorid: 'heidi', name: 'Heidi User', email: 'heidi@mail.utoronto.ca', role: 'regular', password: 'iV38la' },
    { utorid: 'ivan', name: 'Ivan User', email: 'ivan@mail.utoronto.ca', role: 'regular', password: 'oE56wp' },
    { utorid: 'judy', name: 'Judy User', email: 'judy@mail.utoronto.ca', role: 'regular', password: 'zX07nt' },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        utorid: u.utorid,
        name: u.name,
        email: u.email,
        role: u.role,
        password: u.password,
        verified: true,
        points: 1000,
      },
    });
    users.push(user);
    console.log(`Created user with id: ${user.id}`);
  }

  const superuser = users.find(u => u.role === 'superuser');
  const manager = users.find(u => u.role === 'manager');
  const cashier = users.find(u => u.role === 'cashier');
  const regularUsers = users.filter(u => u.role === 'regular');

  const eventsData = [
    { name: 'CSSU Gaming Night', description: 'Join us for a night of games!', location: 'BA 3200', points: 50 },
    { name: 'Exam De-stress', description: 'Relax before exams with snacks.', location: 'BA 2270', points: 20 },
    { name: 'Career Fair', description: 'Meet potential employers.', location: 'Exam Centre', points: 100 },
    { name: 'Hackathon', description: '24-hour coding challenge.', location: 'Gerstein Library', points: 500 },
    { name: 'Movie Night', description: 'Watching "The Social Network".', location: 'Innis Town Hall', points: 30 },
  ];

  const events = [];
  for (let i = 0; i < eventsData.length; i++) {
    const e = eventsData[i];
    const event = await prisma.event.create({
      data: {
        name: e.name,
        description: e.description,
        location: e.location,
        startTime: new Date(new Date().setDate(new Date().getDate() + i)), // Future dates
        endTime: new Date(new Date().setDate(new Date().getDate() + i + 1)),
        points: e.points,
        pointsRemain: e.points * 10,
        published: true,
      },
    });
    events.push(event);
    console.log(`Created event with id: ${event.id}`);
  }

  const promotionsData = [
    { name: 'Welcome Bonus', description: 'Get points for joining!', type: 'onetime', points: 100 },
    { name: 'Double Points Week', description: 'Earn double points on purchases.', type: 'automatic', rate: 2.0 },
    { name: 'Exam Season Boost', description: 'Extra points during exams.', type: 'automatic', points: 50 },
    { name: 'Summer Sale', description: 'Discounts on merch.', type: 'automatic', rate: 1.5 },
    { name: 'Referral Bonus', description: 'Refer a friend.', type: 'onetime', points: 200 },
  ];

  const promotions = [];
  for (let i = 0; i < promotionsData.length; i++) {
    const p = promotionsData[i];
    const promotion = await prisma.promotion.create({
      data: {
        name: p.name,
        description: p.description,
        type: p.type,
        startTime: new Date(),
        endTime: new Date(new Date().setDate(new Date().getDate() + 30)),
        points: p.points,
        rate: p.rate,
      },
    });
    promotions.push(promotion);
    console.log(`Created promotion with id: ${promotion.id}`);
  }

  // Create Transactions
  // At least 30 transactions with at least 2 of each type.
  // Types: purchase, redemption, adjustment, event, transfer

  const transactionTypes = ['purchase', 'redemption', 'adjustment', 'event', 'transfer'];

  //At least 2 of each type
  const initialTransactions = [];
  for (const type of transactionTypes) {
    initialTransactions.push({ type });
    initialTransactions.push({ type });
  }

  // Fill rest with random types
  while (initialTransactions.length < 30) {
    const randomType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    initialTransactions.push({ type: randomType });
  }

  for (const t of initialTransactions) {
    const randomUser = regularUsers[Math.floor(Math.random() * regularUsers.length)];
    let data = {
      type: t.type,
      userId: randomUser.id,
      createdAt: new Date(),
    };

    switch (t.type) {
      case 'purchase':
        data.spent = parseFloat((Math.random() * 50).toFixed(2));
        data.awarded = Math.floor(data.spent * 10);
        data.createdById = cashier.id;
        data.processed = true;
        data.processedById = cashier.id;
        break;
      case 'redemption':
        data.redeemed = Math.floor(Math.random() * 100);
        data.createdById = cashier.id;
        data.processed = true;
        data.processedById = cashier.id;
        break;
      case 'adjustment':
        data.awarded = Math.floor(Math.random() * 50) - 25;
        data.remark = 'Manual adjustment';
        data.createdById = manager.id;
        data.processed = true;
        data.processedById = manager.id;
        break;
      case 'event':
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        data.relatedId = randomEvent.id;
        data.awarded = randomEvent.points;
        data.createdById = manager.id;
        data.processed = true;
        data.processedById = manager.id;
        break;
      case 'transfer':
        const receiver = regularUsers.find(u => u.id !== randomUser.id);
        data.userId = receiver.id;
        data.createdById = randomUser.id;
        data.redeemed = 50;
        data.remark = `Transfer from ${randomUser.name}`;
        data.processed = true;
        break;
    }

    await prisma.transaction.create({ data });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
