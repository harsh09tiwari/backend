import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";     //   for validation of user details
import {User} from "../models/user.model.js"  //  for checking user details from datebase
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { decode } from "jsonwebtoken";



const generateAccessTokenandRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        console.log(user);
        
        const accessToken = user.generateAccessToken()   
        //   generating the access and refresh token
        const refreshToken = user.generateRefreshToken()
        
        

        //   adding and saving the token to the database
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave : false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}


//      REGISTERING THE USER
const registerUser = asyncHandler(async (req, res) => {
    //  get user details from frontend
    //  validation - not empty
    //  check if user already exits : username, email
    //  check for images, avatar
    //  upload them to cloudinary, avatar
    //  create user object - create entry in DB
    //  remove password and refresh token field from response
    //  check for user creation
    //  return response


    //    geting values from the frontend
    const {fullname, email, username, password}= req.body
    // console.log("email: ", email);
    
    // console.log(req.body);
    

    //    validating the values from forntend.   this technique check all fields at one time
    if ([fullname, email, username, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }


    //   checking user details from database
    //  FINDING THE EXISTED USER 
    const existedUser = await User.findOne({
        $or : [{username}, {email}]   //   coz of array we can check as many value we want
    })
    //  checking if the user is found
    if (existedUser) {
        throw new ApiError(400, "User is already registered with this email or username");
    }


    //   checking of images files through middleware and router
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // console.log(req.files);

    // const coverImageLocalPath = req.files?.coverImage[0]?.path ;    //  since it is not required so if we not provide any coverImage it will show error like "undefined"
    // better way to handle
    let coverImageLocalPath;      //  now if we don't find the coverImage it will return a empty String ""
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    //  uploading the avatar and coverImage, and checking the avatar is present or not
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    console.log(avatar)
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    //  entry in database  and checking the entry
    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).
    // since all are selected by default so we choose those fields which are we not want=> use negative symbol before the field name e.g => (-name)
    select("-password -refreshToken")        //  removing so no one can see it


    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

//     returning  response
    return res
    .status(201)
    .json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )


}) 

//      LOGIN THE USER
const loginUser = asyncHandler(async (req, res) => {
    // req body => data
    // username or email
    // find the user
    // check password
    // access and refresh token
    // send cookie


    const {email, username, password} = req.body
//
    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }
//
    const user = await User.findOne({
        //   this will check on any of the parameters.
        $or : [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(400, "user does not exist")
    }
//
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(400, "password is wrong")
    }

    const {accessToken, refreshToken} = await generateAccessTokenandRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")


    const options = {
        httpOnly : true,
        secure : true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,{
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in Successfully"
        )
    )
});


//   LOGOUT USER
//   agar user ko logout karna hai to cookie ko delete and Refresh token ko reset karna padega
const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )
    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged out Successfully"))
})

//      generating tokens
const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401,  "Unauthorize Access")
    }

    try {
        const decodeToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodeToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }
    
        //   matching the tokens of user and the token which is stored in database
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired");
        }
    
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessTokenandRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

//      for changing password
const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword, confirmPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "entered wrong password")
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "confirm password did not match");
        
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"))
})

//    accessing the user
const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successflly"))
})

//   updating text based data
const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullname, email} = req.body

    if (!(fullname || email)) {
        throw new ApiError(400, "All files are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,    //   this can be also written as fullname : fullname
                email
            }
        },
        {new : true}
    ).select("-password")

    if (!user) {
        throw new ApiError(401, "User not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
    

})

  //    FOR MYSELF =>   DELETE THE PREVIOUS AVATAR

//  updating files which required middlewares   =>    Avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");   
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on Avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                  avatar: avatar.url
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar changed successfully"))

})  

//    updating files which required middleware   =>  CoverImage
const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImageLocalPath.url) {
        throw new ApiError(400, "Error while uploading Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"))
})


//     we are fetching the number of subscriber of a channel and no of channel he subscribed
const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params    //   url se username milega, params se url milega
    if(!username?.trim()){
        throw new ApiError(400, "Username is missing");   
    }

//      USING AGGREGATION PIPELINE OF MONGO
    const channel = await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase
            }
        },
        {   //    checking for no of subscriber
            $lookup : {
                from  : "subscriptions",   //  model se dheko
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {   //    checking for no of channels
            $lookup : {
                from  : "subscriptions",   //  model se dheko
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelSubscribedToCount: {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $cond : {
                        if: {$in:[req.user?._id, "$subscribers.subscribe"]},   //   here $ represents the fields => line no 410
                        then: true,
                        else: false
                    }
                }
            }
        },
        {    //   this only allows selected to project=> means display
            $project : {
                fullname : 1,
                username : 1,
                subscribersCount : 1,
                channelSubscribedToCount : 1,
                isSubscribed : 1,
                avatar : 1,
                coverImage : 1,
                email : 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel doeas not exists");
        
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "user channel fetched successfully"))
     
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
};