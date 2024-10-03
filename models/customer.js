const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerSchema = new Schema({
    customerId: {
        type: String,
        required: true,
        unique: true,
        match: [/^\d{13}$/, 'Customer ID ต้องเป็นเลขบัตรประชาชน 13 หลัก'],
    },
    customerFName: {
        type: String,
        required: true
    },
    customerLName: {
        type: String,
        required: true
    },
    customerAddress: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    pawnId: {
        type: [String], 
        required: false 
    }
});

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;