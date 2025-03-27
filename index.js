import express from 'express'
import {open} from 'sqlite'
import sqlite3 from 'sqlite3'
import path from 'path'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const __dirname = process.cwd()
const dbpath = path.join(__dirname, "goodreads.db")

const app = express()
app.use(cors())
app.use(express.json())

let db = null

const initializeDBAndServer = async()=>{
    try{

        db=await open({
            filename:dbpath,
            driver :sqlite3.Database,
        });
        app.listen(3000,()=>{
            console.log('server started at http://localhost:3000')
        })
    }catch(e){
        console.log(`DB Error : ${e.message}`)
    }
}

initializeDBAndServer();


const Logger =(request,response,next)=>{
    const authHeader = request.headers['authorization']
    let jwtToken
    if(authHeader !== undefined){
         jwtToken =authHeader.split(" ")[1]
       
    }
    if(jwtToken === undefined){
        response.status(401).send('Invalid jwtToken')
    }else{
        jwt.verify(jwtToken,"myToken",async(error,payload)=>{
            if(error){
                response.status(401).send('Invalid jwtToken')
            }else{
                next()
            }
        })
    }
}


//get all the books available in db

app.get("/books",Logger,async(request,response)=>{
    // console.log(request)
    
                try{
                    const getbooksquery = 
                    `
                SELECT * FROM BOOKS;
                
                `
                const books = await db.all(getbooksquery)
                if(!books){
                    response.status(404).json({error:'books not found'})
                }
                response.send(books)
            
                }catch(error){
                    response.status(500).json({error:'unable to fetch books'})
                }
            
    
}) 


//get author birth year

app.get('/birth',Logger,async(request,response)=>{
    try{
        const getbirthquery =
    `
    SELECT NAME as author_name ,BIRTH_YEAR 
    FROM AUTHOR 
    `
    const birth= await db.all(getbirthquery)
    response.send(birth)
    }catch(error){
        response.status(500).json({error:'unable to fetch author birth year'})
    }
    
})


//get all the user sumbittd review
app.get("/user-review",Logger,async(request,response)=>{
    try{
        const getuserquery = 
    `
    select DISTINCT users.user_id,users.name as user_name 
    from users inner join reviews on users.user_id  = reviews.user_id
    order by users.user_id asc;
    
    `;
    const users = await db.all(getuserquery)
    if(!users){
        response.status(404).json({error:'user not found'})
    }
    response.send(users)
    }catch(error){
        response.status(500).json({error:'unable to fetch the users'})
    }
    
});


//get all the book reviews along with date
app.get("/reviews",Logger,async(request,response)=>{
    try{
        const getreviewquery = 
    `
    SELECT USERS.NAME AS USER_NAME,REVIEWS.REVIEW_TEXT AS REVIEW ,REVIEWS.REVIEW_DATE
    FROM USERS INNER JOIN REVIEWS ON USERS.USER_ID = REVIEWS.USER_ID 
    `;
    const reviews = await db.all(getreviewquery)
    if(!reviews){
        response.status(404).json({error:'reviews not found'})
    }
    response.send(reviews)
    }catch(error){
        response.status(500).json({error:'unable to fetch the reviews'})
    }
    
})

// get all the books sold above 100 copies
app.get("/books_sold_above_100",Logger,async(request,response)=>{
    try{
        const getbookabove100query = 
    `
    SELECT * 
    FROM BOOKS
    WHERE COPIES_SOLD >100
    `
    const books = await db.all(getbookabove100query)
    if(!books){
        response.status(404).json({error:'books not found'})
    }
    response.send(books)
    }catch(error){
        response.status(500).json({error:"unable to fetch books"})

    }
    
})


//get all review where rating is less than 3

app.get("/reviews-rating-less-than-3",Logger,async(request,response)=>{
    try {
        const getreviewwith3query = 
    `
        SELECT books.title,reviews.REVIEW_TEXT
        FROM BOOKS INNER JOIN REVIEWS ON BOOKS.book_id = reviews.book_id
        where reviews.rating <3.0
    `
    const reviews = await db.all(getreviewwith3query)
    if(!reviews){
        response.status(404).json({error:"reviews not found"})
    }
    response.send(reviews)  
    }catch(error){
        response.status(500).json({error:"unable to fetch reviews"})
    }
    
})

