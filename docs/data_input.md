---
title: Uploading Data to Burrito for Visualization
layout: default
---
# Uploading Data to Burrito for Visualization

Burrito has several options for uploading and viewing datasets. Each data file must be formatted as shown in the examples linked below.

<h2 id="taxonomy">Taxonomic Data</h2>

<h3>OTU (taxa abundance) table</h3>

The first upload option only requires a table of abundances of Greengenes (McDonald et al 2012 97% OTUs from a 16S rRNA sequencing study, as produced by QIIME or similar programs. 
The burrito server then runs PICRUSt (Langille et al, 2013) to generate taxonomy-function links and estimated functional profiles. The column of OTU IDs must come as the first column in the table.

<a href="https://elbo-spice.gs.washington.edu/shiny/burrito/Data/examples/example_otus.txt" target="_blank"><strong>Example</strong> </a>

<h3>Taxonomic hierarchy</h3>

The user can provide a custom tree describing the taxonomic relationships between OTUs (7) (by default the visualization uses the Greengenes taxonomy).
All OTUs (or lowest-level taxa) in the OTU table must have a unique row in the corresponding hierarchy file.

<a href="https://elbo-spice.gs.washington.edu/shiny/burrito/Data/examples/example_tax_hierarchy.txt" target="_blank"><strong>Example</strong> </a>

<h3>Choosing a summary taxonomic level</h3>

Once all data upload options are complete, the user selects a taxonomic hierarchy level to summarize the data to (11). 
The highest-resolution level can be chosen (e.g. OTU) and the user will be able to visualize function contributions down to the OTU level. 
However, by choosing a lower-resolution level the visualization will load faster, be more responsive, and use less memory.


<h2 id="function">Functional Data</h2>

<h3>Comparison with metagenome-based function abundances</h3>

Burrito will optionally compare taxa-based estimated functional abundances with a second, paired dataset of measured function abundances (for example, directly annotated and quantified from shotgun metagenomic data). To select this option, the user must upload a data file of function abundances with the first column listing KEGG Orthologs (KO), 
and subsequent columns detailing the abundances of each KO in each sample. 

The column names must correspond exactly with the sample names used in other data files.

<a href="https://elbo-spice.gs.washington.edu/shiny/burrito/Data/examples/example_metagenome.txt" target="_blank"><strong>Example</strong> </a>

<h3>Custom genomic content for each taxon</h3>

The third upload option allows the user to provide their own genome annotation table for the taxa in their OTU table. The first file is again an OTU table of the same format, except with any OTU IDs (not limited to Greengenes). 

The columns must appear in the order in the example. The OTU IDs must match those found in the associated OTU table. All OTUs must have some information in the genome content file.

<a href="https://elbo-spice.gs.washington.edu/shiny/burrito/Data/examples/example_genome_content.txt" target="_blank"><strong>Example</strong> </a>

<h3>Table of functional attributions for each taxon</h3>

The second upload option requires a table of 16S rRNA reads, as in the first option, but the user can also supply a table of taxon-specific function abundances in the format generated using the PICRUSt metagenome_contributions.py script. 

The columns must appear in the order in the example. The OTU IDs and sample names must appropriately match those found in the 16S rRNA read table.

<a href="https://elbo-spice.gs.washington.edu/shiny/burrito/Data/examples/example_contributions.txt" target="_blank"><strong>Example</strong> </a>


<h3>Functional hierarchy (Pathway assignments)</h3>

The user can provide a custom tree describing the hierarchical relationships between functions (8) (by default the visualization uses the KEGG BRITE hierarchy (Kanehisa and Goto, 2000). This file must be in the same format as the example.

<a href="https://elbo-spice.gs.washington.edu/shiny/burrito/Data/examples/example_func_hierarchy.txt" target="_blank"><strong>Example</strong> </a>

<h3>Choosing a functional summary level</h3>

The user also must select a function hierarchy level to summarize the data to (12). As with the OTU summary, the highest-resolution level can be chosen, but choosing a lower-resolution level may increase performance.

*Warning:* The BRITE hierarchy (used by default) maps single KOs to multiple subpathways. Because Burrito's tree visualization assumes there are no such many-to-one hierarchical mappings, Burrito will not display functional data at the KO level under the default settings.
If using a custom hierarchy that maps a higher-resolution function level to multiple lower-resolution levels, the user should select a summary level with exclusively unique mappings. For lower levels, for example for KOs that belong to multiple pathways, Burrito will assign 
their abundance fractionally to each linked pathway.

<h2 id="samples">Sample Grouping Data</h2>

The user can provide a sample grouping table linking samples to different groupings or factors (e.g. cases vs. controls) in the format shown in the example. Any column of the table can then be selected as the variable used to group and color samples in the visualization. 

<a href="https://elbo-spice.gs.washington.edu/shiny/burrito/Data/examples/example_sample_map.txt" target="_blank"><strong>Example</strong> </a>

Alternatively, users can select an option to sort samples alphabetically by sample ID.

