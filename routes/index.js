const express = require('express');
const router = express.Router();
const Customer = require('../models/customer'); // โมเดลลูกค้า
const GoldPawn = require('../models/goldPawn'); // โมเดลทอง

// GET หน้าแรก
router.get('/', (req, res) => {
  res.render('index');
});

// GET หน้ารายชื่อลูกค้า
router.get('/customer-list', async (req, res) => {
    try {
        const customers = await Customer.find(); // ดึงข้อมูลลูกค้าทั้งหมด
        res.render('customerlist', { customers }); // ส่งข้อมูลไปยัง view
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).send('Internal Server Error');
    }
});

// GET หน้าข้อมูลทอง
router.get('/gold-list', async (req, res) => {
    try {
        const goldData = await GoldPawn.find().populate('typeName', 'typeName'); // ดึงข้อมูลทองทั้งหมด พร้อม populate typeName
        res.render('goldlist', { goldData }); // ส่งข้อมูลทองไปยัง view
    } catch (error) {
        console.error('Error fetching gold data:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