//get books written by indian 

app.get("/book-by-indian",Logger,async(request,response)=>{
    try{
        const getbookbyindian = 
    `
    SELECT BOOKS.TITLE
    FROM BOOKS INNER JOIN AUTHOR ON BOOKS.AUTHOR_ID = AUTHOR.AUTHOR_ID
    WHERE NATIONALITY = "INDIAN"
    `
    const books = await db.all(getbookbyindian)
    if(!books){
        response.status(404).json({error:'books not found'})
    }
    response.send(books)
    }catch(e){
        response.status(500).json({error:"unable to fetch the books"})
    }
    
})

app.get("/reviews-by-count",Logger,async(request,response)=>{
    try{
        const getreviewsbycount = 
        `
        SELECT books.title,COUNT(*) as review_count
        FROM books inner join reviews on books.book_id = reviews.book_id 
        GROUP By BOOKS.title
        

        `
        const no_of_reviews = await db.all(getreviewsbycount)
        if (!no_of_reviews){
            response.status(404).json({error:'unable to get the count'})
        }
        response.send(no_of_reviews)


    }catch(error){

        response.status(500).json({error:'unable to fetch the count'})
    }
    
    
})
app.get("/reviews-last-6-months",Logger,async(request,response)=>{
    try{
        const getreviewslast6monts = 
        `
            SELECT *
            FROM reviews 
            WHERE review_date >= date('now', '-6 months');
        `
        const last6mreviews = await db.all(getreviewslast6monts)
        if (!last6mreviews){
            response.status(404).json({error:'unable to get the count'})
        }
        response.send(last6mreviews)


    }catch(error){

        response.status(500).json({error:'unable to fetch the count'})
    }
    
    
})
app.get("/earliest-published",Logger,async(request,response)=>{
    try{
        const getearliestpublished = 
        `
            SELECT TITLE, published_year as year
            FROM BOOKS
            ORDER BY published_year ASC
            LIMIT 1;
        `
        const earliest = await db.all(getearliestpublished)
        if (!earliest){
            response.status(404).json({error:'unable to get book'})
        }
        response.send(earliest)


    }catch(error){

        response.status(500).json({error:'unable to fetch the book'})
    }
    
    
})


//books reviewd in 2024

app.get("/book-review-2024",Logger,async(request,response)=>{
    try{
        const getbooksreviewdin2024 = 
        `
            select books.title,strftime("%Y",review_date) as year
            from books inner join reviews on books.book_id = reviews.book_id
            where cast(strftime("%Y",review_date) as integer) = 2024
        `
        const reviewed = await db.all(getbooksreviewdin2024)
        if (!reviewed){
            response.status(404).json({error:'unable to get book'})
        }
        response.send(reviewed)


    }catch(error){

        response.status(500).json({error:'unable to fetch the book'})
    }
    
    
})

app.post("/register",async(request,response)=>{
    const {username,name,location,email,password} = request.body

    const hashedPassword = await bcrypt.hash(password,15)

    const selectuser = `SELECT  * FROM USERDETAILS WHERE USERNAME =?`
    const dbuser = await db.get(selectuser,[username])
    console.log(dbuser)
    if(dbuser === undefined){
        //register user
        const register = 'INSERT INTO USERDETAILS(USERNAME,NAME,LOCATION,EMAIL,PASSWORD) VALUES(?,?,?,?,?)'
        const user = await db.run(register,[username,name,location,email,hashedPassword])
        response.send('user created successfully')
    }else{
        response.status(400)
        response.send('user already exists')
    }
    
})


app.post("/login",async(request,response)=>{
    const {username,password} = request.body;
    console.log(password)

const getselectquery = 
    `SELECT USERNAME,PASSWORD FROM USERDETAILS WHERE USERNAME =?`
    const dbuser = await db.get(getselectquery,[username])
    console.log(dbuser.PASSWORD)
    if(dbuser === undefined){
        response.status(400);
        response.send('invalid username')
    }else{
        const isPasswordMatched = await bcrypt.compare(password,dbuser.PASSWORD)
        if(isPasswordMatched===true){
            const payload ={username:username}
            const jwtToken = jwt.sign(payload,'myToken')
            response.send({jwtToken});
        }else{
            response.status(400)
            response.send('Invalid password');
        }
    }

})




