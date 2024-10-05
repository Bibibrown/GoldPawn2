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
// async function generatePawnId() {
//     const lastPawn = await addPawn.findOne().sort({ createdAt: -1 });
//     if (!lastPawn) return 'P-0001';
//     const lastId = parseInt(lastPawn.pawnId.split('-')[1]);
//     const newPawnId = lastId + 1;
//     return `P-${String(newPawnId).padStart(4, '0')}`;
// }

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

        async function generatePawnId() {
            const lastPawn = await addPawn.findOne().sort({ createdAt: -1 }); // หาข้อมูลล่าสุด
            if (!lastPawn) return 'P-0001'; // ถ้าไม่มีข้อมูลเลย
            const lastId = parseInt(lastPawn.pawnId.split('-')[1]); // แยกตัวเลขจาก typeId
            const newPawnId = lastId + 1; // เพิ่ม ID ใหม่
            return `P-${String(newPawnId).padStart(4, '0')}`; // คืนค่า typeId ใหม่
        }
        const newPID = await generatePawnId();

        // ส่งข้อมูลลูกค้า, ประวัติการจำนำทอง, และ customerId ไปยังหน้า addpawn.ejs
        res.render('addpawn', { customer, pawns, customerId: customer.customerId, newGoldId, newPID, typeList});
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
    const { pawnId, typeName, weight, principal, interest, intperm } = req.body;
    
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

        console.log(existingPawn)
        console.log(newGold)
        console.log(newPawnId)
        console.log(newGoldId)

        res.status(201).json({ 
            message: 'เพิ่มข้อมูลทองที่จำนำเรียบร้อย', 
            pawn: existingPawn,
            gold: newGold,
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

// router.get('/:pawnId', async (req, res) => {
//     const { pawnId } = req.params;
//     try {
//         console.log('Searching for pawnId:', pawnId);
//         // ค้นหา Pawn โดยใช้ pawnId แทน _id
//         const pawn = await addPawn.findOne({ pawnId: pawnId });
//         
//         if (!pawn) {
//             console.log('Pawn not found');
//             return res.status(404).render('error', { message: 'ไม่พบข้อมูลจำนำ' });
//         }

//         console.log('Pawn found:', JSON.stringify(pawn, null, 2));

//         // ค้นหา Customer โดยใช้ customerId แทน _id
//         const customer = await Customer.findOne({ customerId: pawn.customerId });

//         if (!customer) {
//             console.log('Customer not found');
//             return res.status(404).render('error', { message: 'ไม่พบข้อมูลลูกค้า' });
//         }

//         // ค้นหาข้อมูล Gold
//         const goldItems = await Pawn.find({ goldId: { $in: pawn.goldId } }).populate('typeName');
//         console.log('Gold items found:', JSON.stringify(goldItems, null, 2));

//         const pawnWithGold = {
//             ...pawn.toObject(),
//             goldItems: goldItems,
//             customer: customer // เพิ่มข้อมูลลูกค้าเข้าไปใน object
//         };

//         res.render('pawnlist', { pawn: pawnWithGold });
//     } catch (error) {
//         console.error('Detailed error:', error);
//         res.status(500).render('error', { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลจำนำ: ' + error.message });
//     }
// });

// router.get('/by-gold/:goldId', async (req, res) => {
//     const { goldId } = req.params;
//     try {
//         const pawn = await Pawn.findOne({ goldId: goldId }).populate('customerId');
//         if (!pawn) {
//             return res.status(404).render('error', { message: 'ไม่พบข้อมูลจำนำ' });
//         }
//         
//         const goldItems = await Gold.find({ goldId: { $in: pawn.goldId } }).populate('typeName');
//         const pawnWithGold = { ...pawn.toObject(), goldItems: goldItems };
//         
//         res.render('pawnlist', { pawn: pawnWithGold });
//     } catch (error) {
//         console.error('Error fetching pawn details:', error);
//         res.status(500).render('error', { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลจำนำ' });
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
//         

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