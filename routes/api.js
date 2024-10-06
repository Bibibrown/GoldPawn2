const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Customer = require('../models/customer');
const Pawn = require('../models/goldPawn');
const Payment = require('../models/payment');
const addPawn = require('../models/pawn');
const Type = require('../models/type'); 

async function generateTypeId() {
    const lastType = await Type.findOne().sort({ createdAt: -1 }); // หาข้อมูลล่าสุด
    if (!lastType) return 'T-0001'; // ถ้าไม่มีข้อมูลเลย
    const lastId = parseInt(lastType.typeId.split('-')[1]); // แยกตัวเลขจาก typeId
    const newId = lastId + 1; // เพิ่ม ID ใหม่
    return `T-${String(newId).padStart(4, '0')}`; // คืนค่า typeId ใหม่
}

async function generatePawnId() {
    const lastPawn = await addPawn.findOne().sort({ createdAt: -1 });
    if (!lastPawn) return 'P-0001';
    const lastId = parseInt(lastPawn.pawnId.split('-')[1]);
    const newPawnId = lastId + 1;
    return `P-${String(newPawnId).padStart(4, '0')}`;
}

async function generateGoldId() {
    const lastGold = await Pawn.findOne().sort({ createdAt: -1 });
    if (!lastGold) return 'G-0001';
    const lastId = parseInt(lastGold.goldId.split('-')[1]);
    const newGoldId = lastId + 1;
    return `G-${String(newGoldId).padStart(4, '0')}`;
}

