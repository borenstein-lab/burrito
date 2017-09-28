---
title: Burrito
layout: default
---

### A web tool for interactive visualization of the links between taxonomic composition and function in microbiome datasets

Microbiome sequencing studies typically focus on two related but separate questions: 
1) which microbial taxa are present, and 2) what genetic functions are present? 

Burrito a visualization tool to facilitate exploration of both taxonomy and function in microbiome datasets. Burrito can estimate function abundances from 16S rRNA OTU data, 
and displays species abundances, function abundances, and the share of each function that can be attributed to each species, while allowing interactive comparisons between different samples.

Burrito is located at <a href="https://elbo-spice.gs.washington.edu/shiny/burrito/">https://elbo-spice.gs.washington.edu/shiny/burrito/</a>

### Overview

![burrito_example](burrito_sp_example_screenshot.png?raw=true)

Burrito can visualize compositional microbiome data from amplicon sequencing or whole metagenome profiling studies. To generate a visualization, users select from various options when uploading data to the tool [home page](http://elbo-spice.gs.washington.edu/shiny/burrito/). 
In the most basic form, Burrito requires a dataset of taxonomic abundances across samples. If no other data are provided, this dataset must be in the form of 97% Greengenes OTUs. 
Data can be supplied in other formats with supporting information on either gene annotations for each taxon, or taxon-specific functional abundances. 
Sample datasets are provided in the documentation.

Burrito uses the resulting taxonomic and taxonomy-linked functional dataset to generate a visualization combining standard stacked bar plots of the relative abundances of taxa and functions in each sample with a “control panel” that displays hierarchical and linking relationships and enables active exploration via these relationships. 
Optionally, Burrito can display a second, taxa-independent functional stacked bar plot (e.g. from independent functional profile characterization) interleaved with the main taxonomy-based plot for comparison.

Users can interact with the visualization by placing the cursor over any item, which highlights all related components. 
Clicking on the different areas of the control panel allows for drilling down into specific subgroups of interest - nodes in the bipartite graph freeze the display of that node’s linked components. Try clicking on an
edge in the control panel to see the abundance of a specific function attributable to a specific taxon.
Clicking on a node of the  trees will expand or collapse the level of detail. 

