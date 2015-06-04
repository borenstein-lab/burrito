!function(){
	var bP={};	
	var b=20, bb=150, height=500, buffMargin=1, minHeight=14;
	var c1=[-60, 35], c2=[-50, 100], c3=[-10, 60]; //Column positions of labels.
	var colors = d3.scale.category20().range();
	
	bP.partData = function(data){
		var sData={};
		
		var cat1 = Object.keys(data[0])[0], cat2 = Object.keys(data[0])[1], num3 = Object.keys(data[0])[2];
		sData.keys=[
			d3.set(data.map(function(d){ return d[cat1];})).values().sort(function(a,b){ return ( a<b? -1 : a>b ? 1 : 0);}),
			d3.set(data.map(function(d){ return d[cat2];})).values().sort(function(a,b){ return ( a<b? -1 : a>b ? 1 : 0);})		
		];
		// need to get to match in tree order

		//console.log(sData.keys[1].toSource());
		
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
				function(d){ 
					d.percent = scaleFact*d.percent; 
					d.height= scaleFact; //*d.value; //(d.height==m? m : d.height*scaleFact);
					d.middle=sum+b+d.height/2;
					d.y=s + d.middle; //- d.percent*(e-s-2*b*a.length)/2;
					d.h= 1; //scaleFact; //d.value; //d.percent*(e-s-2*b*a.length);
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
			return edgePolygon(i(t));
		};
	}
	
	function drawPart(data, id, p){
		d3.select("#"+id).append("g").attr("class","part"+p)
			.attr("transform","translate("+( p*(bb+b))+",0)");

		d3.select("#"+id).select(".part"+p).append("g").attr("class","subbars");
		d3.select("#"+id).select(".part"+p).append("g").attr("class","mainbars");
		
		var mainbar = d3.select("#"+id).select(".part"+p).select(".mainbars")
			.selectAll(".mainbar").data(data.mainBars[p])
			.enter().append("g").attr("class","mainbar");

		mainbar.append("rect").attr("class","mainrect")
			.attr("x", 0).attr("y",function(d){ return d.middle-d.height/2; })
			.attr("width",b).attr("height",function(d){ return d.height; })
			.style("shape-rendering","auto")
			.style("fill-opacity",0).style("stroke-width","0.5")
			.style("stroke","black").style("stroke-opacity",0);
			
		mainbar.append("text").attr("class","barlabel")
			.attr("x", c1[p])
			.attr("y",function(d){ return d.middle+5;})
			.text(function(d,i){ return data.keys[p][i];})
			.attr("text-anchor","start" )
			.style("visibility", "hidden");
			
//		mainbar.append("text").attr("class","barvalue")
//			.attr("x", c2[p]).attr("y",function(d){ return d.middle+5;});
			//.text(function(d,i){ return d.value ;})
			//.attr("text-anchor","end");
			
//		mainbar.append("text").attr("class","barpercent")
//			.attr("x", c3[p]).attr("y",function(d){ return d.middle+5;});
			//.text(function(d,i){ return "( "+Math.round(100*d.percent)+"%)" ;})
			//.attr("text-anchor","end").style("fill","grey");
			
		d3.select("#"+id).select(".part"+p).select(".subbars")
			.selectAll(".subbar").data(data.subBars[p]).enter()
			.append("rect").attr("class","subbar")
			.attr("x", 0)
			.attr("y",function(d){ return d.y})
			.attr("width",b)
			.attr("height",function(d){ return d.h})
			.style("fill",function(d){ return colors[d.key1];})
			.style("opacity",0.1);
	}
	
	function drawEdges(data, id){
		d3.select("#"+id).append("g").attr("class","edges").attr("transform","translate("+ b+",0)");

		// var bundle = d3.layout.bundle();

		// var line = d3.svg.line.radial()
  //   		.interpolate("bundle")
  //   		.tension(.85);

		d3.select("#"+id).select(".edges").selectAll(".edge")
			.data(data.edges).enter().append("polygon").attr("class","edge")
			.attr("points", edgePolygon)
			.style("fill",function(d){ return colors[d.key1];})
			.style("opacity",0.2).each(function(d) { this._current = d; })
			.on("mouseover", function(d,i){ 
				d3.select(this).attr("points", edgePolygon2).style("opacity",1);
				var current_data = this._current;
				bP.selectEdge(id, i, current_data);
			})
			.on("mouseout", function(d,i){ 
				d3.select(this).attr("points", edgePolygon).style("opacity",0.2);
				var current_data = this._current;
				bP.deselectEdge(id, i, current_data);
			});
	}	
	

	function drawHeader(header, id){
		d3.select("#"+id).append("g").attr("class","header").append("text").text(header[2])
			.style("font-size","20").attr("x",108).attr("y",-20).style("text-anchor","middle")
			.style("font-weight","bold");
		
		[0,1].forEach(function(d){
			var h = d3.select("#"+id).select(".part"+d).append("g").attr("class","header");
			
			h.append("text").text(header[d]).attr("x", (c1[d]-3))
				.attr("y", -5).style("fill","black").style("font-size", "16");
			//h.append("text").text("Count").attr("x", (c2[d]-10))
			//	.attr("y", -5).style("fill","grey");
			// h.append("line").attr("x1",c1[d]-10).attr("y1", -2)
			// 	.attr("x2",c3[d]+10).attr("y2", -2).style("stroke","black")
			// 	.style("stroke-width","1").style("shape-rendering","crispEdges");
		});
	}
	
	function edgePolygon(d){
		return [0, d.y1, bb, d.y2, bb, d.y2+d.h2, 0, d.y1+d.h1].join(" ");
	}	

	function edgePolygon2(d){
		return [0, d.y1-Math.sqrt(d.wid)/2, bb, d.y2-Math.sqrt(d.wid)/2, bb, d.y2+Math.sqrt(d.wid)/2, 0, d.y1+Math.sqrt(d.wid)].join(" ");
	}	
	
	bP.draw = function(bip, svg){
		svg.append("g")
			.attr("id", bip.id);
				//.attr("transform","translate("+ (550*s)+",0)");
		//console.log(bip.data.data.toSource());		
		var visData = visualize(bip.data);
		drawPart(visData, bip.id, 0);
		drawPart(visData, bip.id, 1); 
		drawEdges(visData, bip.id);
		drawHeader(bip.header, bip.id);
			
		[0,1].forEach(function(p){			
			d3.select("#"+bip.id)
				.select(".part"+p)
				.select(".mainbars")
				.selectAll(".mainbar")
				.on("mouseover",function(d, i){ return bP.selectSegment(bip, p, i); })
				.on("mouseout",function(d, i){ return bP.deSelectSegment(bip, p, i); });	
		});
	}
	
	bP.selectSegment = function(k, m, s){ //s # of node, m which side of nodes
			// var newdata =  {keys:[], data:[]};	
				
			// newdata.keys = k.data.keys.map( function(d){ return d;});
			
			// newdata.data[m] = k.data.data[m].map( function(d){ return d;});
			
			// newdata.data[1-m] = k.data.data[1-m]
			// 	.map( function(v){ return v.map(function(d, i){ return (s==i ? d : 0);}); });
			
			// transition(visualize(newdata), k.id);
				
			var selectedBar = d3.select("#"+k.id).select(".part"+m).select(".mainbars")
				.selectAll(".mainbar").filter(function(d,i){ return (i==s);}); //return sth element of main bar only
			
			//selectedBar.select(".mainrect").style("stroke-opacity",1);			
			selectedBar.select(".barlabel").style('font-weight','bold').style("visibility", "visible");
;

			var selSubBar =  d3.select("#"+k.id).select(".part"+m).select(".subbars")
				.selectAll(".subbar")
				.filter(function(d,i){ return (d["key"+(m+1)]==s); }); //return sth element of main bar only
			//console.log(selSubBar.toSource());
			//console.log(selectedBar.toSource());

			selSubBar.style("opacity", 1);

			var selectedEdges = d3.select("#"+k.id).select(".edges").selectAll(".edge")
				.filter(function(d,i){ return (d["key"+(m+1)]==s); });
			//console.log(selectedEdges.toSource());

			selectedEdges.attr("points", edgePolygon2).style("opacity", 1);
			//selectedEdges.select("_current").style("stroke-opacity", 1);
			//selectedBar.select(".barvalue").style('font-weight','bold');
			//selectedBar.select(".barpercent").style('font-weight','bold');
	}	
	
	bP.deSelectSegment = function(k, m, s){
		//transition(visualize(k.data), k.id);
		var selectedBar = d3.select("#"+k.id).select(".part"+m).select(".mainbars")
			.selectAll(".mainbar").filter(function(d,i){ return (i==s);});

			var selSubBar = d3.select("#"+k.id).select(".part"+m).select(".subbars").selectAll(".subbar")
			.filter(function(d,i){ return (d["key"+(m+1)]==s); }); //return sth element of main bar only
			selSubBar.style("opacity", 0.1);

		//selectedBar.select(".mainrect").style("stroke-opacity",0);			
		selectedBar.select(".barlabel").style('font-weight','normal').style("visibility", "hidden");

		var selectedEdges = d3.select("#"+k.id).select(".edges").selectAll(".edge")
			.filter(function(d,i){ return (d["key"+(m+1)]==s); });
		//console.log(selectedEdges.toSource());

		selectedEdges.attr("points", edgePolygon).style("opacity", 0.2);

		//selectedBar.select(".barvalue").style('font-weight','normal');
		//selectedBar.select(".barpercent").style('font-weight','normal');
	}

	bP.selectEdge = function(id, i, current_data){
		//bold associated names
		[0,1].forEach(function(m){
		var selectedBar = d3.select("#"+id).select(".part"+m).select(".mainbars")
			.selectAll(".mainbar").filter(function(d,i){ 
				return (i==current_data["key"+(m+1)]);});
			selectedBar.select(".barlabel").style('font-weight','bold').style("visibility", "visible");

			var selSubBar =  d3.select("#"+id).select(".part"+m).select(".subbars")
				.selectAll(".subbar")
				.filter(function(d,i){ 
					return (d["key"+(m+1)]==current_data["key"+(m+1)]); }); 
			selSubBar.style("opacity", 1);
		});
	}

	bP.deselectEdge = function(id, i, current_data){
		[0,1].forEach(function(m){
		var selectedBar = d3.select("#"+id).select(".part"+m).select(".mainbars")
			.selectAll(".mainbar").filter(function(d,i){ 
				return (i==current_data["key"+(m+1)]);});
		selectedBar.select(".barlabel").style('font-weight','normal').style("visibility", "hidden");
		var selSubBar =  d3.select("#"+id).select(".part"+m).select(".subbars")
			.selectAll(".subbar")
			.filter(function(d,i){ 
				return (d["key"+(m+1)]==current_data["key"+(m+1)]); }); 
		selSubBar.style("opacity", 0.2);
		});		

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
}();