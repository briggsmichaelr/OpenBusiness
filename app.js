const express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
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

async function db_find(collection,parameters) {
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        let db = client.db("OB");
        let collection_temp = db.collection(collection);
        let collection_filtered = await collection_temp.find(parameters);
        collection_filtered = await collection_filtered.toArray();
        return collection_filtered;
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}
async function db_insertOne(collection,parameters) {
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        let db = client.db("OB");
        let collection_temp = db.collection(collection);
        let collection_filtered = await collection_temp.insertOne(parameters);
        return collection_filtered;
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}
//db_find("users",{username:"briggsmichaelr"})
/*
    let user = await db_find("users",{username:username})
    if(user.length === 0) {            
        await users.insertOne({username: username});
        user = await users.find({username: username});
        user = await user.toArray();
        req.session.username = user[0].username;
        console.log(`user ${username} was just inserted!`);
        res.redirect('/about');
    } else {
        console.log(`user ${username} already exists!`)
        res.redirect('/login');
    }
*/

app.get('/', (req, res) => res.render('home'));
app.get('/about/', (req,res) =>{
    console.log(req.session);

    res.render('about',{user:req.session.username});
}) 
app.get('/login/', (req,res) =>{
    res.render('login');
})
app.post('/login_request/', async (req,res) =>{
    let username = req.body.username_name; 
    let user = await db_find("users",{username: username});
    if (user.length > 0) { 
        req.session.username = await user[0].username;
        res.redirect ('/profile')
    } else {
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
    let user = await db_find("users", {username: username});
    //try {
        // Connect to the MongoDB cluster
       // await client.connect();
       // let db = client.db("OB");
        //let users = db.collection("users");

        //let user = await users.find({username: username});
        //user = await user.toArray();
        
        console.log(user);
        if(user.length === 0) {            
            await db_insertOne("users", {username: username});
            user = await db_find("users", {username: username});
            req.session.username = user[0].username;
            console.log(`user ${username} was just inserted!`);
            res.redirect('/about');
        } else {
            console.log(`user ${username} already exists!`)
            res.redirect('/login');
        }
    //} catch (e) {
      //  console.error(e);
    //} finally {
        //await client.close();
    //}
})
app.get('/create-organization/',(req,res)=>{
    res.render('create');
})
app.post('/create-organization-endpoint/',async (req,res)=>{
    let Org_to_be_inserted = req.body.Org_Name;
    //check if user is logged in
    if(req.session.username){
        let user = req.session.username;
        try {
            // Connect to the MongoDB cluster
            await client.connect();
            let db = client.db("OB");
            let organizations = db.collection("organizations");
            //Make sure organization does not currently exist
            let Org = await organizations.find({name: Org_to_be_inserted, admin:user});
            Org = await Org.toArray();
            if(Org.length === 0) {
                await organizations.insertOne({name: Org_to_be_inserted,admin:user});
                console.log(`Org ${Org_to_be_inserted} was just inserted!`);
                res.redirect(`/${user}/${Org_to_be_inserted}`);
            } else {
                console.log(`Org ${Org_to_be_inserted} already exists!`)
                res.redirect('/create-organization');
            }
        } catch (e) {
            console.error(e);
        } finally {
            await client.close();
        }
    } else {
        res.redirect('/login?logged_in=false&redirected_from=create-organization');
    }
})

app.get('/:username/:organization',async (req,res)=>{
    let admin = req.params.username;
    let organization = req.params.organization;
    let user = req.session.username;

    await client.connect();
    let db = client.db("OB");
    let organizations = db.collection("organizations");
    let Org = await organizations.find({admin:user,name:organization});
    Org = await Org.toArray();
    let content = Org[0].content;
    if(user==admin){
        res.render('organization',{admin:true,name:organization,content:content});
    } else{
        res.render('organization',{admin:false,name:organization,content:content});
    }
});
app.get('/profile/' ,async (req,res)=>{
    if(req.session.username){
        let user = req.session.username;
        await client.connect();
        let db = client.db("OB");
        let organizations = db.collection("organizations");
        //Make sure organization does not currently exist
        let Org = await organizations.find({admin:user});
        Org = await Org.toArray();
        res.render('profile',{user:user,organizations:Org})
    } else {
        res.redirect('/login');
    }
})
app.post('/create-folder/',async (req,res)=>{
    //define admin as person who clicked create folder
    let admin= req.session.username;
    //connect to database
    await client.connect();
            let db = client.db("OB");
            let organizations = db.collection("organizations");
    //allow folders to be added to the data base of admin's organization
    //allow admin to post folders
    //
    console.log('folder_to_be_inserted',req.body.folder_name);
    console.log('folder_to_be_inserted',req.body.folder_name);


    let folder_to_be_inserted = req.body.folder_name;
    let org_name = req.body.organization_name
    let Org = await organizations.updateOne({name:org_name, admin:admin}, {$set:{content:[{name:folder_to_be_inserted,type:'folder'}]}});
    
    await client.close();
    res.send("okay")
})

app.listen(port, () => console.log(`Open Business app listening at http://localhost:${port}`))