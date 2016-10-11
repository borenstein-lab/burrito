(function(){
	var trees={};
	trees.treestructure = {};
	trees.SVGs = {};
	trees.taxa_tree_data, trees.func_tree_data;
	var roots = {};
	var taxa_means = {}
	var data_cube;
	var bpvisdata;
	var navDims;
	var margin;
	var levelNames = {};
	var curlevelNames = {};
	var diagonal;
	var taxa_colors;
	var func_colors;
	var nodeIndex = 0;
	var bpBarHeight = {};
	var highlightOverall = function(){};
	var dehighlightOverall = function(){};
	var updateOtherThings = function(){};
	
	trees.SetUp = function(navDims) {
		var TaxaTree = d3.layout.tree()
			.children(function (d) { return d.values; })
			.size([(navDims.height), navDims.treewidth]);

		var FuncTree = d3.layout.tree()
			.children(function (d) { return d.values;})
			.size([(navDims.height), navDims.treewidth]);

		trees.treestructure["taxa"] = TaxaTree;
		trees.treestructure["func"] = FuncTree;
		
		diagonal = d3.svg.diagonal()
			.projection(function (d) {
			return [d.y, d.x];
		});
	}
	
	trees.SetUp2 = function(navname, margins, navdim, tax_hierarchy_t, func_hierarchy_t) {
		navDims = navdim;
		margin = margins;
		trees.treestructure["taxa"].size([(navDims.height), navDims.treewidth]);
		trees.treestructure["func"].size([(navDims.height), navDims.treewidth]);
		
		var TaxaTreeG = d3.select("#" + navname).append("g")
			.attr("transform", "translate(" + 5 + "," + margins.top + ")");

		var FuncTreeG = d3.select("#" + navname).append("g")
			.attr("transform", "translate(" + (navDims.width - navDims.treewidth - 5) +  "," + margins.top + ")");

		trees.SVGs["taxa"] = TaxaTreeG;
		trees.SVGs["func"] = FuncTreeG;
		trees.taxa_tree_data = tax_hierarchy_t;
		trees.func_tree_data = func_hierarchy_t;
		
		bpBarHeight[0] = 50; bpBarHeight[1] = 50;	
	}
	
	trees.SetUp3 = function(height, datcube, otu_abundance_data, bpvd, highloverall, dehighloverall, taxa_cols, func_cols, updateFunc) {
		data_cube = datcube;
		bpvisdata = bpvd;
		highlightOverall = highloverall;
		dehighlightOverall = dehighloverall;
		taxa_colors = taxa_cols;
		func_colors = func_cols;
		updateOtherThings = updateFunc;

		levelNames['taxa'] = ["Kingdom", "Phylum", "Class", "Order", "Family", "Genus", "Species", "OTU"];
		levelNames['func'] = ["Category", "SuperPathway", "SubPathway"];
		curlevelNames['taxa'] = levelNames['taxa'];
		curlevelNames['func'] = levelNames['func'];

		var taxa_data = jQuery.extend(true, [], trees.taxa_tree_data);
		
		/*var curr_taxa = [];
		for (var i = 0; i < taxa_data.length; i++){
			curr_taxa.push(taxa_data[i]);
		}

		for (; curr_taxa.length > 0;){
			curr_taxon = curr_taxa.shift();
			if (!data_cube.is_leaf(curr_taxon)){
				curr_taxon.values.sort(sort_nest);
				for (var i = 0; i < curr_taxon.values.length; i++){
					curr_taxa.push(curr_taxon.values[i]);
				}
			}
		} */

		var newTaxaData = {
			"key": "All Taxa",
			"values": taxa_data,
		}

		var taxaroot = newTaxaData;
		taxaroot.x0 = height/4;
		taxaroot.y0 = 0;
		
		function collapse(d) {
			d.type = settype;
				if (d.values) {
					d._values = d.values;
					d._values.forEach(collapse);
					d.values = null;
				}
			
		}
		
		var settype = 'taxa';
		taxaroot.values.forEach(collapse);
		taxaroot.type = 'taxa';

		
		
		
		roots["taxa"] = taxaroot;
		countchildren(roots["taxa"]);
		//get means for all OTUs, then for all the way up the tree
		get_taxa_sample_means(otu_abundance_data, data_cube)
		getAvgs(roots["taxa"])
		trees.update(roots["taxa"]);
		
		var function_data = jQuery.extend(true, [], trees.func_tree_data);

		newFunctionData = {
			"key": "All Functions",
			"values": function_data,
		}

		funcroot = newFunctionData;
		funcroot.x0 = height/4;
		funcroot.y0 = 0;
		
		settype = 'func';
		funcroot.values.forEach(collapse);
		funcroot.type = settype;
		
		roots["func"] = funcroot;
		countchildren(roots["func"]);
		getAvgs(roots["func"])
		trees.update(roots['func']);

		trees.click(roots['taxa'].values[0])
	}
	
	
	
	
	
	// Update the tree graphs
	// Expands or collapses the source node, depending on whether it is currently open or closed
	trees.update = function(source) {
		// Compute the new tree layout.
		var nodes = trees.treestructure[source.type].nodes(roots[source.type]).reverse();
		var links = trees.treestructure[source.type].links(nodes);
			

		var nleaf = 0;
		nodes.forEach(function (d) {
			nleaf = nleaf + (d.values ? 0 : 1);
		})

		nodes.forEach(function (d) {
			if (!(d.values)) { 
				var dattype = d.type == "taxa" ? 0 : 1;
				var thedat = -1;

				for (var idxz = 0; idxz < bpvisdata.keys[dattype].length ; idxz++) {
					if (d.key == bpvisdata.keys[dattype][idxz])
						thedat = idxz;
				}
				
				if (thedat >= 0) {
					d.x = bpvisdata.mainBars[dattype][thedat].y;	
				} else { d.x = 0; 
				}
				
				//d.x = (nleaf - leafC)/nleaf * height;
				//leafC = leafC + 1;
			} else { 
				var sumpos = 0;
				d.values.forEach(function (dc) {
					sumpos = sumpos + dc.x;
				})
				d.x = sumpos / d.values.length; 
			}
		})
		
		
		// Normalize for fixed-depth.
		var maxDepth = trees.getDepth(roots[source.type]);
		
		var depthpos = {};
		depthpos['taxa'] = [];
		depthpos['func'] = [];
		nodes.forEach(function (d) {
			if (source.type == 'taxa') {
				//d.y = (d.depth / maxDepth) * treewidth ;
				if (d.depth == maxDepth) {
					//d.y = treewidth;
				}
				depthpos['taxa'][d.depth] = d.y;

			} else {
				//d.y = treewidth - (d.depth / maxDepth) * treewidth;
				d.y = (navDims.treewidth) - d.y;
				depthpos['func'][d.depth] = d.y;
			}
		}); 
		
		// update BP bar height
		//bpBarHeight[0] = bpvisdata.mainBars[0][
		bpBarHeight[0] = Math.min( d3.select("#part0").select(".mainrect").attr("height"), 100);
		bpBarHeight[1] = Math.min( d3.select("#part1").select(".mainrect").attr("height"), 100);
		//\¯\¯\Update hierarchical level labels¯\¯\¯\¯\¯\¯\¯\

		// figure out which depth levels exist
		curlevelNames[source.type] = [];
		for (idxz = 0; idxz < (maxDepth - 1); idxz++) {
			curlevelNames[source.type].push({name: levelNames[source.type][idxz], depth: idxz});
		}
		
		// Update the tree depth labels
		var depthlabels = trees.SVGs[source.type].selectAll("g.depthlabel")
			.data(curlevelNames[source.type])
			
		var newdepthlabels = depthlabels.enter().append("g")
			.attr("class","depthlabel")
			.attr("transform", function(d) {
				return "translate(" + depthpos[source.type][d.depth+1] + "," + -15 + ") rotate(" + (source.type == 'taxa' ? -35 : 35) + ")" ;
			});
			
		newdepthlabels.append("text")
			.text(function (d) {
				return d.name;
				})
			.style("font-weight","bold")
			.attr("text-anchor","middle")
			.attr("visibility", "hidden");
			
		var upddepthlabels = depthlabels.transition()
			.duration(duration)
			.style("font-weight","bold")
			.attr("transform", function(d) {
				return "translate(" + depthpos[source.type][d.depth+1] + "," + -15 + ") rotate(" + (source.type == 'taxa' ? -35 : 35) + ")";
			});
			
		upddepthlabels.select("text")
			.attr("visibility", "visible");
		
		var labelexit = depthlabels.exit().transition()
			.duration(duration)
			.remove();
			
		labelexit.select("text")
			.attr("visibility","hidden");
		
		//\_/_/_/_/End level label update_/_/_/_/_/_/_/_/_/_/_/_/_/_/
			
		
		// Update the nodes
		var node = trees.SVGs[source.type].selectAll("g.node")
			.data(nodes, function (d) {
			return d.id || (d.id = ++nodeIndex);
		});

		// Enter any new nodes at the parent's previous position.
		var nodeEnter = node.enter().append("g")
			.attr("class", "node")
			.attr("transform", function (d) {
				return "translate(" + source.y0 + "," + source.x0 + ")";
			})
			.on("click", trees.click)
			.on("mouseover", function (d) {
				clickedBars = d3.select("#Genomes").selectAll(".mainbars").select(".clicked")
  				if(clickedBars.empty()){
				if (~d.values) {
					if (d.type == 'taxa') {
						highlightOverall(d.key, "", 1);
					} else {
						highlightOverall("", d.key, 2);
					}
				} else {
					highlightTree(d, this);
				}
				}												
			})
			.on("mouseout", function(d) {
			  	clickedBars = d3.select("#Genomes").selectAll(".mainbars").select(".clicked")
  				if(clickedBars.empty()){
				if (~d.values) {
					if (d.type == 'taxa') {
						dehighlightOverall(d.key, "", 1);
					} else {
						dehighlightOverall("", d.key, 2);
					}
				} else {
					dehighlightTree(d, this);
				}
				}
				});

		nodeEnter.filter( function(d) { return (~d.values) }).append("rect")
			.attr("x", function (d) {
				var dattype = d.type == "taxa" ? 0 : 1;
				return -1*(bpBarHeight[dattype]/2); 
				})
			.attr("width", function(d) {
				var dattype = d.type == "taxa" ? 0 : 1;
				return bpBarHeight[dattype];	
				})
			.attr("height", function(d) {
				var dattype = d.type == "taxa" ? 0 : 1;
				return bpBarHeight[dattype];
				})
			.attr("y", function (d) {
				var dattype = d.type == "taxa" ? 0 : 1;
				return -1*(bpBarHeight[dattype]/2);
				})	
			.attr("style","opacity:0")
			;
		
		nodeEnter.append("circle")
			.attr("r", 1e-6)
			.style("fill", function (d) { 
				if(source.type==="taxa"){
					return taxa_colors(d.key); } else {
					return func_colors(d.key);
				 } });

	/*								return d._values ? "lightsteelblue" : "#fff";
		});
	*/							
		node.filter( function (d) {
			return (~d.values) })
				.filter( function(d) { return d3.select(this).select("rect").empty(); })
				.append("rect");

		/*
		nodeEnter.append("text")
			.attr("x", function (d) {
			return source.type == 'taxa' ? 10 : -10;
		})
			.attr("dy", ".35em")
			.attr("text-anchor", function (d) {
			return source.type == 'taxa' ? "start" : "end";
		})
			.text(function (d) {
			   if(d.key != null)
				   return d.key;
		})
			.style("fill-opacity", 1e-6);
		*/
		
		// Transition nodes to their new position.
		var nodeUpdate = node.transition()
			.duration(duration)
			.attr("transform", function (d) {
			return "translate(" + d.y + "," + d.x + ")";
		}); 
		
				
		nodeUpdate.selectAll("rect")
			.attr("x", function (d) {
				var dattype = d.type == "taxa" ? 0 : 1;
				return -1*(bpBarHeight[dattype]/2); 
				})
			.attr("width", function(d) {
				var dattype = d.type == "taxa" ? 0 : 1;
				return bpBarHeight[dattype];	
				})
			.attr("height", function(d) {
				var dattype = d.type == "taxa" ? 0 : 1;
				return bpBarHeight[dattype];
				})
			.attr("y", function (d) {
				var dattype = d.type == "taxa" ? 0 : 1;
				return -1*(bpBarHeight[dattype]/2);
				})
			.attr("style","opacity:0")
			;
		
		
		nodeUpdate.select("circle")
			.attr("r", function (d) {
				var dattype = d.type == "taxa" ? 0 : 1;
				if(d.sampleAvg && d._values){
					return (bpBarHeight[dattype]/2) * Math.sqrt(d.sampleAvg)
					//return (4 * Math.sqrt(d.Ndescendents))
				}else{
					return 5;
				}
			})
			.style("fill", function (d) { 
				if(source.type==="taxa"){
					return taxa_colors(d.key); } else {
					return func_colors(d.key);
				 } });

	/*								.style("fill", function (d) {
				if (d.values) {
				return "#fff";
				} else {  // has d._values
					if (d._values[0].hasOwnProperty("key")) {
						return "lightsteelblue";
					} else {
						return "#000"
					}
				}
			});
	*/
		/*
		nodeUpdate.select("text")
			.style("fill-opacity", function(d) {
				return d.values ? 0 : 1;
			})
			.text(function (d) {
				if( d.values) {
					return "";
				} else {
					if(d.key != null)
				   return d.key;
				}
			}); */
			
			

		// Transition exiting nodes to the parent's new position.
		var nodeExit = node.exit().transition()
			.duration(duration)
			.attr("transform", function (d) {
			return "translate(" + source.y + "," + source.x + ")";
		})
			.remove();

		nodeExit.select("circle")
			.attr("r", 1e-6);

	/*	nodeExit.select("text")
			.style("fill-opacity", 1e-6); */

		
		// Update the links…
		var link = trees.SVGs[source.type].selectAll("path.link")
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
			d.x0 = d.x;
			d.y0 = d.y;
		});
		
		//\¯\¯\Update hierarchical level labels¯\¯\¯\¯\¯\¯\¯\

		// figure out which depth levels exist
		curlevelNames[source.type] = [];
		for (idxz = 0; idxz < (maxDepth - 1); idxz++) {
			curlevelNames[source.type].push({name: levelNames[source.type][idxz], depth: idxz});
		}
		
		// Update the tree depth labels
		var depthlabels = trees.SVGs[source.type].selectAll("g.depthlabel")
			.data(curlevelNames[source.type])
			
		var newdepthlabels = depthlabels.enter().append("g")
			.attr("class","depthlabel")
			.attr("transform", function(d) {
				return "translate(" + depthpos[source.type][d.depth+1] + "," + 0 + ") rotate(" + (source.type == 'taxa' ? -15 : 15) + ")" ;
			});
			
		newdepthlabels.append("text")
			.text(function (d) {
				return d.name;
				})
			.style("font-weight","bold")
			.attr("text-anchor","middle")
			.attr("visibility", "hidden");
			
		var upddepthlabels = depthlabels.transition()
			.duration(duration)
			.style("font-weight","bold")
			.attr("transform", function(d) {
				return "translate(" + depthpos[source.type][d.depth+1] + "," + 0 + ") rotate(" + (source.type == 'taxa' ? -15 : 15) + ")";
			});
			
		upddepthlabels.select("text")
			.attr("visibility", "visible");
		
		var labelexit = depthlabels.exit().transition()
			.duration(duration)
			.remove();
			
		labelexit.select("text")
			.attr("visibility","hidden");
			
		//\_/_/_/_/End level label update_/_/_/_/_/_/_/_/_/_/_/_/_/_/
	}
	


	// Toggle children on click.
	trees.click = function(d) {
			if (d.values) { //collapse
				if (d.depth > 0) {//don't collapse the root
					trees.collapseTree(d);
					d.type == 'taxa' ? data_cube.collapse_taxon(d.key) : data_cube.collapse_func(d.key);
				}
			} else { //expand
				if (d._values[0].hasOwnProperty('key')) {
					d.values = d._values;
					d._values = null;
					d.type == 'taxa' ? data_cube.expand_taxon(d.key) : data_cube.expand_func(d.key);
				} else {
				}			
			}
		updateOtherThings();
		trees.update(d);
	}

	// collapse all children of the collapsing node recursively
	trees.collapseTree = function(d) {
		if (d.values) {
			d._values = d.values;
			d.values = null;
			d._values.forEach(trees.collapseTree);
		}
	}

	// get the total depth of the tree to the deepest leaf
	trees.getDepth = function(rootnode) {
		var depth = 0;
		if (rootnode.values) {
			rootnode.values.forEach(function(d) {
				var tmpDepth = trees.getDepth(d);
				if (tmpDepth > depth) {
					depth = tmpDepth;
				}
			})
		}
		return 1+depth;
	}


	trees.highlightTree = function( name, type) {
		var treedatainterest = trees.treestructure[type].nodes(roots[type]).filter( function(d) {
			return d.key == name;
		} );
		var treedatainterestobj = trees.SVGs[type].selectAll("g.node").filter( function(d) {
			return d.key == name;
		})
		var data = treedatainterest[0];
		var thisobj = treedatainterestobj[0];
		var thisnode = data;
		var thisNparents = [];
		thisNparents.push(thisnode);
		while (thisnode.parent) {
			thisnode = thisnode.parent;
			thisNparents.push(thisnode);
		}
		var node = trees.SVGs[data.type].selectAll("g.node");
		data.thisandparents = node.filter(function (d2) { 
			var good = false;
			thisNparents.forEach( function (d4) {
				if (d2.id == d4.id) {
					good = true;} 
					});
			return good;
		})
		
		data.thisandparents.select("circle")
			.style("stroke-width", "5")
			.style("stroke", "black");
			
		data.thisandparents.insert("text", "rect")
				.text(function (d5) {
				if (d5.values) {
					name_split = (d5.key.split('_')).pop()
					return name_split;
					//return d5.key 
				} else {
					""
				}
				})
				.attr("text-anchor", "middle")
				.attr("dy", function (d5, isz) {
					return "-" + (1* d3.select(thisobj.parentNode).select("circle").attr("r") +  6) +  "";
				})
				.attr("transform", "rotate(" + (data.type == 'taxa' ? -30 : 30) + ")");
				
	}

	trees.dehighlightTree = function(name, type) {
		var treedatainterest = trees.treestructure[type].nodes(roots[type]).filter( function(d) {
			return d.key == name;
		} );
		var data = treedatainterest[0];
		data.thisandparents.select("circle")
			.style("stroke-width", "1")
			.style("stroke", "grey");

		data.thisandparents.selectAll("text").remove(); 
	}
	
	function getAvgs(rootnode){
		if(rootnode.type=="func"){
			if(rootnode.key != "All Functions"){
				func_leaves = data_cube.get_leaves(rootnode.key, data_cube.func_lookup)
				rootnode.sampleAvg = data_cube.funcMeans[rootnode.key]
// 				for(j = 0; j < func_leaves.length; j++){
// 					funcAvg += data_cube.funcMeans[func_leaves[j]]
// 				}
//				rootnode.sampleAvg = funcAvg
			} else {
				rootnode.values.forEach(function(d){
					getAvgs(d)
				})
				rootnode.sampleAvg = 0.1
			}
		} else {
			//taxa Avgs
			if(rootnode.key != "All Taxa"){
				var taxa_leaves = data_cube.get_leaves(rootnode.key, data_cube.taxa_lookup)
				var taxaAvg = 0
				for(j = 0; j < taxa_leaves.length; j++){
					taxaAvg += taxa_means[taxa_leaves[j]]
				}
				rootnode.sampleAvg = taxaAvg
			} else {
				rootnode.values.forEach(function(d){
					getAvgs(d)
				})
				rootnode.sampleAvg = 0.1
			}
		}
		if(rootnode._values){
			rootnode._values.forEach(function(d){
				if(d._values){ getAvgs(d)}
				
			})
		}
	}
	
	function countchildren(rootnode) {
		var totchildren = 0;
		var addone = 1;
		if (rootnode.values) {
			rootnode.values.forEach( function(d) {
				totchildren = totchildren + countchildren(d);
			})
			addone = 0;
		} 
		if (rootnode._values) {
			rootnode._values.forEach( function(d) {
				totchildren = totchildren + countchildren(d);
			})
			addone = 0;
		}
		rootnode.Ndescendents = totchildren;
		return (totchildren + addone);
	}

	function get_taxa_sample_means(otu_abundance_data, data_cube){
		var otus = d3.keys(otu_abundance_data[0]).filter(function(d){ return d != "Sample"})
		for(j = 0; j < otus.length; j++){
			taxa_means[otus[j]] = 0
			for(k = 0; k < otu_abundance_data.length; k++){
				taxa_means[otus[j]] += otu_abundance_data[k][otus[j]]*1
			}
			taxa_means[otus[j]] = taxa_means[otus[j]]/(otu_abundance_data.length)
		}
	}	
	// Accessor and settor functions
	
	trees.getTaxaTreeData = function() {
		return trees.taxa_tree_data;
	}
	
	trees.getFuncTreeData = function() {
		return trees.func_tree_data;
	}
	
	trees.updateBPvisdata = function(bpvd) {
		bpvisdata = bpvd;
	}

	this.trees = trees;
})();



