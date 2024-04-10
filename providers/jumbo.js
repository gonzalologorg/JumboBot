const fs = require('fs');
const download = require('../helpers.js');
const jumboURL = "https://www.jumbo.com.ar/_v/segment/graphql/v1?workspace=master&operationName=productSearchV3&variables=%7B%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22fd92698fe375e8e4fa55d26fa62951d979b790fcf1032a6f02926081d199f550%22%2C%22sender%22%3A%22vtex.store-resources%400.x%22%2C%22provider%22%3A%22vtex.search-graphql%400.x%22%7D%2C%22variables%22%3A%22ewogICJxdWVyeSI6ICIiLAogICJvcmRlckJ5IjogIk9yZGVyQnlTY29yZURFU0MiLAogICJmcm9tIjogMCwKICAidG8iOiA1MCwKICAiZmFjZXRzQmVoYXZpb3IiOiAiU3RhdGljIiwKICAiY2F0ZWdvcnlUcmVlQmVoYXZpb3IiOiAiZGVmYXVsdCIsCiAgIndpdGhGYWNldHMiOiBmYWxzZSwKICAic2hvd1Nwb25zb3JlZCI6IGZhbHNlCn0=%3D%22%7D"
const fetch = require("node-fetch");

function limpiarProducto(product) {

    let productoLimpio = {
        id: product.productId,
        descripcion : product.description,
        nombre : product.productName,
        marca : product.brand,
        precioDeVenta : product.priceRange.sellingPrice.highPrice,
        precioDeList : product.priceRange.listPrice.highPrice,
        imagen : product.items[0].images[0].imageUrl
    }

    if (!fs.existsSync("public/images/" + productoLimpio.id + ".jpg")) {
        console.log("[JUMBO] Bajando imagen para " + productoLimpio.nombre);
        download(productoLimpio.imagen, "public/images/" + productoLimpio.id + ".jpg");
    }

    return productoLimpio;
}

let baseDeDatos = {};

function promediarPrecios(resultados) {
    if (!baseDeDatos.iniciado) {
        if (fs.existsSync("public/data/jumbo/data.json")) {
            baseDeDatos = fs.readFileSync("public/data/jumbo/data.json");
            baseDeDatos = JSON.parse(baseDeDatos);
        }
        baseDeDatos.iniciado = true;
    }

    for (let index = 0; index < resultados.length; index++) {
        const element = resultados[index];
        if (!baseDeDatos[resultados[index].id]) {
            baseDeDatos[resultados[index].id] = element;
        } else {
            if (baseDeDatos[resultados[index].id].precioDeList != element.precioDeList) {
                fs.appendFileSync("public/data/jumbo/historial.json", JSON.stringify({
                    id : resultados[index].id,
                    name : resultados[index].nombre,
                    precio: resultados[index].precioDeList,
                    diferencia : Math.round(((resultados[index].precioDeList - baseDeDatos[resultados[index].id].precioDeVenta) / resultados[index].precioDeVenta) * 100),
                    fecha : new Date().getTime()
                }) + "\n");
                baseDeDatos[resultados[index].id] = element;
            }
        }
    }

    fs.writeFileSync("public/data/jumbo/data.json", JSON.stringify(baseDeDatos, null, 4));
}

async function processJumbo(){
    console.log("[JUMBO] Buscando la API de jumbo...");
    let data = await fetch(jumboURL);
    let json = await data.json();
    let products = json.data.productSearch.products;
    let diaDeHoy = new Date();
    let fecha = diaDeHoy.getFullYear() + "-" + (diaDeHoy.getMonth() + 1) + "-" + diaDeHoy.getDate();

    fs.mkdirSync("public/data/jumbo/", {recursive: true});
    fs.mkdirSync("public/data/jumbo/" + fecha, {recursive: true});
    console.log("[JUMBO] API procesada! Procesando datos");

    let resultados = [];
    products.forEach(product => {
        const final = limpiarProducto(product);
        resultados.push(final);
        fs.writeFileSync("public/data/jumbo/" + fecha + "/" + product.productId + ".json", JSON.stringify(final, null, 4));
    });

    console.log("[JUMBO] Datos procesados, promediando y buscando precios...");
    promediarPrecios(resultados);

    setTimeout(() => {
        processJumbo();
    }, 3600 * 1000);
}

module.exports = processJumbo;
