const express = require('express');
const router = express.Router();
const Payment = require('../models/payment');
const Pawn = require('../models/goldPawn');
const Customer = require('../models/customer');


function calculateTotalPayment(principal, interest) {
    return principal + interest;
}

router.get('/', async (req, res) => {
    res.render('golddetail');
});

router.get('/gold-payment-history/:goldId', async (req, res) => {
    console.log('Accessing gold-payment-history route');
    console.log('GoldId:', req.params.goldId);
    try {
        const { goldId } = req.params;
        
        // ดึงข้อมูลทองโดยใช้ goldId
        const gold = await Pawn.findOne({ goldId }).lean();
        if (!gold) {
            console.log('Gold not found');
            return res.status(404).render('error', { message: 'ไม่พบข้อมูลทอง' });
        }
        console.log('Gold found:', gold);

        // ดึงประวัติการชำระเงินโดยใช้ goldId
        const payments = await Payment.find({ goldId })
            .sort({ paymentDate: -1 })
            .lean();
        console.log('Payments found:', payments);

        const calculatedPayments = payments.map(payment => ({
            ...payment,
            totalPayment: calculateTotalPayment(gold.principal, gold.intperm)
        }));
        // เพิ่มข้อมูลเพิ่มเติมที่ต้องการแสดง
        gold.additionalInfo = `น้ำหนัก: ${gold.weight}g, ประเภท: ${gold.typeName}`;

        res.render('golddetail', { gold, payments: calculatedPayments,
            calculateTotalPayment });
    } catch (error) {
        console.error('Error fetching gold payment history:', error);
        res.status(500).render('error', { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการชำระเงินทอง' });
    }
});

//ดึงข้อมูลต่อดอก 
router.get('/gold/:goldId', async (req, res) => {
    try {
        const { goldId } = req.params;
        console.log('Received goldId:', goldId);
        
        const gold = await Pawn.findOne({ goldId }).lean();
        if (!gold) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลทอง' });
        }

        const latestPayment = await Payment.findOne({ goldId })
            .sort({ paymentDate: -1 })
            .lean();

        if (!latestPayment) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลการชำระเงิน' });
        }

        res.json({
            startDate: latestPayment.startDate,
            nextDueDate: latestPayment.nextDueDate,
            intperm: gold.intperm
        });
    } catch (error) {
        console.error('Error fetching gold data:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลทอง' });
    }
});

async function generatePaymentId() {
    const lastPayment = await Payment.findOne().sort({ createdAt: -1 });
    if (!lastPayment) return 'PM-0001';
    const lastId = parseInt(lastPayment.paymentId.split('-')[1]);
    const newPaymentId = lastId + 1;
    return `PM-${String(newPaymentId).padStart(4, '0')}`;
}

//เพิ่มข้อมูลต่อดอก
router.post('/extend-payment/:goldId', async (req, res) => {
    try {
        const { goldId } = req.params;
        //ยอดที่ต้องชำระ
        const { amount } = req.body;

        // ดึงข้อมูล Gold
        const gold = await Pawn.findOne({ goldId });

        if (!gold) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลทอง' });
        }

        // ตรวจสอบสถานะของทอง
        if (gold.status === 'ไถ่คืน') {
            return res.status(400).json({ success: false, message: 'ไม่สามารถต่อดอกได้เนื่องจากทองถูกไถ่คืนแล้ว' });
        }

        // ดึงข้อมูล Pawn ล่าสุด
        const currentPawn = await Pawn.findOne({ goldId }).sort({ createdAt: -1 });

        if (!currentPawn) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลทอง' });
        }

        console.log('Current Pawn:', JSON.stringify(currentPawn, null, 2));

        // ดึงข้อมูล Payment ล่าสุด
        const lastPayment = await Payment.findOne({ goldId }).sort({ createdAt: -1 });

        if (!lastPayment) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการชำระเงินล่าสุด' });
        }

        console.log('Last Payment:', JSON.stringify(lastPayment, null, 2));

        // ใช้ข้อมูลจาก lastPayment
        const startDate = new Date(lastPayment.startDate);
        const nextDueDate = new Date(lastPayment.nextDueDate);

        //เช็ควันที่
        if (isNaN(startDate.getTime()) || isNaN(nextDueDate.getTime())) {
            return res.status(400).json({ 
                success: false, 
                message: 'วันที่ในข้อมูลการชำระเงินไม่ถูกต้อง',
                startDate: lastPayment.startDate,
                nextDueDate: lastPayment.nextDueDate
            });
        }

        console.log('Current Start Date:', startDate);
        console.log('Current Next Due Date:', nextDueDate);

        // คำนวณวันที่สำหรับการต่อดอกใหม่
        const newStartDate = new Date(nextDueDate.getTime() + 24 * 60 * 60 * 1000); // nextDueDate + 1 วัน
        const duration = nextDueDate.getTime() - startDate.getTime(); //หาจำนวนวันทั้งหมดในรอบต่อดอก
        const newNextDueDate = new Date(newStartDate.getTime() + duration); //กำหนดของรอบถัดไป

        console.log('New Start Date:', newStartDate);
        console.log('New Next Due Date:', newNextDueDate);

        const newPaymentId = await generatePaymentId();

        const newPayment = new Payment({
            paymentId: newPaymentId,
            startDate: newStartDate,
            endDate: newNextDueDate,
            nextDueDate: newNextDueDate,
            amount: parseFloat(amount),
            statusPawn: 'ต่อดอก',
            goldId: goldId
        });

        await newPayment.save();

        const updatedGold = await Pawn.findOneAndUpdate(
            { goldId: goldId },
            {
                $push: {
                    payments: newPayment._id
                },
                $set: {
                    statusPawn: 'ต่อดอก'
                }
            },
            { new: true }
        );

        console.log('Updated Gold:', updatedGold);

        // ส่งข้อมูลกลับไปยัง client
        res.json({ 
            success: true, 
            message: 'ต่อดอกเรียบร้อยแล้ว',
            paymentId: newPaymentId,
            newStartDate: newStartDate.toISOString().split('T')[0],
            newNextDueDate: newNextDueDate.toISOString().split('T')[0],
            amount: newPayment.amount
        });
    } catch (error) {
        console.error('Error extending payment:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการต่อดอก', error: error.message });
    }
});

