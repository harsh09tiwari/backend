const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((err) => next(err))
    }
}   




export {asyncHandler}




//      its like function inside a function, we are just removing the curly brackets
// const a = (func) => {() => {}}    just  remove the curly brackets.   it is a higher order function




//   USING TRY AND CATCH

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success : false,
//             meassage : error.meassage
//         })
//     }
// } 