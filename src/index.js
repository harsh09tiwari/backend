// require('dotenv').config({path: './env'})      //  not that optimal

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

// import express from "express";
// const app = express();


dotenv.config({
    path: './env'
});

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.error("APP encountered an error:", error);
            throw error;
        });

        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at PORT ${process.env.PORT || 8000}`);
        });
    })
    .catch((error) => {
        console.error("MONGO DB connection FAILED !!!", error);
    });

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