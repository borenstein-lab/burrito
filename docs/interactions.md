---
title: Available Interactions in the BURRITO Visualization
layout: default
---
# Interacting with the BURRITO Visualization

BURRITO enables the user to explore their data using a wide array of interactive features. These features range from visualization-wide highlighting for examing broad trends to taxon-, function-, or attribution-specific tooltips for detailed information about individual aspects of community structure.

### Highlighting taxa, functions, and attributions

The user can highlight various components of the visualization by hovering over or clicking on these different components

#### Highlighting taxa

To highlight the data associated with a specific taxon for quick visual comparison of that taxon's abundance across all samples, the user can hover over or click on a bar segment corresponding to that taxon in the taxonomic abundance bar plot or the taxon's node in the bipartite graph. This will highlight that taxon's bar segment in each sample's taxonomic abundance bar and the taxon's node in the bipartite graph.

#### Highlighting functions

To highlight the data associated with a specific function for quick visual comparison of that function's abundance across all samples, the user can hover over or click on a bar segment corresponding to that function in the function abundance bar plot or the function's node in the bipartite graph. This will highlight that function's bar segment in each sample's function abundance bar and the function's node in the bipartite graph.

#### Highlighting attributions

When the user highlights a specific taxon, this will also highlight bar segments in the function abundance bar plot corresponding to the function abundance shares attributed to the highlighted taxon across all samples. Additionally, users can highlight the function shares attributed to a taxon for a single function by clicking on the edge in the bipartite graph (revealed by clicking on either the taxon or function) linking the taxon of interest's node to the function of interest's node. This will highlight the bar segments in the taxonomic abundance bar plot corresponding to the specific taxon and the bar segments in the function abundance bar plot corresponding to the specific functino's abundance shares attributed to that taxon.

### Visualizing average abundances and attributions

Various components of the top half of the visualization reveal summary information about average abundances and attributions.

#### Visualizing average taxon and function abundances

The diameter of the leaf nodes in the taxonomic and functional trees represent the average abundances of the corresponding taxa and functions. The user can access a scale translating diameter to average abundance by opening the options menu on the left-hand side (clicking on the triangle with a gear) and clicking the "Display legend" button.

#### Visualizing the average share of a function attributed to a taxon

The user can examine the average share of a function attributed to a taxon across all samples by hovering over or clicking on either the taxon or function of interest. This will reveal edges between taxon and function nodes in the bipartite graph. If the user hovers over or clicks on a taxon, this will reveal edges linking the taxon's node in the bipartite graph to all functions with shares attributed to that taxon in any sample. Similarly, if the user hovers over or clicks on a function, this will reveal edges linking the function's node to all taxa that shares of that function are attributed to in anysample. The width of the edge corresponds to the average share of the function attributed to the taxon. Similar to average abundances, the user can access a scale translating edge with to average attribution with the "Display legend" button in the options menu.

### Drilling up and down in taxonomic and functional resolution

To explore taxonomic or functional data at different resolutions, the user can expand or collapse branches of the taxnomic or functional hierarchies by clicking on nodes in their respective trees. When the user clicks on a leaf node, the tree will expand to reveal all nodes below the clicked node in the corresponding hierarchy (assuming the clicked node is not at the highest-resolution summary level selected by the user on the upload page). When the user clicks on an internal node in a tree, the tree will collapse to hide all nodes below the clicked node in that tree (consequently making the clicked node a leaf node).

### Inspecting detailed abundance and attribution data via tooltips

To inspect the abundance or attribution data in more detail, hovering over various components of the visualization will reveal tooltips that provide more specific information about the component.

#### Taxonomic abundance tooltips

When hovering over a bar segment in the taxonomic abundance bar plot, a tooltip will show the name of the taxon, the sample name, and the relative abundance of that taxon in that sample.

#### Function abundance tooltips

When hovering over a bar segment in the function abundance bar plot, a tooltip will show the name of the funciton, the sample name, and the relative abundance of that function in that sample.

When hovering over a highlighted bar segment in the function abundance bar plot corresponding to the share of a function attributed to a specific taxon, a tooltip will show the name of the funciton, the name of the taxon to which the function's share is attributed, the sample name, the percentage of the function's total abundance attributed to the taxon, and the percentage of the total abundance of all functions that this share makes up in the sample.

#### Bipartite graph tooltips

When hovering over a taxon node in the bipartite graph, a tooltip will show the name of the taxon and its average abundance across all samples.

When hovering over a function node in the bipartite graph, a tooltip will show the name of the function and its average abundance across all samples.

When hovering over an edge in the bipartite graph, a tooltip will show the name of the taxon on the left end of the edge, the name of the function on the right of the edge, the average percentage of that function's abundance attributed to the taxon, and the average percentage of total function abundance that shares of the function attributed to the taxon make up across all samples.