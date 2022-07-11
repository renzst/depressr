// depressr-usf.js 
// USF variant

// Modules
const puppeteer = require('puppeteer'); // headless chrome
const fs = require('fs');
const path = require("path");
const csvMerger = require("csv-merger");


// Parameters
const p = {
    query: "https://florida.plantatlas.usf.edu/Specimen.aspx",
    forms: {
        family: "input#ctl00_cphBody_tbFamily",
        genus: "input#ctl00_cphBody_tbTaxon",
        species: "input#ctl00_cphBody_tbTaxon", // use += for value
        state: "input#ctl00_cphBody_tbStateProv",
        county: "input#ctl00_cphBody_tbCounty",
        collector: "input#ctl00_cphBody_tbCollector",
        submit: "input#ctl00_cphBody_btnSubmit",
        paginateSelectType: "select",
        paginateAt: "select#ctl00_cphBody_lstNumPerPage", // options
        paginateLimit: "1000"
    },
    results: {
        total: "span#ctl00_cphBody_Grid1_ctl01_lblNumberOfRecordsText",
        paginate: "#ctl00_cphBody_Grid1_ctl01_ibNext",
        download: "input#ctl00_cphBody_Button1",
        checkAll: "p.specSearchBtns :nth-child(1)",
        uncheckAll: "p.specSearchBtns :nth-child(4)",
    }
};


// Functions
const timeout = async (delay) => {
    new Promise(resolve => {
        setTimeout(console.log(`Waiting for ${delay} seconds...`), delay * 1000)
    })
}

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

const formatArgs = (args, params) => {
    if (params.forms.genus == params.forms.species & args.species != "") {
        args.species = " " + args.species;
    };
    return args;
};

const paginate = async (page, sels) => {
    await page.reload({waitUntil: ['networkidle2', 'domcontentloaded']});

    await page.waitForSelector(sels.results.paginate);
    await page.click(sels.results.paginate);

    await page.waitForNavigation();

    return page;
}

const processResults = async (page, sels, args) => {
    await page.screenshot({path: "./screenshot.png", fullPage: true})

    let resultsText = await page.$eval(sels.results.total, el => el.textContent);
    try {
        resultsText = await page.$eval(sels.results.total, el => el.textContent);
    }
    catch (e) {
        console.log("No records found for your query.");
        console.log("If your query is valid, you might be getting blocked...");
        return false;
    }

    resultsText = await resultsText.split(" ");
    const total = await resultsText[4];
    const current = await resultsText[2].match(/(?<=\-).*$/);
    console.log(`On this page: up to ${current} of ${total} specimens...`)

    await page.click(sels.results.checkAll);
    await page.click(sels.results.download);
    await page.click(sels.results.uncheckAll);

    if (+current < +total) {
        console.log("Flipping the page...");
        page = await paginate(page, sels);
        await processResults(page, sels, args);
    };

    return true;
};

const initBrowser = async (args) => {
    console.log("Starting browser...");
    const browser = await puppeteer.launch( {args: [`--window-size=1600,900`], headless: !args.headed} );
    const page = await browser.newPage();

    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: path.resolve(path.resolve("./tmp")),
    });

    return {browser, page};
};

const usf = async (args) => {
    args = await formatArgs(args, p);

    if (fs.existsSync("./tmp")) {
        fs.rmSync("./tmp", {recursive:true})
    };
    fs.mkdirSync("./tmp");

    const {browser, page} = await initBrowser(args);

    console.log(`Navigating to ${p.query}`);
    await page.goto(p.query, {waitUntil: 'networkidle2'});

    const resultsPage = await submitQuery(page, p, args);

    if (await processResults(resultsPage, p, args)) {
        browser.close();

        const dirContents = fs.readdirSync(path.resolve("./tmp")).map(x => "./tmp/" + x);
        const outputPath = path.resolve(args.outputDir, args.outputFile.toString(), ".csv");
        console.log(`Writing to ${outputPath}...`);
        await csvMerger.merge(dirContents, {output: outputPath, writeOutput: true});
        if (args.removeIntermediates) {
            fs.rmSync("./tmp", {recursive: true});
        };
    };

    return;
};

module.exports = usf;