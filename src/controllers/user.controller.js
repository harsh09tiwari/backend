import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";     //   for validation of user details
import {User} from "../models/user.model.js"  //  for checking user details from datebase
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async (req, res) => {
    //  get user details from frontend
    //  validation - not empty
    //  check if user already exits : username, email
    //  check for images, avatar
    //  upload them to cloudinary, avatar
    //  create user object - create entry in DB
    //  remove password and refresh token field from response
    //  check for user creation
    //  return res


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
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )


}) 

export default registerUser;