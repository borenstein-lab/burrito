# CSE 512 Final Project
####Cecilia Noecker, Alex Eng, Colin McNally, Will Gagne-Maynard

  Human-associated microbial communities, known as the human microbiome, have been associated with a range of diseases including obesity and inflammatory bowel disease. Analyses of these communities through metagenomic sequencing have focused on two related but separate questions: 1) which microbial species are present, and 2) what genetic functions are present? Our lab has developed techniques to combine the answers to these two questions--to deconvolve which genes belong to which species and thus how differences in species abundance between samples contribute to differences in function abundance. The result is a dataset of abundances of gene functions within each species for each sample. These functions can be present in all species, some subset of species, or only a single species. The high dimensional nature of these data presents challenges for visualization. A sample may have 500-1,000 different species, each with 1,000-5,000 genes (which can be grouped into a smaller set of functional categories), and a typical study consists of 10-100 samples across different environments, disease states, or time points. 

  We have developed a visualization tool to facilitate exploration of this type of dataset. Our tool can display the distributions of species abundances, the distributions of function abundances, and the contributions of each species to each function, and will furthermore allow interactive comparisons between different samples and subsets. Our preliminary plan is to implement a bipartite graph visualization showing links between taxa and genes connected to a stacked bar plot or area plot showing the composition of either genes or taxa across samples, with lots of options for interactive zooming, brushing, and sorting to explore how different subsets of taxa contribute to gene variation across samples and vice versa.


View our project at:

http://cse512-15s.github.io/fp-cnoecker-engal-cmcn-wgagne-maynard/

##Roles:
  We will work collectively on designing data structures that will allow for efficiently switching between hierarchical        levels of taxa and functions and looking up links and contributions between them.
 
###Will: 
-Specialize in realizing our visualization in Canvas to increase performance

-Exploring options on how to integrate Canvas and d3 to quickly render the large number of data points and edges that our visualization will include.

-Port visualization prototypes to Canvas

-Project management, to ensure that the project is broken down into manageable chunks.

-Coordinating visual design of separate components of the visualization.

-Gathering user feedback and using it to modify project goals.

###Colin:
-Initial implementation of bipartite graph visualization.

-Initial implementation of bipartite graph interaction, including mouseover highlighting and using it to highlight sections of the stacked bar plots.

-Aid in implementation of data structures.

-Creating animations when changing what data is being displayed.


###Alex:
-Initial implementation of hierarchical tree structures visualization.

-Initial implementation of hierarchical tree interaction:using them to increase or reduce the level of detail on the stacked bar plots and the bipartite graph, including transitions between levels when the user clicks on a taxon or function to subset

-Implementation of data structures


###Cecilia:
-Format the data for input

-Initial code for stacked bar plots visualization.

-Implementation of stacked bar plot interactions including mouseover details, click to subset, and sample sorting and reordering, followed by implementation of joint subsetting of both bar plots.


##To Do 5/27/25
#Overall
-Get multiple graphs on same page
#Stacked Bar Plots
-make one with otu data(on it's own, not involved in data cube)
-highlight all bars from species(write a function to do so)
-collapsing or expanding bars
-need to rewrite KO stacked bar w/ data cube
#Data
-load all data at once w/ nested loads
-Create data cube
#Trees
-Create trees with edges from nodes
-Leaves at same x-coordinate, maybe using dummy nodes. 
-Permanent labels on leaves
-interior labels on mouseover
-branch coloring or shading scheme for heirarchy level


##Tasks

#Colin
Work on the tree structure

#Alex
Data Structure
Simple Highlighting on stacked bar

#Cecilia
Start on Bipartite

#Will
Create OTU Stacked Bar Graph
Get everything on the same page


