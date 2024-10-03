const express = require('express');
const router = express.Router();
const Customer = require('../models/customer'); // อ้างอิงโมเดล Customer

// Middleware สำหรับตรวจสอบข้อมูลลูกค้า
function validateCustomerData(req, res, next) {
    const { customerId, customerFName, customerLName, customerAddress, customerPhone } = req.body;

    // ตรวจสอบว่าข้อมูลครบถ้วน
    if (!customerId || !customerFName || !customerLName || !customerAddress || !customerPhone) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลลูกค้าทั้งหมด' });
    }

    // ตรวจสอบว่า customerId เป็นเลข
    if (isNaN(customerId)) {
        return res.status(400).json({ message: 'ID ลูกค้าต้องเป็นตัวเลข' });
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
        res.render('customer', { customer, customerId }); // ส่งข้อมูลลูกค้าไปยัง view
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
        console.error('Update Error:', error); // Log the error
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
        res.status(201).redirect(`/customer/${newCustomer.customerId}`); // เปลี่ยนไปที่หน้าแสดงข้อมูลลูกค้า
    } catch (error) {
        console.error('Create Customer Error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลลูกค้า' });
    }
});

module.exports = router;