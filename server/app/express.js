//Modules
var https = require("https");
var http = require("http");
var fs = require("fs");
var path = require("path");
var favicon = require("serve-favicon");
var morgan = require("morgan");
var cookieParser = require("cookie-parser");
var recursive = require("recursive-readdir");
var async = require("async");
var bodyParser = require("body-parser");
var helmet = require("helmet");
var compression = require("compression");
var express = require("express");
var app = express();
module.exports = { app: app };

//Includes
var Config = require(__config);
var Helper = require(__helper);

log.info("Express initialized");

//Favicon
//express.use(favicon(path.join(__dirname, "public", "favicon.ico")));

//Attach access logging to express
app.use(require("morgan")(Config.logs.format, { "stream": log.stream }));

//Request Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(compression());

log.info("Express middleware attached");

//HTTP Listen
if (Config.http.hostname !== ""){
	
	//Create server and listen
	module.exports.http = http.createServer(app).listen(Config.http.port.internal, Config.http.hostname);
	
	//Logging for events
	module.exports.http.on("close", function(){
		log.info("HTTP server ended and stream closed");
	});
	log.info("HTTP listening at " + Config.http.hostname + ":" + Config.http.port.internal);
}

//HTTPS Listen
if (Config.https.hostname !== "" && Config.https.ssl.key !== "" && Config.https.ssl.cert !== ""){
	
	//Create server and listen
	module.exports.https = https.createServer({
		key: Helper.loadCertificate(Config.https.ssl.key),
		cert: Helper.loadCertificate(Config.https.ssl.cert)
	}, app).listen(Config.https.port.internal, Config.https.hostname);
	
	//Logging for events
	module.exports.https.on("close", function(){
		log.info("HTTPS server ended and stream closed");
	});
	log.info("HTTPS listening at " + Config.https.hostname + ":" + Config.https.port.internal);
}

//Static routes for public folder
app.use(express.static(__client));

log.info("Setup client static routes");

//Load api calls from file
recursive(__api, function (err, files) {

	//Remove all non router files
	var includeFiles = [];
	for (var i=0; i<files.length; i++){
		if (files[i].indexOf(".get.js") >= 0 ||
			files[i].indexOf(".post.js") >= 0 ||
			files[i].indexOf(".put.js") >= 0 ||
			files[i].indexOf(".delete.js") >= 0){
			includeFiles.push(files[i]);
		}
	}

	//Routing handler for api calls
	if (err){
		log.error(err.message);	
	}else{

		//Log endpoint count
		log.info("Loaded " + includeFiles.length + " api endpoints");
		
		//Import individual api routers
		for (var a=0; a<includeFiles.length; a++){
			var route = require(includeFiles[a]);
			app.use("/api", route);
		}
	}

	log.info("Setup routes for api endpoints");
	
	app.use("/victor", function (req, res, next){
		console.log(req);
		res.status(200).json({ test: "test" });
	});
	
	//Error handler for server side api requests
	app.use("/api", function(req, res, next){
		res.status(404).json({ error: "Not Found" });
	});
	app.use("/api", function(err, req, res, next){
		if (Helper.isString(err)){
			
			//User error 
			res.status(200).json({ error: err });
		}else{
			
			//Interal server error
			if (err.hasOwnProperty("message")){
				log.error(err.message, err.stack);
			}else{
				log.error("Internal server error", err.stack);	
			}
			res.status(500).json({ error: "Server Error" });
		}
	});
	
	//Error handler for client side requests
	app.get("*", function(req, res, next){
		console.log(req.path);
		res.status(404).redirect("/errors/404.html");
	});
	app.get("*", function(err, req, res, next){
		log.error(err.stack);
		res.status(500).redirect("/errors/500.html");
	});

	log.info("Setup error handling routes");
});