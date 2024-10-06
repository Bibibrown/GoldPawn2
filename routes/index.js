const express = require('express');
const router = express.Router();
const Customer = require('../models/customer'); 
const GoldPawn = require('../models/goldPawn'); 

// GET หน้าแรก
router.get('/', (req, res) => {
  res.render('index');
});

// GET หน้ารายชื่อลูกค้า
router.get('/customer-list', async (req, res) => {
    const searchQuery = req.query.search || ''; //รับข้อมูลช่องค้นหา
    try {
        const customers = await Customer.find({ //ดึงข้อมูลcustomerขึ้นมา
             //ตรวจสอบว่าค่าที่รับมาตรงกับข้อมูลไหนในฐานข้อมูล
            $or: [
                { customerFName: new RegExp(searchQuery, 'i') },
                { customerLName: new RegExp(searchQuery, 'i') },
                { customerAddress: new RegExp(searchQuery, 'i') },
                { customerPhone: new RegExp(searchQuery, 'i') }
            ]
        });
        res.render('customerlist', { customers }); 
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).send('Internal Server Error');
    }
});

// GET หน้าข้อมูลทอง
router.get('/gold-list', async (req, res) => {
    const searchQuery = req.query.search || ''; // รับคำค้นจาก query parameters
    let searchCriteria = {
        $or: [
            { goldId: new RegExp(searchQuery, 'i') }, // ค้นหาจาก goldId
            { status: new RegExp(searchQuery, 'i') }, // ค้นหาจาก status
            { typeName: new RegExp(searchQuery, 'i') } // ค้นหาจากประเภททอง
        ]
    };

    // ตรวจสอบว่าคำค้นเป็นตัวเลขหรือไม่
    const numericSearch = Number(searchQuery);
    if (!isNaN(numericSearch)) {
        // ถ้าเป็นตัวเลข เพิ่มเงื่อนไขค้นหาสำหรับ weight
        searchCriteria.$or.push({ weight: numericSearch });
    }
    try {
        const goldData = await GoldPawn.find(searchCriteria); 

        res.render('goldlist', { goldData, noData: goldData.length === 0 });
    } catch (error) {
        console.error('Error fetching gold data:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