// GET: ดึงข้อมูลลูกค้าทั้งหมด
router.get('/customers', async (req, res) => {
    try {
        const customers = await Customer.find();  // ค้นหาลูกค้าทั้งหมดใน MongoDB
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET: ดึงข้อมูลลูกค้าตาม ID
router.get('/customers/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const customer = await Customer.findOne({ customerId });
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST: เพิ่มลูกค้าใหม่
router.post('/customers', async (req, res) => {
    try {
        const {
            customerId,
            customerFName,
            customerLName,
            customerAddress,
            customerPhone
        } = req.body;

        const newCustomer = new Customer({
            customerId,
            customerFName,
            customerLName,
            customerAddress,
            customerPhone
        });
        await newCustomer.save();
        res.status(201).json(newCustomer);
    } catch (error) {
        console.error(error); // log ข้อผิดพลาดใน console
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลลูกค้า', error });
    }
});

// PUT: แก้ไขข้อมูลลูกค้า
router.put('/customers/:customerId', async (req, res) => {
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

// DELETE: ลบข้อมูลลูกค้า
router.delete('/customers/:customerId', async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const deletedCustomer = await Customer.findOneAndDelete({ customerId: customerId }); // ลบประเภททองตาม typeId

        if (!deletedCustomer) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลลูกค้าที่ต้องการลบ' });
        }

        res.status(200).json({ message: 'ลบข้อมูลลูกค้าสำเร็จ', deletedCustomer });
    } catch (error) {
        console.error('Error deleting gold type:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูลลูกค้า', error });
    }
});

// GET: ดึงข้อมูลpawnทั้งหมด
router.get('/pawns', async (req, res) => {
    try {
        const pawns = await addPawn.find();  
        res.json(pawns);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET: ดึงข้อมูลpawnตาม ID
router.get('/pawns/:pawnId', async (req, res) => {
    try {
        const { pawnId } = req.params;
        const pawn = await addPawn.findOne({ pawnId });
        if (!pawn) return res.status(404).json({ message: 'Pawn not found' });
        res.json(pawn);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST: เพิ่มpawnใหม่
router.post('/pawns', async (req, res) => {
    try {
        const newPawn = new addPawn({
            pawnId: await generatePawnId(),
            customerId: req.body.customerId,
            goldId: req.body.goldId || [] 
        });
        await newPawn.save();
        res.status(201).json(newPawn);
    } catch (error) {
        console.error(error); 
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลการจำนำ', error });
    }
});

// PUT: แก้ไขข้อมูลpawn
router.put('/pawns/:pawnId', async (req, res) => {
    const { pawnId } = req.params; 
    const { customerId, goldId } = req.body;

    try {
        const updatedPawn = await addPawn.findOneAndUpdate(
            {  pawnId:  pawnId },
            { customerId, goldId },
            { new: true }
        );

        if (!updatedPawn) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการจำนำเพื่ออัปเดต' });
        }

        res.json(updatedPawn);
    } catch (error) {
        console.error('Update Error:', error); // Log the error
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลการจำนำ' });
    }
});

// DELETE: ลบข้อมูลpawn
router.delete('/pawns/:pawnId', async (req, res) => {
    try {
        const pawnId = req.params.pawnId;
        const deletedPawn = await addPawn.findOneAndDelete({ pawnId: pawnId }); 

        if (!deletedPawn) {
            return res.status(404).json({ message: 'ไม่พบการจำนำที่ต้องการลบ' });
        }

        res.status(200).json({ message: 'ลบข้อมูลการจำนำสำเร็จ', deletedPawn });
    } catch (error) {
        console.error('Error deleting gold type:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูล', error });
    }
});

// GET: ดึงข้อมูลgoldทั้งหมด
router.get('/golds', async (req, res) => {
    try {
        const golds = await Pawn.find();  
        res.json(golds);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET: ดึงข้อมูลgoldตาม ID
router.get('/golds/:goldId', async (req, res) => {
    try {
        const { goldId } = req.params;
        const gold = await Pawn.findOne({ goldId });
        if (!gold) return res.status(404).json({ message: 'Gold not found' });
        res.json(gold);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT: แก้ไขข้อมูลgold
router.put('/golds/:goldId', async (req, res) => {
    const { goldId } = req.params; // รับ customerId จาก path parameter
    const { pawnId, typeName, weight, principle, interest, intperm, status, paymentId} = req.body;

    try {
        const updatedGold = await Pawn.findOneAndUpdate(
            { goldId : goldId  },
            { pawnId, typeName, weight, principle, interest, intperm, status, paymentId},
            { new: true }
        );

        if (!updatedGold) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลทองเพื่ออัปเดต' });
        }

        res.json(updatedGold);
    } catch (error) {
        console.error('Update Error:', error); // Log the error
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลทอง' });
    }
});

// DELETE: ลบข้อมูลtype
router.delete('/golds/:goldId', async (req, res) => {
    try {
        const goldId = req.params.goldId;
        const deletedGold = await Pawn.findOneAndDelete({ goldId: goldId }); // ลบประเภททองตาม typeId

        if (!deletedGold) {
            return res.status(404).json({ message: 'ไม่พบทองที่ต้องการลบ' });
        }

        res.status(200).json({ message: 'ลบทองสำเร็จ', deletedGold });
    } catch (error) {
        console.error('Error deleting gold type:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบทอง', error });
    }
});

// GET: ดึงข้อมูลtypeทั้งหมด
router.get('/types', async (req, res) => {
    try {
        const types = await Type.find();  
        res.json(types);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET: ดึงข้อมูลtypeตาม ID
router.get('/types/:typeId', async (req, res) => {
    try {
        const { typeId } = req.params;
        const type = await Type.findOne({ typeId });
        if (!type) return res.status(404).json({ message: 'Type not found' });
        res.json(type);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST: เพิ่มtypeใหม่
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

// PUT: แก้ไขข้อมูลtype
router.put('/types/:typeId', async (req, res) => {
    const { typeId } = req.params; // รับ customerId จาก path parameter
    const { typeName} = req.body;

    try {
        const updatedType = await Type.findOneAndUpdate(
            { typeId : typeId  },
            { typeName},
            { new: true }
        );

        if (!updatedType) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลประเภทเพื่ออัปเดต' });
        }

        res.json(updatedType);
    } catch (error) {
        console.error('Update Error:', error); // Log the error
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลประเภท' });
    }
});

// DELETE: ลบข้อมูลtype
router.delete('/types/:typeId', async (req, res) => {
    try {
        const typeId = req.params.typeId;
        const deletedType = await Type.findOneAndDelete({ typeId: typeId }); // ลบประเภททองตาม typeId

        if (!deletedType) {
            return res.status(404).json({ message: 'ไม่พบประเภททองที่ต้องการลบ' });
        }

        res.status(200).json({ message: 'ลบประเภททองสำเร็จ', deletedType });
    } catch (error) {
        console.error('Error deleting gold type:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบประเภททอง', error });
    }
});

module.exports = router;