// depressr.js
// Renz Torres

// Modules
const puppeteer = require('puppeteer'); // headless chrome
const fs = require('fs');
const yargs = require('yargs');
const path = require("path");
const { request } = require('http');

// Constants

const params = {
    "usf": {
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
    },
    "uf": {
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
    }
}


// Functions

const parseArgs = (args) => {
    const argv = yargs(args)
/*         .command("download", "Downloads files according to query from arg pairs")
        .command("test", "Downloads only the first result page and outputs the expected number of records") */
        .usage('Usage $0 [download/test] --source [usf/uf] [optional arg pairs]')
        .demandOption(["source"])
        .describe("source", "Select herbarium database")
        .describe("family", "Taxonomic family")
        .default("family", "")
        .describe("genus", "Taxonomic genus. Overrides family")
        .default("genus", "")
        .describe("species", "Specific epithet. Genus is required")
        .default("species", "")
        .describe("state", "US state")
        .default("state", "")
        .describe("county", "US county, Louisianan parish, or Alaskan borough")
        .default("county", "")
        .describe("collector", "Last name of collector")
        .default("collector", "")
        .describe("outputDir", "Directory of output")
        .default("outputDir", "./")
        .describe("outputFile", "Output file name. Defaults to the moment of first run")
        .default("outputFile", Date.now())
        .describe("outputType", "Output file type. One of 'csv' or 'json'")
        .default("outputType", "csv")
        .argv;
    return argv ;
};

const formatArgs = (args, params) => {
    if (params.forms.genus == params.forms.species & args.species != "") {
        args.species = " " + args.species;
    }
    return args;
}

const submitQuery = async (page, params, args) => {
    for (let selector in params.forms) {
        if (selector != "submit" & !selector.includes("paginate")) {
            await page.waitForSelector(params.forms[selector]);
            await page.$eval(params.forms[selector], (x, val) => x.value += val, args[selector]);
        }
        if (selector == "paginateAt") {
            await page.waitForSelector(params.forms[selector]);
            if (params.forms.paginateSelectType == "select") {
                await page.select(params.forms[selector], params.forms["paginateLimit"]);
            }
            else if (params.forms.paginateSelectType == "radio") {
                await page.click(params.forms[selector]);
            };
        }
    }

    console.log("Submitting query...");

    await page.click(params.forms.submit);
    await page.waitForNavigation();

    return page;
}

const paginate = async (page, sels) => {
    await page.reload({waitUntil: ['networkidle2', 'domcontentloaded']});

    await page.waitForSelector(sels.results.paginate);
    await page.click(sels.results.paginate);

    await page.waitForNavigation();

    return page;
}

// for usf, returns the output filename 
const processResults = async (page, sels, args) => {
    console.log("Top of processResults()");
    let resultsText = await page.$eval(sels.results.total, el => el.textContent);
    resultsText = await resultsText.split(" ");
    const total = await resultsText[4];
    const current = await resultsText[2].match(/(?<=\-).*$/);

    await page.click(sels.results.checkAll);
    await page.click(sels.results.download);
    await page.click(sels.results.uncheckAll);

    if (+current < +total) {
        page = await paginate(page, sels);
        await processResults(page, sels, args);
    }

    return;

}





const main = async () => {
    let args = await parseArgs(process.argv);

    if (!fs.existsSync(args.outputDir)) {
        fs.mkdirSync(path.resolve(args.outputDir))
    };

    const herbSels = await params[args.source];
    args = await formatArgs(args, herbSels);

    const browser = await puppeteer.launch( {args: [`--window-size=1200,900`], headless: true} );
    const page = await browser.newPage();
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: path.resolve(path.resolve(args.outputDir)),
    });

    await page.goto(herbSels.query, {waitUntil: 'networkidle2'});
    console.log("Navigated to query page");

    const resultsPage = await submitQuery(page, herbSels, args);

    await processResults(resultsPage, herbSels, args);

    await resultsPage.screenshot({path: "screenshot.png"});

    browser.close();
    return;
    
};

main();

