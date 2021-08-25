const express = require('express');
var bodyParser = require('body-parser');
//var favicon = require('serve-favicon');
const expressLayouts = require('express-ejs-layouts')
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var fileStoreOptions = {path : './sessions/'};
const app = express();
app.use(session(
    {secret: 'my secret',
    store: new FileStore(fileStoreOptions),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

const port = 3000
app.use(express.static('public'));
//app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(expressLayouts);
app.set('layout', 'base-page')
app.set('view engine', 'ejs');
const {DB_USER, DB_PASS, DB_CLUSTER} = require('./secret.js')

const { MongoClient } = require('mongodb');

const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_CLUSTER}.cipru.mongodb.net/OB?retryWrites=true&w=majority`; 
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function db_find(collection,filter) {
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        let db = client.db("OB");
        let collection_temp = db.collection(collection);
        let collection_filtered = await collection_temp.find(filter);
        collection_filtered = await collection_filtered.toArray();
        return collection_filtered;
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}
async function db_insertOne(collection,filter) {
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        let db = client.db("OB");
        let collection_temp = db.collection(collection);
        let collection_filtered = await collection_temp.insertOne(filter);
        return collection_filtered;
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}
async function db_updateOne(collection,filter,updateFilter) {
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        let db = client.db("OB");
        let collection_temp = db.collection(collection);
        let collection_updated = await collection_temp.updateOne(filter,updateFilter);
        return collection_updated;
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}

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
    let username = req.body.username_name;
    let user = await db_find("users", {username: username});
    if(user&&user.length === 0) {            
        await db_insertOne("users", {username: username});
        req.session.username = username;
        console.log(`user ${username} was just inserted!`);
        res.redirect('/about');
    } else {
        console.log(`user ${username} already exists!`)
        res.redirect('/login');
    }
})
app.get('/create-organization/',(req,res)=>{
    res.render('create');
})
app.post('/create-organization-endpoint/',async (req,res)=>{
    let Org_to_be_inserted = req.body.Org_Name;
    //check if user is logged in
    if(req.session.username){
        let user = req.session.username;
        let Org = await db_find("organizations",{name:Org_to_be_inserted,admin:user});
        if(Org.length === 0) {
            await db_insertOne("organizations",{name: Org_to_be_inserted,admin:user});
            console.log(`Org ${Org_to_be_inserted} was just inserted!`);
            res.redirect(`/${user}/${Org_to_be_inserted}`);
        } else {
            console.log(`Org ${Org_to_be_inserted} already exists!`)
            res.redirect('/create-organization');
        }
    } else {
        res.redirect('/login?logged_in=false&redirected_from=create-organization');
    }
})

app.get('/:username/:organization',async (req,res)=>{
    let admin = req.params.username;
    let organization = req.params.organization;
    let user = req.session.username;

    let Org = await db_find("organizations",{name:organization,admin:admin});
    let content = Org[0].content;
    if(user==admin){
        res.render('organization',{admin:true,name:organization,content:content});
    } else{
        res.render('organization',{admin:false,name:organization,content:content});
    }
});
app.get('/:username/:organization/:file',async (req,res)=>{
    let admin = req.params.username;
    let organization = req.params.organization;
    let file = req.params.file;
    let user = req.session.username;

    let Org = await db_find("organizations",{name:organization,admin:admin});
    let content = Org[0].content;
    console.log(content);
    if(user==admin){
        res.render('file',{admin:true,name:organization,content:content});
    } else{
        res.render('file',{admin:false,name:organization,content:content});
    }
});
app.get('/profile/' ,async (req,res)=>{
    if(req.session.username){
        let user = req.session.username;
        let Org = await db_find("organizations",{admin:user});
        res.render('profile',{user:user,organizations:Org})
    } else {
        res.redirect('/login');
    }
})
app.post('/create-folder/',async (req,res)=>{
    //define admin as person who clicked create folder
    let admin= req.session.username;
    let folder_to_be_inserted = req.body.folder_name;
    let org_name = req.body.organization_name
    //connect to database
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        let db = client.db("OB");
        let collection_temp = db.collection("organizations");
        //let collection_updated = 
        await collection_temp.updateOne({name:org_name, admin:admin},{$push:{content:{name:folder_to_be_inserted,type:'folder'}}});
        //return collection_updated;
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
    res.redirect(`/${admin}/${org_name}`);
})
app.post("/create-file/",async (req,res)=>{
    //define admin as person who clicked create folder
    let admin= req.session.username;
    let file_to_be_inserted = req.body.file_name;
    let org_name = req.body.organization_name
    //connect to database
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        let db = client.db("OB");
        let collection_temp = db.collection("organizations");
        //let collection_updated = 
        await collection_temp.updateOne({name:org_name, admin:admin},{$push:{content:{name:file_to_be_inserted,type:'file'}}});
        //return collection_updated;
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
    res.redirect(`/${admin}/${org_name}`);
})
app.listen(port, () => console.log(`Open Business app listening at http://localhost:${port}`))