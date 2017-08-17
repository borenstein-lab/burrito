!function(){
  var fB = {};

  var x = d3.scale.ordinal();
  var y = d3.scale.linear()

  var xAxis = d3.svg.axis()
  .orient("bottom");

  var yAxis = d3.svg.axis()
  .orient("left")
  .tickFormat(d3.format(".2s"));


  fB.vizData = function(data, sample_order){

    var y0 = 0;
    var y1 = 0;
    var total = 0;



    data.forEach(function(d) {
      var length = d.data.length;
      var y0 = 0;
      var y1 = 0;
      var h = d.length-1;

      //assign values for size of bars
      d.data.forEach(function(e){
        e.y0 = y0*100;
        e.y1= (y0 += +e.contributions)*100; 



      })

      total = d.data[length-1].y1;

      d.data.forEach(function(e){
        e.total = total;

        e.y0 = Math.round(e.y0/e.total*100*100)/100;
        e.y1 = Math.round(e.y1/e.total*100*100)/100;


      })


      
    });

    // var h = [];
    // data.map(function(d) { 
    //   d.data.map(function(e){
    //     h.push(e.Sample);
    //     return e.Sample;
    //   })  
    // });
    x.domain(sample_order);
    y.domain([0, 100]);
    return data;
  }


  fB.getSampleGroup = function(samp, sampledata, grouping){
    group = sampledata.filter(function(e){ return e.Sample==samp;})[0][grouping];
    return group;
  }



  // var sampleColor = d3.scale.ordinal();
  // sampleColor["1"] = "red";
  // sampleColor["2"] = "darkred";
  // sampleColor["3"] = "steelblue";
  // sampleColor["4"] = "darkblue";



  fB.Draw = function(stackdata, sampledata, colors, svglink, dims, highlight_overall, dehighlight_overall, sampleColor, sample_order, grouping, displayed_taxa, displayed_funcs, clickResponse){

  d3.select("#func_bar_y_label").remove()
  d3.select("#func_bar_x_label").remove()
  d3.select("#func_bar_xtick_svg").remove()

	var graphdims = {width: dims.width - 45, height: dims.height * 8/10, height_buffer:10, width_buffer:0, sample_buffer:45, x_axis_x_buffer:45, sample_label_buffer:8}
   x.rangeBands([0, graphdims.width], .2);
   y.range([graphdims.height, 0]);

   xAxis.scale(x);
   yAxis.scale(y);
   

// 	display_func = d3.set(stackdata[0].data.map(function(d){
// 		return(d.func)
// 	})).values().sort(function(a,b){ return a.replace(/^[A-Za-z0-9]+_/,"") > b.replace(/^[A-Za-z0-9]+_/,"");; })
	
	display_func = []
	d3.select("#Genomes").select(".part1").select("#saveLegBar1").select(".mainbars")
			.selectAll(".mainbar").each(function(d){
			display_func.push((d3.select(this).attr("id")).replace("Genomes1","")); })

// 	display_taxa = d3.set(stackdata[0].data.map(function(d){
// 		return(d.Taxa)
// 	})).values().sort(function(a,b){ return a.replace(/^[A-Za-z0-9]+_/,"") > b.replace(/^[A-Za-z0-9]+_/,"");; })
	display_taxa = []
	d3.select("#Genomes").select(".part0").select("#saveLegBar0").select(".mainbars")
			.selectAll(".mainbar").each(function(d){
			display_taxa.push((d3.select(this).attr("id")).replace("Genomes0","")); })
	
   var viz = fB.vizData(stackdata, sample_order);

   var first_sample_x = x(sample_order[0]);
   var last_sample_x = x(sample_order[sample_order.length - 1]);

  //y axis label
  svglink.append("text")
    .attr("class", "y label")
    .attr("id", "func_bar_y_label")
    .attr("text-anchor", "middle")
    .attr("y", 0)
    .attr("x", -(graphdims.height + graphdims.height_buffer) / 2)
    .attr("font-size",18)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Relative Abundance (%)");

  //x-axis label
   /* svglink.append("text")
    .attr("class", "x label")
    .attr("id", "func_bar_x_label")
    .attr("text-anchor", "middle")
    .attr("y", dims.height-18)
    .attr("x", dims.width - graphdims.width + graphdims.width_buffer + ((graphdims.width - graphdims.width_buffer) / 2))
    .attr("font-size",18)
    .attr("dy", ".75em")
    .text("Samples");
*/ //removed to make room for group labels





    //init the tooltip as invisible
  var tooltip = d3.select("body")
  .append("div")
  .style("position", "absolute")
  .style("z-index", "10")
  .style("visibility", "hidden")
  .style("background", "lightyellow")
  .style("opacity", "1")
  .style("border", "0px")    
  .style("border-radius", "4px")  
  .style("padding","2px")

  .text("");






    //create a Sample object for each sample
  var Sample = svglink.selectAll(".Sample")
  .data(viz.filter(function(d){ return d.Sample != average_contrib_sample_name}))
  .enter().append("g")
  .attr("class", "g")
  .attr("id", function(d){ return "func_"+d.Sample })
  .attr("transform", function(d) { return "translate(" + (graphdims.sample_buffer - first_sample_x + x(d.Sample)) + "," + graphdims.height_buffer + ")"; });


    //create rects for each value, transpose based on sample

  Sample.selectAll("rect")
  .data(function(d) { 
   return d.data;
 })
  .enter().append("rect")
  .attr("func", function(d) {return d.func})
  .attr("taxon", function(d) { return d.Taxa})
  .attr("width", x.rangeBand())
  .attr("y", function(d) {return y(d.y1); })
  .attr("height", function(d) {return y(d.y0) - y(d.y1) + 1;} )
  .style("fill", function(d) { return colors(d.func); })
  //.style("opacity", 0.75)
  .on("mouseover", function(d){
	current_rectangle_data = d3.select(this).datum();
  	clickedBars = d3.select("#Genomes").selectAll(".mainbars").select(".clicked")
  	clickedFuncBars = d3.select("#Genomes").select(".part1").selectAll(".mainbars").select(".clicked")
  	clickedEdges = d3.select("#Genomes").selectAll(".edges").select(".clicked")
  	if(clickedBars.empty()){ //nothing is clicked
	    highlight_overall("", current_rectangle_data.func, 2);		
		selected = d3.select("#func_" + current_rectangle_data.Sample)
			.selectAll("rect").data()
			.filter(function(e){ 
				return e.func == current_rectangle_data.func; })
     	total_abund = d3.sum(selected.map(function(e){ return e.contributions; }))
    	name_split = (current_rectangle_data.func.split('_')).pop()
    	//taxa_split = (current_rectangle_data.Taxa.split('_')).pop() //+ "<strong>Taxon: </strong>" + taxa_split 
        tooltip.html("<strong>Function: </strong>" + name_split + "<br>" +  "<strong>Sample: </strong>"+current_rectangle_data.Sample + " <br>"+"<strong>Relative Abundance: </strong>" + Math.round(total_abund*100*100)/100+ "%");
          return tooltip.style("visibility", "visible");
    } else if(clickedFuncBars.empty() == false && clickedEdges.empty()==true){ //function bar is clicked
    	if(display_func[clickedFuncBars.datum().key] == (current_rectangle_data.func).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")){
	    	selected = d3.select("#func_" + current_rectangle_data.Sample)
				.selectAll("rect").data()
				.filter(function(e){ 
					return e.func == current_rectangle_data.func; })
     	total_abund = d3.sum(selected.map(function(e){ return e.contributions; }))
    	name_split = (current_rectangle_data.func.split('_')).pop() //+ "<strong>Taxon: </strong>" + taxa_split  + "<br>" 
        tooltip.html("<strong>Function: </strong>" + name_split + "<br>" + "<strong>Sample: </strong>"+current_rectangle_data.Sample + " <br>"+"<strong>Relative Abundance: </strong>" + Math.round(total_abund*100*100)/100+ "%");
          return tooltip.style("visibility", "visible");
    }
    } else if(clickedEdges.empty() == false){
    	if(display_func[clickedEdges.datum().key2] == (current_rectangle_data.func).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_") && display_taxa[clickedEdges.datum().key1] == (current_rectangle_data.Taxa).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")){ //if a taxon is highlighted with an edge clicked, just show contributions from that edge
    		name_split = (current_rectangle_data.func.split('_')).pop()
    		taxa_split = (current_rectangle_data.Taxa.split('_')).pop() //
    		abund = current_rectangle_data.contributions
        	tooltip.html("<strong>Function: </strong>" + name_split + "<br>" + "<strong>Taxon: </strong>" + taxa_split  + "<br>" + "<strong>Sample: </strong>"+current_rectangle_data.Sample + " <br>"+"<strong>Relative Abundance: </strong>" + Math.round(abund*100*100)/100+ "%");
          	return tooltip.style("visibility", "visible");    		
    	}
	} else if(clickedBars.empty() == false && clickedFuncBars.empty() == true){ //highlight contributions if taxon selected
		if(display_taxa[clickedBars.datum().key] == (current_rectangle_data.Taxa).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")){
			name_split = (current_rectangle_data.func.split('_')).pop()
    		taxa_split = (current_rectangle_data.Taxa.split('_')).pop() //
    		abund = current_rectangle_data.contributions
        	tooltip.html("<strong>Function: </strong>" + name_split + "<br>" + "<strong>Taxon: </strong>" + taxa_split  + "<br>" + "<strong>Sample: </strong>"+current_rectangle_data.Sample + " <br>"+"<strong>Relative Abundance: </strong>" + Math.round(abund*100*100)/100+ "%");
          	return tooltip.style("visibility", "visible");   
		}
	}
	})
  .on("mousemove", function(d){
  	current_rectangle_data = d3.select(this).datum()
  	clickedBars = d3.select("#Genomes").selectAll(".mainbars").select(".clicked")
  	clickedFuncBars = d3.select("#Genomes").select(".part1").selectAll(".mainbars").select(".clicked")
  	 clickedEdges = d3.select("#Genomes").selectAll(".edges").select(".clicked")
  	if(clickedBars.empty() || (clickedFuncBars.empty() == false && clickedEdges.empty()== true && display_func[clickedFuncBars.datum().key] == (current_rectangle_data.func).replace(/ /g,"_").replace(/(,|\(|\)|\[|\])/g, "_"))){
  	return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
  	} else if(clickedEdges.empty() == false){
  		 if(display_func[clickedEdges.datum().key2] == (current_rectangle_data.func).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_") && display_taxa[clickedEdges.datum().key1] == (current_rectangle_data.Taxa).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")){ //if a taxon is highlighted with an edge clicked, just show contributions from that edge
		  	return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
		  }
  		} else if(clickedBars.empty() == false && clickedFuncBars.empty() == true){ //highlight contributions if taxon selected
			if(display_taxa[clickedBars.datum().key] == (current_rectangle_data.Taxa).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")){
				return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
			}
		}
  	})
  .on("mouseout", function(d){
  current_rectangle_data = d3.select(this).datum()
    clickedBars = d3.select("#Genomes").selectAll(".mainbars").select(".clicked")
  	clickedFuncBars = d3.select("#Genomes").select(".part1").selectAll(".mainbars").select(".clicked")
  	 clickedEdges = d3.select("#Genomes").selectAll(".edges").select(".clicked")
  	if(clickedBars.empty()){
	    current_rectangle_data = d3.select(this).datum();
    	dehighlight_overall("", current_rectangle_data.func, 2);
    	return tooltip.style("visibility", "hidden");
    	} else if(clickedFuncBars.empty() == false && clickedEdges.empty() == true){
	    	if(display_func[clickedFuncBars.datum().key] == (d.func).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")){
		    	return tooltip.style("visibility", "hidden");
    		}
    	} else if(clickedEdges.empty() == false){
    		if(display_func[clickedEdges.datum().key2] == (current_rectangle_data.func).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_") && display_taxa[clickedEdges.datum().key1] == (current_rectangle_data.Taxa).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")){
    			return tooltip.style("visibility", "hidden");
    		}
    	} else if(clickedBars.empty() == false && clickedFuncBars.empty() == true){ //highlight contributions if taxon selected
			if(display_taxa[clickedBars.datum().key] == (current_rectangle_data.Taxa).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")){
				return tooltip.style("visibility", "hidden");
			}
		}
  })
  .on("click", function(d,i){
    	current_rectangle_data = d3.select(this).datum();
        current_id = "Genomes1"+current_rectangle_data.func.replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")
    	selected = d3.select("#func_" + current_rectangle_data.Sample)
			.selectAll("rect").data()
			.filter(function(e){ 
				return e.func == current_rectangle_data.func; })
     	total_abund = d3.sum(selected.map(function(e){ return e.contributions; }))
    	name_split = (current_rectangle_data.func.split('_')).pop() //+ "<strong>Taxon: </strong>" + taxa_split  + "<br>" 
        tooltip.html("<strong>Function: </strong>" + name_split + "<br>" + "<strong>Sample: </strong>"+current_rectangle_data.Sample + " <br>"+"<strong>Relative Abundance: </strong>" + Math.round(total_abund*100*100)/100+ "%");
		tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
		clickResponse(current_id, current_rectangle_data.func, "funcs", displayed_taxa, displayed_funcs)
		return tooltip.style("visibility", "visible")
		
  });

      //get the x axis set

  svglink.append("svg")
    .attr("id", "func_bar_xtick_svg")
    .attr("x", 0)
    .attr("y",graphdims.height + graphdims.height_buffer)
    .attr("width", last_sample_x - first_sample_x + graphdims.x_axis_x_buffer + x.rangeBand())
    .attr("height", dims.height - graphdims.height - graphdims.height_buffer)
    .style("font-family", "Verdana");


  d3.select("#func_bar_xtick_svg").append("g")
    .attr("class", "x_axis")
    .attr("transform", "translate(" + graphdims.x_axis_x_buffer + ",0)")
    .call(xAxis)
    .selectAll("text")
	.style("alignment-baseline","middle")
    .style("text-anchor", "end")
    .attr("dx", 0)
    .attr("dy", 0)
    .attr("transform", function(d) {
      return "translate(-" + (first_sample_x + (x.rangeBand()/2)) + "," + graphdims.sample_label_buffer + ") rotate(-90)"
    });



    //init y-axis
  svglink.append("g")
  .attr("class", "y axis")
  .attr("transform","translate(" + (dims.width-graphdims.width + graphdims.width_buffer) +"," +graphdims.height_buffer + ")")
  .call(yAxis)
  .append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", 6)
  .attr("dy", ".71em")
  .style("text-anchor", "end")
  .attr("class", "y_label");
  
  if (grouping != "N/A") {
  	var groupnames = sampledata.map(function(e) { return e[grouping]; });
  	groupnames = groupnames.filter(function(v,i) { return groupnames.indexOf(v) == i; });
  	var groups = [];
  	groupnames.forEach( function(gn) { groups.push({ "Name": gn, "Min": width, "Max": 0}); } );
  	d3.selectAll("#func_bars").selectAll(".g").each( function(d) {
  		var curg = fB.getSampleGroup(d.Sample, sampledata, grouping);
  		var gindex = groups.map(function(e) { return e.Name; }).indexOf(curg);
  		var xpos = this.getAttribute("transform");
  		xpos = parseFloat(xpos.substring(10,xpos.indexOf(",")));
  		if (xpos < groups[gindex].Min) { groups[gindex].Min = xpos; }
  		if (xpos > groups[gindex].Max) { groups[gindex].Max = xpos; }
  		});


  	d3.select("#func_bar_xtick_svg").select("g.x_axis").selectAll("rect")
  		.data(groups)
  		.enter()
  		.insert("rect",".tick")
  			.attr("x", function(d) { return d.Min - graphdims.x_axis_x_buffer; } )
  			.attr("y", 0)
  			.attr("width", function(d) { return d.Max - d.Min + x.rangeBand(); })
  			.attr("height", dims.height - graphdims.height - graphdims.height_buffer)
  			.attr("fill", function(d) { return sampleColor(d.Name); });

  	d3.select("#func_bar_xtick_svg").select("g.x_axis").selectAll("g.x_samp_g_label")
  		.data(groups)
  		.enter()
  		.append("g")
  		.attr("class","func_x_g_label")
  		.append("rect")
  			.attr("x", function(d) { return d.Min - graphdims.x_axis_x_buffer; } )
  			.attr("y", dims.height - graphdims.height - graphdims.height_buffer - 20)
  			.attr("width", function(d) { return d.Max - d.Min + x.rangeBand(); })
  			.attr("height", 30)
  			.attr("fill", function(d) { return sampleColor(d.Name); });


  	d3.selectAll("g.func_x_g_label")
  		.append("text")
  		.attr("x", function(d) { return d.Min - graphdims.x_axis_x_buffer + (d.Max - d.Min + x.rangeBand())/2 })
  		.attr("y", dims.height - graphdims.height - graphdims.height_buffer - 4)
  		.attr("text-anchor","middle")
  		.attr("font-size", 17)
  		.text(function(d) { return d.Name; });
	
	}
  /*svglink.selectAll("text").style("fill",function(m){
    if(sampledata.map(function(e){ return e.Sample; }).indexOf(m)!==-1 & grouping != ""){
      return sampleColor(fB.getSampleGroup(m, sampledata, grouping));        
    } else {
      return "#000000";
    } 
  }); */




}

