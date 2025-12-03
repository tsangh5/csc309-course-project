#!/usr/bin/env node
'use strict';
const { PrismaClient } = require('@prisma/client');
const { expressjwt: jwtMiddleware } = require('express-jwt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const express = require('express');
const JWT_SECRET = process.env.JWT_SECRET || 'temporary_secret_for_debugging';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const cors = require('cors');

const app = express();

app.use(cors({
    origin: true, // Allow all origins for now to fix connection issues
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json({ limit: '5mb' })); //increase limit for img purposes

app.get('/', (req, res) => {
    res.status(200).send('Backend is running!');
});

app.use(
    jwtMiddleware({ secret: JWT_SECRET, algorithms: ['HS256'] })
        .unless({
            path: [
                { url: '/auth/tokens', methods: ['POST'] },
                { url: '/auth/resets', methods: ['POST'] },
                { url: /^\/auth\/resets\/[^/]+$/, methods: ['POST'] }
            ]
        })
);

if (!global.lastResetRequest) global.lastResetRequest = new Map();

const port = process.env.PORT || 8080;
const prisma = new PrismaClient();

function requireClearance(minRole) {
    const levels = { regular: 1, cashier: 2, manager: 3, superuser: 4 };

    return (req, res, next) => {
        if (!req.auth) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userLevel = levels[req.auth.role?.toLowerCase()] ?? 0;
        const requiredLevel = levels[minRole];
        if (userLevel < requiredLevel) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}

function checkName(name) {
    return (name.length > 0 && name.length <= 50)
}

function checkUtorid(utorid) {
    return (/^[a-zA-Z0-9]{7,8}$/.test(utorid))
}

function checkEmail(email) {
    return (/^[A-Za-z0-9.-]+@mail\.utoronto\.ca$/.test(email))
}

app.post('/users', requireClearance('cashier'), async (req, res) => {
    const { utorid, name, email } = req.body;

    if (!utorid || !name || !email)
        return res.status(400).json({ error: 'Missing required fields' });
    if (!checkUtorid(utorid))
        return res.status(400).json({ error: 'Invalid utorid' });
    if (!checkName(name))
        return res.status(400).json({ error: 'Invalid name length' });
    if (!checkEmail(email)) {
        return res.status(400).json({ error: 'Invalid UofT email' });
    }
    const existing = await prisma.user.findUnique({ where: { utorid } });
    if (existing)
        return res.status(409).json({ error: 'User already exists' });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const resetToken = uuidv4();

    const newUser = await prisma.user.create({
        data: {
            utorid,
            name,
            email,
            verified: false,
            expiresAt,
            resetToken,
        },
    });

    return res.status(201).json({
        id: newUser.id,
        utorid: newUser.utorid,
        name: newUser.name,
        email: newUser.email,
        verified: false,
        expiresAt: expiresAt.toISOString(),
        resetToken,
    });
});

app.get('/analytics', requireClearance('manager'), async (req, res) => {
    try {
        const getLast7DaysMap = () => {
            const map = {};
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                map[dateStr] = 0;
            }
            return map;
        };

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const revenueAgg = await prisma.transaction.aggregate({
            _sum: { spent: true },
            where: { type: 'purchase' }
        });
        const totalRevenue = revenueAgg._sum.spent || 0;

        const recentPurchases = await prisma.transaction.findMany({
            where: { createdAt: { gte: sevenDaysAgo }, type: 'purchase' },
            select: { createdAt: true, spent: true }
        });
        const revenueMap = getLast7DaysMap();
        recentPurchases.forEach(t => {
            const date = t.createdAt.toISOString().split('T')[0];
            if (revenueMap[date] !== undefined) revenueMap[date] += (t.spent || 0);
        });
        const revenueChartData = Object.keys(revenueMap).map(date => ({
            date,
            revenue: revenueMap[date],
            value: revenueMap[date]
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
        const redeemedAgg = await prisma.transaction.aggregate({
            _sum: { redeemed: true },
            where: { type: 'redemption' }
        });
        const totalPointsRedeemed = redeemedAgg._sum.redeemed || 0;

        const recentRedemptions = await prisma.transaction.findMany({
            where: { createdAt: { gte: sevenDaysAgo }, type: 'redemption' },
            select: { createdAt: true, redeemed: true }
        });
        const redemptionMap = getLast7DaysMap();
        recentRedemptions.forEach(t => {
            const date = t.createdAt.toISOString().split('T')[0];
            if (redemptionMap[date] !== undefined) redemptionMap[date] += (t.redeemed || 0);
        });
        const redemptionChartData = Object.keys(redemptionMap).map(date => ({
            date,
            value: redemptionMap[date]
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        const totalNewUsers = await prisma.user.count();

        const purchaseCount = await prisma.transaction.count({
            where: { type: 'purchase' }
        });
        const avgTransactionValue = purchaseCount > 0 ? (totalRevenue / purchaseCount) : 0;

        const purchaseCountMap = getLast7DaysMap();
        recentPurchases.forEach(t => {
            const date = t.createdAt.toISOString().split('T')[0];
            if (purchaseCountMap[date] !== undefined) purchaseCountMap[date] += 1;
        });
        const purchaseCountChartData = Object.keys(purchaseCountMap).map(date => ({
            date,
            value: purchaseCountMap[date]
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        const awardedAgg = await prisma.transaction.aggregate({
            _sum: { awarded: true }
        });
        const totalPointsAwarded = awardedAgg._sum.awarded || 0;
        const pointRedemptionRate = totalPointsAwarded > 0 ? (totalPointsRedeemed / totalPointsAwarded) * 100 : 0;

        const activeEvents = await prisma.event.findMany({
            where: { endTime: { gte: sevenDaysAgo } },
            select: { startTime: true, endTime: true }
        });
        const eventMap = getLast7DaysMap();
        Object.keys(eventMap).forEach(dateStr => {
            const dayStart = new Date(dateStr).getTime();
            const dayEnd = dayStart + (24 * 60 * 60 * 1000) - 1;

            let count = 0;
            activeEvents.forEach(e => {
                const eStart = new Date(e.startTime).getTime();
                const eEnd = new Date(e.endTime).getTime();

                if (eStart <= dayEnd && eEnd >= dayStart) {
                    count++;
                }
            });
            eventMap[dateStr] = count;
        });
        const eventChartData = Object.keys(eventMap).map(date => ({
            date,
            value: eventMap[date]
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const allTransactions = await prisma.transaction.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true }
        });
        const hourMap = new Array(24).fill(0);
        allTransactions.forEach(t => {
            const hour = new Date(t.createdAt).getHours();
            hourMap[hour] += 1;
        });
        const hourlyChartData = hourMap.map((count, hour) => ({
            label: `${hour}:00`,
            value: count
        }));


        res.json({
            totalRevenue,
            totalPointsRedeemed,
            totalNewUsers,
            avgTransactionValue,
            pointRedemptionRate,
            revenueChartData,
            eventChartData,
            redemptionChartData,
            purchaseCountChartData,
            hourlyChartData
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
});

app.get('/users', requireClearance('manager'), async (req, res) => {

    const { name, role, verified, activated, page = 1, limit = 10 } = req.query;
    const filters = {};

    if (name) {
        filters.OR = [
            { utorid: { contains: name } },
            { name: { contains: name } },
        ];
    }

    if (role) filters.role = role;

    if (verified != null) filters.verified = verified === 'true';
    if (activated != null) {
        if (activated === 'true') filters.lastLogin = { not: null };
        else if (activated === 'false') filters.lastLogin = null;
    }
    const take = parseInt(limit);
    if (isNaN(take) || take < 1)
        return res.status(400).json({ error: 'Invalid limit' });

    let skip = parseInt(page);
    if (isNaN(skip) || skip < 1)
        return res.status(400).json({ error: 'Invalid limit' });

    skip = (skip - 1) * take;

    const [count, users] = await Promise.all([
        prisma.user.count({ where: filters }),
        prisma.user.findMany({
            where: filters,
            skip,
            take,
            orderBy: { id: 'asc' },
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                suspicious: true,
                avatarUrl: true,
            },
        }),
    ]);
    return res.json({ count, results: users });
});

app.patch('/users/me/password', requireClearance('regular'), async (req, res) => {
    const { old, new: nextPass } = req.body;

    if (typeof old !== 'string' || typeof nextPass !== 'string') {
        return res.status(400).json({ error: 'Fields "old" and "new" are required strings.' });
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/.test(nextPass)) {
        return res.status(400).json({ error: 'New password must be 8-20 chars and include uppercase, lowercase, number, and special character.' });
    }

    const utorid = req.auth.utorid;
    const user = await prisma.user.findUnique({ where: { utorid } });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.password != old) return res.status(403).json({ error: 'Incorrect password' });
    const updated = await prisma.user.update({
        where: { utorid },
        data: {
            password: nextPass,
        }
    });
    return res.status(200).json({ message: "Password succesfully changed" });
});

app.patch('/users/me', requireClearance('regular'), async (req, res) => {

    const utorid = req.auth?.utorid;
    if (!utorid) return res.status(401).json({ error: 'Unauthorized' });

    const { name, email, birthday, avatar } = req.body;
    const data = {};
    if ([name, email, birthday, avatar].every(v => v == null)) {
        return res.status(400).json({ error: 'At least one of name, email, birthday, avatar must be provided' });
    }

    if (name != null && typeof name !== 'string')
        return res.status(400).json({ error: 'name must be a string' });
    if (name != null && !checkName(name))
        return res.status(400).json({ error: 'name must be 1-50 characters' });

    if (email != null && typeof email !== 'string')
        return res.status(400).json({ error: 'email must be a string' });
    if (email != null && !checkEmail(email))
        return res.status(400).json({ error: 'email must be a valid UofT address' });
    if (email != null) {
        const dupe = await prisma.user.findUnique({ where: { email } }).catch(() => null);
        if (dupe && dupe.utorid !== utorid) return res.status(409).json({ error: 'Email already in use' });
    }

    if (birthday != null && typeof birthday !== 'string')
        return res.status(400).json({ error: 'birthday must be a string' });
    if (birthday != null && !/^\d{4}-\d{2}-\d{2}$/.test(birthday))
        return res.status(400).json({ error: 'birthday must be in YYYY-MM-DD format' });

    if (birthday != null) {

        const [y, m, d] = birthday.split('-').map(Number);
        const date = new Date(Date.UTC(y, m - 1, d));
        const isValid =
            !Number.isNaN(date.getTime()) &&
            date.getUTCFullYear() === y &&
            date.getUTCMonth() === m - 1 &&
            date.getUTCDate() === d;

        if (!isValid) {
            return res.status(400).json({ error: 'birthday is not a valid calendar date' });
        }

        data.birthday = date;
    }

    if (avatar != null && typeof avatar !== 'string')
        return res.status(400).json({ error: 'avatarUrl must be a string' });

    if (name != null) data.name = name;
    if (email != null) data.email = email;
    if (avatar != null) data.avatarUrl = avatar;

    const updated = await prisma.user.update({
        where: { utorid },
        data,
        select: {
            id: true,
            utorid: true,
            name: true,
            email: true,
            birthday: true,
            role: true,
            points: true,
            createdAt: true,
            lastLogin: true,
            verified: true,
            avatarUrl: true
        }
    });
    return res.status(200).json({
        ...updated,
        birthday: updated.birthday ? new Date(updated.birthday).toISOString().slice(0, 10) : null
    });
});

app.get('/users/me', requireClearance('regular'), async (req, res) => {

    const utorid = req.auth?.utorid;
    if (!utorid) return res.status(400).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
        where: { utorid },
        select: {
            id: true,
            utorid: true,
            name: true,
            email: true,
            birthday: true,
            role: true,
            points: true,
            createdAt: true,
            lastLogin: true,
            verified: true,
            avatarUrl: true,
            promotions: true,
            organizedEvents: true,
            guestEvents: true
        }
    });
    if (!user) return res.status(400).json({ error: 'User not found' });

    return res.json(user);
});

app.post('/users/me/transactions', requireClearance('regular'), async (req, res) => {
    const me = await prisma.user.findUnique({
        where: { id: req.auth.id },
        select: { id: true, utorid: true, verified: true, points: true }
    });
    if (!me) return res.status(401).json({ message: 'Unauthorized' });

    const { type, amount, remark } = req.body || {};
    if (String(type).toLowerCase() !== 'redemption') {
        return res.status(400).json({ message: 'type must be "redemption"' });
    }

    const pts = Number(amount);
    if (!Number.isFinite(pts) || !Number.isInteger(pts) || pts <= 0) {
        return res.status(400).json({ message: 'amount must be a positive integer' });
    }

    if ((me.points ?? 0) < pts) return res.status(400).json({ message: 'Insufficient points' });

    const tx = await prisma.transaction.create({
        data: {
            type: 'redemption',
            userId: me.id,
            awarded: null,
            redeemed: pts,
            spent: null,
            remark: typeof remark === 'string' ? remark : '',
            promotionIds: JSON.stringify([]),
            createdById: me.id,
            processed: false,
            processedById: null,
            relatedId: null
        },
        select: {
            id: true
        }
    });

    return res.status(201).json({
        id: tx.id,
        utorid: me.utorid,
        type: 'redemption',
        processedBy: null,
        amount: pts,
        remark: typeof remark === 'string' ? remark : '',
        createdBy: me.utorid
    });
});

app.get('/users/me/transactions', requireClearance('regular'), async (req, res) => {
    const me = await prisma.user.findUnique({
        where: { id: req.auth.id },
        select: { id: true, utorid: true }
    });
    if (!me) return res.status(401).json({ message: 'Unauthorized' });

    const rows = await prisma.transaction.findMany({
        where: { userId: me.id },
        orderBy: { id: 'asc' },
        select: {
            id: true,
            type: true,
            awarded: true,
            redeemed: true,
            spent: true,
            remark: true,
            promotionIds: true,
            relatedId: true,
            createdAt: true,
            processed: true,
            user: { select: { id: true, utorid: true } },
            createdBy: { select: { utorid: true, suspicious: true } }
        }
    });

    const relatedUserIds = rows
        .map(r => r.relatedId)
        .filter(v => Number.isInteger(v) && v > 0);
    const relatedUsers = relatedUserIds.length
        ? await prisma.user.findMany({
            where: { id: { in: Array.from(new Set(relatedUserIds)) } },
            select: { id: true, utorid: true }
        })
        : [];
    const byId = new Map(relatedUsers.map(u => [u.id, u]));

    const results = rows.map(r => {
        let promoIds = [];
        if (r.promotionIds) {
            try { promoIds = JSON.parse(r.promotionIds) || []; } catch (_) { promoIds = []; }
        }
        const amount = (r.awarded ?? 0) - (r.redeemed ?? 0);
        const other = r.relatedId ? byId.get(r.relatedId) : null;

        const base = {
            id: r.id,
            utorid: r.user?.utorid ?? null,
            type: r.type,
            spent: r.spent ?? null,
            amount,
            promotionIds: promoIds,
            relatedId: r.relatedId ?? null,
            suspicious: !!r.createdBy?.suspicious,
            remark: r.remark ?? '',
            createdBy: r.createdBy?.utorid ?? null,
            createdAt: r.createdAt?.toISOString?.() ?? null
        };

        if (r.type === 'transfer') {
            if ((r.redeemed ?? 0) > 0) {
                return { ...base, sender: me.utorid, recipient: other?.utorid ?? null, redeemed: r.redeemed ?? 0 };
            } else {
                return { ...base, sender: other?.utorid ?? null, recipient: me.utorid, awarded: r.awarded ?? 0 };
            }
        }

        if (r.type === 'redemption') {
            return { ...base, processed: r.processed, redeemed: r.redeemed ?? 0, processedBy: null };
        }

        if (r.type === 'purchase') {
            return { ...base, awarded: r.awarded ?? 0 };
        }

        if (r.type === 'adjustment') {
            return { ...base };
        }

        if (r.type === 'event') {
            return { ...base, awarded: r.awarded ?? 0 };
        }

        return { ...base };
    });

    return res.status(200).json({
        count: results.length,
        results
    });
});

app.get('/transactions', requireClearance('cashier'), async (req, res) => {
    const { type, utorid, limit, offset } = req.query || {};
    const where = {};
    if (type) where.type = String(type).toLowerCase();
    if (utorid) where.user = { utorid: String(utorid) };

    const take = Math.max(0, Math.min(200, Number(limit) || 100));
    const skip = Math.max(0, Number(offset) || 0);

    const rows = await prisma.transaction.findMany({
        where,
        orderBy: [{ id: 'asc' }],
        take,
        skip,
        select: {
            id: true,
            type: true,
            awarded: true,
            redeemed: true,
            spent: true,
            remark: true,
            promotionIds: true,
            relatedId: true,
            createdAt: true,
            processed: true,
            processedById: true,
            user: { select: { id: true, utorid: true } },
            createdBy: { select: { utorid: true, suspicious: true } }
        }
    });

    const relatedUserIds = rows.map(r => r.relatedId).filter(v => Number.isInteger(v) && v > 0);
    const processedByIds = rows.map(r => r.processedById).filter(v => Number.isInteger(v) && v > 0);
    const idsToLoad = Array.from(new Set([...relatedUserIds, ...processedByIds]));
    const extraUsers = idsToLoad.length
        ? await prisma.user.findMany({ where: { id: { in: idsToLoad } }, select: { id: true, utorid: true } })
        : [];
    const byId = new Map(extraUsers.map(u => [u.id, u]));

    const results = rows.map(r => {
        let promoIds = [];
        if (r.promotionIds) {
            try { promoIds = JSON.parse(r.promotionIds) || []; } catch (_) { promoIds = []; }
        }
        const amount = (r.awarded ?? 0) - (r.redeemed ?? 0);
        const other = r.relatedId ? byId.get(r.relatedId) : null;
        const processedBy = r.processedById ? byId.get(r.processedById) : null;

        const base = {
            id: r.id,
            utorid: r.user?.utorid ?? null,
            type: r.type,
            spent: r.spent ?? null,
            amount,
            promotionIds: promoIds,
            relatedId: r.relatedId ?? null,
            suspicious: !!r.createdBy?.suspicious,
            remark: r.remark ?? '',
            createdBy: r.createdBy?.utorid ?? null,
            createdAt: r.createdAt?.toISOString?.() ?? null
        };

        if (r.type === 'transfer') {
            if ((r.redeemed ?? 0) > 0) {
                return { ...base, sender: r.user?.utorid ?? null, recipient: other?.utorid ?? null, redeemed: r.redeemed ?? 0 };
            } else {
                return { ...base, sender: other?.utorid ?? null, recipient: r.user?.utorid ?? null, awarded: r.awarded ?? 0 };
            }
        }

        if (r.type === 'redemption') {
            return { ...base, processed: !!r.processed, processedBy: processedBy?.utorid ?? null, redeemed: r.redeemed ?? 0 };
        }

        if (r.type === 'purchase') {
            return { ...base, awarded: r.awarded ?? 0 };
        }

        if (r.type === 'adjustment') {
            return { ...base };
        }

        if (r.type === 'event') {
            return { ...base, awarded: r.awarded ?? 0 };
        }

        return { ...base };
    });

    return res.status(200).json({ count: results.length, results });
});

app.get('/users/:userId', requireClearance('cashier'), async (req, res) => {
    const id = Number(req.params.userId);
    if (!Number.isInteger(id) || id < 0) return res.status(400).json({ error: 'Invalid user ID' });

    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            utorid: true,
            name: true,
            email: true,
            birthday: true,
            role: true,
            points: true,
            createdAt: true,
            lastLogin: true,
            verified: true,
            avatarUrl: true,
            promotions: {
                where: {
                    used: false,
                    promotion: { type: 'onetime' }
                },
                select: {
                    promotion: { select: { id: true, name: true, minSpending: true, rate: true, points: true } }
                }
            }
        }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const promos = (user.promotions || []).map(p => p.promotion);

    const role = (req.auth?.role || '').toLowerCase();
    const isManager = ['manager', 'superuser'].includes(role);

    if (!isManager) {
        return res.json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            points: user.points,
            verified: user.verified,
            promotions: promos
        });
    }

    return res.json({
        id: user.id,
        utorid: user.utorid,
        name: user.name,
        email: user.email,
        birthday: user.birthday ? new Date(user.birthday).toISOString().slice(0, 10) : null,
        role: user.role,
        points: user.points,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        verified: user.verified,
        avatarUrl: user.avatarUrl,
        promotions: promos
    });
});



app.patch('/users/:userId', requireClearance('manager'), async (req, res) => {
    const id = Number(req.params.userId);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    const allowed = ['email', 'verified', 'suspicious', 'role'];
    const keys = Object.keys(req.body || {});
    if (keys.length === 0) {
        return res.status(400).json({ error: 'Empty body' });
    }
    if (!keys.every(k => allowed.includes(k))) {
        return res.status(400).json({ error: 'Unexpected field(s) in body' });
    }

    let { email, verified, suspicious, role } = req.body;

    const data = {};

    if (verified != null) {
        if (verified === 'true' || verified === true) data.verified = true;
        else {
            return res.status(400).json({ error: 'verified must be true' })
        }
    }

    if (suspicious != null) {
        if (suspicious === 'true' || suspicious === true) data.suspicious = true;
        else if (suspicious === 'false' || suspicious === false) data.suspicious = false;
        else {
            return res.status(400).json({ error: 'suspicious must be a boolean' })
        }
    }

    if (email != null) {
        if (checkEmail(email)) {
            const dupe = await prisma.user.findUnique({ where: { email } }).catch(() => null);
            if (dupe && dupe.id !== id) return res.status(409).json({ error: 'Email already in use' });
            data.email = email;
        } else {
            return res.status(400).json({ error: 'Invalid University of Toronto email' });
        }
    }

    if (role != null) {
        if (typeof role !== 'string') {
            return res.status(400).json({ error: 'role must be a string' });
        }
        role = role.toLowerCase();
        const validRoles = new Set(['regular', 'cashier', 'manager', 'superuser']);
        if (!validRoles.has(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
    }

    const current = await prisma.user.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: 'User not found' });

    if (role != null) {
        const callerRole = String(req.auth?.role || '').toLowerCase();
        const managerAllowed = new Set(['regular', 'cashier']);
        const superAllowed = new Set(['regular', 'cashier', 'manager', 'superuser']);
        const canSet = callerRole === 'superuser' ? superAllowed.has(role) : managerAllowed.has(role);
        if (!canSet) {
            return res.status(403).json({ error: 'Forbidden: cannot set this role' });
        }
        data.role = role;
    }

    const nextSuspicious = data.suspicious != null ? data.suspicious : current.suspicious;
    if (role === 'cashier' && nextSuspicious === true) {
        return res.status(400).json({ error: 'Suspicious user cannot be a cashier' });
    }

    const updated = await prisma.user.update({
        where: { id },
        data,
        select: {
            id: true,
            utorid: true,
            name: true,
            email: data.email !== undefined,
            verified: data.verified !== undefined,
            suspicious: data.suspicious !== undefined,
            role: data.role !== undefined,
        },
    });

    return res.json(updated);
});

app.post('/users/:userId/transactions', requireClearance('regular'), async (req, res) => {
    const recipientId = Number(req.params.userId);
    if (!Number.isInteger(recipientId) || recipientId <= 0) return res.status(400).json({ error: 'userId must be a positive integer' });

    const { type, amount, remark } = req.body || {};
    if (String(type).toLowerCase() !== 'transfer') return res.status(400).json({ error: 'type must be "transfer"' });

    const pts = Number(amount);
    if (!Number.isFinite(pts) || !Number.isInteger(pts) || pts <= 0) return res.status(400).json({ error: 'amount must be a positive integer' });

    const senderId = req.auth?.id;
    if (!senderId) return res.status(401).json({ error: 'Unauthorized' });
    if (senderId === recipientId) return res.status(400).json({ error: 'Cannot transfer to self' });

    const [sender, recipient] = await Promise.all([
        prisma.user.findUnique({
            where: { id: senderId },
            select: {
                id: true,
                utorid: true,
                verified: true,
                points: true
            }
        }),
        prisma.user.findUnique({
            where: { id: recipientId },
            select: {
                id: true,
                utorid: true,
                points: true
            }
        }),
    ]);

    if (!sender) return res.status(401).json({ error: 'Unauthorized' });
    if (!recipient) return res.status(404).json({ error: 'User not found' });
    if (!sender.verified) return res.status(403).json({ error: 'Forbidden' });
    if ((sender.points ?? 0) < pts) return res.status(400).json({ error: 'Insufficient points' });

    const created = await prisma.$transaction(async (tx) => {
        const debit = await tx.transaction.create({
            data: {
                type: 'transfer',
                relatedId: recipient.id,
                userId: sender.id,
                redeemed: pts,
                remark: remark ?? '',
                createdById: sender.id,
            },
            select: { id: true },
        });

        await tx.user.update({
            where: { id: sender.id },
            data: { points: { decrement: pts } }
        });

        await tx.transaction.create({
            data: {
                type: 'transfer',
                relatedId: sender.id,
                userId: recipient.id,
                awarded: pts,
                remark: remark ?? '',
                createdById: sender.id,
            },
            select: { id: true },
        });

        await tx.user.update({
            where: { id: recipient.id },
            data: { points: { increment: pts } }
        });

        return debit;
    });

    return res.status(201).json({
        id: created.id,
        sender: sender.utorid,
        recipient: recipient.utorid,
        type: 'transfer',
        sent: pts,
        remark: remark ?? '',
        createdBy: sender.utorid,
    });
});

app.post('/auth/tokens', async (req, res) => {
    const { utorid, password } = req.body;

    if (!utorid || !password) {
        return res.status(400).json({ error: 'Missing utorid or password' });
    }

    const user = await prisma.user.findUnique({ where: { utorid } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.password !== password) {
        return res.status(401).json({ error: 'Incorrect password' });
    }

    const payload = {
        id: user.id,
        utorid: user.utorid,
        role: user.role,
    };

    const expiresIn = '7d';
    const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256', expiresIn });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
        where: { utorid },
        data: { lastLogin: new Date() },
    });

    return res.json({
        token,
        expiresAt: expiresAt.toISOString(),
    });
});

app.post('/auth/resets', async (req, res) => {
    try {
        const { utorid } = req.body;
        if (!utorid)
            return res.status(400).json({ error: 'Missing utorid' });

        const now = Date.now();
        const last = global.lastResetRequest.get(req.ip) || 0;

        if (now - last < 60 * 1000) {
            return res.status(429).json({ error: 'Too many requests. Please wait 60 seconds.' });
        }

        const user = await prisma.user.findUnique({
            where: { utorid },
        });

        if (!user) {
            return res.status(404).json({ message: 'utorid does not exist' });
        }

        const expiresAt = new Date(now + 60 * 60 * 1000);
        const resetToken = uuidv4();

        await prisma.user.update({
            where: { id: user.id },
            data: {
                expiresAt,
                resetToken,
            },
        });

        global.lastResetRequest.set(req.ip, now);

        return res.status(202).json({
            expiresAt: expiresAt.toISOString(),
            resetToken
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
})

app.post('/auth/resets/:resetToken', async (req, res) => {
    const { utorid, password } = req.body;
    const resetToken = req.params.resetToken;

    if (!resetToken)
        return res.status(404).json({ error: 'Missing reset token' })

    if (!utorid || !password)
        return res.status(400).json({ error: 'Missing required fields' });

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,20}$/;
    if (!passRegex.test(password))
        return res.status(400).json({ error: 'Password must have: at least 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character, and be between 8 and 20 characters long' });

    const user = await prisma.user.findFirst({
        where: { resetToken },
    });

    if (!user)
        return res.status(404).json({ error: 'Invalid utorid' });

    if (user.utorid !== utorid)
        return res.status(401).json({ error: 'Mismatch token' });

    const now = new Date();
    if (!user.expiresAt || user.expiresAt < now)
        return res.status(410).json({ error: 'Reset token expired' });

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password,
            resetToken: null,
            expiresAt: null,
        },
    });

    return res.status(200).json({ message: 'Password reset successfully' });
});

app.post('/events', requireClearance('manager'), async (req, res) => {
    const {
        name,
        description,
        location,
        startTime,
        endTime,
        capacity,
        points
    } = req.body || {};

    if (!name) return res.status(400).json({ error: 'name is required' });
    if (!description) return res.status(400).json({ error: 'description is required' });
    if (!location) return res.status(400).json({ error: 'location is required' });
    if (!startTime) return res.status(400).json({ error: 'startTime is required (ISO 8601)' });
    if (!endTime) return res.status(400).json({ error: 'endTime is required (ISO 8601)' });
    if (points === undefined || points === null)
        return res.status(400).json({ error: 'points is required' });

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()))
        return res.status(400).json({ error: 'startTime must be ISO 8601' });
    if (isNaN(end.getTime()))
        return res.status(400).json({ error: 'endTime must be ISO 8601' });
    if (end <= start)
        return res.status(400).json({ error: 'endTime must be after startTime' });

    const parsedPoints = Number(points);
    if (!Number.isInteger(parsedPoints) || parsedPoints <= 0)
        return res.status(400).json({ error: 'points must be a positive integer' });

    let parsedCapacity = null;
    if (capacity !== null && capacity !== undefined) {
        if (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0) {
            return res.status(400).json({ error: 'capacity must be a positive integer or null' });
        }
        parsedCapacity = Number(capacity);
    }

    const created = await prisma.event.create({
        data: {
            name,
            description,
            location,
            startTime: start,
            endTime: end,
            capacity: parsedCapacity,
            points: parsedPoints,
            pointsRemain: parsedPoints,
        },
        select: {
            id: true,
            name: true,
            description: true,
            location: true,
            startTime: true,
            endTime: true,
            capacity: true,
            pointsRemain: true,
            pointsAwarded: true,
            published: true,
            organizers: true,
            guests: true,
        },
    });

    return res.status(201).json(created);
});

app.get('/events', requireClearance('regular'), async (req, res) => {
    const role = (req.auth?.role || '').toLowerCase();
    const isManager = role === 'manager' || role === 'superuser';

    let {
        name,
        location,
        started,
        ended,
        showFull,
        page = 1,
        limit = 10,
        published
    } = req.query || {};

    const pageNum = Number(page);
    const limitNum = Number(limit);
    if (!Number.isInteger(pageNum) || pageNum < 1)
        return res.status(400).json({ error: 'Invalid page number' });
    if (!Number.isInteger(limitNum) || limitNum < 1)
        return res.status(400).json({ error: 'Invalid limit' });

    if (started != null && ended != null)
        return res.status(400).json({ error: 'Cannot specify both started and ended' });

    const where = {};
    if (name) where.name = { contains: String(name) };
    if (location) where.location = { contains: String(location) };

    const now = new Date();
    const toBool = v => (typeof v === 'string' ? v.toLowerCase() === 'true' : !!v);

    if (started != null) {
        const s = toBool(started);
        where.startTime = s ? { lte: now } : { gt: now };
    }
    if (ended != null) {
        const e = toBool(ended);
        where.endTime = e ? { lte: now } : { gt: now };
    }

    if (!isManager) {
        where.published = true;
    } else if (published != null) {
        where.published = toBool(published);
    }

    const events = await prisma.event.findMany({
        where,
        orderBy: { id: 'asc' },
        select: {
            id: true,
            name: true,
            location: true,
            startTime: true,
            endTime: true,
            capacity: true,
            pointsRemain: true,
            pointsAwarded: true,
            published: true,
        }
    });

    const ids = events.map(e => e.id);
    const countsById = {};
    for (const id of ids) {
        const c = await prisma.eventGuest.count({ where: { eventId: id } });
        countsById[id] = c;
    }

    const showFullBool = toBool(showFull);
    let filtered = events.filter(e => {
        const numGuests = countsById[e.id] || 0;
        const isFull = (e.capacity != null) && (numGuests >= e.capacity);
        return showFullBool ? true : !isFull;
    });

    const total = filtered.length;

    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    filtered = filtered.slice(start, end);

    const results = filtered.map(e => {
        const base = {
            id: e.id,
            name: e.name,
            location: e.location,
            startTime: e.startTime,
            endTime: e.endTime,
            capacity: e.capacity,
            numGuests: countsById[e.id] || 0,
        };
        if (isManager) {
            base.pointsRemain = e.pointsRemain;
            base.pointsAwarded = e.pointsAwarded || 0;
            base.published = !!e.published;
        }
        return base;
    });

    return res.json({ count: total, results });

});

app.post('/events/:eventId/organizers', requireClearance('manager'), async (req, res) => {
    const { eventId } = req.params;
    const { utorid } = req.body || {};

    const idNum = Number(eventId);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        return res.status(400).json({ error: 'eventId must be a positive integer' });
    }
    if (!utorid || typeof utorid !== 'string') {
        return res.status(400).json({ error: 'utorid is required' });
    }

    const event = await prisma.event.findUnique({
        where: { id: idNum },
        select: { id: true, name: true, location: true, endTime: true }
    });
    if (!event) return res.status(404).json({ error: 'event not found' });

    const now = new Date();
    if (event.endTime <= now) {
        return res.status(410).json({ error: 'event has ended' });
    }

    const user = await prisma.user.findUnique({
        where: { utorid },
    });
    if (!user) return res.status(404).json({ error: 'user not found' });

    const existingGuest = await prisma.eventGuest.findFirst({
        where: { eventId: event.id, userId: user.id },
    });

    if (existingGuest) {
        return res.status(400).json({
            error: 'user is registered as a guest; remove them as a guest first, then retry'
        });
    }

    const existingOrganizer = await prisma.eventOrganizer.findFirst({
        where: { eventId: event.id, userId: user.id },
    });

    if (!existingOrganizer) {
        await prisma.eventOrganizer.create({
            data: { eventId: event.id, userId: user.id }
        });
    }

    const eventWithOrganizers = await prisma.event.findUnique({
        where: { id: event.id },
        select: {
            id: true,
            name: true,
            location: true,
            organizers: {
                select: {
                    id: true,
                    user: {
                        select: { utorid: true, name: true }
                    }
                }
            }
        }
    });

    const response = {
        id: eventWithOrganizers.id,
        name: eventWithOrganizers.name,
        location: eventWithOrganizers.location,
        organizers: eventWithOrganizers.organizers.map(o => ({
            id: o.id,
            utorid: o.user.utorid,
            name: o.user.name
        }))
    };

    return res.status(201).json(response);
});

app.post('/events/:eventId/guests', requireClearance('regular'), async (req, res) => {
    const { eventId } = req.params
    const { utorid } = req.body || {}

    const idNum = Number(eventId)
    if (!Number.isInteger(idNum) || idNum <= 0) {
        return res.status(400).json({ error: 'eventId must be a positive integer' })
    }
    if (!utorid || typeof utorid !== 'string') {
        return res.status(400).json({ error: 'utorid is required' })
    }

    const event = await prisma.event.findUnique({
        where: { id: idNum },
        select: { id: true, name: true, location: true, endTime: true, capacity: true }
    })
    if (!event) {
        return res.status(404).json({ error: 'Event not found.' })
    }

    const user = await prisma.user.findUnique({
        where: { utorid },
        select: { id: true, utorid: true, name: true }
    })
    if (!user) {
        return res.status(404).json({ error: 'User not found.' })
    }

    const role = (req.auth?.role || '').toLowerCase()
    let allowed = role === 'manager' || role === 'superuser'
    if (!allowed) {
        const organizer = await prisma.eventOrganizer.findFirst({
            where: { eventId: event.id, userId: req.auth.id }
        })
        allowed = !!organizer
    }
    if (!allowed) {
        return res.status(403).json({ error: 'forbidden' })
    }

    const existingOrganizer = await prisma.eventOrganizer.findFirst({
        where: { eventId: event.id, userId: user.id }
    })
    if (existingOrganizer) {
        return res.status(400).json({ error: 'Cannot add organizer as guest.' })
    }

    const now = new Date()
    if (event.endTime && now >= event.endTime) {
        return res.status(410).json({ error: 'Cannot add guest after event end.' })
    }

    if (event.capacity != null) {
        const numGuests = await prisma.eventGuest.count({ where: { eventId: event.id } })
        if (numGuests >= event.capacity) {
            return res.status(410).json({ error: 'Event is at full capacity.' })
        }
    }

    const existingGuest = await prisma.eventGuest.findFirst({
        where: { eventId: event.id, userId: user.id }
    })
    if (!existingGuest) {
        await prisma.eventGuest.create({ data: { eventId: event.id, userId: user.id } })
    }

    const numGuestsNow = await prisma.eventGuest.count({ where: { eventId: event.id } })

    return res.status(201).json({
        id: event.id,
        name: event.name,
        location: event.location,
        guestAdded: { id: user.id, utorid: user.utorid, name: user.name },
        numGuests: numGuestsNow
    })
})

app.delete('/events/:eventId/organizers/:userId', requireClearance('manager'), async (req, res) => {
    const { eventId, userId } = req.params;

    const idNum = Number(eventId);
    const userIdNum = Number(userId);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        return res.status(400).json({ error: 'eventId must be a positive integer' });
    }
    if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
        return res.status(400).json({ error: 'userId must be a positive integer' });
    }

    const event = await prisma.event.findUnique({
        where: { id: idNum },
        select: { id: true }
    });
    if (!event) {
        return res.status(404).json({ error: 'Event not found.' });
    }

    const user = await prisma.user.findUnique({
        where: { id: userIdNum },
        select: { id: true }
    });
    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    const existing = await prisma.eventOrganizer.findFirst({
        where: { eventId: event.id, userId: user.id },
        select: { id: true }
    });
    if (!existing) {
        return res.status(404).json({ error: 'Organizer not found.' });
    }

    await prisma.eventOrganizer.delete({
        where: { id: existing.id }
    });

    return res.status(204).send();
});

app.get('/events/:eventId', requireClearance('regular'), async (req, res) => {
    const idNum = Number(req.params.eventId)
    if (!Number.isInteger(idNum) || idNum <= 0) {
        return res.status(400).json({ error: 'eventId must be a positive integer' })
    }

    let event = await prisma.event.findUnique({
        where: { id: idNum },
        select: {
            id: true,
            name: true,
            description: true,
            location: true,
            startTime: true,
            endTime: true,
            capacity: true,
            pointsRemain: true,
            pointsAwarded: true,
            published: true
        }
    })
    if (!event) {
        return res.status(404).json({ error: 'Event not found.' })
    }

    const role = (req.auth?.role || '').toLowerCase()
    let canView = event.published || role === 'manager' || role === 'superuser'
    if (!canView) {
        const [isOrg, isGuest] = await Promise.all([
            prisma.eventOrganizer.findFirst({ where: { eventId: event.id, userId: req.auth.id } }),
            prisma.eventGuest.findFirst({ where: { eventId: event.id, userId: req.auth.id } })
        ])
        canView = !!isOrg || !!isGuest
    }
    if (!canView) {
        return res.status(404).json({ error: 'Event not found.' })
    }

    const [orgs, guests, guestCount] = await Promise.all([
        prisma.eventOrganizer.findMany({
            where: { eventId: event.id },
            select: { user: { select: { id: true, utorid: true, name: true } } },
            orderBy: { id: 'asc' }
        }),
        prisma.eventGuest.findMany({
            where: { eventId: event.id },
            select: { user: { select: { id: true, utorid: true, name: true } } },
            orderBy: { id: 'asc' }
        }),
        prisma.eventGuest.count({ where: { eventId: event.id } })
    ])

    const out = {
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        capacity: event.capacity,
        organizers: orgs.map(o => ({ id: o.user.id, utorid: o.user.utorid, name: o.user.name })),
        guests: guests.map(g => ({ id: g.user.id, utorid: g.user.utorid, name: g.user.name })),
        numGuests: guestCount
    }

    const isManager = role === 'manager' || role === 'superuser'
    if (isManager) {
        out.pointsRemain = event.pointsRemain
        out.pointsAwarded = event.pointsAwarded || 0
        out.published = !!event.published
    }

    return res.json(out)
})



app.delete('/events/:eventId', requireClearance('manager'), async (req, res) => {
    const { eventId } = req.params;
    const idNum = Number(eventId);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        return res.status(400).json({ error: 'eventId must be a positive integer' });
    }

    const event = await prisma.event.findUnique({
        where: { id: idNum },
        select: { id: true, published: true }
    });
    if (!event) {
        return res.status(404).json({ error: 'Event not found.' });
    }
    if (event.published) {
        return res.status(400).json({ error: 'Cannot delete published event.' });
    }

    await prisma.eventGuest.deleteMany({ where: { eventId: event.id } });
    await prisma.eventOrganizer.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });

    return res.status(204).send();
});

