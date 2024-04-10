const puppeteer = require('puppeteer');
const fs = require('fs');

const cotoURL = "https://www.cotodigital3.com.ar/sitios/cdigi/browse/catalogo-almac%C3%A9n-infusiones/_/N-dw58vw";

(async () => {
    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
  
    // Navigate the page to a URL
    await page.goto(cotoURL);
  
    // Set screen size
    await page.setViewport({width: 1920, height: 1024});

    let productos = await page.waitForSelector('ul > .clearfix');
    let elements = await page.$$eval("ul > .clearfix", elements => elements.map(el => {
        let base = el.textContent;
        base.replace(/\n/g, '');
        base.replace(/\t/g, '');
        return base;
    }));
    console.log(elements);
    //let val = await elements[0].$$eval('span', span => span);
    //console.log(val);
    //elements.forEach(el => {
    //});
    await browser.close();
  })();