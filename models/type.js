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
        type: [String], // ฟิลด์ goldId เป็น array ของ String
        required: false // สามารถกำหนดให้เป็น optional หรือ required ได้
    }
},{ timestamps: true } );

const Type = mongoose.model('Type', typeSchema);

module.exports = Type;