app.post('/events/:eventId/guests/me', requireClearance('regular'), async (req, res) => {
    const { eventId } = req.params
    const idNum = Number(eventId)
    if (!Number.isInteger(idNum) || idNum <= 0) {
        return res.status(400).json({ error: 'eventId must be a positive integer' })
    }

    const event = await prisma.event.findUnique({
        where: { id: idNum },
        select: { id: true, name: true, location: true, endTime: true, capacity: true }
    })
    if (!event) {
        return res.status(404).json({ error: 'Event not found.' })
    }

    const me = await prisma.user.findUnique({
        where: { id: req.auth.id },
        select: { id: true, utorid: true, name: true }
    })
    if (!me) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const now = new Date()
    if (event.endTime && now >= event.endTime) {
        return res.status(410).json({ error: 'Cannot add guest after event end.' })
    }

    const isOrganizer = await prisma.eventOrganizer.findFirst({
        where: { eventId: event.id, userId: me.id }
    })
    if (isOrganizer) {
        return res.status(400).json({ error: 'Cannot add organizer as guest.' })
    }

    if (event.capacity != null) {
        const numGuests = await prisma.eventGuest.count({ where: { eventId: event.id } })
        if (numGuests >= event.capacity) {
            return res.status(410).json({ error: 'Event is at full capacity.' })
        }
    }

    const existingGuest = await prisma.eventGuest.findFirst({
        where: { eventId: event.id, userId: me.id }
    })
    if (!existingGuest) {
        await prisma.eventGuest.create({ data: { eventId: event.id, userId: me.id } })
    }

    const numGuestsNow = await prisma.eventGuest.count({ where: { eventId: event.id } })

    return res.status(201).json({
        id: event.id,
        name: event.name,
        location: event.location,
        guestAdded: { id: me.id, utorid: me.utorid, name: me.name },
        numGuests: numGuestsNow
    })
})

