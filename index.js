/* Librerias */
const express = require("express");
const app = express();
const fs = require("fs");
const dotenv = require('dotenv').config();
const t = require('./lib/trie');
const {capitalize} = require('./lib/capitalize');

/* Declaracion de constantes */
const PORT = parseInt(process.env.PORT) || 8000;
const HOST = process.env.HOST || 'localhost';
const SUGGESTION_NUMBER = parseInt(process.env.SUGGESTION_NUMBER) || 8;

console.log("SUGGESTION NUMBER:",SUGGESTION_NUMBER);
var rawdata = fs.readFileSync("./names.json");
var data = JSON.parse(rawdata);
console.log("\rNames in database:",Object.keys(data).length);

/* Create Trie */
var Trie = new t.Trie();
// populate Trie
for(item in data){
	Trie.insert(item.toLowerCase(),data[item]);
}

/* Middlewares! */
app.use(express.json(strict = true));
app.use((err, req, res, next) => {
	if(err instanceof SyntaxError){
		res.setHeader('content-type', 'application/json; charset=utf-8');
		return res.status(400).send(JSON.parse('{"message":"Bad Request"}'));
	}
	next();
});

// GET Requests
app.get("/typeahead/:prefix", (req, res) => {
	let query = req.params.prefix.toLowerCase();
	let response = Trie.findName(query,SUGGESTION_NUMBER);
	if(Trie.exists(query)){
		index = response.findIndex(el => el.name == capitalize(query));
		response.unshift(response[index]);
		response.splice(index+1,1);
	}
	res.setHeader('content-type', 'application/json; charset=utf-8');
	res.status(200).send(response);
});
app.get("/typeahead/", (req, res) => {
	res.setHeader('content-type', 'application/json; charset=utf-8');
	let response = Trie.findName("",SUGGESTION_NUMBER);
	res.status(200).send(response);

});

//POSTS REQUESTS
app.post('/typeahead/', (req,res) => {
  	if(req.body.name){
		query = req.body.name.toLowerCase();
		if(score = Trie.exists(query)){
			Trie.insert(query,score+1);
			res.setHeader('content-type', 'application/json; charset=utf-8');
			res.status(201).send(JSON.parse(`{"name":"${capitalize(query)}","times":${score+1}}`))
		}else{
			res.setHeader('content-type', 'application/json; charset=utf-8');
			res.status(400).send(JSON.parse('{"message":"Not Found"}'))
		}
	}else{
		res.setHeader('content-type', 'application/json; charset=utf-8');
		res.status(400).send(JSON.parse('{"message":"Bad Request"}'))
	}
});

app.listen(PORT, HOST, () => {
	console.log(`\n⚡Server listening on http://${HOST}:${PORT}/ ⚡\n`);
	console.log("Write `exit` and press Enter to kill server\n");
});


process.stdin.setEncoding('utf8');
process.stdin.on('data', data => {
	const str = data.toString().trim().toLowerCase();

	if(str=='exit'){
		console.log('\nBye!\n');
		process.exit(0);
	}
});
process.on('SIGINT', function(){
    process.stdout.write("\rCaught interrupt signal. Bye!\n\n");
    process.exit();
});