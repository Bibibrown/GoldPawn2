const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const goldSchema = new Schema({
    pawnId: {
        type: String,
        ref: 'Pawn',
        required: true
    },
    goldId: {
        type: String,
        required: true,
        unique: true, 
    },
    typeName: {
        type: String,
        ref: 'Type',
        required: true,
    },
    weight: {
        type: Number,
        required: true,
        min: 0.01, 
    },
    principal: {
        type: Number,
        required: true,
        min: 0, 
    },
    interest: {
        type: Number,
        required: true,
        min: 0, 
    },
    intperm: {
        type: Number,
        required: true,
        min: 0, 
    },
    status: {
        type: String,
        default:'จำนำ',
        enum: ['จำนำ', 'หลุดจำนำ', 'ไถ่คืน'], 
    },
    paymentId: {
        type: [String], 
        required: false 
    }
}, { timestamps: true });

const Gold = mongoose.model('Gold', goldSchema);
module.exports = Gold;