fB.select_bars = function(func, colors){
  selected = d3.select("#func_bars")
    .selectAll(".g")
    .selectAll("rect")
    .filter(function(d) {
      return d.func == func;
    });
  current_color = selected.style("fill");
  var trimstr = func.replace(/\W+/g,'') + "_tx";
  if (d3.select("#" + trimstr)[0][0] == null) {
     var t = textures.lines()
       .thicker()
       .background(colors(func).brighter(0.2))
       .id(trimstr)
       .stroke("white");


     d3.select("#patternsvg").call(t);
  }
 
    selected.style("opacity", 1)
        .style("fill", "url(#" + trimstr + ")");

    // .style("stroke", "yellow")
    // .style("stroke-width",2);
}

fB.deselect_bars = function(func, colors){
  d3.select("#func_bars")
    .selectAll(".g")
    .selectAll("rect")
    .filter(function(d) {
      return d.func == func;
    })
    //.style("opacity", 0.75)
    .style("fill", colors(func));
}

fB.select_contribution = function(taxon, colors, changeAlpha){
  var selected = d3.select("#func_bars")
    .selectAll(".g")
    .selectAll("rect")
    .filter(function(d) {
      return d.Taxa == taxon;
    });

  //selected.style("opacity", 1)
    selected.style("fill", function(d){
      var trimstr = d.func.replace(/\W+/g,'') + "_tx";
      if (d3.select("#" + trimstr)[0][0] == null) {
        var t = textures.lines()
          .thicker()
          .background(d3.rgb(colors(d.func)).brighter(0.2))
          .id(trimstr)
          .stroke("white");

        d3.select("#patternsvg").call(t);
      }

      return "url(#" + trimstr;
    });

}

