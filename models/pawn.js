const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pawnSchema = new Schema({
    pawnId: {
        type: String,
        unique: true // กำหนดให้ไม่ซ้ำกัน
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId, // อ้างอิงถึง customerId ในฝั่ง customer
        ref: 'Customer', // กำหนดความสัมพันธ์กับ customer model
        required: true
    },
    paymentId: {
        type: [String], 
        required: false 
    }
});

// ฟังก์ชันสำหรับสร้าง pawnId อัตโนมัติ
pawnSchema.pre('save', async function (next) {
    const pawn = this;
    
    // ตรวจสอบว่าถ้ามีการสร้าง pawn ใหม่ และ pawnId ยังไม่มีค่า
    if (!pawn.pawnId) {
      // สร้าง pawnId ใหม่ โดยใช้รูปแบบ PAW-XXXX (เช่น PAW-0001)
      const lastPawn = await Pawn.findOne().sort({ pawnId: -1 }); // หา pawn ล่าสุดจากฐานข้อมูล
      const lastId = lastPawn ? parseInt(lastPawn.pawnId.split('-')[1]) : 0;
      const newId = lastId + 1;
      
      pawn.pawnId = `P-${newId.toString().padStart(4, '0')}`; // สร้าง pawnId เช่น P-0001
    }
    
    next(); // ดำเนินการต่อเพื่อบันทึก
  });

const Pawn = mongoose.model('Pawn', pawnSchema);
module.exports = Pawn;