app.post('/events/:eventId/transactions', requireClearance('regular'), async (req, res) => {
    const { eventId } = req.params
    const { type, utorid, amount, remark } = req.body || {}
    const idNum = Number(eventId)
    if (!Number.isInteger(idNum) || idNum <= 0) {
        return res.status(400).json({ error: 'eventId must be a positive integer' })
    }
    if (type !== 'event') {
        return res.status(400).json({ error: 'Invalid type.' })
    }
    const role = (req.auth?.role || '').toLowerCase()
    const isManager = role === 'manager' || role === 'superuser'
    if (!isManager) {
        return res.status(403).json({ error: 'Permission denied.' })
    }
    const event = await prisma.event.findUnique({
        where: { id: idNum },
        select: { id: true, pointsRemain: true, pointsAwarded: true }
    })
    if (!event) {
        return res.status(404).json({ error: 'Event not found.' })
    }
    const amt = Number(amount)
    if (!Number.isFinite(amt) || !Number.isInteger(amt) || amt <= 0) {
        return res.status(400).json({ error: 'Invalid points.' })
    }
    const creator = await prisma.user.findUnique({
        where: { id: req.auth.id },
        select: { id: true, utorid: true }
    })
    if (!creator) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    if (utorid == null) {
        const guests = await prisma.eventGuest.findMany({
            where: { eventId: event.id },
            select: { user: { select: { id: true, utorid: true } } },
            orderBy: { id: 'asc' }
        })
        const n = guests.length
        const total = amt * n
        if (n === 0) {
            return res.status(400).json({ error: 'User is not a guest.' })
        }
        if (event.pointsRemain < total) {
            return res.status(400).json({ error: 'Invalid points.' })
        }
        const created = []
        for (const g of guests) {
            const t = await prisma.transaction.create({
                data: {
                    type: 'event',
                    relatedId: event.id,
                    userId: g.user.id,
                    awarded: amt,
                    remark: remark ?? null,
                    createdById: creator.id
                },
                select: { id: true }
            })
            await prisma.user.update({ where: { id: g.user.id }, data: { points: { increment: amt } } });
            created.push({ id: t.id, recipient: g.user.utorid, awarded: amt, type: 'event', relatedId: event.id, remark: remark ?? null, createdBy: creator.utorid })
        }
        await prisma.event.update({
            where: { id: event.id },
            data: { pointsRemain: { decrement: total }, pointsAwarded: { increment: total } }
        })
        return res.status(201).json(created)
    } else {
        const user = await prisma.user.findUnique({
            where: { utorid: String(utorid) },
            select: { id: true, utorid: true }
        })
        if (!user) {
            return res.status(404).json({ error: 'User not found.' })
        }
        const isGuest = await prisma.eventGuest.findFirst({
            where: { eventId: event.id, userId: user.id }
        })
        if (!isGuest) {
            return res.status(400).json({ error: 'User is not a guest.' })
        }
        if (event.pointsRemain < amt) {
            return res.status(400).json({ error: 'Invalid points.' })
        }
        const t = await prisma.transaction.create({
            data: {
                type: 'event',
                relatedId: event.id,
                userId: user.id,
                awarded: amt,
                remark: remark ?? null,
                createdById: creator.id
            },
            select: { id: true }
        })
        await prisma.event.update({
            where: { id: event.id },
            data: { pointsRemain: { decrement: amt }, pointsAwarded: { increment: amt } }
        })
        await prisma.user.update({ where: { id: user.id }, data: { points: { increment: amt } } });

        return res.status(201).json({ id: t.id, recipient: user.utorid, awarded: amt, type: 'event', relatedId: event.id, remark: remark ?? null, createdBy: creator.utorid })
    }
})


