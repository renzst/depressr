// depressr.js
// Renz Torres

// Modules
const pup = require('puppeteer'); // headless chrome
const fs = require('fs');
const csv = require('csv');
const yargs = require('yargs');

yargs.scriptName("depressr").usage('$0 [args]')

const parseArgs = (args) => {
    const argv = yargs(args)
        .command("download", "Downloads files according to query from arg pairs")
        .command("test", "Downloads only the first result page and outputs the expected number of records")
        .usage('Usage $0 source [usf/uf] [optional arg pairs]')
        .demandOption(["source"])
        .describe("source", "Select herbarium database")
        .describe("family", "Taxonomic family")
        .describe("genus", "Taxonomic genus. Overrides family")
        .describe("species", "Specific epithet. genus is required")
        .describe("state", "US state")
        .describe("county", "US county, Louisianan parish, or Alaskan borough")
        .describe("collector", "Last name of collector")
        .argv;
    return argv ;
};

const main = () => {
    const args = parseArgs(process.argv);
    console.log(args);
};

main();