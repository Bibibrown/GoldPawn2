const express = require('express');
const router = express.Router();
const Payment = require('../models/payment');
const Pawn = require('../models/goldPawn');

router.get('/', async (req, res) => {
    res.render('golddetail');
});

// router.get('/gold/:goldId', async (req, res) => {
//     const { goldId } = req.params; // รับ goldId ที่ส่งมาใน URL
//     try {
//         // ดึงข้อมูลการชำระเงินจากฐานข้อมูลตาม goldId
//         const payments = await Payment.find({ goldId: goldId }); // ใช้ find แทน findById
//         if (!payments.length) {
//             return res.status(404).json({ message: 'ไม่พบการชำระเงินที่ระบุสำหรับ goldId นี้' });
//         }
//         // ส่งข้อมูลการชำระเงินในรูปแบบ JSON
//         res.json(payments);
//     } catch (error) {
//         console.error('Error fetching payment details:', error);
//         res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการชำระเงิน' });
//     }
// });


// // เส้นทางเพื่อเพิ่มการชำระเงินใหม่
// router.post('/add-payment/:goldId', async (req, res) => {
//     const goldId = req.params.goldId;

//     try {
//         const newPayment = await addPayment(goldId);
//         res.status(201).json({ message: 'เพิ่มการชำระเงินเรียบร้อยแล้ว', payment: newPayment });
//     } catch (error) {
//         res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มการชำระเงิน', error });
//     }
// });

// // เส้นทางเพื่อทำการต่อดอก
// router.post('/extend-payment/:goldId', async (req, res) => {
//     const goldId = req.params.goldId; // รับ goldId จาก URL

//     try {
//         // ดึงข้อมูลการชำระเงินล่าสุดจากฐานข้อมูลตาม goldId
//         const latestPayment = await Payment.findOne({ goldId: goldId }).sort({ createdAt: -1 }); // หาข้อมูลล่าสุด
//         if (!latestPayment) {
//             return res.status(404).json({ message: 'ไม่พบข้อมูลการชำระเงิน' });
//         }

//         // ดึงข้อมูลจำนำทองที่เกี่ยวข้อง
//         const pawn = await Pawn.findOne({ goldId: latestPayment.goldId });
//         if (!pawn) {
//             return res.status(404).json({ message: 'ไม่พบข้อมูลจำนำทอง' });
//         }

//         // ใช้ startDate และ endDate ของการชำระเงินล่าสุด
//         const startDate = new Date(latestPayment.startDate);
//         const endDate = new Date(latestPayment.endDate);
//         const nextDueDate = new Date(latestPayment.nextDueDate); // ใช้ nextDueDate ของการชำระเงินล่าสุด
//         const daysBetween = Math.floor((nextDueDate - startDate) / (1000 * 60 * 60 * 24)); // จำนวนวัน

//         console.log(daysBetween);
//         // ดึง principal และ interest จาก pawn
//         const principal = pawn.principal; // ให้แน่ใจว่า field นี้มีอยู่ในโมเดล Pawn
//         const interest = pawn.interest; // ให้แน่ใจว่า field นี้มีอยู่ในโมเดล Pawn

//         // คำนวณจำนวนเงินใหม่ตามสูตรที่ให้มา
//         const amount = ((principal * (interest / 100)) / 30) * daysBetween;
//         console.log(amount);
//         // สร้าง nextDueDate ใหม่เพื่อหลีกเลี่ยงการปรับเปลี่ยนค่าเดิม
//         const newNextDueDate = new Date(nextDueDate);
//         newNextDueDate.setDate(newNextDueDate.getDate() + 60); // บวกเพิ่ม 60 วัน

//         // สร้างการชำระเงินใหม่ที่มี _id ใหม่
//         const newPayment = new Payment({
//             goldId: goldId,
//             startDate: nextDueDate, // ใช้ nextDueDate ของการชำระเงินล่าสุด
//             endDate: newNextDueDate, // ใช้ endDate ใหม่
//             nextDueDate: newNextDueDate, // กำหนด nextDueDate ใหม่
//             amount: amount, // ใช้จำนวนเงินที่คำนวณใหม่
//             statusPawn: 'ต่อดอก'
//         });
//         console.log(startDate);
//         console.log(nextDueDate);

//         await newPayment.save(); // บันทึกการชำระเงินใหม่

//         res.status(200).json({ message: 'ต่อดอกเรียบร้อยแล้ว', payment: newPayment });
//     } catch (error) {
//         console.error('Error extending payment:', error);
//         res.status(500).json({ message: 'เกิดข้อผิดพลาดในการต่อดอก', error });
//     }
// });

module.exports = router;
