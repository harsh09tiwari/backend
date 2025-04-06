// require('dotenv').config({path: './env'})      //  not that optimal

import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.on("error", (error)=>{
        console.log("APP encounterd an error !!", error);    
    });

    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at PORT ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.log("MONGO DB connection FAILED !!!" , error);
})


 











/*

import express from "express";

//  using iife
( async() => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}`)
        app.on("error", () => {
            console.log("ERROR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch(error){
        console.log("ERROR: ", Error );
        throw err
    }
})()

*/