const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        email:{
            type:String,
            required:true,
            unique:true
        },
        password:{
            type:String,
            required:true,
        },
        status:{
            type:String,
            enum:['Pending','Active'],
            default:'Pending'
        },
        otp:{
            type:String,
            
        },
            expiresAt:{
                type:Number,
                default:Date.now()
            }
    },{timestamps:true}



);

module.exports = mongoose.model('User',UserSchema);



