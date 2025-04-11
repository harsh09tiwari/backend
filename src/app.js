import express from "express"
import cookieParser from "cookie-parser"    //  work is to access or set cookies on browser
import cors from "cors"

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))
app.use(express.json({limit: "16kb"}))     //  accepting json with limit
app.use(express.urlencoded({extended : true, limit : "16kb"}))   //   work on urls
app.use(express.static("public"))         //  for storing assets in local.  PUBLIC here is a folder
app.use(cookieParser())


//   routes import
import userRouter from './routes/user.routes.js'


// routes declaration
app.use("/api/v1/users", userRouter)     //   middleware

// http://localhost:8000/api/v1/users/register

export {app}