app.delete('/events/:eventId/guests/me', requireClearance('regular'), async (req, res) => {
    const { eventId } = req.params
    const idNum = Number(eventId)
    if (!Number.isInteger(idNum) || idNum <= 0) {
        return res.status(400).json({ error: 'eventId must be a positive integer' })
    }

    const event = await prisma.event.findUnique({
        where: { id: idNum },
        select: { id: true, endTime: true }
    })
    if (!event) {
        return res.status(404).json({ error: 'Event not found.' })
    }

    const me = await prisma.user.findUnique({
        where: { id: req.auth.id },
        select: { id: true }
    })
    if (!me) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const now = new Date()
    if (event.endTime && now >= event.endTime) {
        return res.status(410).json({ error: 'Cannot delete guest after event end.' })
    }

    const existingGuest = await prisma.eventGuest.findFirst({
        where: { eventId: event.id, userId: me.id },
        select: { id: true }
    })
    if (!existingGuest) {
        return res.status(404).json({ error: 'Guest not found.' })
    }

    await prisma.eventGuest.delete({ where: { id: existingGuest.id } })
    return res.status(204).send()
})

app.patch('/events/:eventId', requireClearance('regular'), async (req, res) => {
    const idNum = Number(req.params.eventId);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        return res.status(400).json({ error: 'eventId must be a positive integer' });
    }

    const { name, description, location, startTime, endTime, capacity, points, published } = req.body || {};

    const event = await prisma.event.findUnique({
        where: { id: idNum },
    });

    if (!event) return res.status(404).json({ error: 'event not found' });

    const userId = req.auth.id;
    const role = req.auth.role.toLowerCase();

    const isManager = role === 'manager' || role === 'superuser';

    let isOrganizer = false;
    if (!isManager) {
        const organizer = await prisma.eventOrganizer.findFirst({
            where: { eventId: event.id, userId },
        });
        isOrganizer = !!organizer;
    }

    if (!isManager && !isOrganizer) {
        return res.status(403).json({ error: 'forbidden' });
    }

    const now = new Date();

    const data = {};
    const updatedFields = new Set();

    let newStart = event.startTime;
    let newEnd = event.endTime;

    if (startTime != null) {
        const d = new Date(startTime);
        if (isNaN(d.getTime())) return res.status(400).json({ error: 'startTime must be ISO 8601' });
        if (d < now) return res.status(400).json({ error: 'startTime cannot be in the past' });
        newStart = d;
    }

    if (endTime != null) {
        const d = new Date(endTime);
        if (isNaN(d.getTime())) return res.status(400).json({ error: 'endTime must be ISO 8601' });
        if (d < now) return res.status(400).json({ error: 'endTime cannot be in the past' });
        newEnd = d;
    }

    if (newEnd <= newStart) {
        return res.status(400).json({ error: 'endTime must be after startTime' });
    }

    const originalStarted = now >= event.startTime;
    const originalEnded = now >= event.endTime;

    if (originalStarted) {
        if (name != null || description != null || location != null ||
            startTime != null || capacity != null) {
            return res.status(400).json({
                error: 'cannot update name, description, location, startTime, or capacity after the original start time has passed',
            });
        }
    }

    if (originalEnded && endTime != null) {
        return res.status(400).json({ error: 'cannot update endTime after the original end time has passed' });
    }

    if (capacity != null) {
        if (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0) {
            return res.status(400).json({ error: 'capacity must be a positive integer' });
        }
        const cap = Number(capacity);

        if (event.capacity !== null && cap < event.capacity) {
            const confirmedGuests = await prisma.eventGuest.count({ where: { eventId: event.id } });
            if (cap < confirmedGuests) {
                return res.status(400).json({
                    error: 'capacity cannot be reduced below the current number of confirmed guests',
                });
            }
        }

        data.capacity = cap;
        updatedFields.add('capacity');
    }

    if (name != null) { data.name = String(name); updatedFields.add('name'); }
    if (description != null) { data.description = String(description); updatedFields.add('description'); }
    if (location != null) { data.location = String(location); updatedFields.add('location'); }

    if (startTime != null) { data.startTime = newStart; updatedFields.add('startTime'); }
    if (endTime != null) { data.endTime = newEnd; updatedFields.add('endTime'); }

    if (points != null) {
        if (!isManager) return res.status(403).json({ error: 'only managers can update points' });
        const newPoints = Number(points);
        if (!Number.isInteger(newPoints) || newPoints <= 0) {
            return res.status(400).json({ error: 'points must be a positive integer' });
        }
        const delta = newPoints - event.points;

        if (delta < 0 && event.pointsRemain + delta < 0) {
            return res.status(400).json({
                error: 'total points cannot be reduced below the amount already allocated (pointsRemain would go below zero)',
            });
        }

        data.points = newPoints;
        data.pointsRemain = event.pointsRemain + delta;
        updatedFields.add('points');
    }

    if (published != null) {
        if (!isManager) return res.status(403).json({ error: 'only managers can set published' });
        if (published !== true && published !== 'true') {
            return res.status(400).json({ error: 'published can only be set to true' });
        }
        data.published = true;
        updatedFields.add('published');
    }

    if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'no valid fields to update' });
    }

    const updated = await prisma.event.update({
        where: { id: event.id },
        data,
    });

    const response = {
        id: updated.id,
        name: updated.name,
        location: updated.location,
    };

    if (updatedFields.has('description')) response.description = updated.description;
    if (updatedFields.has('startTime')) response.startTime = updated.startTime.toISOString();
    if (updatedFields.has('endTime')) response.endTime = updated.endTime.toISOString();
    if (updatedFields.has('capacity')) response.capacity = updated.capacity;
    if (updatedFields.has('points')) {
        response.pointsRemain = updated.pointsRemain;
        response.pointsAwarded = updated.pointsAwarded || 0;
    }
    if (updatedFields.has('published')) response.published = updated.published;

    return res.status(200).json(response);

});

