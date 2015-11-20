#A web-based tool for interactive data exploration of metagenomic datasets.
####Cecilia Noecker, Alex Eng, Colin McNally, Will Gagne-Maynard

  Human-associated microbial communities, known as the human microbiome, have been associated with a range of diseases including obesity and inflammatory bowel disease. Analyses of these communities through metagenomic sequencing have focused on two related but separate questions: 1) which microbial species are present, and 2) what genetic functions are present?  These functions can be present in all species, some subset of species, or only a single species. The high dimensional nature of these data presents challenges for visualization. A sample may have 500-1,000 different species, each with 1,000-5,000 genes (which can be grouped into a smaller set of functional categories), and a typical study consists of 10-100 samples across different environments, disease states, or time points. 

  We have developed a visualization tool to facilitate exploration of this type of dataset. Our tool can display the distributions of species abundances, the distributions of function abundances, and the contributions of each species to each function, and furthermore allows interactive comparisons between different samples and subsets. 

![](/images/Final_Image.png)

###Running Instructions
Access our visualization [HERE](http://cse512-15s.github.io/fp-cnoecker-engal-cmcn-wgagne-maynard/)

OR download this repository and run python -m SimpleHTTPServer 9000 at the root. Then access the visualization from http://localhost:9000/ using your favorite web browser.

###Credits
####Cecilia Noecker
- Responsible for all data cleaning and organization prior to loading data into our visualization
- Generated the bipartite graph and assisted in linking it to the tree structure
- Developed coloring scales for the visualization as a whole

####Alex Eng
- Developed our "data cube" structure to hold our data
- Created the taxa stacked bar plot
- Developed the highting interactivity between seperate parts of the visualization

####Colin McNally
- Developed the tree structure for both Taxa and Function
- Worked on linking the tree structure to the bipartite graph
- Created the final visualization product on one page

####Will Gagne-Maynard
- Generated the stacked bar plot for functions
- Assisted in linking the stacked bar plots with the bipartite graph and tree
- Gave design and use feedback throughout the study
