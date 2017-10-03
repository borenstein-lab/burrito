(function(){
  var otu_bar = {};

  var otu_bar_x = d3.scale.ordinal();
  var otu_bar_y = d3.scale.linear();

  var otu_bar_x_axis = d3.svg.axis()
  .orient("bottom");

  var otu_bar_y_axis = d3.svg.axis()
  .orient("left")
  .tickFormat(d3.format(".2s"));

  otu_bar.getSampleGroup = function(samp, sampledata, grouping){
    samp_column = d3.keys(sampledata[0])[0]
  	group = sampledata.filter(function(e){ 
  		return e[samp_column]==samp;})[0][grouping];
    return group;
  }


  function get_taxon_abundance(taxon, row, data_cube){
    var leaves = data_cube.get_leaves(taxon, data_cube.taxa_lookup);
    total = 0;
    for (var i = 0; i < leaves.length; i++){
      total += parseFloat(row[leaves[i]]);
    }
    return total;
  }

  function generate_otu_barplot_tooltip_text(name_split, sample, y1, y0){
    return taxonomic_abundance_tooltip_text[0] + name_split + taxonomic_abundance_tooltip_text[1] + sample + taxonomic_abundance_tooltip_text[2] + (Math.round((y1 - y0) * 100) / 100) + taxonomic_abundance_tooltip_text[3]
  }

  otu_bar.make_data = function(otu_abundance_data, data_cube, samp_col, sample_order){
    var bar_data = [];
    otu_abundance_data.forEach(function(d, i){
      var bar = {};
      bar[samp_col] = d[samp_col]//sample_order[i];
      var y0 = 0;
      var my_display_taxa = data_cube.displayed_taxa.slice(0);
      my_display_taxa.reverse()
      bar.taxa = my_display_taxa.map(function(name){
        return { name: name, y0: y0, y1: y0 += get_taxon_abundance(name, d, data_cube)};
      });
      bar.total = bar.taxa[bar.taxa.length - 1].y1;
      bar_data.push(bar);
    })
    otu_bar_x.domain(sample_order);
    otu_bar_y.domain([0, 100]);
    return bar_data;
  }

  otu_bar.draw = function(bar_data, sampledata, colors, svglink, dims, highlight_overall, dehighlight_overall, sampleColor, sample_order, grouping, displayed_taxa, displayed_funcs, clickResponse){

    d3.select("#otu_bar_y_label").remove()
    d3.select("#otu_bar_x_label").remove()
    d3.select("#otu_bar_xtick_svg").remove()

  	var graphdims = {width: dims.width - 45, height: dims.height * 8/10, height_buffer:10, width_buffer:10, sample_buffer:45, x_axis_x_buffer:45, sample_label_buffer:8}
    graphdims.width = graphdims.width - graphdims.width_buffer;
    otu_bar_x.rangeBands([0, graphdims.width], .2);
    otu_bar_x_axis.scale(otu_bar_x);
    otu_bar_y_axis.scale(otu_bar_y);
    
  	d3.selectAll("#otutooltipdiv").remove();
    var tooltip = d3.select("body")
      .append("div")
    	  .attr("id","otutooltipdiv")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("background", "lightyellow")
        .style("opacity", "1")
        .style("border", "0px")    
        .style("border-radius", "4px")  
        .style("padding","2px")
        .text(default_taxonomic_abundance_tooltip_text);

    var normalized = true;
	
    bar_data.forEach(function(d) {
      d.taxa.forEach(function(e){
        e.y0 = Math.round(e.y0/d.total*100*100)/100;
        e.y1 = Math.round(e.y1/d.total*100*100)/100;
      })
    })
    
    var first_sample_x = otu_bar_x(sample_order[0]);
    var last_sample_x = otu_bar_x(sample_order[sample_order.length - 1]);

    var Sample = svglink.selectAll(".Sample")
      .data(bar_data)
      .enter()
      .append("g")
        .attr("class", "g")
        .attr("transform", function(d) { 
        	samp_col = d3.keys(d)[0]
          return "translate(" + (graphdims.sample_buffer + graphdims.width_buffer - first_sample_x + otu_bar_x(d[samp_col])) + "," + graphdims.height_buffer +")"; 
        });

    Sample.selectAll("rect")
      .data(function(d) {
      	d["taxa"] = d.taxa.map(function(dat){ 
      		dat_plusSamp = dat
      		samp_col = d3.keys(d)[0]
      		dat_plusSamp[samp_col] = d[samp_col]
      		return dat_plusSamp;
        })
        return d.taxa;
      })
      .enter()
        .append("rect")
          .attr("taxon", function(d){return d.name;})
          .attr("width", otu_bar_x.rangeBand())
          .style("fill", function(d) { 
            return colors(d.name); 
          })
          .style("opacity", 0.75)
          .on("mouseover", function(d){
          	current_rectangle_data = d3.select(this)
              .datum();
        		clickedBars = d3.select("#Genomes")
              .selectAll(".mainbars")
                .select(".clicked")
        		clickedTaxaBars = d3.select("#Genomes")
              .select(".part0")
                .selectAll(".mainbars")
                  .select(".clicked")
        		clickedEdges = d3.select("#Genomes")
              .selectAll(".edges")
                .select(".clicked")
            samp_col = d3.keys(current_rectangle_data)
              .pop()
        		
            if(clickedBars.empty()){ //if nothing is clicked
            	highlight_overall(current_rectangle_data.name, "", 1);
            	name_split = current_rectangle_data.name
                .split('_')
                  .pop()
            	tooltip.html(generate_otu_barplot_tooltip_text(name_split, current_rectangle_data[samp_col], current_rectangle_data.y1, current_rectangle_data.y0));
            	return tooltip.style("visibility", "visible");
            }

            if(clickedTaxaBars.empty() == false){ // if any taxa are highlighted
          		if(displayed_taxa[clickedTaxaBars.datum().key] == (current_rectangle_data.name).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")){
              	name_split = current_rectangle_data.name
                  .split('_')
                    .pop()
              	tooltip.html(generate_otu_barplot_tooltip_text(name_split, current_rectangle_data[samp_col], current_rectangle_data.y1, current_rectangle_data.y0));
                return tooltip.style("visibility", "visible");
          		}
          	} else if(clickedEdges.empty() == false){ //if an edge is clicked
          		if(displayed_taxa[clickedEdges.datum().key1] == (current_rectangle_data.name).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")){ //if relevant edge is clicked
        		    name_split = current_rectangle_data.name
                  .split('_')
                    .pop()
            		tooltip.html(generate_otu_barplot_tooltip_text(name_split, current_rectangle_data[samp_col], current_rectangle_data.y1, current_rectangle_data.y0));
              	return tooltip.style("visibility", "visible");
          		}
          	}
          })
          .on("mousemove", function(d){ 
          	current_rectangle_data = d3.select(this)
              .datum();
            clickedBars = d3.select("#Genomes")
              .selectAll(".mainbars")
                .select(".clicked")
      		  clickedTaxaBars = d3.select("#Genomes")
              .select(".part0")
                .selectAll(".mainbars")
                  .select(".clicked")
      		  clickedEdges = d3.select("#Genomes")
              .selectAll(".edges")
                .select(".clicked")
      		  if(clickedBars.empty()){
    	        return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
            } else if(clickedTaxaBars.empty() == false){
             	if(displayed_taxa[clickedTaxaBars.datum().key] == (d.name).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")){
             		return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
             	}
            } else if(clickedEdges.empty() == false){
             	if(displayed_taxa[clickedEdges.datum().key1] == (current_rectangle_data.name).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")){
             		return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
             	}
            }
          })
          .on("mouseout", function(d){
          	current_rectangle_data = d3.select(this)
              .datum();
            clickedBars = d3.select("#Genomes")
              .selectAll(".mainbars")
                .select(".clicked")
      		  clickedTaxaBars = d3.select("#Genomes")
              .select(".part0")
                .selectAll(".mainbars")
                  .select(".clicked")
      		  clickedEdges = d3.select("#Genomes")
              .selectAll(".edges")
                .select(".clicked")
        		if(clickedBars.empty()){
             	var current_rectangle_data = d3.select(this)
                .datum();
              dehighlight_overall(current_rectangle_data.name, "", 1);
              	return tooltip.style("visibility", "hidden");
            }  
            if(clickedTaxaBars.empty() == false){
        		  if(displayed_taxa[clickedTaxaBars.datum().key] == (d.name).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")){
    	    		 return tooltip.style("visibility", "hidden");
        		  } 
            } else if(clickedEdges.empty() == false){
        		  if(displayed_taxa[clickedEdges.datum().key1] == (current_rectangle_data.name).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")){
        			 return tooltip.style("visibility", "hidden");
        		  }
            }
          })
          .on("click", function(d){
            current_rectangle_data = d3.select(this)
              .datum();
            samp_col = d3.keys(current_rectangle_data).pop()
            current_id = "Genomes0"+current_rectangle_data.name
                .replace(/ /g,"_")
                  .replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")
            name_split = current_rectangle_data.name
              .split('_')
                .pop()
            tooltip.html(generate_otu_barplot_tooltip_text(name_split, current_rectangle_data[samp_col], current_rectangle_data.y1, current_rectangle_data.y0));
    		    tooltip.style("top", (d3.event.pageY-10)+"px")
              .style("left",(d3.event.pageX+10)+"px");
        		clickResponse(current_id, current_rectangle_data.name, "taxa", displayed_taxa, displayed_funcs)
    		    return tooltip.style("visibility", "visible")
          });

    // Initializae x-axis
    svglink.append("svg")
      .attr("id", "otu_bar_xtick_svg")
      .attr("x", graphdims.width_buffer)
      .attr("width", last_sample_x - first_sample_x + graphdims.x_axis_x_buffer + otu_bar_x.rangeBand())
      .attr("clip-path", "")

    d3.select("#otu_bar_xtick_svg")
      .append("g")
        .attr("class", "x_axis")
        .attr("id", "otu_x_axis")
        .attr("transform", "translate(" + graphdims.x_axis_x_buffer + ",0)")
        .call(otu_bar_x_axis)
        .selectAll("text")
          .style("alignment-baseline","middle")
          .attr("dominant-baseline", "middle")
          .style("font-size", sample_label_size)
          .style("text-anchor", "end")
          .attr("dx", 0)
          .attr("dy", 0)

    // Fix length of axis bar so it doesn't extend too far when exported
    var curr_x_axis_path_string = document.getElementById("otu_x_axis")
        .querySelectorAll("path")[0]
          .getAttribute("d");
    var x_axis_path_string_prefix = curr_x_axis_path_string.match(/^(.*)H/);
    var x_axis_path_string_suffix = curr_x_axis_path_string.match(/H[0-9\.]*(V.*)$/);
    d3.select("#otu_x_axis")
      .selectAll("path")
        .attr("d", x_axis_path_string_prefix[1] + "H" + (last_sample_x - first_sample_x + otu_bar_x.rangeBand()) + x_axis_path_string_suffix[1]);


    // Grab the initial x transform of the ticks
    var initial_x_axis_tick_transform = dims.width
    d3.select("#otu_x_axis")
      .selectAll(".tick")
        .each(function(data){
          var tick = d3.select(this)
          var transform = d3.transform(tick.attr("transform"))
            .translate
          if (transform[0] < initial_x_axis_tick_transform){
            initial_x_axis_tick_transform = transform[0]
          }
        })

    // Remove the initial x transform from the ticks
    d3.select("#otu_x_axis").selectAll(".tick")
      .each(function(data){
        var tick = d3.select(this)
        var transform = d3.transform(tick.attr("transform"))
          .translate
        tick.attr("transform", "translate(" + (transform[0] - initial_x_axis_tick_transform) + ",0)")
      })

    // Calculate the maximum width of x-axis text (height after roatation) and vertically center the text relative to the bars they correspond to
    var max_x_axis_text_width = 0;
    d3.select("#otu_x_axis")
      .selectAll("text")
        .each(function(){
          var text_width = d3.select(this)
            .node()
              .getBBox()
                .width
          if (text_width > max_x_axis_text_width){
            max_x_axis_text_width = text_width
          }
          var text_height = d3.select(this)
            .node()
              .getBBox()
                .height
          d3.select(this)
            .attr("transform", "translate(" + ((otu_bar_x.rangeBand() / 2) - (text_height / 2)) + "," + graphdims.sample_label_buffer + ") rotate(-90)")
        })
    

    var max_group_label_height = 0;	
  	if (grouping != "N/A") {

    	var groupnames = sampledata.map(function(e) { return e[grouping]; });
    	groupnames = groupnames.filter(function(v,i) { return groupnames.indexOf(v) == i; });

    	var groups = [];
    	groupnames.forEach( function(gn) { groups.push({ "Name": gn, "Min": width, "Max": 0}); } );
    	
    	
    	d3.selectAll("#taxa_bars").selectAll(".g").each( function(d) {
      		samp_col = d3.keys(d)[0]
      		var curg = otu_bar.getSampleGroup(d[samp_col], sampledata, grouping);
      		var gindex = groups.map(function(e) { 
      			return e.Name; })
            .indexOf(curg);
      		var xpos = this.getAttribute("transform");
      		xpos = parseFloat(xpos.substring(10,xpos.indexOf(",")));
      		if (xpos < groups[gindex].Min) { groups[gindex].Min = xpos; }
      		if (xpos > groups[gindex].Max) { groups[gindex].Max = xpos; }
      	});

    	d3.select("#otu_bar_xtick_svg").selectAll("g.x_samp_g_label")
    		.data(groups)
    		.enter()
      		.insert("g","g.x_axis")
    			.classed("x_samp_g_label",true)
    			.append("rect")
      			.attr("x", function(d) { return d.Min - graphdims.width_buffer; } )
      			.attr("y", 0)
      			.attr("width", function(d) { return d.Max - d.Min + otu_bar_x.rangeBand(); })
      			.attr("fill", function(d) { return sampleColor(d.Name); });

    	d3.select("#otu_bar_xtick_svg").selectAll(".x_samp_g_label")
    		.append("text")
      		.attr("x", function(d) { return d.Min - graphdims.width_buffer + (d.Max - d.Min + otu_bar_x.rangeBand())/2 })
      		.attr("text-anchor","middle")
      		.attr("font-size", group_label_size)
      		.text(function(d) { return d.Name; });

    	d3.select("#taxa_bars").selectAll("line.bar_group_divider")
    		.data(groups.slice(0,groups.length - 1))
    		.enter()
      		.insert("line","g.g")
      			.classed("bar_group_divider",true)
      			.attr("x1", function(d) { return d.Max + otu_bar_x.rangeBand() * 9/8 })
      			.attr("y1", graphdims.height_buffer)
      			.attr("x2", function(d) { return d.Max + otu_bar_x.rangeBand() * 9/8 })

      // Determine the maximum height of any of the group labels
      d3.select("#otu_bar_xtick_svg").selectAll(".x_samp_g_label")
        .selectAll("text")
          .each(function(){
            var text_height = d3.select(this)
              .node()
                .getBBox()
                  .height
            if (text_height > max_group_label_height){
              max_group_label_height = text_height
            }
          })
  	}

    // Position and size the x-axis to contain full labels and group labels if necessary
    var buffer_between_sample_labels_and_bottom = 2
    var x_axis_height = max_x_axis_text_width + max_group_label_height + graphdims.sample_label_buffer + buffer_between_sample_labels_and_bottom
    d3.select("#otu_bar_xtick_svg")
      .attr("y", dims.height - x_axis_height)
      .attr("height", x_axis_height)

    // Make the colored label backgrounds the correct height
    d3.select("#otu_bar_xtick_svg").selectAll("rect")
      .attr("height", x_axis_height)

    // Position the group labels
    d3.select("#otu_bar_xtick_svg").selectAll(".x_samp_g_label")
      .selectAll("text")
        .each(function(){
          d3.select(this)
            .attr("y", x_axis_height - buffer_between_sample_labels_and_bottom)
        })

    // Set the height of the group dividers
    d3.select("#taxa_bars").selectAll("line.bar_group_divider")
      .each(function(){
        d3.select(this)
          .attr("y2", dims.height - x_axis_height)
      })

    
    // Set the y range to be between the top of the barplot svg and the top of the x-axis
    otu_bar_y.range([dims.height - x_axis_height - graphdims.height_buffer, 0]);

    // Initialize the y-axis
    svglink.append("g")
      .attr("class", "y axis")
      .attr("transform","translate("+ (dims.width-graphdims.width) +"," + graphdims.height_buffer + ")")
      .call(otu_bar_y_axis)
      .selectAll("text")
        .style("font-size", y_axis_tick_size)


    // Initialize the y-axis label
    svglink.append("text")
      .attr("class", "y label")
      .attr("id", "otu_bar_y_label")
      .attr("text-anchor", "middle")
      .attr("y", 0)
      .attr("x", -(dims.height - x_axis_height) / 2)
      .attr("font-size", y_axis_label_size)
      .attr("dy", ".75em")
      .attr("transform", "rotate(-90)")
      .text(taxonomic_abundance_y_axis_title);

    // Now that we know the y range, position the tops and bottoms of the bar rectangles
    Sample.selectAll("rect")
      .attr("y", function(d) {
        return otu_bar_y(d.y1); 
      })
      .attr("height", function(d) { 
        return otu_bar_y(d.y0) - otu_bar_y(d.y1) + 1; 
      })
  };

otu_bar.select_bars = function(taxon){
  selected =  d3.select("#taxa_bars")
    .selectAll(".g")
      .selectAll("rect")
        .filter(function(d) {
          return d.name == taxon;
        });
  
  var trimstr = taxon.replace(/\W+/g,'') + "_tx";
	current_color = selected.style("fill");

	if (d3.select("#" + trimstr)[0][0] == null) {
  	var t = textures.lines()
    	.thicker()
    	.background(d3.rgb(current_color).brighter(0.2))
  		.id(trimstr)
 			.stroke("white");

 		d3.select("#patternsvg").call(t);
	}

  selected.style("opacity", 1)
    .style("fill", "url(#" + trimstr + ")");

}

otu_bar.deselect_bars = function(taxon, colors){
  d3.select("#taxa_bars")
    .selectAll(".g")
    .selectAll("rect")
    .filter(function(d) {
      return d.name == taxon;
    })
    .style("opacity", 0.75)
    .style("fill", function(d){ return colors(d.name); });
}

  this.otu_bar = otu_bar;
})();
