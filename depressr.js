// depressr.js
// Renz Torres
// Wrapper

const yargs = require('yargs');
const fs = require('fs');
const path = require('path');

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
        .describe("removeIntermediates", "Remove intermediate outputs")
        .boolean("removeIntermediates")
        .describe("headed", "Run puppeteer as headed. Defaults headless")
        .boolean("headed")
        .check((argv, options) => {
            if (argv.species != "" & argv.genus == "") {
                return false;
            };
            if (argv.genus != "" & argv.family != "") {
                argv.family = "";
            };
            if (argv.source == "usf") {
                argv.species = " " + argv.species;
            };
            return true;
        })
/*         .describe("outputType", "Output file type. One of 'csv' or 'json'")
        .default("outputType", "csv") */
        .argv;
    return argv ;
};

const main = async () => {
    const args = await parseArgs(process.argv);

    if (!fs.existsSync(args.outputDir)) {
        fs.mkdirSync(path.resolve(args.outputDir))
    };

    if (args.source == "usf") {
        const depress = require(path.resolve("./depressr-usf.js"));
        depress(args);
    }
    else if (args.source == "uf") {
        const depress = require(path.resolve("./depressr-uf.js"));
        depress(args);
    };
};

main();

