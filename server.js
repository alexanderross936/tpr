const express = require('express');
var cors = require('cors')
const bcrypt = require('bcrypt')
const config = require('config')
const { check, validationResult } = require("express-validator");
var mongoose = require('mongoose');
var mongoDB = 'mongodb://127.0.0.1/one_database';
const jwt = require('jsonwebtoken');
require('./models/Ingredient')
require('./models/Recipe')
require('./models/User')
require('./config/default.json')
const auth = require('./frontend/src/middleware/auth')
const User = require('./models/User');
const Recipe = require('./models/Recipe');
const Ingredient = require('./models/Ingredient');
mongoose.connect(mongoDB, { useNewUrlParser: true });

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static())

app.get('/user', auth, async(req, res) => {
    try {
        const user = await (await User.findById(req.user.id)).isSelected('-password');
        res.json(user);
    }   catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

app.post('/register', 
[
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please put valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters')
    .isLength({ min: 6 })
]
, 
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password } = req.body;
    
    try {
// See if user exists
let user = await User.findOne({ email });

        if(user){
    return res.status(400).json({ errors: [{ msg: 'User already exists' }]});

}


user = new User({
    name,
    email,
    password
})

// encrypt password using bcrypt

const salt = await bcrypt.genSalt(10);

user.password = await bcrypt.hash(password, salt);

await user.save();

const payload = {
    user: {
        id: user.id
    }
}

jwt.sign(
    payload, 
    config.get('jwtSecret'),
    { expiresIn: 360000 },
    (err, token) => {
        if(err) throw err;
        res.json({ token });
    });
// return jsonwebtoken

    } catch(err){
        console.error(err.message);
        res.status(500).send('Server error');

    }

    console.log(req.body);



})

app.post('/login', 
[
    check('email', 'Please put valid email').isEmail(),
    check('password', 'Password is required')
    .exists()
]
, 
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password } = req.body;
    
    try {
// See if user exists
let user = await User.findOne({ email });

        if(!user){
    return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }]});

}

const isMatch = await bcrypt.compare(password, user.password);

if(!isMatch){
    return res.status(400)
    .json({ errors: [{ msg: 'Invalid credentials'}] })
}


const payload = {
    user: {
        id: user.id
    }
}

jwt.sign(payload, 
    config.get('jwtSecret'),
    { expiresIn: 360000 },
    (err, token) => {
        if(err) throw err;
        res.json({ token });
    });
// return jsonwebtoken

    } catch(err){
        console.error(err.message);
        res.status(500).send('Server error');

    }

    console.log(req.body);

})