fB.deselect_contribution = function(taxon, colors){
  selected = d3.select("#func_bars")
    .selectAll(".g")
    .selectAll("rect")
    .filter(function(d) {
      return d.Taxa == taxon;
    });
    selected.style("fill",function(d){ return colors(d.func); });
}

fB.select_single_contribution = function(taxon, func, colors, changeAlpha){
  selected = d3.select("#func_bars")
    .selectAll(".g")
    .selectAll("rect")
    .filter(function(d) {
      return d.func == func && d.Taxa == taxon;
    });
  var trimstr = func.replace(/\W+/g,'') + "_tx";
  if (d3.select("#" + trimstr)[0][0] == null) {
     var t = textures.lines()
       .thicker()
       .background(d3.rgb(colors(func)).brighter(0.2))
       .id(trimstr)
       .stroke("white");

     d3.select("#patternsvg").call(t);
  }
    
    selected.style("opacity", 1)
        .style("fill", "url(#" + trimstr + ")");
}

fB.deselect_single_contribution = function(taxon, func, colors){
  selected = d3.select("#func_bars")
    .selectAll(".g")
    .selectAll("rect")
    .filter(function(d) {
      return d.func == func && d.Taxa == taxon;
    });

    selected.style("fill", function(d){ return colors(d.func); });
}

this.fB = fB;
}();
