require('dotenv').config()
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Stripe = require('stripe')

const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

const PUBLIC = path.join(__dirname, 'public')
const CONTENT = path.join(PUBLIC, 'content')
if(!fs.existsSync(CONTENT)) fs.mkdirSync(CONTENT, {recursive:true})

const dbFile = path.join(__dirname,'data.db')
const db = new sqlite3.Database(dbFile)

db.serialize(()=>{
  db.run(`CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    originalname TEXT,
    mimetype TEXT,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password_hash TEXT,
    sweepcoins INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)
})

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, CONTENT) },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random()*1e9)
    const ext = path.extname(file.originalname)
    cb(null, unique + ext)
  }
})
const upload = multer({storage})

app.post('/api/upload', upload.single('file'), (req,res)=>{
  if(!req.file) return res.status(400).json({error:'no file'})
  const title = req.body.title || ''
  const { filename, originalname, mimetype } = req.file
  db.run('INSERT INTO content (filename, originalname, mimetype, title) VALUES (?,?,?,?)', [filename, originalname, mimetype, title], function(err){
    if(err) return res.status(500).json({error:err.message})
    res.json({id:this.lastID, filename, originalname, mimetype, title})
  })
})

function generateToken(user){
  const payload = { id: user.id, email: user.email }
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
}

function authMiddleware(req,res,next){
  const h = req.headers.authorization || ''
  const m = h.match(/^Bearer\s+(.*)$/)
  if(!m) return res.status(401).json({error:'missing token'})
  try{
    const data = jwt.verify(m[1], process.env.JWT_SECRET || 'dev-secret')
    req.user = data
    next()
  }catch(err){
    return res.status(401).json({error:'invalid token'})
  }
}

app.post('/api/signup', async (req,res)=>{
  const { email, password } = req.body || {}
  if(!email || !password) return res.status(400).json({error:'email and password required'})
  try{
    const hash = await bcrypt.hash(password, 10)
    db.run('INSERT INTO users (email,password_hash) VALUES (?,?)', [email, hash], function(err){
      if(err) return res.status(400).json({error:err.message})
      const user = { id: this.lastID, email }
      const token = generateToken(user)
      res.json({user, token})
    })
  }catch(err){ res.status(500).json({error:err.message}) }
})

app.post('/api/signin', (req,res)=>{
  const { email, password } = req.body || {}
  if(!email || !password) return res.status(400).json({error:'email and password required'})
  db.get('SELECT id,email,password_hash,sweepcoins FROM users WHERE email = ?', [email], async (err,row)=>{
    if(err) return res.status(500).json({error:err.message})
    if(!row) return res.status(400).json({error:'invalid credentials'})
    const ok = await bcrypt.compare(password, row.password_hash)
    if(!ok) return res.status(400).json({error:'invalid credentials'})
    const user = { id: row.id, email: row.email }
    const token = generateToken(user)
    res.json({user: {id:row.id, email:row.email, sweepcoins: row.sweepcoins}, token})
  })
})

app.get('/api/me', authMiddleware, (req,res)=>{
  db.get('SELECT id,email,sweepcoins,created_at FROM users WHERE id = ?', [req.user.id], (err,row)=>{
    if(err) return res.status(500).json({error:err.message})
    if(!row) return res.status(404).json({error:'not found'})
    res.json(row)
  })
})

// Create a PaymentIntent for deposit. Expects {amount_cents}
app.post('/api/create-payment-intent', authMiddleware, async (req,res)=>{
  if(!stripe) return res.status(500).json({error:'Stripe not configured'})
  const { amount_cents } = req.body || {}
  if(!amount_cents || isNaN(amount_cents)) return res.status(400).json({error:'amount_cents required'})
  try{
    const pi = await stripe.paymentIntents.create({
      amount: parseInt(amount_cents,10),
      currency: 'usd',
      metadata: { userId: req.user.id }
    })
    res.json({client_secret: pi.client_secret})
  }catch(err){ res.status(500).json({error:err.message}) }
})

app.post('/api/create-checkout-session', authMiddleware, async (req,res)=>{
  if(!stripe) return res.status(500).json({error:'Stripe not configured'})
  const { amount_cents } = req.body || {}
  if(!amount_cents || isNaN(amount_cents)) return res.status(400).json({error:'amount_cents required'})
  try{
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Deposit sweepcoins' },
          unit_amount: parseInt(amount_cents,10)
        },
        quantity: 1
      }],
      metadata: { userId: req.user.id },
      success_url: process.env.SUCCESS_URL || 'http://localhost:3000/?success=1',
      cancel_url: process.env.CANCEL_URL || 'http://localhost:3000/?canceled=1'
    })
    res.json({url: session.url})
  }catch(err){ res.status(500).json({error:err.message}) }
})

// Stripe webhook endpoint - set STRIPE_WEBHOOK_SECRET in env if using signature verification
app.post('/webhook', express.raw({type: 'application/json'}), (req,res)=>{
  if(!stripe) return res.status(500).send('stripe not configured')
  const sig = req.headers['stripe-signature']
  let event = null
  try{
    if(process.env.STRIPE_WEBHOOK_SECRET && sig){
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    }else{
      event = req.body
    }
  }catch(err){ return res.status(400).send(`Webhook error: ${err.message}`) }

  if(event.type === 'payment_intent.succeeded' || event.type === 'charge.succeeded'){
    const pi = event.data.object
    const metadata = pi.metadata || {}
    const userId = metadata.userId || pi.metadata?.userId
    const amount = pi.amount || pi.amount_received || 0
    if(userId){
      // conversion: 1 cent => 1 sweepcoin (so $1 => 100 sweepcoins)
      const coins = parseInt(amount,10) || 0
      db.run('UPDATE users SET sweepcoins = sweepcoins + ? WHERE id = ?', [coins, userId], function(err){
        // ignoring errors in webhook handling
      })
    }
  }
  res.json({received:true})
})

app.get('/api/content', (req,res)=>{
  db.all('SELECT id, filename, originalname, mimetype, title, created_at FROM content ORDER BY created_at DESC', [], (err,rows)=>{
    if(err) return res.status(500).json({error:err.message})
    res.json(rows)
  })
})

app.use('/content', express.static(CONTENT))

app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`))
