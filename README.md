# A web-based tool for the interactive exploration of the links between taxonomy and function in metagenomic data

  DNA sequencing technology has revolutionized our ability to describe the structure and function of diverse microbial communities. Metagenomic sequencing studies typically focus on two related but separate questions: 1) which microbial taxa are present, and 2) what genetic functions are present?  These functions can be present in all taxonomic groups, some subset, or only a single species. The high dimensional nature of these data presents challenges for visualization. A sample may have on the order of 1,000 different species, each with 1,000-5,000 genes (which can be grouped into a smaller set of functional categories), and a typical metagenomic study consists of 10-100 samples across different environments, disease states, or time points. 

  Here we have developed a visualization tool to facilitate exploration of microbiome datasets describing both taxonomy and function. Our tool can display the distributions of species abundances, the distributions of function abundances, and the contributions of each species to each function, and furthermore allows interactive comparisons between different samples. 

### Burrito web address
Our tool is located [HERE](https://elbo-spice.gs.washington.edu/shiny/burrito/)

## Interacting with burrito
### The homepage
The burrito homepage is a web form that allows the user to upload data and select their desired settings for the interactive visualization.

TODO: ADD SCREENSHOT OF TWO OPTIONS WITH CIRCLED & NUMBERED COMMPONENTS 

First, the user chooses whether they want to view the burrito visualziation for an example dataset (1) or upload their own data (2). When viewing an example dataset, the user chooses from several pre-loaded studies (3). 

If the user decides to upload their own data, they have three options for how to provide their data files. All input table files should be tab-delimited with a column header for each column including the first column. 

#### Run PICRUSt option
The first upload option (4) only requires a table of abundances of Greengenes ([McDonald et al 2012](http://doi.org/10.1038/ismej.2011.139) 97% OTUs from a 16S rRNA sequencing study, as produced by [QIIME](http://qiime.org) or similar programs. The burrito server then runs PICRUSt ([Langille et al, 2013](http://picrust.github.io/picrust/)) to generate taxonomy-function links and estimated functional profiles. The file format for this option is:

|OTU    |Sample1_Name|Sample2_Name|etc.|
|------:|-----------:|-----------:|---:|
|OTU1_ID|10          |5           |etc.|
|OTU2_ID|0           |5           |etc.|
|etc.   |etc.        |etc.        |etc.|

The column of OTU IDs must come as the first column in the table.

#### Use PICRUSt output option
The second upload option (5) requires a table of 16S rRNA reads, as in the first option, but to save time the user also supplies the contribution table already generated using the PICRUSt `metagenome_contributions.py` script. The format for this PICRUSt contribution table should be:

|Gene      |Sample      |OTU    |GeneCountPerGenome|OTUAbundanceInSample|CountContributedByOTU|ContributionPercentOfSample|ContributionPercentOfAllSamples|
|---------:|-----------:|------:|-----------------:|-------------------:|--------------------:|--------------------------:|------------------------------:|
|Gene1_Name|Sample1_Name|OTU1_ID|1.0               |10.0                |10.0                 |0.5                        |0.0002                         |
|Gene1_Name|Sample1_Name|OTU2_ID|2.0               |5.0                 |10.0                 |0.5                        |0.0002                         |
|etc.      |etc.        |etc.   |etc.              |etc.                |etc.                 |etc.                       |etc.                           |

The columns must appear in this order. The OTU IDs and sample names must appropriately match those found in the 16S rRNA read table.

#### Use custom gene annotations
The third upload option (6) allows the user to provide their own genome annotation table for the taxa in their OTU table. The first file is again an OTU table of the same format, except with any OTU IDs (not limited to Greengenes). The genome annotation file lists the gene contents for each OTU in the following format:

|OTU    |Gene      |CopyNumber|
|------:|---------:|---------:|
|OTU1_ID|Gene1_Name|1         |
|OTU2_ID|Gene1_Name|2         |
|etc.   |etc.      |etc.      |

The columns must appear in this order. The OTU IDs must appropriately match those found in the associated OTU table.

#### Optional files
There are four optional files a user can provide when uploading their own data. These files allow customization of additional data in the visualization.

##### Taxonomic hierarchy
The user can provide a custom tree describing the taxonomic relationships between OTUs (7) (by default the visualization uses the Greengenes taxonomy) in the following format:

|OTU    |Kingdom    |Phylum          |etc.|
|------:|----------:|---------------:|---:|
|OTU1_ID|k__Bacteria|p__Bacteroidetes|etc.|
|OTU2_ID|k__Bacteria|p__Firmicutes   |etc.|
|etc.   |etc.       |etc.            |etc.|

This custom tree must have the OTU ID column first followed by a column for each taxonomic rank from lowest resolution (e.g. Kingdom) to highest resolution (e.g. Species). The user can specify their own taxonomic rank names.

##### Function hierarchy
The user can provide a custom tree describing the hierarchical relationships between functions (8) (by default the visualization uses the KEGG [BRITE](http://www.genome.jp/kegg/brite.html) hierarchy ([Kanehisa and Goto, 2000](http://doi.org/10.1093/nar/28.1.27)) in the following format:

|Gene  |Category  |SuperPathway           |etc.|
|-----:|---------:|----------------------:|---:|
|K00001|Metabolism|Carbohydrate Metabolism|etc.|
|K00002|Metabolism|Lipid Metabolism       |etc.|
|etc.  |etc.      |etc.                   |etc.|

This custom hierarchy must have the lowest level ID column first (e.g. KO or gene) followed by a column for each level of function hierarchy from lowest resolution (e.g. Category or Class) to highest resolution (e.g. SubPathway or Module). The user can specify their own taxonomic rank names.

##### Sample metadata
The user can provide a metadata table (9) linking samples to different groupings or factors (e.g. cases vs. controls) in the following format. This information will be used to color sample labels in the visualization.

|Sample      |Grouping_1|Grouping_2|etc.|
|-----------:|---------:|---------:|---:|
|Sample1_Name|Case      |Human     |etc.|
|Sample2_Name|Control   |Mouse     |etc.|
|etc.        |etc.      |etc.      |etc.|

##### Function profile for comparison
The user can also provide a table of function abundances for each sample (10), which can be compared with the taxonomy-linked function profiles, for example to compare gene abundances from metagenomic data with predicted PICRUSt abundances from 16S rRNA sequencing. This additional functional profile data should have the following format:

|Gene  |Sample1_Name|Sample2_Name|etc.|
|-----:|-----------:|-----------:|---:|
|K00001|0.4         |0.2         |etc.|
|K00002|0.3         |0.5         |etc.|
|etc.  |etc.        |etc.        |etc.|

The function profile table must have sample names matching those used in the 16S rRNA OTU table so that side-by-side comparisons between predicted and measured function profiles can be made.

#### Final selections

##### Choosing a summary taxonomic level
Once all data upload options are complete, the user selects a taxonomic hierarchy level to summarize the data to (11). The highest-resolution level can be chosen (e.g. OTU) and the user will be able to visualize function contributions down to the OTU level. However, by choosing a lower-resolution level the visualization will load faster, be more responsive, and use less memory.

##### Choosing a summary function level
The user also must select a function hierarchy level to summarize the data to (12). As with the OTU summary, the highest-resolution level can be chosen, but choosing a lower-resolution level may increase performance.

**WARNING** The BRITE hierarchy (used by default) maps single KOs to multiple subpathways. If using the default function hierarchy or a custom hierarchy that maps a higher-resolution function level to multiple lower-resolution function levels, the user should summarize to at least the highest-resolution level without such one-to-many mappings (e.g. for the default function hierarchy, summarize to SubPathway or a lower-resolution level). (TODO: WHAT CURRENTLY HAPPENS IF THEY PICK KO???) 

##### Choosing a color scheme
The user can choose between two color scheme options (13). First, the hierarchical color scale colors the nodes of a subtree in the taxonomic or function hierarchy a shade of the parent node's color, which is ideal for exploring overall trends in broad categories. Second, the random color scale instead assigns random colors to the nodes of the taxonomic and function hierarchies, which is better for comparing fine-scale differences across samples.

##### Choosing a sample grouping
If the user has uploaded a sample metadata file, they can select a column from the metadata to group samples. This will order the visualization barplot bars to keep samples of the same group together and color the sample names similarly.

##### Generating the visualization
Finally, once all selections have been made, the user can generate the visualization (15)!

### The visualization

TODO: ADD SCREENSHOT OF FULL VISUALIZATION

#### The function abundance barplot
The function abundance barplot shows the relative abundances of functions in each sample. By hovering over a bar segment, that function will be highlighted across all samples in the barplot.

TODO: ADD SCREENSHOT OF FUNCTION BARPLOT MOUSING OVER SEGMENT

Additionally, when mousing over a bar segment, the corresponding function will be selected in the taxonomy-function connection visualization (connectogram?) as described later.

#### The taxonomic abundance barplot
The taxonomic abundance barplot shows the relative abundances of taxa in each sample. By hovering over a bar segment, that taxon will be highlighted across all samples in the barplot. Additionally, the contributions of that taxon to each function will be highlighted in the function barplot across all samples.

TODO: ADD SCREENSHOT OF THE OTU AND FUNCTION BARPLOTS MOUSING OVER AN OTU SEGMENT

Additionally, when mousing over a bar segment, the corresponding taxon will be selected in the taxonomy-function connection visualization (connectogram?) (see below).

#### The taxonomy and function hierarchies
The taxonomy/function hierarchy shows the hierarchical structure of both the displayed taxonomy and function categorizations. By clicking on a leaf taxon/function node (node at the rightmost/leftmost part of the hierarchy), the tree will expand that node to show the sub-taxa/-functions of the corresponding taxon/function (if any) in the taxonomy/function hierarchy as well as the taxonomy/function abundance barplot.

TODO: ADD SCREENSHOT OF BEFORE AND AFTER EXPANDING A NODE

Alternatively, by clicking on an interior taxon/function node (any node other than a leaf taxon/function node), the tree will collapse that branch of the tree, displaying the clicked taxon/function node as a leaf node with a single color in the taxonomy/function bar plots.

TODO: ADD SCREENSHOT OF BEFORE AND AFTER COLLAPSING A NODE

#### The taxonomy-function connection visualization (connectogram?)
TBD

#### Saving the visualization (or visualization components)
Once the user has adjusted the displayed visualization to suit their needs, they can save the entire visualization, or individual components, using the menu...TODO

TODO: ADD SCREENSHOT OF SAVE MENU
