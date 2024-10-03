const express = require('express');
const router = express.Router();
const Type = require('../models/type');

// GET หน้าเพิ่มข้อมูล
router.get('/', (req, res) => {
    res.render('adddata');
});

// ฟังก์ชันสำหรับสร้าง typeId อัตโนมัติ
async function generateTypeId() {
    const lastType = await Type.findOne().sort({ createdAt: -1 }); // หาข้อมูลล่าสุด
    if (!lastType) return 'T-0001'; // ถ้าไม่มีข้อมูลเลย
    const lastId = parseInt(lastType.typeId.split('-')[1]); // แยกตัวเลขจาก typeId
    const newId = lastId + 1; // เพิ่ม ID ใหม่
    return `T-${String(newId).padStart(4, '0')}`; // คืนค่า typeId ใหม่
}

// POST สำหรับเพิ่มข้อมูลประเภททอง
router.post('/types', async (req, res) => {
    try {
        const newType = new Type({
            typeId: await generateTypeId(), // สร้าง typeId ใหม่
            typeName: req.body.typeName,
            goldId: req.body.goldId || [] // รับ goldId จาก body หากมี หรือจะใช้ array ว่าง
        });
        await newType.save();
        res.status(201).json(newType);
    } catch (error) {
        console.error(error); // log ข้อผิดพลาดใน console
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลประเภททอง', error });
    }
});

// GET สำหรับดึงข้อมูลประเภททอง
router.get('/types', async (req, res) => {
    try {
        const types = await Type.find();
        res.json(types);
    } catch (error) {
        console.error(error); // log ข้อผิดพลาดใน console
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประเภททอง', error });
    }
});

// GET สำหรับดึง typeId ล่าสุด
router.get('/latest-id', async (req, res) => {
    try {
        const newId = await generateTypeId(); // ใช้ฟังก์ชันสร้าง typeId ใหม่
        res.json({ typeId: newId }); // ส่ง typeId ล่าสุด
    } catch (error) {
        console.error(error); // log ข้อผิดพลาดใน console
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึง typeId ล่าสุด', error });
    }
});

module.exports = router;
