const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const typeSchema = new Schema({
    typeId: {
        type: String,
        required: true,
        unique: true
    },
    typeName: {
        type: String,
        required: true 
    },
    goldId: {
        type: [String], 
        required: false 
    }
},{ timestamps: true } );

const Type = mongoose.model('Type', typeSchema);

module.exports = Type;
