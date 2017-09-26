---
title: Exporting Figures and Data from Burrito
layout: default
---
# Exporting Figures and Data from Burrito

Burrito can export both static visualizations and the summary-level data used to generate them. Click the triangle in the upper left corner of the visualization to view export options. 

### Exporting Images

Images can be exported either in PNG format or as raw SVG files. Users can set the name of the file to be downloaded, and Burrito will add a suffix depending on the download option selected. 
The following components of the visualization can be downloaded as standalone images:

- A screenshot of the entire visualization
- The bar plot of taxonomic relative abundances
- The bar plot of functional relative abundances
- The list of displayed taxa and their associated color (left side of the control panel; serves as a legend for the taxonomic bar plot)
- The list of displayed functions and their associated color (right side of the control panel; serves as a legend for the function bar plot)

Any regions of the visualization highlighted by clicking will also be highlighted in the exported images.

### Exporting Data Files

The Burrito server generates summarized tables of taxa and function abundances that are displayed in the visualization. These tables can be downloaded for further analysis. 
Specifically, the estimated function abundances and the taxon-specific function attributions can each be downloaded. These are supplied at the level of resolution selected on the upload page 
(Genus for taxa and sub-pathway for functions by default). These are formatted the same as output files from PICRUSt (Langille Nature Biotech 2013). 