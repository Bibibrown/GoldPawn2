const express = require('express');
const router = express.Router();
const Customer = require('../models/customer');
const Pawn = require('../models/goldPawn');
const Payment = require('../models/payment');
const addPawn = require('../models/pawn');
const Type = require('../models/type'); 

// เส้นทางเพื่อแสดงหน้า Add Gold Pawn สำหรับลูกค้า
router.get('/addpawn/:customerId', async (req, res) => {
    const { customerId } = req.params;
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
        // ส่งข้อมูลลูกค้า, ประวัติการจำนำทอง, และ customerId ไปยังหน้า addpawn.ejs
        res.render('addpawn', { customer, pawns, customerId: customer.customerId, newGoldId, typeList});
    } catch (error) {
        console.error('Error fetching customer or pawn history:', error);
        res.status(500).render('error', { message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
});

// เส้นทางเพื่อจัดการการเพิ่มการจำนำทองใหม่ (POST)
router.post('/addpawn', async (req, res) => {
    const { customerId, goldId, goldTypeName, weight, principal, interest, intperm } = req.body;
    try {
        // หาลูกค้าตาม customerId
        const customer = await Customer.findOne({ customerId: customerId });
        if (!customer) {
            return res.status(404).render('error', { message: 'ไม่พบลูกค้า' });
        }
        async function generatePawnId() {
            const lastPawn = await addPawn.findOne().sort({ createdAt: -1 }); // หาข้อมูลล่าสุด
            if (!lastPawn) return 'P-0001'; // ถ้าไม่มีข้อมูลเลย
            const lastId = parseInt(lastPawn.pawnId.split('-')[1]); // แยกตัวเลขจาก typeId
            const newPawnId = lastId + 1; // เพิ่ม ID ใหม่
            return `P-${String(newPawnId).padStart(4, '0')}`; // คืนค่า typeId ใหม่
        }
        const newPID = await generatePawnId();
        // สร้าง Pawn ใหม่
        const newPawn = new addPawn({
            pawnId: newPID, // ตัวอย่างการสร้าง pawnId แบบไม่ซ้ำ
            customerId: customer.customerId,
            goldId: [] // เริ่มต้นเป็น array ว่าง
        });

        await newPawn.save();

        // สร้าง Gold ใหม่ที่อ้างอิงถึง Pawn นี้
        const newGold = new Pawn({
            pawnId: newPawn._id,
            goldId: req.body.goldId || 'GOLD-' + newPawn._id, // กำหนด goldId ตามที่คุณต้องการ
            typeName: req.body.typeName, // ควรรับค่า typeName จากฟอร์ม
            weight: weight,
            principal: principal,
            interest: interest,
            intperm: intperm,
            status: 'จำนำ',
            paymentId: [] // เริ่มต้นเป็น array ว่าง
        });

        await newGold.save();

        // เพิ่ม goldId ลงใน Pawn
        newPawn.goldId.push(newGold.goldId);
        await newPawn.save();

        // เพิ่ม pawnId ลงในลูกค้า
        customer.pawnId.push(newPawn.pawnId);
        await customer.save();

        console.log('Customer ID:', customer._id);
        
        // ดึงข้อมูลที่เพิ่งถูกสร้างและส่งไปยังหน้าแสดงผล
        const pawns = await Pawn.find({ customerId: customer._id })
            .populate({
                path: 'goldId',
                populate: { path: 'typeName' }
            })
            .sort({ createdAt: 1 });

        console.log('Pawns:', JSON.stringify(pawns, null, 2));

        res.redirect(`/pawn/addpawn/${encodeURIComponent(customerId)}`);
    } catch (error) {
        console.error('Error adding new pawn:', error);
        res.status(500).render('error', { message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลจำนำทอง' });
    }
});

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
