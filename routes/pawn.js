const express = require('express');
const router = express.Router();
const Customer = require('../models/customer');
const Pawn = require('../models/goldPawn');
const Payment = require('../models/payment');


// // เส้นทางเพื่อแสดงหน้า Add Gold Pawn สำหรับลูกค้า
// router.get('/addpawn/:customerId', async (req, res) => {
//     const { customerId } = req.params;
//     try {
//         // ดึงข้อมูลลูกค้าตาม customerId
//         const customer = await Customer.findOne({ customerId: customerId });
//         if (!customer) {
//             return res.status(404).send('ไม่พบลูกค้า');
//         }

//         // ดึงประวัติการจำนำทองของลูกค้า
//         const pawns = await Pawn.find({ customerId: customerId }).sort({ goldId: 1 });

//         // สร้าง goldId ใหม่โดยอัตโนมัติ
//         const latestGoldPawn = await Pawn.findOne().sort({ goldId: -1 }).limit(1);
//         const newGoldId = latestGoldPawn ? (parseInt(latestGoldPawn.goldId) + 1).toString() : '1';

//         // ส่งข้อมูลลูกค้า, ประวัติการจำนำทอง, และ customerId ไปยังหน้า addpawn.ejs
//         res.render('addpawn', { customer, pawns, customerId, newGoldId });
//     } catch (error) {
//         console.error('Error fetching customer or pawn history:', error);
//         res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูล');
//     }
// });

// // API Route เพื่อดึงประวัติการจำนำทองของลูกค้า
// router.get('/:customerId', async (req, res) => {
//     const { customerId } = req.params;
//     try {
//         const pawns = await Pawn.find({ customerId: customerId }).sort({ goldId: 1});
//         res.json(pawns);
//     } catch (error) {
//         console.error('Error fetching pawn history:', error);
//         res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงประวัติการจำนำทอง' });
//     }
// });

// // ฟังก์ชันเพื่อเพิ่มการชำระเงินใหม่
// const addPayment = async (goldId) => {
//     try {
//         // ดึงข้อมูลจาก goldPawn โดยใช้ goldId
//         const pawn = await Pawn.findOne({ goldId: goldId });
//         if (!pawn) {
//             throw new Error('ไม่พบข้อมูลจำนำทอง');
//         }

//         // กำหนดวันเริ่มต้น วันสิ้นสุด และจำนวนเงิน
//         const startDate = pawn.createdAt; // วันที่เริ่มต้นจาก timestamp ใน goldPawn
//         const endDate = new Date(startDate);
//         endDate.setDate(endDate.getDate() + 60); // บวกเพิ่ม 60 วัน

//         const newPayment = new Payment({
//             goldId: goldId,
//             startDate: startDate,
//             endDate: endDate,
//             nextDueDate: endDate, // กำหนดครั้งถัดไปเป็นวันเดียวกันกับวันสิ้นสุด
//             amount: pawn.total, // จำนวนเงินจาก total ใน goldPawn
//             statusPawn: 'เริ่มจำนำ'
//         });

//         // บันทึกการชำระเงินใหม่
//         await newPayment.save();
//         return newPayment; // ส่งกลับการชำระเงินใหม่
//     } catch (error) {
//         console.error('Error adding payment:', error);
//         throw error; // ถ้าเกิดข้อผิดพลาดให้โยนขึ้น
//     }
// };

// // เส้นทางเพื่อเพิ่มข้อมูลจำนำทอง
// router.post('/', async (req, res) => {
//     const { customerId, goldId, type, weight, principal, interest, total } = req.body;
//     try {
//         // ตรวจสอบว่า goldId มีอยู่แล้วในระบบหรือไม่
//         const existingGold = await Pawn.findOne({ goldId: goldId });
//         if (existingGold) {
//             return res.status(400).json({ message: 'ID ทองนี้มีอยู่แล้วในระบบ' });
//         }

//         // สร้างข้อมูลจำนำทองใหม่
//         const newPawn = new Pawn({
//             customerId,
//             goldId,
//             type,
//             weight,
//             principal,
//             interest,
//             total,
//             status:"จำนำ" // ค่าเริ่มต้น
//         });

//         // บันทึกข้อมูลจำนำทองลงฐานข้อมูล
//         await newPawn.save();

//         // เพิ่มการชำระเงินพร้อมกัน
//         await addPayment(goldId);
        

//         // ส่งการตอบกลับ
//         res.status(201).json({ message: 'เพิ่มข้อมูลจำนำทองเรียบร้อย' });
//     } catch (error) {
//         console.error('Error adding gold pawn:', error);
//         res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลจำนำทอง', error });
//     }
// });

// // เส้นทางเพื่อดึงข้อมูลประวัติการชำระเงินสำหรับทองคำตาม goldId
// router.get('/gold-payment-history/:goldId', async (req, res) => {
//     const goldId = req.params.goldId;

//     try {
//         // ดึงข้อมูลประวัติการชำระเงินสำหรับ goldId จากฐานข้อมูล
//         const paymentHistory = await Payment.find({ goldId: goldId }).sort({ paymentDate: -1 });

//         // ดึงข้อมูลเงินต้นจากตาราง Pawn
//         const pawn = await Pawn.findOne({ goldId: goldId });

//         if (!pawn) {
//             return res.status(404).send('ไม่พบข้อมูลจำนำทอง');
//         }

//         const principal = pawn.principal; // เงินต้น
//         const customerId = pawn.customerId; // ดึง customerId จาก pawn

//         // ดึงข้อมูลลูกค้าโดยใช้ customerId
//         const customer = await Customer.findOne({ customerId: customerId });

//         // ส่งข้อมูลประวัติการชำระเงิน, เงินต้น, customerId และข้อมูลลูกค้าไปยังหน้า golddetail
//         res.render('golddetail', { goldId, paymentHistory, principal, customerId, customer });
//     } catch (error) {
//         console.error('Error fetching payment history:', error);
//         res.status(500).render('golddetail', { goldId, paymentHistory: [], error: 'เกิดข้อผิดพลาดในการดึงประวัติการชำระเงิน', principal: 0 });
//     }
// });

module.exports = router;