app.post('/transactions', requireClearance('regular'), async (req, res) => {
    const { utorid, type, spent, promotionIds, amount, remark } = req.body || {}

    if (!utorid || typeof utorid !== 'string') return res.status(400).json({ message: 'utorid is required' })
    if (type !== 'purchase' && type !== 'adjustment') return res.status(400).json({ message: 'Invalid type.' })

    const role = (req.auth?.role || '').toLowerCase()
    const isCashierPlus = role === 'cashier' || role === 'manager' || role === 'superuser'
    const isManagerPlus = role === 'manager' || role === 'superuser'

    if (type === 'purchase' && !isCashierPlus) return res.status(403).json({ message: 'Permission denied.' })
    if (type === 'adjustment' && !isManagerPlus) return res.status(403).json({ message: 'Permission denied.' })

    const user = await prisma.user.findUnique({
        where: { utorid },
        select: {
            id: true,
            utorid: true,
            points: true
        }
    })
    if (!user) return res.status(404).json({ message: 'User not found.' })

    const creator = await prisma.user.findUnique({
        where: { id: req.auth.id },
        select: {
            id: true,
            utorid: true,
            suspicious: true
        }
    })
    if (!creator) return res.status(401).json({ message: 'Unauthorized' })

    if (type === 'purchase') {
        const spentNum = Number(spent)
        if (!Number.isFinite(spentNum) || spentNum <= 0) return res.status(400).json({ message: 'Spent must be a positive number' })

        const autoPromos = await prisma.promotion.findMany({
            where: { type: 'automatic' },
            select: {
                id: true,
                minSpending: true,
                rate: true,
                points: true
            }
        })
        let computedEarned = Math.floor(spentNum * 4)
        for (const p of autoPromos) {
            const meetsMin = p.minSpending == null || Number(spentNum) >= Number(p.minSpending)
            if (meetsMin) {
                if (p.rate != null) computedEarned += Math.floor(spentNum * Number(p.rate) * 100)
                if (p.points != null) computedEarned += Number(p.points)
            }
        }

        const ids = Array.isArray(promotionIds) ? promotionIds.map(Number) : []
        if (ids.some(x => !Number.isInteger(x) || x <= 0)) return res.status(400).json({ message: 'Invalid promotion' })

        if (ids.length > 0) {
            const promos = await prisma.promotion.findMany({
                where: { id: { in: ids } },
                select: {
                    id: true,
                    type: true,
                    minSpending: true,
                    rate: true,
                    points: true
                }
            })
            if (promos.length !== ids.length) return res.status(400).json({ message: 'Invalid promotion' })
            for (const p of promos) {
                if (p.type !== 'onetime') return res.status(400).json({ message: 'Invalid promotion' })
                const link = await prisma.userPromotion.findFirst({
                    where: {
                        userId: user.id,
                        promotionId: p.id
                    },
                    select: { id: true, used: true }
                })
                if (!link) {
                    const meetsMin = p.minSpending == null || Number(spentNum) >= Number(p.minSpending)
                    if (!meetsMin) return res.status(400).json({ message: 'Promotion not active' })
                    if (p.rate != null) computedEarned += Math.floor(spentNum * Number(p.rate) * 100)
                    if (p.points != null) computedEarned += Number(p.points)
                    await prisma.userPromotion.create({
                        data: {
                            userId: user.id,
                            promotionId: p.id,
                            used: true
                        }
                    })
                } else if (link.used) return res.status(400).json({ message: 'Promotion already used' })
            }
        }

        const credited = creator.suspicious ? 0 : computedEarned
        if (credited > 0) await prisma.user.update({ where: { id: user.id }, data: { points: { increment: credited } } })

        const tx = await prisma.transaction.create({
            data: {
                type: 'purchase',
                relatedId: null,
                userId: user.id,
                awarded: computedEarned,
                spent: spentNum,
                remark: remark ?? null,
                suspicious: creator.suspicious,
                promotionIds: JSON.stringify(ids),
                createdById: creator.id
            },
            select: { id: true }
        })

        return res.status(201).json({
            id: tx.id,
            utorid: user.utorid,
            type: 'purchase',
            spent: spentNum,
            earned: credited,
            remark: remark ?? null,
            promotionIds: ids,
            createdBy: creator.utorid
        })
    }

    if (type === 'adjustment') {
        const amt = Number(amount);
        if (!Number.isFinite(amt) || !Number.isInteger(amt)) return res.status(400).json({ error: 'amount must be an integer' });

        const ids = Array.isArray(promotionIds) ? promotionIds.map(Number) : [];
        if (ids.some(x => !Number.isInteger(x) || x <= 0)) return res.status(400).json({ error: 'Invalid promotion' });

        const relNum = Number(req.body.relatedId);
        if (!Number.isInteger(relNum) || relNum <= 0) return res.status(400).json({ error: 'relatedId must be a positive integer' });

        const relatedTx = await prisma.transaction.findUnique({
            where: { id: relNum },
            select: { id: true, userId: true },
        });
        if (!relatedTx) return res.status(404).json({ error: 'Related transaction not found' });
        if (relatedTx.userId !== user.id) return res.status(400).json({ error: 'Invalid related transaction' });

        await prisma.user.update({
            where: { id: user.id },
            data: { points: { increment: amt } }
        });

        const tx = await prisma.transaction.create({
            data: {
                type: 'adjustment',
                relatedId: relNum,
                userId: user.id,
                awarded: amt > 0 ? amt : null,
                redeemed: amt < 0 ? Math.abs(amt) : null,
                remark: remark ?? '',
                promotionIds: JSON.stringify(ids),
                createdById: creator.id,
            },
            select: { id: true },
        });

        return res.status(201).json({
            id: tx.id,
            utorid: user.utorid,
            amount: amt,
            type: 'adjustment',
            relatedId: relNum,
            remark: remark ?? '',
            promotionIds: ids,
            createdBy: creator.utorid,
        });
    }


    return res.status(400).json({ message: 'Invalid type.' })
})

