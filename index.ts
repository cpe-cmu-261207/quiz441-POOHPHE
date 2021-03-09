import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { body, query, validationResult } from 'express-validator'
import fs from 'fs'

const app = express()
app.use(bodyParser.json())
app.use(cors())
let username_login: any;
let user_index: any;
const PORT = process.env.PORT || 3000
const SECRET = "SIMPLE_SECRET"
interface DbSchema {
  users: JWTPayload[]
}

interface JWTPayload {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  balance: number;
}

type JWTpayload  = Pick<JWTPayload,'username'>

app.post('/login',
body('username').isString(),
body('password').isString(),
  (req, res) => {
    console.log(req.body)
    const { username, password } = req.body
    // Use username and password to create token.
    const body = req.body
    const raw = fs.readFileSync('db.json', 'utf8')
    const db: DbSchema = JSON.parse(raw)
    const user = db.users.find(user => user.username === body.username)
let i =0,found =false
    db.users.forEach(user => {
     if(user.username === body.username){
       found = true
       user_index = i
     }else if(!found){
      i = i+1
     }
   })
  if (!user) {
    res.status(400)
    res.json({ message: 'Invalid username or password' })
    return
  }
  if (body.password != user.password) {
    res.status(400)
    res.json({ message: 'Invalid username or password' })
    return
  }
  const token = jwt.sign(
    { username: user.username } as JWTpayload, 
    SECRET
  )
  console.log(token)
  username_login = body.username
    return res.status(200).json({
      message: 'Login succesfully',
      token: token
    })
  })

  app.post('/register',
  body('username').isString(),
  body('password').isString(),
  body('firstname').isString(),
  body('lastname').isString(),
  body('balance').isNumeric(),
  (req, res) => {

    const { username, password, firstname, lastname, balance } = req.body

    const buffer = fs.readFileSync("db.json", "utf-8" );
    const db = JSON.parse(buffer);

    const isExistUser = db.users.find((value: { username: any }) => value.username === username);

    if(isExistUser){
      return res.status(400).json({
        message: "Username is already in used"
      })
    }

    db.users.push({
      username,
      password,
      firstname,
      lastname,
      balance
    });
    fs.writeFileSync("./db.json", JSON.stringify(db));

    return res.status(200).json({
      message: "Register successfully"
    })
  })

app.get('/balance',
  (req, res) => {
    const token = req.query.token as string
    console.log(token)
    try {

      //const username = jwt.verify(token, SECRET) as JWTpayload
      const raw = fs.readFileSync('db.json', 'utf8')
      const db: DbSchema = JSON.parse(raw)
      const todos = db.users[user_index].balance
      res.json({
        name: String(username_login),
        balance: todos
      })
    }
    catch (e) {
      //response in case of invalid token
      res.status(401)
      res.json({
        "message": "Invalid token"

      })
    }
  })

app.post('/deposit',
  body('amount').isInt({ min: 1 }),
  
  (req, res) => {
    
    try{
      
          //Is amount <= 0 ?
          if (!validationResult(req).isEmpty())
            return res.status(400).json({ message: "Invalid data" })
          
          const raw = fs.readFileSync('db.json', 'utf8')
          const db: DbSchema = JSON.parse(raw) 
          const {amount} = req.body
          if(amount<=0){
            res.status(400)
            res.json({ message:  "Invalid data" })
          }
          let todos = db.users[user_index].balance+amount
          db.users[user_index].balance = todos
          fs.writeFileSync("./db.json", JSON.stringify(db));
            res.json({"message": "Deposit successfully",
            "balance": todos
          })
    }catch(e){
      res.status(401).json({ message: "Invalid token" })
    }
   
  })

app.post('/withdraw',
  (req, res) => {
    //const token = req.query.token as string
    const {amount} = req.body

    try{
      
      //const data = jwt.verify(token, SECRET) as JWTPayload
      const raw = fs.readFileSync('db.json', 'utf8')
      const db: DbSchema = JSON.parse(raw) 
      
      let todos = db.users[user_index].balance
     
      if(todos<amount  || amount<=0){
        res.status(400)
        res.json({ message:  "Invalid data" })
      }
      
      let mm = todos-amount
      db.users[user_index].balance = mm
      fs.writeFileSync("./db.json", JSON.stringify(db));
      res.json({"message": "Deposit successfully",
      "balance": mm
    })

    }catch(e){
      res.status(401)
      res.json({ message:  "Invalid token" })
    }

  })

app.delete('/reset', (req, res) => {

  //code your database reset here
  fs.writeFileSync('db.json', JSON.stringify({users:[]}))
  return res.status(200).json({
    message: 'Reset database successfully'
  })
})

app.get('/me', (req, res) => {
  res.status(200)
  res.json({
    firstname: "Pherawat",
    lastname: "Wongsawad",
    code:620610802,
    gpa:4.00
  })
})

app.get('/demo', (req, res) => {
  return res.status(200).json({
    message: 'This message is returned from demo route.'
  })
})

app.listen(PORT, () => console.log(`Server is running at ${PORT}`))