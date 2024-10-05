const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pawnSchema = new Schema({
    pawnId: {
        type: String,
        unique: true // กำหนดให้ไม่ซ้ำกัน
    },
    customerId: {
        type: String, // อ้างอิงถึง customerId ในฝั่ง customer
        ref: 'Customer', // กำหนดความสัมพันธ์กับ customer model
        required: true
    },
    goldId: {
        type: [String], 
        required: false 
    }
}, { timestamps: true });

const Pawn = mongoose.model('Pawn', pawnSchema);
module.exports = Pawn;