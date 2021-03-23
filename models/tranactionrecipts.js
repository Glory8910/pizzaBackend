const mongoose=require('mongoose')

const paymentactions=mongoose.Schema({
   receipts:{
       type:Object
   }
 
})

const receiptscopy=mongoose.model("paydetails",paymentactions)
module.exports={ receiptscopy };