// Route สำหรับดึงข้อมูลล่าสุดของทอง
router.get('/get-latest-data/:goldId', async (req, res) => {
    try {
        const { goldId } = req.params;
        console.log('Fetching data for goldId:', goldId);

        // ค้นหา Gold document
        const gold = await Pawn.findOne({ goldId: goldId });
        
        if (!gold) {
            console.log('Gold not found');
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลทอง' });
        }

        // ค้นหา Payment ล่าสุดสำหรับ Gold นี้
        const latestPayment = await Payment.findOne({ goldId: goldId })
            .sort({ createdAt: -1 })
            .limit(1);

        let startDate;
        if (latestPayment && latestPayment.startDate) {
            startDate = latestPayment.startDate;
        } else {
            startDate = gold.startDate;
        }

        // แปลง startDate เป็น string ในรูปแบบ 'YYYY-MM-DD'
        startDate = new Date(startDate).toISOString().split('T')[0];

        console.log('Latest start date:', startDate);

        res.json({
            success: true,
            startDate: startDate,
            principal: gold.principal,
            interest: gold.interest
        });
    } catch (error) {
        console.error('Error fetching latest gold data:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Route สำหรับการไถ่คืน
router.post('/redeem', async (req, res) => {
    try {
        const { goldId, startDate, endDate, initialAmount, interestAmount, totalAmount } = req.body;

        // ค้นหา Gold document
        const gold = await Pawn.findOne({ goldId });
        if (!gold) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลทอง' });
        }
        if (gold.status === 'ไถ่คืน') {
            return res.status(400).json({ success: false, message: 'ทองถูกไถ่คืนแล้ว' });
        }
        
        const newPaymentId = await generatePaymentId();

        // สร้าง Payment ใหม่สำหรับการไถ่คืน
        const newPayment = new Payment({
            goldId,
            paymentId: newPaymentId,
            startDate,
            endDate,
            amount: totalAmount,
            statusPawn: 'ไถ่คืน',
        });
        await newPayment.save();

        // อัปเดต Gold document
        gold.status = 'ไถ่คืน';
        gold.paymentId = newPaymentId;
        if (!gold.paymentId) {
            gold.paymentId = [];
        }
        gold.paymentId.push(newPayment._id);

        await gold.save();

        res.json({ success: true, message: 'ไถ่คืนเรียบร้อยแล้ว' });
    } catch (error) {
        console.error('Error in redeeming gold:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการไถ่คืน', error: error.message });
    }
});

//เปลี่ยน status หลุดจำนำ
router.get('/check-status/:goldId', async (req, res) => {
    try {
        const goldId = req.params.goldId;
        const gold = await Pawn.findOne({ goldId: goldId });
        
        if (!gold) {
            return res.json({ success: false, message: 'ไม่พบทอง' });
        }

        const currentDate = new Date();
        const latestPayment = await Payment.findOne({ goldId: goldId }).sort({ nextDueDate: -1 });

        if (!latestPayment) {
            return res.json({ success: true, statusChanged: false, currentStatus: gold.status });
        }

        const nextDueDate = new Date(latestPayment.nextDueDate);

        let statusChanged = false;
        if (currentDate > nextDueDate && gold.status !== 'หลุดจำนำ') {
            gold.status = 'หลุดจำนำ';
            await gold.save();
            statusChanged = true;
        }

        return res.json({ 
            success: true, 
            statusChanged: statusChanged,
            currentStatus: gold.status,
            lastPaymentDate: latestPayment.paymentDate,
            nextDueDate: latestPayment.nextDueDate,
            pawnId: gold.pawnId,
            typeName: gold.typeName,
            weight: gold.weight,
            principal: gold.principal,
            interest: gold.interest,
            intperm: gold.intperm
        });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะทอง:', error);
        res.json({ success: false, message: 'เกิดข้อผิดพลาดขณะตรวจสอบสถานะทอง' });
    }
});

module.exports = router;
