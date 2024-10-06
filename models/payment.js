const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
    paymentId: {
        type: String,
        required: true,
        unique: true
    },
    paymentDate: {
        type: Date,
        default: Date.now // วันที่จ่ายจะเป็นวันที่ปัจจุบัน
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
    },
    nextDueDate: {
        type: Date,

    },
    amount: {
        type: Number,
        required: true
    },
    statusPawn: {
        type: String,
        default:'เริ่มจำนำ',
        enum: ['เริ่มจำนำ', 'ต่อดอก', 'ไถ่คืน'], 
    },
    goldId: {
        type: String,
        ref: 'Gold',
        required: true
    }
},{ timestamps: true } );

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
