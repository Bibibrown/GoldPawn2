const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const goldSchema = new Schema({
    pawnId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pawn',
        required: true
    },
    goldId: {
        type: String,
        required: true,
        unique: true, // กำหนดให้ไม่ซ้ำกัน
    },
    typeName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Type',
        required: true,
    },
    weight: {
        type: Number,
        required: true,
        min: 0.01, // กำหนดค่าน้ำหนักขั้นต่ำ
    },
    principal: {
        type: Number,
        required: true,
        min: 0, // กำหนดเงินต้นขั้นต่ำ
    },
    interest: {
        type: Number,
        required: true,
        min: 0, // กำหนดดอกเบี้ยขั้นต่ำ
    },
    intperm: {
        type: Number,
        required: true,
        min: 0, // กำหนดเงินสุทธิขั้นต่ำ
    },
    status: {
        type: String,
        default:'จำนำ',
        enum: ['จำนำ', 'หลุดจำนำ', 'ไถ่คืน'], // กำหนดสถานะที่อนุญาต
    },
    paymentId: {
        type: [String], 
        required: false 
    }
}, { timestamps: true });

const Gold = mongoose.model('Gold', goldSchema);
module.exports = Gold;