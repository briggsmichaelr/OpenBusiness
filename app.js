const express = require('express')
const app = express()
const port = 3000
app.use(express.static('public'));
app.set('view engine', 'ejs');
const {DB_USER, DB_PASS, DB_CLUSTER} = require('./secret.js')

const { MongoClient } = require('mongodb');
async function main(){
    const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_CLUSTER}.cipru.mongodb.net/OB?retryWrites=true&w=majority`; 
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
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
    res.render('about')
})


app.listen(port, () => console.log(`Open Business app listening at http://localhost:${port}`))