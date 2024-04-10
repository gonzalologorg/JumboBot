const express = require('express');
const isDev = true;
let ejs = require('ejs');
const fs = require('fs');

const app = express();
app.set('view engine', 'ejs');

let logCache;
let lastUpdate = new Date().getTime();
var server;

if (isDev) {
    server = app.listen(6969, () => {
        console.log("Server listening on port " + 6969);
    });
} else {
    var https = require('https');
    server = https.createServer({
        key: fs.readFileSync("/etc/letsencrypt/live/imgonzo.dev/privkey.pem", 'utf8'),
        cert: fs.readFileSync("/etc/letsencrypt/live/imgonzo.dev/fullchain.pem", 'utf8')
    }, app);
    
    server.listen(6969, () => {
        console.log("Server listening on port " + 6969);
    });
}

app.get('/', (req, res) => {
   if (logCache != null) {
        res.render("index", {data: logCache, lastUpdate: new Date(lastUpdate).toLocaleString()});
        return
   }

   let data = fs.readFileSync("public/data/jumbo/historial.json", "utf-8").split("\n");
   logCache = [];
   data.forEach((element, index) => {
        if (element != "") {
            let json = JSON.parse(element);
            json.fecha = new Date(json.fecha).toLocaleString();
            json.diferencia = json.diferencia * -1;
            //Place it at the top of the array
            if (!json.precio) {
                let prev = fs.readFileSync("public/data/jumbo/data.json", "utf-8");
                prev = JSON.parse(prev);
                json.precio = prev[json.id].precioDeVenta;
            }

            if (json.diferencia > 0) {
                json.precioViejo = Math.round(json.precio - json.precio * (1 - json.diferencia / 100));
            } else {
                json.precioViejo = Math.round(json.precio - json.precio * (json.diferencia / 100));
            }
            logCache.unshift(json);
        }
    });

    lastUpdate = new Date().getTime();
    res.render("index", {data: logCache, lastUpdate: new Date(lastUpdate).toLocaleString()});
    setTimeout(() => {
        logCache = null;
    }, 300 * 1000);
});
