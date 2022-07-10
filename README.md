# depressr

depressr is a web scraper written in Javascript. Its primary purpose is to extract herbarium records from target herbaria. Current targets include:

  - University of South Florida's [Atlas of Florida Plants](https://florida.plantatlas.usf.edu/)
  - University of Florida Florida Museum [Herbairum Collections](https://www.floridamuseum.ufl.edu/herbarium/cat/catsearch.htm)

## Why the name?

In herbariums, vascular plants are stored physically as "presses", flattened sample material. With this program we're extracting the database of presses, thus "depressing" it. The lack of final "e" is because I'm gay.

## How to use

The bare code,

    node depressr.js

pops up usage. Below is a list of argument pairs to use (note that not all argument pairs are available or will be useful :

  - `--source [usf/uf]` selects an herbarium database from which to pull. Defaults to `usf`
  - `--family [family]` selects records by plant family.
  - `--genus [genus]` selects records by plant genus. overrides `--family`.
  - `--species [species]` selects records by plant species. `--genus` must be present.
  - `--state [state]` selects by US state
  - `--county [county]` selects by US county. Can be helpful to use alongside `--state`, but not required
  - `--collector [collector]` selects by who collected. If a multi-word argument, takes only the first word and assumes it's the last name.

## Install

*to be described*