app.get('/transactions/:id', requireClearance('manager'), async (req, res) => {
    const idNum = Number(req.params.id)
    if (!Number.isInteger(idNum) || idNum <= 0) {
        return res.status(400).json({ message: 'transactionId must be a positive integer' })
    }

    const tx = await prisma.transaction.findUnique({
        where: { id: idNum },
        select: {
            id: true,
            type: true,
            awarded: true,
            redeemed: true,
            spent: true,
            remark: true,
            promotionIds: true,
            relatedId: true,
            suspicious: true,
            user: { select: { utorid: true } },
            createdBy: { select: { utorid: true } }
        }
    })

    if (!tx) {
        return res.status(404).json({ message: 'Transaction not found.' })
    }

    let promoIds = []
    if (tx.promotionIds) {
        try { promoIds = JSON.parse(tx.promotionIds) || [] } catch (_) { promoIds = [] }
    }

    const amount = (tx.awarded ?? 0) - (tx.redeemed ?? 0);

    return res.status(200).json({
        id: tx.id,
        utorid: tx.user?.utorid ?? null,
        amount,
        type: tx.type,
        spent: tx.spent ?? null,
        suspicious: tx.suspicious,
        remark: tx.remark ?? null,
        promotionIds: promoIds,
        relatedId: tx.relatedId ?? null,
        createdBy: tx.createdBy?.utorid ?? null
    })
})

