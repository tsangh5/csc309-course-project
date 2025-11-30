/*
 * Complete this script so that it is able to add a superuser to the database
 * Usage example: 
 *   node prisma/createsu.js clive123 clive.su@mail.utoronto.ca SuperUser123!
 */
'use strict';

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const [, , utorid, email, password] = process.argv;

    if (!utorid || !email || !password) {
        console.error('Usage: node prisma/createsu.js <utorid> <email> <password>');
        process.exit(1);
    }

    const user = await prisma.user.create({
        data: {
            name: utorid,
            utorid,
            email,
            password,
            role: 'superuser',
            verified: true
        },
    });

    console.log('Superuser created:', user);
}

main();
