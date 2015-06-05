var margin = {
    top: 20,
    right: 120,
    bottom: 20,
    left: 120
},
//width = window.innerWidth - margin.left - margin.right - 50,
//height = window.innerHeight - margin.top - margin.bottom - 50;
width = 600 - margin.left - margin.right - 50;
height = 600 - margin.left - margin.right - 50;

var i = 0,
    duration = 750,
    taxaroot,
	funcroot,
	roots = {};



var TaxaTree = d3.layout.tree()
    .children(function (d) {
    if (d.hasOwnProperty('values')) return d.values;
    else if (d.hasOwnProperty('children')) return d.children;
})
    .size([height, width/2]);

var FuncTree = d3.layout.tree()
    .children(function (d) {
    if (d.hasOwnProperty('values')) return d.values;
    else if (d.hasOwnProperty('children')) return d.children;
})
    .size([height, width/2]);

var trees = [];
trees["taxa"] = TaxaTree;
trees["func"] = FuncTree;

var diagonal = d3.svg.diagonal()
    .projection(function (d) {
    return [d.y, d.x];
});

var TaxaTreeSVG = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var FuncTreeSVG = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var SVGs = {};
SVGs["taxa"] = TaxaTreeSVG;
SVGs["func"] = FuncTreeSVG;

d3.tsv("taxa_mapping.txt", function(error, data1){
    d3.tsv("functional_mapping.txt", function(error, data2){

        var taxa_data = d3.nest()
        .key(function(d) { return d.Kingdom; })
        .key(function(d) { return d.Phylum; })
        .key(function(d) { return d.Class; })
        .key(function(d) { return d.Order; })
        .key(function(d) { return d.Family; })
        .key(function(d) { return d.Genus; })
        .key(function(d) { return d.Species; })
        .entries(data1);    

    newTaxaData = {
        "name": "All Taxa",
        "children": taxa_data,
    }

    taxaroot = newTaxaData;
    taxaroot.x0 = height/2;
    taxaroot.y0 = 0;
	
    function collapse(d) {
		d.type = settype;
        if (d.hasOwnProperty('name')) {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        } else if (d.hasOwnProperty('key')) {
            if (d.values) {
                d._values = d.values;
                d._values.forEach(collapse);
                d.values = null;
            }
        }
    }
	
	var settype = 'taxa';
    taxaroot.children.forEach(collapse);
	taxaroot.type = 'taxa';

	roots["taxa"] = taxaroot;
	
    update(taxaroot);

    d3.select(self.frameElement).style("height", "800px");

    var function_data = d3.nest()
        .key(function(d) { return d.Category; })
        .key(function(d) { return d.SuperPathway; })
        .key(function(d) { return d.SubPathway; })
        .key(function(d) { return d.KO; })
        .entries(data2);    

    newFunctionData = {
        "name": "All Functions",
        "children": function_data,
    }

    funcroot = newFunctionData;
    funcroot.x0 = height/2;
    funcroot.y0 = 0;
	settype = 'func';
    funcroot.children.forEach(collapse);
	funcroot.type = settype;
	roots["func"] = funcroot;
	
    update(funcroot);

    d3.select(self.frameElement).style("height", "800px");


    function update(source) {

        // Compute the new tree layout.
		
        var nodes = trees[source.type].nodes(roots[source.type]).reverse(),
            links = trees[source.type].links(nodes);
		
		var nleaf = 0;
		nodes.forEach(function (d) {
			nleaf = nleaf + (d.children || d.values ? 0 : 1);
		})
		
		var leafC = 1;
		nodes.forEach(function (d) {
			if (!(d.children || d.values)) {
				d.x = (nleaf - leafC)/nleaf * height;
				leafC = leafC + 1;
			} else {
				var sumpos = 0;
				d.children.forEach(function (dc) {
					sumpos = sumpos + dc.x;
				})
				d.x = sumpos / d.children.length;
			}
		})
        // Normalize for fixed-depth.
		var maxDepth = getDepth(roots[source.type]);
        nodes.forEach(function (d) {
        //    d.y = (d.depth / maxDepth) * width ;
        });

        // Update the nodes…
        var node = SVGs[source.type].selectAll("g.node")
            .data(nodes, function (d) {
            return d.id || (d.id = ++i);
        });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
            .on("click", click);

        nodeEnter.append("circle")
            .attr("r", 1e-6)
            .style("fill", function (d) {
            return d._children || d._values ? "lightsteelblue" : "#fff";
        });

        nodeEnter.append("text")
            .attr("x", function (d) {
            return 10;
        })
            .attr("dy", ".35em")
            .attr("text-anchor", function (d) {
            return "start";
        })
            .text(function (d) {
               if(d.name != null)
                   return d.name;
               else if(d.key != null)
                   return d.key;
        })
            .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

        nodeUpdate.select("circle")
            .attr("r", 4.5)
            .style("fill", function (d) {
            return d._children || d._values ? "lightsteelblue" : "#fff";
        });

        nodeUpdate.select("text")
            .style("fill-opacity", function(d) {
				return d.children || d.values ? 0 : 1;
			})
			.text(function (d) {
				if(d.children || d.values) {
					return "";
				} else {
					if(d.name != null)
                   return d.name;
               else if(d.key != null)
                   return d.key;
				}
			});

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links…
        var link = SVGs[source.type].selectAll("path.link")
            .data(links, function (d) {
            return d.target.id;
        });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
            var o = {
                x: source.x0,
                y: source.y0
            };
            return diagonal({
                source: o,
                target: o
            });
        });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function (d) {
            var o = {
                x: source.x,
                y: source.y
            };
            return diagonal({
                source: o,
                target: o
            });
        }).remove();

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
            //console.log(d.x);
            //console.log(d.y);
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // Toggle children on click.
    function click(d) {
        if (d.hasOwnProperty('name')) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
        } else if (d.hasOwnProperty('key')) {
            if (d.values) {
                d._values = d.values;
                d.values = null;
            } else {
                d.values = d._values;
                d._values = null;
            }
        }
        update(d);
    }
	
	function getDepth(rootnode) {
		var depth = 0;
		if (rootnode.children) {
			rootnode.children.forEach(function(d) {
				var tmpDepth = getDepth(d);
				if (tmpDepth > depth) {
					depth = tmpDepth;
				}
			})
		}
		return 1+depth;
	}
})
});








