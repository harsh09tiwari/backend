import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"     //   jwt is a bearer token(it is like key, we send data who have the key  )
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
            index : true,
        },
        email : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
        },
        fullname : {
            type : String,
            required : true,
            trim : true,
            index : true,
        },
        avatar : {
            type : String,   //  we are using cloudinary url (it is like AWS for uploading files, img and vid and provide a link of it)
            required : true,
        },
        coverImage : {
            type : String  // cloudinary url
        },
        watchHistory : [   //  it is an Array.
            {
                type : mongooseSchema.Types.ObjectId,
                ref : "Video"
            }
        ],
        password : {
            type : String,
            required : [true, 'Password is required'],
        },
        refreshToken : {
            type : String
        }
    },
    {timestamps : true}
)

//    using bcrypt
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()  //  password nai change kiya to bahar aajao

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function name(password) {
    return await bcrypt.compare(password, this.password)
}

//  using jwt
userSchema.methods.generateAccessToken = function (){
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullname : this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function (){
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)