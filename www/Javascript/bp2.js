(function(){
	var bP={};	
	var b=20, bb=150, height=0, buffMargin=1, minHeight=14;
	var c1=[-15, 35], c2=[-50, 100], c3=[-10, 60]; //Column positions of labels.
	var colors = d3.scale.category20().range();
	
	bP.partData = function(data, displayed_taxa, displayed_funcs){
		var sData={};
		var cat1 = d3.keys(data[0])[0], cat2 = d3.keys(data[0])[1], num3 = d3.keys(data[0])[2];
		//console.log(displayed_taxa.toSource());
		//console.log(displayed_funcs.toSource());
		sData.keys=[displayed_taxa, displayed_funcs];
		// sData.keys=[
		// 	// d3.set(d3.keys(data)).values().sort(function(a,b){ return ( a<b? -1 : a>b ? 1 : 0);}),
		// 	// d3.set(d3.keys(data).map(function(d){ return data[d].values})).values().sort(function(a,b){ return ( a<b? -1 : a>b ? 1 : 0);})
		// 	d3.set(data.map(function(d){ return d[cat1];})).values(),//.sort(function(a,b){ return ( a<b? -1 : a>b ? 1 : 0);}),
		// 	d3.set(data.map(function(d){ return d[cat2];})).values() //.sort(function(a,b){ return ( a<b? -1 : a>b ? 1 : 0);})		
		// ];
		// need to get to match in tree order so may want another way to get unique values
		
		sData.data = [	sData.keys[0].map( function(d){ return sData.keys[1].map( function(v){ return 0; }); }),
						sData.keys[1].map( function(d){ return sData.keys[0].map( function(v){ return 0; }); }) 
		];

		data.forEach(function(d){ 
			sData.data[0][sData.keys[0].indexOf(d[cat1])][sData.keys[1].indexOf(d[cat2])]=1*d[num3];
			sData.data[1][sData.keys[1].indexOf(d[cat2])][sData.keys[0].indexOf(d[cat1])]=1*d[num3]; 
		});
				
		return sData;
	}
	
	function visualize(data){
		var vis ={};
		function calculatePosition(a, s, e, b, m){
			// console.log("a"+a);
			// console.log("s"+s);
			// console.log("e"+e);
			// console.log("b"+b);
			// console.log("m"+m);

			var total=a.length;

			var sum=0, neededHeight=0, leftoverHeight= e-s-2*b*a.length;
			var ret =[];
			
			a.forEach(
				function(d){ 
					var v={};
					v.percent = d; //(total == 0 ? 0 : d/total); //d is 1 or 0 only
					v.value=d;
					v.height=1; //Math.max(v.percent*(e-s-2*b*a.length), m); 
					(v.height==m ? leftoverHeight-=m : neededHeight+=v.height );
					ret.push(v);
				}
			);
			
			var scaleFact=leftoverHeight/Math.max(neededHeight,1), sum=0;
			ret.forEach(
				function(d, i){ 
					d.key = i;
					d.percent = scaleFact*d.percent; 
					d.height= scaleFact; //*d.value; //(d.height==m? m : d.height*scaleFact);
					d.middle=sum+b+d.height/2;
					d.y=s + d.middle; //- d.percent*(e-s-2*b*a.length)/2;
					d.h= 2; //scaleFact; //d.value; //d.percent*(e-s-2*b*a.length);
					d.percent = (total == 0 ? 0 : d.value/total);
					sum+=2*b+d.height;
					d.wid=d.value;
					//console.log(d.wid);
				}
			);
			return ret;
		}

		//making the main 2 bars
		vis.mainBars = [ 
			calculatePosition( data.data[0].map(function(d){ return d.length;}), 0, height, buffMargin, minHeight), //d3.sum(d) 
			calculatePosition( data.data[1].map(function(d){ return d.length;}), 0, height, buffMargin, minHeight)
		];
		
		//making the bars for each node
		vis.subBars = [[],[]];
		vis.mainBars.forEach(function(pos,p){
			pos.forEach(function(bar, i){	
				if(bar.value !== 0){
					calculatePosition(data.data[p][i], bar.y, bar.y, 0, 0).forEach(function(sBar,j){ //+bar.h
						sBar.key1=(p==0 ? i : j); 
						sBar.key2=(p==0 ? j : i); 
						vis.subBars[p].push(sBar); 
					});
				}
			});
		});
		vis.subBars.forEach(function(sBar){
			sBar.sort(function(a,b){ 
				return (a.key1 < b.key1 ? -1 : a.key1 > b.key1 ? 
						1 : a.key2 < b.key2 ? -1 : a.key2 > b.key2 ? 1: 0 )});
		});

		//console.log(vis.subBars[0].toSource());
		
		vis.edges = vis.subBars[0].map(function(p,i){
			return {
				key1: p.key1,
				key2: p.key2,
				y1:p.y,
				y2:vis.subBars[1][i].y,
				h1:p.h,
				h2:vis.subBars[1][i].h,
				val:p.value,
				wid:p.wid
			};
		});
		//console.log(vis.edges.length);
		//console.log(vis.edges[0].val);
		vis.edges = vis.edges.filter(function(d){ return d.val!==0});
		//console.log(vis.edges[0].toSource());
		//console.log(vis.edges.length);
		vis.keys=data.keys;
		return vis;
	}
	
	function arcTween(a) {
		var i = d3.interpolate(this._current, a);
		this._current = i(0);
		return function(t) {
			return bP.edgePolygon(i(t));
		};
	}
	
	function drawPart(data, id, p, colors){
		d3.select("#"+id).append("g").attr("class","part"+p).transition().duration(300)
			.attr("transform","translate("+ (p==0 ? (-1*(bb+b)) : (bb)) +",0)");

		//d3.select("#"+id).select(".part"+p).append("g").attr("class","subbars");
		d3.select("#"+id).select(".part"+p).append("g").attr("class","mainbars");
		
		var mainbar = d3.select("#"+id).select(".part"+p).select(".mainbars")
			.selectAll(".mainbar").data(data.mainBars[p])
			.enter().append("g").attr("class","mainbar");

		var padding = 0;
		var nbar = data.mainBars[p].length;

		if ( nbar < 5) { padding = 20;
		}else if (nbar < 11) {padding = 10;
		}else if (nbar < 25) {padding = 5;
		}else { nbar = 4;}
		
		mainbar.append("rect").attr("class","mainrect")
			.attr("x", 0)
			.attr("y",function(d){ return (d.middle-d.height/2 + (padding/2)); })
			.attr("width",b)
			.attr("height",function(d){ return (d.height - padding); })
			.style("shape-rendering","auto")
			.style("fill", function(d) {return colors(data.keys[p][d["key"]])} )
			.style("fill-opacity",.75).style("stroke-width","0.5")
			.style("stroke","black").style("stroke-opacity",0)
			.transition().duration(300);

		mainbar.append("text").attr("class","barlabel")
			.attr("x", c1[p])
			.attr("y",function(d){ return d.middle+5;})
			.text(function(d,i){ return data.keys[p][i];})
			.attr("text-anchor", p == 0 ? "end" : "start" )
			.transition().duration(300);

		if(data.keys[p].length==1){
			fontSize=24;	
		}  else{
			fontSize = 24/Math.log(data.keys[p].length) + 2;
		}
		mainbar.selectAll(".barlabel").style("font-size", fontSize+"px");
		/*
		d3.select("#"+id).select(".part"+p).select(".subbars")
			.selectAll(".subbar").data(data.subBars[p]).enter()
			.append("rect").attr("class","subbar")
			.attr("x", 0)
			.attr("y",function(d){ return d.y})
			.attr("width",b)
			.attr("height",function(d){ return d.h})
			.style("fill",function(d){ 
				return colors(data.keys[p][d["key"+(p+1)]]);})
			.style("opacity",0.1)
			.transition().duration(300);
		*/
	}

	// function updatePart(data, id, p){
	// 	d3.select("#"+id).select(".part"+p).select(".mainbars").selectAll(".mainbar")
	// 		.data(data.mainBars[p]).transition();

	// 	d3.select("#"+id).select(".part"+p).select(".subbars").selectAll(".subbar")
	// 		.data(data.subBars[p]).transition();

	// }
	
	function drawEdges(data, id, taxa_colors, func_colors, displayed_taxa, displayed_funcs, highlightall, dehighlightall){
		d3.select("#"+id).append("g").attr("class","edges").transition().duration(300).attr("transform","translate(0,0)");

		edgeBar = d3.select("#"+id).select(".edges").selectAll(".edge")
			.data(data.edges).enter().append("polygon")
			.attr("class","edge")
			.attr("points", bP.edgePolygon);

		edgeBar.style("fill", "grey") //function(d){ return taxa_colors(data.keys[0][d.key1]) ;})
			.style("opacity",0.2).each(function(d) { this._current = d; })
			.on("mouseover", function(d,i){ 
				d3.select(this).attr("points", bP.edgePolygon2).style("opacity",1);
				var current_data = this._current;
				bP.selectEdge(id, i, current_data, taxa_colors, func_colors, displayed_taxa, displayed_funcs, highlightall);
			})
			.on("mouseout", function(d,i){ 
				d3.select(this).attr("points", bP.edgePolygon).style("opacity",0.2).style("fill", "grey");
				var current_data = this._current;
				bP.deselectEdge(id, i, current_data, displayed_taxa, displayed_funcs, dehighlightall, taxa_colors, func_colors);
			})
			.transition().duration(300);
			//brush would go here
	}	
	

	function drawHeader(header, id){
		//d3.select("#"+id).append("g").attr("class","header").append("text").text(header[2])
		//	.style("font-size","20").attr("x",108).attr("y",-20).style("text-anchor","middle")
		//	.style("font-weight","bold");
		
		[0,1].forEach(function(d){
			var h = d3.select("#"+id).select(".part"+d).append("g").attr("class","header");
			
			h.append("text").text(header[d]).attr("x", (c1[d]-3))
				.attr("y", -5).style("fill","black").style("font-size", "14pt");
			//h.append("text").text("Count").attr("x", (c2[d]-10))
			//	.attr("y", -5).style("fill","grey");
			// h.append("line").attr("x1",c1[d]-10).attr("y1", -2)
			// 	.attr("x2",c3[d]+10).attr("y2", -2).style("stroke","black")
			// 	.style("stroke-width","1").style("shape-rendering","crispEdges");
		});
	}
	
	bP.edgePolygon = function(d){
		return [-bb, d.y1, bb, d.y2, bb, d.y2+d.h2, -bb, d.y1+d.h1].join(" ");
	}	

	bP.edgePolygon2 = function(d){
		if(d.wid===1){ //don't change
			return [-bb, d.y1, bb, d.y2, bb, d.y2+d.h2, -bb, d.y1+d.h1].join(" ");
		} else{
			return [-bb, d.y1-Math.sqrt(d.wid)/2, bb, d.y2-Math.sqrt(d.wid)/2, bb, d.y2+Math.sqrt(d.wid)/2, -bb, d.y1+Math.sqrt(d.wid)].join(" ");
		}
		//
	}	
	
	bP.draw = function(bip, svg, dims, taxa_colors, func_colors, displayed_taxa, displayed_funcs, highlightall, dehighlightall){
		
		bb = dims.width * .075;
		b = dims.width / 50;
		c1 = [-(5 + 0.005*dims.width), b + (5 + 0.005*dims.width)];
		
		svg.append("g")
			.attr("id", bip.id);

		// var brush = svg.append("g")
  //     		.datum(function() { return {selected: false, previouslySelected: false}; })
  //     		.attr("class", "brush")
  //     		.call(d3.svg.brush()
	 //       		.x(d3.scale.identity().domain([0, width]))
  //   	    	.y(d3.scale.identity().domain([0, height]))
		// 		.on("brush", function(){
		// 			var extent = brush.extent();
  // 					edges.classed("selected", function(d) {
  // 						selectEdge(id, i, current_data);
  // 						console.log(d.toSource());
  //   					is_brushed = extent[0] <= d.index && d.index <= extent[1];
  //   					return is_brushed;
  // 					});
		// 		})
		// 		.on("brushend", function(){

		// 		}));

		// svg.append("g")
		// 	.attr("class", "brush")
		// 	.call(brush)
		// 	.selectAll('rect')
		// 	.attr('height', height);

		height = dims.height - dims.header;
				//.attr("transform","translate("+ (550*s)+",0)");
		//console.log(bip.data.data.toSource());		
		var visData = visualize(bip.data);
		drawPart(visData, bip.id, 0, taxa_colors);
		drawPart(visData, bip.id, 1, func_colors); 
		drawEdges(visData, bip.id, taxa_colors, func_colors, displayed_taxa, displayed_funcs, highlightall, dehighlightall);
//		drawHeader(bip.header, bip.id);
			
		[0,1].forEach(function(p){			
			d3.select("#"+bip.id)
				.select(".part"+p)
				.select(".mainbars")
				.selectAll(".mainbar")
				.on("mouseover",function(d, i){ 
					if (p == 0) {
						return highlightall(displayed_taxa[i],"",1);
					} else {
						return highlightall("", displayed_funcs[i],2);
				} })						
				.on("mouseout",function(d, i){ 
					if (p == 0) {
						return dehighlightall(displayed_taxa[i],"",1);
					} else {
						return dehighlightall("", displayed_funcs[i],2);
				}
				});	
		});

	}
	

	bP.updateGraph = function(bip, svg, dims, taxa_colors, func_colors, displayed_taxa, displayed_funcs, highlightall, dehighlightall){ //bip id has to be the same

		//svg.select("#"+bip.id).transition();
		svg.select("#"+bip.id).remove(); //.transition();
		svg.append("g")
			.attr("id", bip.id);
			
// var svg = d3.select('#barChart')
//        .append('svg')
//        .attr('width', width + margins.left + margins.right)
//        .attr('height', height + margins.top + margins.bottom)
//        .append('g')
//        .attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');

// 		d3.select(#+bip.id).select("svg").remove();
// 		svg.select(#+bip.id).transition();
// 		//or .remove()?

		var visData = visualize(bip.data);
		//updatePart(visData, bip.id, 0);
		//updatePart(visData, bip.id, 1);
		drawPart(visData, bip.id, 0, taxa_colors);
		drawPart(visData, bip.id, 1, func_colors); 
		drawEdges(visData, bip.id, taxa_colors, func_colors, displayed_taxa, displayed_funcs, highlightall, dehighlightall);
		//drawHeader(bip.header, bip.id);
			
		[0,1].forEach(function(p){			
			d3.select("#"+bip.id)
				.select(".part"+p)
				.select(".mainbars")
				.selectAll(".mainbar")
				.on("mouseover",function(d, i){ 
					if (p == 0) {
						return highlightall(displayed_taxa[i],"",1);
					} else {
						return highlightall("", displayed_funcs[i],2);
				} })						
				.on("mouseout",function(d, i){ 
					if (p == 0) {
						return dehighlightall(displayed_taxa[i],"",1);
					} else {
						return dehighlightall("", displayed_funcs[i],2);
				}
				});	
		});
		
		return visData;
	} 

	bP.selectSegment = function(m, s, taxa_colors, func_colors, displayed_taxa, displayed_funcs){ //s # of node, m which side of nodes
			// var newdata =  {keys:[], data:[]};	
				
			// newdata.keys = k.data.keys.map( function(d){ return d;});
			
			// newdata.data[m] = k.data.data[m].map( function(d){ return d;});
			
			// newdata.data[1-m] = k.data.data[1-m]
			// 	.map( function(v){ return v.map(function(d, i){ return (s==i ? d : 0);}); });
			
			// transition(visualize(newdata), k.id);
				
			var selectedBar = d3.select("#Genomes").select(".part"+m).select(".mainbars")
				.selectAll(".mainbar").filter(function(d,i){ return (i==s);}); //return sth element of main bar only
			
			//selectedBar.select(".mainrect").style("stroke-opacity",1);			
			selectedBar.select(".barlabel").style('font-weight','bold').style("visibility", "visible");

			if(m==1){
				current_color = func_colors(displayed_funcs[s]) } else {
					current_color = taxa_colors(displayed_taxa[s]);
				}

			var t = textures.lines()
			    .thicker()
			    .background(current_color)
			    .stroke("white");

			selectedBar.call(t);

			selectedBar.select(".mainrect")
				.style('fill-opacity',1)
				.style("fill", t.url());

			var selectedEdges = d3.select("#Genomes").select(".edges").selectAll(".edge")
				.filter(function(d,i){ return (d["key"+(m+1)]==s); });
			//console.log(selectedEdges.toSource());

			if(m==0){
				n = 1;
			} else{
				n = 0;
			} 

			selectedEdges.attr("points", bP.edgePolygon2).style("opacity", 1).style("fill", function(f){ if(n==1){
				return func_colors(displayed_funcs[f["key2"]]);	
			} else{
				return taxa_colors(displayed_taxa[f["key1"]]);
			} });
			//selectedEdges.select("_current").style("stroke-opacity", 1);
			//selectedBar.select(".barvalue").style('font-weight','bold');
			//selectedBar.select(".barpercent").style('font-weight','bold');
	}	
	
	bP.deSelectSegment = function(m, s, taxa_colors, func_colors, displayed_taxa, displayed_funcs){
		//transition(visualize(k.data), k.id);
		var selectedBar = d3.select("#Genomes").select(".part"+m).select(".mainbars")
			.selectAll(".mainbar").filter(function(d,i){ return (i==s);});

		var selSubBar = d3.select("#Genomes").select(".part"+m).select(".subbars").selectAll(".subbar")
			.filter(function(d,i){ return (d["key"+(m+1)]==s); }); //return sth element of main bar only
			selSubBar.style("opacity", 0.1);

		if(m==1){
			current_color = func_colors(displayed_funcs[s]) } else {
				current_color = taxa_colors(displayed_taxa[s]);
			}

		selectedBar.select(".barlabel").style('font-weight','normal'); //.style("visibility", "hidden");
		selectedBar.select(".mainrect")
			.style('fill-opacity',.75)
			.style("fill", current_color);
		

		var selectedEdges = d3.select("#Genomes").select(".edges").selectAll(".edge")
			.filter(function(d,i){ return (d["key"+(m+1)]==s); });
		//console.log(selectedEdges.toSource());

		selectedEdges.attr("points", bP.edgePolygon).style("opacity", 0.2).style("fill", "grey");

		//selectedBar.select(".barvalue").style('font-weight','normal');
		//selectedBar.select(".barpercent").style('font-weight','normal');
	}

	bP.selectEdge = function(id, i, current_data, taxa_colors, func_colors, displayed_taxa, displayed_funcs, highlightall){
		//bold associated names
		[0,1].forEach(function(m){
		var selectedBar = d3.select("#Genomes").select(".part"+m).select(".mainbars")
			.selectAll(".mainbar").filter(function(d,i){ 
				return (i==current_data["key"+(m+1)]);});
			selectedBar.select(".barlabel").style('font-weight','bold').style("visibility", "visible");

			if(m==1){
				current_color = func_colors(displayed_funcs[current_data["key"+(m+1)]]) } else {
				current_color = taxa_colors(displayed_taxa[current_data["key"+(m+1)]]);
			}

			var t = textures.lines()
			    .thicker()
			    .background(current_color)
			    .stroke("white");

			selectedBar.call(t);

			selectedBar.select(".mainrect")
				.style("fill-opacity",1)
				.style("fill", t.url())

			var selSubBar =  d3.select("#"+id).select(".part"+m).select(".subbars")
				.selectAll(".subbar")
				.filter(function(d,i){ 
					return (d["key"+(m+1)]==current_data["key"+(m+1)]); }); 

			selSubBar.style("opacity", 1);

		highlightall(displayed_taxa[current_data["key1"]], displayed_funcs[current_data["key2"]], 3);
		});
	}

	bP.deselectEdge = function(id, i, current_data, displayed_taxa, displayed_funcs, dehighlightall, taxa_colors, func_colors){
		[0,1].forEach(function(m){
		var selectedBar = d3.select("#"+id).select(".part"+m).select(".mainbars")
			.selectAll(".mainbar").filter(function(d,i){ 
				return (i==current_data["key"+(m+1)]);});
		selectedBar.select(".barlabel").style('font-weight','normal')//.style("visibility", "hidden");
		if(m==1){
			current_color = func_colors(displayed_funcs[current_data["key"+(m+1)]]) } else {
			current_color = taxa_colors(displayed_taxa[current_data["key"+(m+1)]]);
		}

		selectedBar.select(".mainrect")
			.style("fill-opacity",.75)
			.style("fill", current_color)


		var selSubBar =  d3.select("#"+id).select(".part"+m).select(".subbars")
			.selectAll(".subbar")
			.filter(function(d,i){ 
				return (d["key"+(m+1)]==current_data["key"+(m+1)]); }); 
		selSubBar.style("opacity", 0.2);
		});		
		dehighlightall(displayed_taxa[current_data["key1"]], displayed_funcs[current_data["key2"]], 3);

	}

		// function transitionPart(data, id, p){
	// 	var mainbar = d3.select("#"+id).select(".part"+p).select(".mainbars")
	// 		.selectAll(".mainbar").data(data.mainBars[p]);
		
	// 	mainbar.select(".mainrect").transition().duration(500)
	// 		.attr("y",function(d){ return d.middle-d.height/2;})
	// 		.attr("height",function(d){ return d.height;});
			
	// 	mainbar.select(".barlabel").transition().duration(500)
	// 		.attr("y",function(d){ return d.middle+5;});
			
	// 	mainbar.select(".barvalue").transition().duration(500)
	// 		.attr("y",function(d){ return d.middle+5;}).text(function(d,i){ return d.value ;});
			
	// 	mainbar.select(".barpercent").transition().duration(500)
	// 		.attr("y",function(d){ return d.middle+5;})
	// 		//.text(function(d,i){ return "( "+Math.round(100*d.percent)+"%)" ;});
			
	// 	d3.select("#"+id).select(".part"+p).select(".subbars")
	// 		.selectAll(".subbar").data(data.subBars[p])
	// 		.transition().duration(500)
	// 		.attr("y",function(d){ return d.y}).attr("height",function(d){ return d.h});
	// }
	
	// function transitionEdges(data, id){
	// 	d3.select("#"+id).append("g").attr("class","edges")
	// 		.attr("transform","translate("+ b+",0)");

	// 	d3.select("#"+id).select(".edges").selectAll(".edge").data(data.edges)
	// 		.transition().duration(500)
	// 		.attrTween("points", arcTween)
	// 		.style("opacity",function(d){ return (d.h1 ==0 || d.h2 == 0 ? 0 : 0.5);});	
	// }
	
	// function transition(data, id){
	// 	transitionPart(data, id, 0);
	// 	transitionPart(data, id, 1);
	// 	transitionEdges(data, id);
	// }
	

	this.bP = bP;
})();