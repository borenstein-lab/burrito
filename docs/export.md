---
title: Exporting Figures and Data from BURRITO
layout: default
---
# Exporting Figures and Data from BURRITO

BURRITO can export both static visualizations and the summary-level data used to generate them. Click the triangle in the upper left corner of the visualization to view export options. 

### Exporting Images

Images can be exported either in PNG format or as raw SVG files. Users can set the name of the file to be downloaded, and BURRITO will add a suffix depending on the download option selected. 
The following components of the visualization can be downloaded as standalone images:

- A screenshot of the entire visualization
- The bar plot of taxonomic relative abundances
- The bar plot of functional relative abundances
- The list of displayed taxa and their associated colors (left side of the control panel; serves as a legend for the taxonomic bar plot)
- The list of displayed functions and their associated colors (right side of the control panel; serves as a legend for the function bar plot)

Any regions of the visualization highlighted by clicking will also be highlighted in the exported images.

### Exporting Data Files

The BURRITO server generates summarized tables of function abundances and attributions that are displayed in the visualization, as well as results of basic summary analyses. These tables can be downloaded for further analysis 
via the sidebar menu. See [Uploading Data to BURRITO](data_input.html) for more information on the settings and options for these files.

- *Function abundance tables*: 
Specifically, the estimated function abundances and the taxon-specific function attributions can each be downloaded. These are supplied at the level of resolution selected on the upload page 
(Genus for taxa and sub-pathway for functions by default). These are formatted the same as output files from PICRUSt (Langille et al Nature Biotech 2013). 

- *Sample Prediction Indices*: If the provided data uses the default Greengenes OTUs and PICRUSt functional predictions, users can evaluate the quality of those predictions on a per-sample level. BURRITO calculates and provides for download the weighted Nearest Sequenced Taxon Index (NSTI) for each sample, a score indicating the average branch length separating each OTU from a sequenced reference genome (weighted by OTU abundances). See the PICRUSt documentation for more details on these values.

- *Basic differential abundance statistics*: If users provide and select a binary sample grouping (for example Cases and Controls), BURRITO will automatically perform and provide preliminary differential abundance calculations
for all of the displayed taxa and functions, at the user-specified minimum levels of resolution. This includes the difference in mean abundance between the two sample groups and the p-value from a Wilcoxon rank-sum test between the two groups, 
as well as the adjusted p-value after multiple choice correction based on the Bonferroni correction and the Benjamini-Hochberg false discovery rate methods. If a paired dataset of function abundances is provided, 
the same statistics will also be reported for those features.
