(function() {
	var trees={};
	var trees.trees;
	var trees.SVGs = {};
	var trees.taxa_tree_data, trees.func_tree_data;
	var trees.roots
	
	trees.SetUp = function(navDims) {
		var TaxaTree = d3.layout.tree()
			.children(function (d) { return d.values; })
			.size([(navDims.height), navDims.treewidth]);

		var FuncTree = d3.layout.tree()
			.children(function (d) { return d.values;})
			.size([(navDims.height), navDims.treewidth]);

		trees.trees["taxa"] = trees.TaxaTree;
		trees.trees["func"] = trees.FuncTree;
		
	}
	
	trees.SetUp2 = function(navname, margins, navDims) {
		trees.trees["taxa"].size([(navDims.height), navDims.treewidth]);
		trees.trees["func"].size([(navDims.height), navDims.treewidth]);
		
		var TaxaTreeG = d3.select("#" + navname).append("g")
			.attr("transform", "translate(" + 5 + "," + margins.top + ")");

		var FuncTreeG = d3.select("#" + navname).append("g")
			.attr("transform", "translate(" + (navDims.width - navDims.treewidth - 5) +  "," + margins.top + ")");

		trees.SVGs["taxa"] = TaxaTreeG;
		trees.SVGs["func"] = FuncTreeG;
	}
	
	trees.SetUp3 = function(tax_hierarchy_t, func_hierarchy_t, height) {
		/*var levelNames = {};
		var curlevelNames = {};
		levelNames['taxa'] = ["Kingdom", "Phylum", "Class", "Order", "Family", "Genus", "Species", "OTU"];
		levelNames['func'] = ["Category", "SuperPathway", "SubPathway"];
		curlevelNames['taxa'] = levelNames['taxa'];
		curlevelNames['func'] = levelNames['func'];
		
		*/
		
		trees.taxa_tree_data = tax_hierarchy_text;
		trees.func_tree_data = func_hierarchy_text;
		
		/*
		var taxLevels = d3.keys(trees.taxa_tree_data[0]);
		*/
		
		var taxa_data = jQuery.extend(true, [], taxa_tree_data);
		
		var curr_taxa = [];
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
		}

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
		update(roots["taxa"]);
		
		var function_data = jQuery.extend(true, [], func_tree_data);

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
		update(roots['func']);

		click(roots['taxa'].values[0])
	}
	
	
	
	
	
	// Update the tree graphs
	// Expands or collapses the source node, depending on whether it is currently open or closed
	trees.update = function(source) {
		// Compute the new tree layout.
		var nodes = trees.trees[source.type].nodes(roots[source.type]).reverse(),
		var	links = trees.trees[source.type].links(nodes);
			

		var nleaf = 0;
		nodes.forEach(function (d) {
			nleaf = nleaf + (d.values ? 0 : 1);
		})
		/*
		
		var leafC = 1;
		*/
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
		var maxDepth = getDepth(roots[source.type]);
		
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

		// figure out which depth levels exist
		curlevelNames[source.type] = [];
		for (idxz = 0; idxz < (maxDepth - 1); idxz++) {
			curlevelNames[source.type].push({name: levelNames[source.type][idxz], depth: idxz});
		}
		
		// Update the tree depth labels
		var depthlabels = SVGs[source.type].selectAll("g.depthlabel")
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
			.on("click", trees.click)
			.on("mouseover", function (d) {
				if (~d.values) {
					if (d.type == 'taxa') {
						highlightOverall(d.key, "", 1);
					} else {
						highlightOverall("", d.key, 2);
					}
				} else {
					highlightTree(d, this);
				}
												

			})
			.on("mouseout", function(d) {
				if (~d.values) {
					if (d.type == 'taxa') {
						dehighlightOverall(d.key, "", 1);
					} else {
						dehighlightOverall("", d.key, 2);
					}
				} else {
					dehighlightTree(d, this);
				}
				});

		nodeEnter.filter( function(d) { return (~d.values) }).append("rect")
			.attr("x", function (d) {
				if (source.type == 'taxa') {
					return 0; 
				} else {
					return (-170 - d.y);
				}})
			.attr("width", function(d) {
				if (source.type == 'taxa') {
					return "" + (navDims.treewidth + margin.left - d.y) + ""
				} else {
					return 170+d.y;
				}})
			.attr("height", function(d) {
				return (height / 2 / nleaf / 1.5);
				})
			.attr("y", function (d) {
				return (-1 * height / 2 / nleaf / 3); })
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

		nodeUpdate.filter( function (d) {return (d.values) } ).selectAll("rect").remove();
		
		
				
		nodeUpdate.selectAll("rect")
			.attr("x", function (d) {
				if (source.type == 'taxa') {
					return 0; 
				} else {
					return (-170 - d.y);
				}})
			.attr("width", function(d) {
				if (source.type == 'taxa') {
					return "" + (navDims.treewidth + margin.left - d.y) + ""
				} else {
					return 170+d.y;
				}})
			.attr("height", function(d) {
				return (height / 2 / nleaf / 1.5);
				})
			.attr("y", function (d) {
				return (-1 * height / nleaf / 3); })
			.attr("style","opacity:0")
			;
		
		
		nodeUpdate.select("circle")
			.attr("r", function (d) {
				if(d.sampleAvg && d._values){
					return 25 * Math.sqrt(d.sampleAvg)
					//return (4 * Math.sqrt(d.Ndescendents))
				}else{
					return 4;
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
			d.x0 = d.x;
			d.y0 = d.y;
		});
		
	/////////////////////// Do depth labels /////////////////////////////
		// figure out which depth levels exist
		curlevelNames[source.type] = [];
		for (idxz = 0; idxz < (maxDepth - 1); idxz++) {
			curlevelNames[source.type].push({name: levelNames[source.type][idxz], depth: idxz});
		}
		
		// Update the tree depth labels
		var depthlabels = SVGs[source.type].selectAll("g.depthlabel")
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
	}
	


	// Toggle children on click.
	trees.click = function(d) {
			if (d.values) { //collapse
				if (d.depth > 0) {//don't collapse the root
					trees.collapseTree(d);
					d.type == 'taxa' ? data_cube.collapse_taxon(d.key) : data_cube.collapse_func(d.key);
					bpvisdata = updateBPgraph();
				}
			} else { //expand
				if (d._values[0].hasOwnProperty('key')) {
					d.values = d._values;
					d._values = null;
					d.type == 'taxa' ? data_cube.expand_taxon(d.key) : data_cube.expand_func(d.key);
					bpvisdata = updateBPgraph();
				} else {
				}
				
		   }
		update(d);
		update_otu_bar();
		update_func_bar();
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
		var treedatainterest = trees.trees[type].nodes(trees.roots[type]).filter( function(d) {
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
			
		data.thisandparents.append("text")
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
		var treedatainterest = trees.trees[type].nodes(trees.roots[type]).filter( function(d) {
			return d.key == name;
		} );
		var data = treedatainterest[0];
		data.thisandparents.select("circle")
			.style("stroke-width", "1")
			.style("stroke", "grey");

		data.thisandparents.selectAll("text").remove(); 
	}
	
	trees.getAvgs = function(rootnode){
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
					trees.getAvgs(d)
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
					trees.getAvgs(d)
				})
				rootnode.sampleAvg = 0.1
			}
		}
		if(rootnode._values){
			rootnode._values.forEach(function(d){
				if(d._values){ trees.getAvgs(d)}
				
			})
		}
	}
	
	trees.countchildren = function(rootnode) {
			var totchildren = 0;
			var addone = 1;
			if (rootnode.values) {
				rootnode.values.forEach( function(d) {
					totchildren = totchildren + trees.countchildren(d);
				})
				addone = 0;
			} 
			if (rootnode._values) {
				rootnode._values.forEach( function(d) {
					totchildren = totchildren + trees.countchildren(d);
				})
				addone = 0;
			}
			rootnode.Ndescendents = totchildren;
			return (totchildren + addone);
		}
	
	// Accessor functions
	
	trees.getTaxaTreeData = function() {
		return trees.taxa_tree_data;
	}
	
	trees.getFuncTreeData = function() {
		return trees.func_tree_data;
	}
	
	this.trees = trees;
})();



