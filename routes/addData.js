const express = require('express');
const router = express.Router();
const Type = require('../models/type');

// GET หน้าเพิ่มข้อมูล
router.get('/', (req, res) => {
    res.render('adddata');
});

// POST สำหรับเพิ่มข้อมูลประเภททอง
router.post('/types', async (req, res) => {
    const { typeId, typeName, goldId } = req.body; // ดึงข้อมูลจาก body

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!typeId || !typeName) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    try {
        // ตรวจสอบว่า typeId นี้มีอยู่ในฐานข้อมูลหรือไม่
        const existingType = await Type.findOne({ typeId });
        if (existingType) {
            return res.status(409).json({ message: 'ID ประเภทนี้มีอยู่แล้วในฐานข้อมูล' });
        }

        const newType = new Type({
            typeId,
            typeName,
            goldId: goldId || [] // กำหนดให้เป็น array ว่างถ้าไม่ได้ส่งค่า
        });
        
        await newType.save(); // บันทึกข้อมูลในฐานข้อมูล
        res.status(201).json({ message: 'เพิ่มข้อมูลประเภททองเรียบร้อย' });
    } catch (error) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลประเภททอง', error: error.message });
    }
});

module.exports = router;
