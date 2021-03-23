const mongoose=require('mongoose')

const scheme=mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    email:{
       type:String,
       required: true,
       unique:true
    },
    password:{
        type:String,
        required: true
    },
    resetid:{
        type:String
    },
    roles:{
        type:Array,
        required:true
    },
 
    transactionId:{
        type:String,
        sparse:true,
        require:true,
        index:true

        
    },
    transactionAmount:{
        type:Number,
    

    },

 
})

const userdata=mongoose.model("coll",scheme)
module.exports={ userdata };