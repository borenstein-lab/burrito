---
title: Uploading Data to Burrito for Visualization
layout: default
---
# Uploading Data to Burrito for Visualization

<h2 id="taxonomy">Taxonomic Data</h2>

<h3>OTU (taxa abundance) table</h3>

The first upload option only requires a table of abundances of Greengenes (McDonald et al 2012 97% OTUs from a 16S rRNA sequencing study, as produced by QIIME or similar programs. The burrito server then runs PICRUSt (Langille et al, 2013) to generate taxonomy-function links and estimated functional profiles. The file format for this option is:

The column of OTU IDs must come as the first column in the table.

<h3>Taxonomic hierarchy</h3>

The user can provide a custom tree describing the taxonomic relationships between OTUs (7) (by default the visualization uses the Greengenes taxonomy) in the following format:
All OTUs (or lowest-level taxa) in the OTU table must have a unique row in the corresponding hierarchy file.

<h3>Choosing a summary taxonomic level</h3>

Once all data upload options are complete, the user selects a taxonomic hierarchy level to summarize the data to (11). 
The highest-resolution level can be chosen (e.g. OTU) and the user will be able to visualize function contributions down to the OTU level. 
However, by choosing a lower-resolution level the visualization will load faster, be more responsive, and use less memory.

<h2 id="function">Functional Data</h2>

<h3>PICRUSt-formatted table of functional contributions of each taxon</h3>

The second upload option requires a table of 16S rRNA reads, as in the first option, but to save time the user also supplies the contribution table already generated using the PICRUSt metagenome_contributions.py script. The format for this PICRUSt contribution table should be:

The columns must appear in this order. The OTU IDs and sample names must appropriately match those found in the 16S rRNA read table.

<h3>Custom gene annotations for each taxon</h3>

The third upload option allows the user to provide their own genome annotation table for the taxa in their OTU table. The first file is again an OTU table of the same format, except with any OTU IDs (not limited to Greengenes). The genome annotation file lists the gene contents for each OTU in the following format:

The columns must appear in this order. The OTU IDs must appropriately match those found in the associated OTU table. All OTUs must have some information in the genome content file.

<h3>Comparison with shotgun metagenome annotations</h3>

<h3>Functional hierarchy (Pathway assignments)</h3>

The user can provide a custom tree describing the hierarchical relationships between functions (8) (by default the visualization uses the KEGG BRITE hierarchy (Kanehisa and Goto, 2000).

<h3>Choosing a functional summary level</h3>

The user also must select a function hierarchy level to summarize the data to (12). As with the OTU summary, the highest-resolution level can be chosen, but choosing a lower-resolution level may increase performance.

WARNING The BRITE hierarchy (used by default) maps single KOs to multiple subpathways. If using the default function hierarchy or a custom hierarchy that maps a higher-resolution function level to multiple lower-resolution function levels, the user should summarize to at least the highest-resolution level without such one-to-many mappings (e.g. for the default function hierarchy, summarize to SubPathway or a lower-resolution level). (TODO: WHAT CURRENTLY HAPPENS IF THEY PICK KO???)

<h2 id="samples">Sample Grouping Data</h2>

The user can provide a sample grouping table (9) linking samples to different groupings or factors (e.g. cases vs. controls) in the following format. Any column of the table can then be selected as the variable used to group and color samples in the visualization. 

Alternatively, users can select an option to sort samples alphabetically by sample ID.

