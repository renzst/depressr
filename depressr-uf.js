// depressr.uf.js
// UF/FLAS variant

// Modules
const puppeteer = require('puppeteer'); // headless chrome
const fs = require('fs');
const path = require("path");


// Parameters
const p = {
    query: "https://www.floridamuseum.ufl.edu/herbarium/cat/catsearch.htm",
    forms: {
        family: "input[name='family']",
        genus: "input[name='genus']",
        species: "input[name='species']",
        state: "input[name='state']",
        county: "input[name='county']",
        collector: "input[name='last']", // method to include separate first and last name
        submit: "input#submit1",
        paginateSelectType: "radio",
        paginateAt: "input[value = 200]"
    },
};


// Functions
const submitQuery = async (page, params, args) => {
    for (let selector in params.forms) {
        if (selector != "submit" & !selector.includes("paginate")) {
            await page.waitForSelector(params.forms[selector]);
            await page.$eval(params.forms[selector], (x, val) => x.value += val, args[selector]);
        };
        if (selector == "paginateAt") {
            await page.waitForSelector(params.forms[selector]);
            if (params.forms.paginateSelectType == "select") {
                await page.select(params.forms[selector], params.forms["paginateLimit"]);
            }
            else if (params.forms.paginateSelectType == "radio") {
                await page.click(params.forms[selector]);
            };
        };
    };

    console.log("Submitting query...");

    await page.click(params.forms.submit);
    await page.waitForNavigation();

    return page;
};

const initBrowser = async (args) => {
    const browser = await puppeteer.launch( {args: [`--window-size=1600,900`], headless: true} );
    const page = await browser.newPage();
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: path.resolve(path.resolve(args.outputDir)),
    });

    return {browser, page};
};

const uf = async (args) => {
    const {browser, page} = await initBrowser(args);

    await page.goto(p.query, {waitUntil: 'networkidle2'});

    const resultsPage = await submitQuery(page, p, args);
};

module.exports = uf;