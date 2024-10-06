const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pawnSchema = new Schema({
    pawnId: {
        type: String,
        unique: true 
    },
    customerId: {
        type: String, // อ้างอิงถึง customerId ในฝั่ง customer
        ref: 'Customer', 
        required: true
    },
    goldId: {
        type: [String], 
        required: false 
    }
}, { timestamps: true });

const Pawn = mongoose.model('Pawn', pawnSchema);
module.exports = Pawn;