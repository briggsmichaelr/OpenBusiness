const express = require('express')
var bodyParser = require('body-parser');
var session = require('express-session')
const app = express();
app.use(session(
    {secret: 'my secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
const port = 3000
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.set('view engine', 'ejs');
const {DB_USER, DB_PASS, DB_CLUSTER} = require('./secret.js')

const { MongoClient } = require('mongodb');

const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_CLUSTER}.cipru.mongodb.net/OB?retryWrites=true&w=majority`; 
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    

async function main(){
    //const client = new MongoClient(uri);
 
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        // Make the appropriate DB calls
        //await  listDatabases(client);
        let db = client.db("OB");
        let users = db.collection("users");

        let user = await users.find();
        await user.forEach (c=>console.log(c));
    } catch (e) {
        console.error(e);
    } finally {
        console.log('about to close');
        await client.close();
    }
}

main().catch(console.error);
/*async function listDatabases(client){
    let databasesList = await client.db().admin().listDatabases();
 
    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};*/

app.get('/', (req, res) => res.send('Hello from the Open World!'));
app.get('/about/', (req,res) =>{
    console.log(req.session);

    res.render('about',{user:req.session.username});
}) 
app.get('/login/', (req,res) =>{
    res.render('login');
})
app.post('/login_request/', async (req,res) =>{
    let username = req.body.username_name; 
    await client.connect();
    let db = client.db("OB");
    let users = db.collection("users");

    let user = await users.find({username: username});
    user = await user.toArray();
    console.log('user',user);
    if (user.length > 0) { 
        req.session.username = user[0].username;
        res.redirect ('/about')
    } 
    else {
        res.redirect ('/signup')
    }
})
app.get('/signup/',(req,res)=>{
    res.render('signup');
})
app.get('/team/',function(req,res) {
    res.render("team.ejs");
} );
app.post('/signup_request/', async (req,res) =>{
    console.log(req.body);
    let username = req.body.username_name;
    console.log(username);
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        let db = client.db("OB");
        let users = db.collection("users");

        let user = await users.find({username: username});
        user = await user.toArray();
        
        console.log(user);
        if(user.length === 0) {
            await users.insertOne({username: username});
            console.log(`user ${username} was just inserted!`);
            res.redirect('/about');
        } else {
            console.log(`user ${username} already exists!`)
            res.redirect('/login');
        }
    } catch (e) {
        console.error(e);
    } finally {
        console.log('about to close');
        await client.close();
    }
})

app.listen(port, () => console.log(`Open Business app listening at http://localhost:${port}`))