app.patch('/transactions/:transactionId/suspicious', requireClearance('manager'), async (req, res) => {
    const idNum = Number(req.params.transactionId)
    if (!Number.isInteger(idNum) || idNum <= 0) return res.status(400).json({ message: 'transactionId must be a positive integer' })

    const { suspicious } = req.body || {}
    if (typeof suspicious !== 'boolean') return res.status(400).json({ message: 'suspicious must be true or false' })

    const tx = await prisma.transaction.findUnique({
        where: { id: idNum },
        select: {
            id: true,
            type: true,
            awarded: true,
            redeemed: true,
            spent: true,
            remark: true,
            promotionIds: true,
            suspicious: true,
            user: { select: { id: true, utorid: true, points: true } },
            createdBy: { select: { utorid: true } }
        }
    })
    if (!tx) return res.status(404).json({ message: 'Transaction not found.' })
    if (!tx.user) return res.status(400).json({ message: 'Transaction has no target user' })

    if (tx.suspicious !== suspicious) {
        const amount = (tx.awarded ?? 0) - (tx.redeemed ?? 0)
        const delta = suspicious ? -amount : amount
        await prisma.user.update({ where: { id: tx.user.id }, data: { points: { increment: delta } } })
    }

    const updated = await prisma.transaction.update({
        where: { id: tx.id },
        data: { suspicious },
        select: {
            id: true,
            type: true,
            awarded: true,
            redeemed: true,
            spent: true,
            remark: true,
            promotionIds: true,
            suspicious: true,
            user: { select: { utorid: true } },
            createdBy: { select: { utorid: true } }
        }
    })

    let promoIds = []
    if (updated.promotionIds) {
        try { promoIds = JSON.parse(updated.promotionIds) || [] } catch (_) { promoIds = [] }
    }

    const amountOut = (updated.awarded ?? 0) - (updated.redeemed ?? 0)

    return res.status(200).json({
        id: updated.id,
        utorid: updated.user?.utorid ?? null,
        type: updated.type,
        spent: updated.spent ?? 0,
        amount: amountOut,
        promotionIds: promoIds,
        suspicious: updated.suspicious,
        remark: updated.remark ?? '',
        createdBy: updated.createdBy?.utorid ?? null
    })
})

app.patch('/transactions/:transactionId/processed', requireClearance('regular'), async (req, res) => {
    const idNum = Number(req.params.transactionId)
    if (!Number.isInteger(idNum) || idNum <= 0) return res.status(400).json({ message: 'transactionId must be a positive integer' })

    const { processed } = req.body || {}
    if (processed !== true) return res.status(400).json({ message: 'processed must be true' })

    const role = (req.auth?.role || '').toLowerCase()
    const isPrivileged = role === 'cashier' || role === 'manager' || role === 'superuser'
    if (!isPrivileged) return res.status(403).json({ message: 'Permission denied.' })

    const tx = await prisma.transaction.findUnique({
        where: { id: idNum },
        select: {
            id: true,
            type: true,
            processed: true,
            redeemed: true,
            remark: true,
            user: { select: { id: true, utorid: true } },
            createdBy: { select: { utorid: true } }
        }
    })
    if (!tx) return res.status(404).json({ message: 'Transaction not found.' })
    if (tx.type !== 'redemption') return res.status(400).json({ message: 'Invalid transaction type' })
    if (tx.processed) return res.status(400).json({ message: 'Transaction already processed' })
    if (!tx.user) return res.status(400).json({ message: 'Transaction has no target user' })

    const amt = Number(tx.redeemed ?? 0)
    await prisma.user.update({ where: { id: tx.user.id }, data: { points: { decrement: amt } } })

    const updated = await prisma.transaction.update({
        where: { id: idNum },
        data: { processed: true, processedById: req.auth.id },
        select: {
            id: true,
            type: true,
            redeemed: true,
            remark: true,
            user: { select: { utorid: true } },
            createdBy: { select: { utorid: true } },
            processedBy: { select: { utorid: true } }
        }
    })

    return res.status(200).json({
        id: updated.id,
        utorid: updated.user?.utorid ?? null,
        type: updated.type,
        processedBy: updated.processedBy?.utorid ?? null,
        redeemed: updated.redeemed ?? 0,
        remark: updated.remark ?? '',
        createdBy: updated.createdBy?.utorid ?? null
    })
})

