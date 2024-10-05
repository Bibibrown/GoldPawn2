const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Customer = require('../models/customer');
const Pawn = require('../models/goldPawn');
const Payment = require('../models/payment');
const addPawn = require('../models/pawn');
const Type = require('../models/type'); 


async function generateGoldId() {
    const lastGold = await Pawn.findOne().sort({ createdAt: -1 });
    if (!lastGold) return 'G-0001';
    const lastId = parseInt(lastGold.goldId.split('-')[1]);
    const newGoldId = lastId + 1;
    return `G-${String(newGoldId).padStart(4, '0')}`;
}

async function generatePaymentId() {
    const lastPayment = await Payment.findOne().sort({ createdAt: -1 });
    if (!lastPayment) return 'PM-0001';
    const lastId = parseInt(lastPayment.paymentId.split('-')[1]);
    const newPaymentId = lastId + 1;
    return `PM-${String(newPaymentId).padStart(4, '0')}`;
}
// ฟังก์ชันสำหรับรับวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
function getCurrentDate() {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localToday = new Date(today.getTime() - offset);
    return localToday.toISOString().split('T')[0];
}

// เส้นทางเพื่อแสดงหน้า Add Gold Pawn สำหรับลูกค้า
router.get('/addpawn/:customerId', async (req, res) => {
    const { customerId } = req.params;
    const currentDate = getCurrentDate();
    try {
        // ดึงข้อมูลลูกค้าตาม customerId
        const customer = await Customer.findOne({ customerId: customerId });
        if (!customer) {
            // return res.status(404).send('ไม่พบลูกค้า');
            return res.status(404).render('error', { message: 'ไม่พบลูกค้า' });
        }

        // ดึงประวัติการจำนำทองของลูกค้า โดยใช้ customer._id
        const pawns = await Pawn.find({ customerId: customer._id })
        .populate({
            path: 'goldId',
            populate: { path: 'typeName' } // Populate typeName in Gold
        })
        .sort({ createdAt: 1 });

        // สร้าง goldId ใหม่โดยอัตโนมัติ
        const typeList = await Type.find();

        async function generateGoldId() {
            const lastGold = await Pawn.findOne().sort({ createdAt: -1 }); // หาข้อมูลล่าสุด
            if (!lastGold) return 'G-0001'; // ถ้าไม่มีข้อมูลเลย
            const lastId = parseInt(lastGold.goldId.split('-')[1]); // แยกตัวเลขจาก typeId
            const newGoldId = lastId + 1; // เพิ่ม ID ใหม่
            return `G-${String(newGoldId).padStart(4, '0')}`; // คืนค่า typeId ใหม่
        }
        const newGoldId = await generateGoldId();

        async function generatePawnId() {
            const lastPawn = await addPawn.findOne().sort({ createdAt: -1 }); // หาข้อมูลล่าสุด
            if (!lastPawn) return 'P-0001'; // ถ้าไม่มีข้อมูลเลย
            const lastId = parseInt(lastPawn.pawnId.split('-')[1]); // แยกตัวเลขจาก typeId
            const newPawnId = lastId + 1; // เพิ่ม ID ใหม่
            return `P-${String(newPawnId).padStart(4, '0')}`; // คืนค่า typeId ใหม่
        }
        const newPID = await generatePawnId();

        // ส่งข้อมูลลูกค้า, ประวัติการจำนำทอง, และ customerId ไปยังหน้า addpawn.ejs
        res.render('addpawn', { customer, pawns, customerId: customer.customerId, newGoldId, newPID, typeList, startDate: currentDate});
    } catch (error) {
        console.error('Error fetching customer or pawn history:', error);
        res.status(500).render('error', { message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
});


// เส้นทางเพื่อจัดการการเพิ่มการจำนำทองใหม่ (POST)
router.post('/addpawn/:customerId', async (req, res) => {
    console.log('Request body:', req.body);
    console.log('Request params:', req.params);
    const { customerId } = req.params;
    const { pawnId, typeName, weight, principal, interest, intperm, startDate, nextDueDate } = req.body;
    
    console.log('Received startDate:', startDate);
    console.log('Received nextDueDate:', nextDueDate);
    try {
        const customer = await Customer.findOne({ customerId: customerId });
        if (!customer) {
            return res.status(404).json({ error: 'ไม่พบลูกค้า' });
        }

        // ใช้ pawnId ที่ส่งมาจาก client
        const newPawnId = pawnId;
        const newGoldId = await generateGoldId();

        // ตรวจสอบว่ามี pawn ที่มี pawnId นี้อยู่แล้วหรือไม่
        let existingPawn = await addPawn.findOne({ pawnId: newPawnId });
        
        if (!existingPawn) {
            // ถ้ายังไม่มี pawn นี้ ให้สร้างใหม่
            existingPawn = new addPawn({
                pawnId: newPawnId,
                customerId: customer.customerId,
                goldId: []
            });
        }

        const type = await Type.findById(typeName);

        const newPaymentId = await generatePaymentId();

        const newGold = new Pawn({
            pawnId: newPawnId,
            goldId: newGoldId,
            typeName: type.typeName,
            weight: weight,
            principal: principal,
            interest: interest,
            intperm: intperm,
            status: 'จำนำ',
            paymentId: [newPaymentId]
        });

        await newGold.save();
        console.log('Gold saved:', newGold);

        existingPawn.goldId.push(newGoldId);
        await existingPawn.save();
        console.log('Pawn saved:', existingPawn);

        if (!customer.pawnId.includes(existingPawn.pawnId)) {
            customer.pawnId.push(existingPawn.pawnId);
            await customer.save();
            console.log('Customer updated:', customer);
        }

        // ดึงข้อมูล Gold ที่มี typeName populated
        // const populatedGold = await Pawn.findById(newGold._id).typeName;
        // ตรวจสอบและแปลงค่าวันที่
        const startDateObj = new Date(startDate);
        let nextDueDateObj = new Date(nextDueDate);

        if (isNaN(startDateObj.getTime())) {
            throw new Error('วันที่เริ่มต้นไม่ถูกต้อง');
        }

        if (isNaN(nextDueDateObj.getTime())) {
            throw new Error('วันที่ครบกำหนดไม่ถูกต้อง');
        }

        if (nextDueDateObj <= startDateObj) {
            throw new Error('วันที่ครบกำหนดต้องมาหลังวันที่เริ่มต้น');
        }
        // สร้างรายการชำระเงินใหม่
        const newPayment = new Payment({
            paymentId: newPaymentId,
            paymentDate: new Date(), // วันที่ทำรายการปัจจุบัน
            startDate: startDateObj,
            nextDueDate: nextDueDateObj,
            amount: principal,
            statusPawn: 'เริ่มจำนำ',
            goldId: newGoldId
        });
        await newPayment.save();
        console.log('Payment created:', newPayment);

        console.log(existingPawn)
        console.log(newGold)
        console.log(newPawnId)
        console.log(newGoldId)

        res.status(201).json({ 
            message: 'เพิ่มข้อมูลทองที่จำนำเรียบร้อย', 
            pawn: existingPawn,
            gold: newGold,
            payment: newPayment,
            newPawnId: newPawnId,
            newGoldId: newGoldId
        });
    } catch (error) {
        console.error('Error adding new gold:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลจำนำทอง', details: error.message });
    }
});

// route สำหรับดูรายละเอียดการจำนำ
router.get('/:pawnId', async (req, res) => {
    try {
        const { pawnId } = req.params;
        
        // ค้นหาข้อมูลการจำนำจาก pawnId
        const pawn = await addPawn.findOne({ pawnId });
        
        if (!pawn) {
            return res.status(404).render('error', { message: 'ไม่พบข้อมูลการจำนำ' });
        }

        // ค้นหา Customer โดยใช้ customerId
        const customer = await Customer.findOne({ customerId: pawn.customerId });

        if (!customer) {
            return res.status(404).render('error', { message: 'ไม่พบข้อมูลลูกค้า' });
        }

        // ค้นหาข้อมูลทองที่เกี่ยวข้องกับการจำนำนี้
        const golds = await Pawn.find({ goldId: { $in: pawn.goldId } }); // ใช้ goldId ที่อยู่ใน pawn

        // แปลงข้อมูล golds เพื่อใช้ goldId แทน _id
        const formattedGolds = golds.map(gold => ({
            ...gold.toObject(),
            id: gold.goldId  // เพิ่ม field id ที่มีค่าเท่ากับ goldId
        }));

        // ส่งข้อมูลไปแสดงในหน้า EJS
        res.render('pawnlist', { 
            pawn: { ...pawn.toObject(), customer }, 
            golds: formattedGolds
        });

    } catch (error) {
        console.error('Error fetching pawn details:', error);
        res.status(500).render('error', { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจำนำ' });
    }
});

module.exports = router;