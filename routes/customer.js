const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const Customer = require('../models/customer'); 
const Pawn = require('../models/pawn');
const Gold = require('../models/goldPawn');
const Payment = require('../models/payment');

// Middleware สำหรับตรวจสอบข้อมูลลูกค้า
function validateCustomerData(req, res, next) {
    const { customerId, customerFName, customerLName, customerAddress, customerPhone } = req.body;

    if (!customerId || !customerFName || !customerLName || !customerAddress || !customerPhone) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลลูกค้าทั้งหมด' });
    }

    if (isNaN(customerId)) {
        return res.status(400).json({ message: 'ID ลูกค้าต้องเป็นตัวเลข 13 หลัก' });
    }
    // ตรวจสอบความยาวของชื่อและนามสกุล
    if (customerFName.length < 2 || customerLName.length < 2) {
        return res.status(400).json({ message: 'ชื่อและนามสกุลต้องมีความยาวอย่างน้อย 2 ตัวอักษร' });
    }
    // ตรวจสอบรูปแบบเบอร์โทร (ต้องมี 10 หลัก)
    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(customerPhone)) {
        return res.status(400).json({ message: 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก' });
    }
    next();
}

// GET หน้าเพิ่มลูกค้าใหม่
router.get('/add-customer', (req, res) => {
    const customerID = req.query.customerID || ''; // รับ customerID จาก query parameter
    res.render('addcustomer', { customerID }); // ส่ง customerID ไปยัง view
});

// GET ลูกค้าตาม ID
router.get('/:customerId', async (req, res) => {
    const { customerId } = req.params;
    try {
        const customer = await Customer.findOne({ customerId });
        if (!customer) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลลูกค้า' });
        }
        res.render('customer', { customer, customerId }); 
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการค้นหาข้อมูลลูกค้า' });
    }
});

// PUT อัปเดตข้อมูลลูกค้า
router.put('/:customerId', validateCustomerData, async (req, res) => {
    const { customerId } = req.params; // รับ customerId จาก path parameter
    const { customerFName, customerLName, customerAddress, customerPhone } = req.body;

    try {
        const updatedCustomer = await Customer.findOneAndUpdate(
            { customerId: customerId },
            { customerFName, customerLName, customerAddress, customerPhone },
            { new: true }
        );

        if (!updatedCustomer) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลลูกค้าเพื่ออัปเดต' });
        }

        res.json(updatedCustomer);
    } catch (error) {
        console.error('Update Error:', error); 
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลลูกค้า' });
    }
});

// POST เพิ่มข้อมูลลูกค้าใหม่
router.post('/', validateCustomerData, async (req, res) => {
    const { customerId, customerFName, customerLName, customerAddress, customerPhone } = req.body;

    try {
        // ตรวจสอบว่ามี ID ลูกค้าที่ซ้ำกันหรือไม่
        const existingCustomerById = await Customer.findOne({ customerId });
        if (existingCustomerById) {
            return res.status(409).json({ message: 'ID ลูกค้าซ้ำ กรุณาใช้ ID อื่น' });
        }

        // ตรวจสอบว่ามีหมายเลขโทรศัพท์ที่ซ้ำกันหรือไม่
        const existingCustomerByPhone = await Customer.findOne({ customerPhone });
        if (existingCustomerByPhone) {
            return res.status(409).json({ message: 'เบอร์โทรศัพท์นี้มีอยู่แล้ว กรุณาใช้เบอร์โทรศัพท์อื่น' });
        }

        const newCustomer = new Customer({
            customerId,
            customerFName,
            customerLName,
            customerAddress,
            customerPhone
        });

        await newCustomer.save();
        res.status(201).redirect(`/customer/${newCustomer.customerId}`); 
    } catch (error) {
        console.error('Create Customer Error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลลูกค้า' });
    }
});

// DELETE สำหรับลบข้อมูลลูกค้าและการจำนำที่เชื่อมโยง
router.delete('/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        let deletedPawns = 0;
        let deletedGolds = 0;
        let deletedPayments = 0;

        // ค้นหาการจำนำที่เกี่ยวข้อง
        const pawns = await Pawn.find({ customerId: customerId });

        if (pawns.length > 0) {
            deletedPawns = pawns.length;
            // ใช้ทั้ง _id และ pawnId ในการค้นหา Gold
            const pawnIds = pawns.map(pawn => pawn._id.toString());
            const pawnNumbers = pawns.map(pawn => pawn.pawnId);
            
            console.log('Pawn IDs:', pawnIds);
            console.log('Pawn Numbers:', pawnNumbers);

            // ตรวจสอบ Gold ที่เกี่ยวข้องโดยใช้ทั้ง _id และ pawnId
            const relatedGolds = await Gold.find({ 
                $or: [
                    { pawnId: { $in: pawnIds } },
                    { pawnId: { $in: pawnNumbers } }
                ]
            });
            console.log(`Found ${relatedGolds.length} related gold records`);
            deletedGolds = relatedGolds.length;

            // รวบรวม goldIds ทั้งหมด
            const goldIds = relatedGolds.map(gold => gold.goldId);

            // ลบข้อมูล Payment ที่เกี่ยวข้องกับ Gold
            const deletePaymentResult = await Payment.deleteMany({ goldId: { $in: goldIds } });
            deletedPayments = deletePaymentResult.deletedCount;
            console.log(`Deleted ${deletedPayments} payment records`);

            // ลบข้อมูลทองคำที่เกี่ยวข้องกับ pawn ทั้งหมด
            const deleteGoldResult = await Gold.deleteMany({ 
                $or: [
                    { pawnId: { $in: pawnIds } },
                    { pawnId: { $in: pawnNumbers } }
                ]
            });
            console.log(`Deleted ${deleteGoldResult.deletedCount} gold records`);
            
            // ลบการจำนำทั้งหมดของลูกค้า
            const deletePawnResult = await Pawn.deleteMany({ customerId: customerId });
            console.log(`Deleted ${deletePawnResult.deletedCount} pawn records`);
        }

        // ลบลูกค้า
        const deleteCustomerResult = await Customer.findOneAndDelete({ customerId: customerId });
        if (!deleteCustomerResult) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.status(200).json({ 
            message: 'Customer, related pawns, golds, and payments deleted successfully',
            deletedCustomer: deleteCustomerResult,
            deletedPawns,
            deletedGolds,
            deletedPayments
        });
    } catch (error) {
        console.error('Error deleting customer and related data:', error);
        res.status(500).json({ message: 'Error deleting customer and related data', error: error.message });
    }
});

module.exports = router;