app.post('/promotions', requireClearance('manager'), async (req, res) => {
    const { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;

    if (!name || !description || !type || !startTime || !endTime) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (type !== 'automatic' && type !== 'one-time') {
        return res.status(400).json({ error: 'Type must be either "automatic" or "one-time"' });
    }
    let fixedType = 'automatic'
    if (type === 'one-time') {
        fixedType = 'onetime'
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Must be ISO 8601' });
    }

    if (start < now) {
        return res.status(400).json({ error: 'Start time cannot be in the past' });
    }

    if (end <= start) {
        return res.status(400).json({ error: 'End time must be after start time' });
    }

    if (minSpending != null) {
        if (typeof minSpending !== 'number' || minSpending < 0) {
            return res.status(400).json({ error: 'minSpending must be a positive number' });
        }
    }

    if (rate != null) {
        if (typeof rate !== 'number' || rate <= 0) {
            return res.status(400).json({ error: 'rate must be a positive number' });
        }
    }

    if (points != null) {
        if (!Number.isInteger(points) || points < 0) {
            return res.status(400).json({ error: 'points must be a positive integer' });
        }
    }

    const promotion = await prisma.promotion.create({
        data: {
            name,
            description,
            type: fixedType,
            startTime: start,
            endTime: end,
            minSpending,
            rate,
            points,
        },
    });

    return res.status(201).json({
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        type: promotion.type,
        startTime: promotion.startTime.toISOString(),
        endTime: promotion.endTime.toISOString(),
        minSpending: promotion.minSpending,
        rate: promotion.rate,
        points: promotion.points,
    });

});

app.get('/promotions', requireClearance('regular'), async (req, res) => {
    const { name, type, page = 1, limit = 10, started, ended, orderBy = 'id', order = 'asc' } = req.query;
    const userRole = req.auth.role.toLowerCase();
    const isManager = userRole === 'manager' || userRole === 'superuser';

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || pageNum < 1) return res.status(400).json({ error: 'Invalid page' });
    if (isNaN(limitNum) || limitNum < 1) return res.status(400).json({ error: 'Invalid limit' });

    if (isManager && started !== undefined && ended !== undefined) {
        return res.status(400).json({ error: 'Cannot specify both started and ended' });
    }

    const where = {};
    const now = new Date();

    if (name) {
        where.name = { contains: String(name) };
    }

    if (type) {
        if (type !== 'automatic' && type !== 'one-time') {
            return res.status(400).json({ error: 'Invalid type filter' });
        }
        where.type = type
        if (type === 'one-time') {
            where.type = 'onetime';
        }

    }

    if (!isManager) {
        where.startTime = { lte: now };
        where.endTime = { gte: now };
        where.OR = [
            { type: 'automatic' },
            {
                type: 'onetime',
                users: {
                    none: {
                        userId: req.auth.id,
                        used: true,
                    },
                },
            },
        ];
    } else {
        if (started !== undefined) {
            where.startTime = started === 'true' ? { lte: now } : { gt: now };
        }
        if (ended !== undefined) {
            where.endTime = ended === 'true' ? { lte: now } : { gt: now };
        }
    }

    const validOrderFields = ['id', 'name', 'startTime', 'endTime', 'points', 'rate'];
    const sortField = validOrderFields.includes(orderBy) ? orderBy : 'id';
    const sortOrder = order === 'desc' ? 'desc' : 'asc';

    const [count, promotions] = await Promise.all([
        prisma.promotion.count({ where }),
        prisma.promotion.findMany({
            where,
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
            orderBy: { [sortField]: sortOrder },
        }),
    ]);

    const formatPromotion = (p) => {
        const base = {
            id: p.id,
            name: p.name,
            description: p.description,
            type: p.type,
            endTime: p.endTime.toISOString(),
        };

        if (isManager) {
            base.startTime = p.startTime.toISOString();
        }

        if (p.minSpending != null) base.minSpending = p.minSpending;
        if (p.rate != null) base.rate = p.rate;
        if (p.points != null) base.points = p.points;

        return base;
    };

    return res.json({ count, results: promotions.map(formatPromotion) });

});

app.get('/promotions/:promotionId', requireClearance('regular'), async (req, res) => {
    const promotionId = parseInt(req.params.promotionId, 10);
    if (isNaN(promotionId) || promotionId <= 0) {
        return res.status(400).json({ error: 'Invalid promotion ID' });
    }

    const userRole = req.auth.role.toLowerCase();
    const isManager = userRole === 'manager' || userRole === 'superuser';

    const promotion = await prisma.promotion.findUnique({
        where: { id: promotionId },
    });

    if (!promotion) {
        return res.status(404).json({ error: 'Promotion not found' });
    }

    const now = new Date();
    const isActive = promotion.startTime <= now && promotion.endTime >= now;

    if (!isManager && !isActive) {
        return res.status(404).json({ error: 'Promotion not found' });
    }

    const response = {
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        type: promotion.type,
        endTime: promotion.endTime.toISOString(),
        minSpending: promotion.minSpending,
        rate: promotion.rate,
        points: promotion.points,
    };

    if (isManager) {
        response.startTime = promotion.startTime.toISOString();
    }

    return res.json(response);
});

app.patch('/promotions/:promotionId', requireClearance('manager'), async (req, res) => {
    const promotionId = parseInt(req.params.promotionId, 10);
    if (isNaN(promotionId) || promotionId <= 0) {
        return res.status(400).json({ error: 'Invalid promotion ID' });
    }

    const allowedFields = ['name', 'description', 'type', 'startTime', 'endTime', 'minSpending', 'rate', 'points'];
    const providedFields = Object.keys(req.body);

    if (providedFields.length === 0) {
        return res.status(400).json({ error: 'No fields provided for update' });
    }

    const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
        return res.status(400).json({ error: `Invalid fields: ${invalidFields.join(', ')}` });
    }

    const promotion = await prisma.promotion.findUnique({
        where: { id: promotionId },
    });

    if (!promotion) {
        return res.status(404).json({ error: 'Promotion not found' });
    }

    const now = new Date();
    const hasStarted = promotion.startTime <= now;
    const hasEnded = promotion.endTime <= now;

    if (hasStarted) {
        return res.status(400).json({ error: 'Cannot update a promotion that has started' });
    }

    if (hasEnded) {
        return res.status(400).json({ error: 'Cannot update a promotion that has ended' });
    }

    const updateData = {};
    const updatedFields = new Set();

    for (const field of providedFields) {
        const value = req.body[field];
        if (value == null) continue
        switch (field) {
            case 'name':
                if (typeof value !== 'string' || value.trim().length === 0) {
                    return res.status(400).json({ error: 'Invalid name' });
                }
                updateData.name = value;
                updatedFields.add('name');
                break;

            case 'description':
                if (typeof value !== 'string') {
                    return res.status(400).json({ error: 'Invalid description' });
                }
                updateData.description = value;
                updatedFields.add('description');
                break;

            case 'type':
                if (value !== 'automatic' && value !== 'one-time') {
                    return res.status(400).json({ error: 'Type must be either "automatic" or "one-time"' });
                }
                updateData.type = value;
                updatedFields.add('type');
                if (value === 'one-time') {
                    updateData.type = 'onetime';
                }
                break;

            case 'startTime':
                const newStart = new Date(value);
                if (isNaN(newStart.getTime())) {
                    return res.status(400).json({ error: 'Invalid startTime format' });
                }
                if (newStart < now) {
                    return res.status(400).json({ error: 'Start time cannot be in the past' });
                }
                updateData.startTime = newStart;
                updatedFields.add('startTime');
                break;

            case 'endTime':
                const newEnd = new Date(value);
                if (isNaN(newEnd.getTime())) {
                    return res.status(400).json({ error: 'Invalid endTime format' });
                }
                if (newEnd < now) {
                    return res.status(400).json({ error: 'End time cannot be in the past' });
                }
                updateData.endTime = newEnd;
                updatedFields.add('endTime');
                break;

            case 'minSpending':
                if (value != null && (typeof value !== 'number' || value <= 0)) {
                    return res.status(400).json({ error: 'minSpending must be a positive number or null' });
                }
                updateData.minSpending = value;
                updatedFields.add('minSpending');
                break;

            case 'rate':
                if (value != null && (typeof value !== 'number' || value <= 0)) {
                    return res.status(400).json({ error: 'rate must be a positive number or null' });
                }
                updateData.rate = value;
                updatedFields.add('rate');
                break;

            case 'points':
                if (value != null && (!Number.isInteger(value) || value <= 0)) {
                    return res.status(400).json({ error: 'points must be a positive integer or null' });
                }
                updateData.points = value;
                updatedFields.add('points');
                break;
        }
    }

    if (hasStarted) {
        const restrictedFields = ['name', 'description', 'type', 'startTime', 'minSpending', 'rate', 'points'];
        const attemptedRestricted = [...updatedFields].filter(field => restrictedFields.includes(field));
        if (attemptedRestricted.length > 0) {
            return res.status(400).json({
                error: `Cannot update ${attemptedRestricted.join(', ')} after promotion has started`
            });
        }
    }

    if (hasEnded && updatedFields.has('endTime')) {
        return res.status(400).json({ error: 'Cannot update endTime after the original end time has passed' });
    }

    const finalStart = updateData.startTime || promotion.startTime;
    const finalEnd = updateData.endTime || promotion.endTime;
    if (finalEnd <= finalStart) {
        return res.status(400).json({ error: 'End time must be after start time' });
    }

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updated = await prisma.promotion.update({
        where: { id: promotionId },
        data: updateData,
    });

    const response = {
        id: updated.id,
        name: updated.name,
        type: updated.type,
    };

    if (updatedFields.has('description')) response.description = updated.description;
    if (updatedFields.has('startTime')) response.startTime = updated.startTime.toISOString();
    if (updatedFields.has('endTime')) response.endTime = updated.endTime.toISOString();
    if (updatedFields.has('minSpending')) response.minSpending = updated.minSpending;
    if (updatedFields.has('rate')) response.rate = updated.rate;
    if (updatedFields.has('points')) response.points = updated.points;

    return res.json(response);
});

app.delete('/promotions/:promotionId', requireClearance('manager'), async (req, res) => {
    const promotionId = parseInt(req.params.promotionId, 10);
    if (isNaN(promotionId) || promotionId <= 0) {
        return res.status(400).json({ error: 'Invalid promotion ID' });
    }

    const promotion = await prisma.promotion.findUnique({
        where: { id: promotionId },
    });

    if (!promotion) {
        return res.status(404).json({ error: 'Promotion not found' });
    }

    const now = new Date();
    const hasStarted = promotion.startTime <= now;

    if (hasStarted) {
        return res.status(403).json({ error: 'Cannot delete a promotion that has already started' });
    }

    await prisma.promotion.delete({
        where: { id: promotionId },
    });

    return res.status(204).send();
});

app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Invalid or missing token' });
    }
    next(err);
});

const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});