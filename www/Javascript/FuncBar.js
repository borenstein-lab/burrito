!function(){
  var fB = {};

  var func_bar_x = d3.scale.ordinal();
  var func_bar_y = d3.scale.linear()

  var func_bar_x_axis = d3.svg.axis()
  .orient("bottom");

  var func_bar_y_axis = d3.svg.axis()
  .orient("left")
  .tickFormat(d3.format(".2s"));

  function generate_function_barplot_tooltip_text(name_split, sample, total_abund){
    return function_abundance_tooltip_text[0] + name_split + function_abundance_tooltip_text[1] + sample + function_abundance_tooltip_text[2] + (Math.round(total_abund * 100 * 100) / 100) + function_abundance_tooltip_text[3];
  }

  function generate_function_barplot_contribution_tooltip_text(name_split, taxa_split, sample, abund, func_share){
    return function_contribution_tooltip_text[0] + name_split + function_contribution_tooltip_text[1] + taxa_split + function_contribution_tooltip_text[2] + 
    sample + function_contribution_tooltip_text[3] + (Math.round(func_share*100)/100) + function_contribution_tooltip_text[4] + 
    function_contribution_tooltip_text[5] + (Math.round(abund * 100 * 100) / 100) + function_contribution_tooltip_text[6];
  }

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

    // If there are comparison samples, then we make space for comparisons for all samples
    var fixed_sample_order = []
    var comparison_present = false
    for (var sample_index = 0; sample_index < sample_order.length; sample_index++){
      if (sample_order[sample_index].indexOf("_comparison") >= 0){
        comparison_present = true
      } else {
        fixed_sample_order.push(sample_order[sample_index])
        fixed_sample_order.push(sample_order[sample_index] + "_comparison")
      }
    }
    if (comparison_present){
      func_bar_x.domain(fixed_sample_order)
    } else {
      func_bar_x.domain(sample_order);
    }
    func_bar_y.domain([0, 100]);
    return data;
  }


  fB.getSampleGroup = function(samp, sampledata, grouping){
  	samp_column = d3.keys(sampledata[0])[0]
  	group = sampledata.filter(function(e){ return e[samp_column]==samp;})[0][grouping];
    return group;
  }

  fB.Draw = function(stackdata, sampledata, colors, svglink, dims, highlight_overall, dehighlight_overall, sampleColor, sample_order, grouping, displayed_taxa, displayed_funcs, clickResponse, totalFuncs){

    d3.select("#func_bar_y_label").remove()
    d3.select("#func_bar_x_label").remove()
    d3.select("#func_bar_xtick_svg").remove()

    var graphdims = {width: dims.width - 45, height: dims.height * 8/10, height_buffer:10, width_buffer:10, sample_buffer:45, x_axis_x_buffer:45, sample_label_buffer:10, padding: 0.2}
    graphdims.width = graphdims.width - graphdims.width_buffer;
    func_bar_x.rangeBands([0, graphdims.width], graphdims.padding);
    
    func_bar_x_axis.scale(func_bar_x);
    func_bar_y_axis.scale(func_bar_y);

    display_func = []
    d3.select("#Genomes").select(".part1").select("#saveLegBar1").select(".mainbars")
      .selectAll(".mainbar").each(function(d){
        display_func.push((d3.select(this).attr("id")).replace("Genomes1","")); 
      })

    display_taxa = []
    d3.select("#Genomes").select(".part0").select("#saveLegBar0").select(".mainbars")
      .selectAll(".mainbar").each(function(d){
        display_taxa.push((d3.select(this).attr("id")).replace("Genomes0","")); 
      })

    var viz = fB.vizData(stackdata, sample_order);
    var first_sample_x = func_bar_x(sample_order[0]);
    var last_sample_x = func_bar_x(sample_order[0]);
    for (i = 0; i < sample_order.length; i++){
      curr_x = func_bar_x(sample_order[i]);
      if (curr_x < first_sample_x){
        first_sample_x = curr_x;
      }
      if (curr_x > last_sample_x){
        last_sample_x = curr_x;
      }
    }

    //init the tooltip as invisible
	
  	d3.selectAll("#functooltipdiv").remove();
      var tooltip = d3.select("body")
        .append("div")
        .attr("id","functooltipdiv")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("background", "lightyellow")
        .style("opacity", "1")
        .style("border", "1px")    
        .style("border-radius", "4px")  
        .style("padding","2px")
        .text(default_function_abundance_tooltip_text);

    //create a Sample object for each sample
    var Sample = svglink.selectAll(".Sample")
      .data(viz.filter(function(d){ return d.Sample != average_contrib_sample_name}))
      .enter().append("g")
        .attr("class", "g sample_bar")
        .attr("id", function(d){ return "func_" + d.Sample })
        .attr("transform", function(d) { return "translate(" + (graphdims.sample_buffer + graphdims.width_buffer - first_sample_x + func_bar_x(d.Sample)) + "," + graphdims.height_buffer + ")"; });

    //create rects for each value, transpose based on sample
    Sample.selectAll("rect")
      .data(function(d) { 
        return d.data;
      })
        .enter().append("rect")
          .attr("func", function(d) {return d.func})
          .attr("taxon", function(d) { return d.Taxa})
          .attr("width", func_bar_x.rangeBand())
          .style("fill", function(d) { return colors(d.func); })
          .on("mouseover", function(d){
            current_rectangle_data = d3.select(this).datum();
            clickedBars = d3.select("#Genomes").selectAll(".mainbars").select(".clicked")
            clickedFuncBars = d3.select("#Genomes").select(".part1").selectAll(".mainbars").select(".clicked")
            clickedEdges = d3.select("#Genomes").selectAll(".edges").select(".clicked")
          	if(clickedBars.empty()){ //nothing is clicked

              highlight_overall("", current_rectangle_data.func, 2);		
              total_abund = totalFuncs[current_rectangle_data.Sample][current_rectangle_data.func]["total"]
              name_split = (current_rectangle_data.func.split('_')).pop()
              tooltip.html(generate_function_barplot_tooltip_text(name_split, current_rectangle_data.Sample, total_abund));
              return tooltip.style("visibility", "visible");
            } else if(clickedFuncBars.empty() == false && clickedEdges.empty()==true){ //function bar is clicked
            	if(display_func[clickedFuncBars.datum().key] == (current_rectangle_data.func).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")){
                total_abund = totalFuncs[current_rectangle_data.Sample][current_rectangle_data.func]["total"]
            	  name_split = (current_rectangle_data.func.split('_')).pop() //+ "<strong>Taxon: </strong>" + taxa_split  + "<br>" 
                tooltip.html(generate_function_barplot_tooltip_text(name_split, current_rectangle_data.Sample, total_abund));
                return tooltip.style("visibility", "visible");
              }
            } else if(clickedEdges.empty() == false){
            	if(display_func[clickedEdges.datum().key2] == (current_rectangle_data.func).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_") && display_taxa[clickedEdges.datum().key1] == (current_rectangle_data.Taxa).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")){ //if a taxon is highlighted with an edge clicked, just show contributions from that edge
            		name_split = (current_rectangle_data.func.split('_')).pop()
            		taxa_split = (current_rectangle_data.Taxa.split('_')).pop() //
            		abund = current_rectangle_data.contributions
              		total_abund = totalFuncs[current_rectangle_data.Sample][current_rectangle_data.func]["total"]
            		func_share = totalFuncs[current_rectangle_data.Sample][current_rectangle_data.func]["percents"][current_rectangle_data.Taxa]
                tooltip.html(generate_function_barplot_contribution_tooltip_text(name_split, taxa_split, current_rectangle_data.Sample, abund, func_share));
                return tooltip.style("visibility", "visible");    		
              }
          	} else if(clickedBars.empty() == false && clickedFuncBars.empty() == true){ //highlight contributions if taxon selected
        	   	if(display_taxa[clickedBars.datum().key] == (current_rectangle_data.Taxa).replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")){
        			  name_split = (current_rectangle_data.func.split('_')).pop()
            		taxa_split = (current_rectangle_data.Taxa.split('_')).pop() //
            		abund = current_rectangle_data.contributions
              		total_abund =totalFuncs[current_rectangle_data.Sample][current_rectangle_data.func]["total"]
            		func_share = totalFuncs[current_rectangle_data.Sample][current_rectangle_data.func]["percents"][current_rectangle_data.Taxa]
                	tooltip.html(generate_function_barplot_contribution_tooltip_text(name_split, taxa_split, current_rectangle_data.Sample, abund, func_share));
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
//             selected = d3.select("#func_" + current_rectangle_data.Sample)
//               .selectAll("rect").data()
//               .filter(function(e){ 
//                 return e.func == current_rectangle_data.func; 
//               })
            total_abund = totalFuncs[current_rectangle_data.Sample][current_rectangle_data.func]["total"]//d3.sum(selected.map(function(e){ return e.contributions; }))
            name_split = (current_rectangle_data.func.split('_')).pop() //+ "<strong>Taxon: </strong>" + taxa_split  + "<br>" 
            tooltip.html(generate_function_barplot_tooltip_text(name_split, current_rectangle_data.Sample, total_abund));
            tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
            clickResponse(current_id, current_rectangle_data.func, "funcs", displayed_taxa, displayed_funcs)
            return tooltip.style("visibility", "visible")
          });

    // Initialize x-axis
    svglink.append("svg")
      .attr("id", "func_bar_xtick_svg")
      .attr("x", graphdims.width_buffer)
      .attr("width", last_sample_x - first_sample_x + func_bar_x.rangeBand() + graphdims.x_axis_x_buffer)

    d3.select("#func_bar_xtick_svg").append("g")
      .attr("class", "x_axis")
      .attr("id", "func_x_axis")
      .attr("transform", "translate(" + graphdims.x_axis_x_buffer + ",0)")
      .call(func_bar_x_axis)
      .selectAll("text")
        .style("alignment-baseline","middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", sample_label_size)
        .attr("dx", 0)
        .attr("dy", 0)
        .style("text-anchor", "end")

    // Fix length of x axis bar so it doesn't extend too far when exported
    var curr_x_axis_path_string = document.getElementById("func_x_axis").querySelectorAll("path")[0].getAttribute("d");
    var x_axis_path_string_prefix = curr_x_axis_path_string.match(/^(.*)H/);
    var x_axis_path_string_suffix = curr_x_axis_path_string.match(/H[0-9\.]*(V.*)$/);
    d3.select("#func_x_axis").selectAll("path").attr("d", x_axis_path_string_prefix[1] + "H" + (last_sample_x - first_sample_x + func_bar_x.rangeBand()) + x_axis_path_string_suffix[1]);

    // Remove labels for comparison samples
    d3.select("#func_x_axis").selectAll("text")
      .each(function(data){
        var text_element = d3.select(this)
        if (this.textContent.indexOf("_comparison") >= 0){
          text_element.remove()
        }
      })

    var num_total_samples = 0
    var num_comparison_samples = 0
    svglink.selectAll(".Sample")
      .data(viz.filter(function(d){
        if (d.Sample.indexOf("_comparison") >= 0){
          num_comparison_samples += 1
        } else if (d.Sample.indexOf(average_contrib_sample_name) < 0){
          num_total_samples += 1
        }
      }))
    if (num_comparison_samples > 0){
      num_total_samples *= 2
    }

    console.log("Total samples:" + num_total_samples)
    console.log("Comparison samples:" + num_comparison_samples)

    // Calculate the new padding between bars after removing space between paired comparison samples
    var original_padding = func_bar_x.rangeBand() * graphdims.padding / (1 - graphdims.padding)
    var total_original_padding = original_padding * (num_total_samples - 1)

    // Subtract placeholder bar space from the total original padding
    var new_padding = total_original_padding / (sample_order.length - num_comparison_samples - 1)
    
    // If there are comparison samples, then we need to move bars and sample labels around
    if (num_comparison_samples > 0){

      // Reposition x-coordinates of sample, sample label, and grouping elements depending on comparison samples
      var last_bar_end = graphdims.sample_buffer + func_bar_x.rangeBand() + graphdims.width_buffer;
      var last_sample_label_begin = 0;
      for (var sample_index = 1; sample_index < sample_order.length; sample_index++){

        var sample_name = sample_order[sample_index]
        var sample_element = d3.select("#func_" + sample_name)

        // If the current sample is a comparison sample, make it right next to its paired sample with no gap
        if (sample_name.indexOf("_comparison") >= 0){

          sample_element.attr("transform", "translate(" + last_bar_end + "," + graphdims.height_buffer + ")")
          last_bar_end = last_bar_end + func_bar_x.rangeBand()

        // Otherwise, place the sample the new padding distance away from the previous sample
        } else {

          sample_element.attr("transform", "translate(" + (last_bar_end + new_padding) + "," + graphdims.height_buffer + ")")
          // last_bar_end = last_bar_end + x.rangeBand() + new_padding

          // If the sample has no comparison sample, make a blank space the size of a comparison sample as placeholder
          if (!document.getElementById("func_" + sample_name + "_comparison")){
            last_bar_end = last_bar_end + (func_bar_x.rangeBand() * 2) + new_padding

          // Otherwise, the next bar will be the comparison bar
          } else {
            last_bar_end = last_bar_end + func_bar_x.rangeBand() + new_padding
          }
        }
      }
    }

    // If comparison samples exist, place marker text below paired samples to indicate which is which and record the space required for these labels to properly place sample labels and size the x-axis
    var max_sample_type_text_height = 0
    if (num_comparison_samples > 0){
      for (var sample_index = 0; sample_index < sample_order.length; sample_index++){

        var sample_name = sample_order[sample_index]
        var comparison_name = sample_name + "_comparison"
        // Skip comparison sample names
        if (sample_name.indexOf("_comparison") < 0){

          var sample_x = (d3.transform(d3.select("#func_" + sample_name).attr("transform")).translate)[0]
          d3.select("#func_x_axis")
            .append("text")
              .attr("class", "sample_type_label")
              .attr("x", 0)
              .attr("y", 0)
              .style("font-size", func_type_label_size)
              .style("alignment-baseline","hanging")
              .attr("dominant-baseline", "hanging")
              .attr("text-anchor", "middle")
              .attr("transform", "translate(" + (sample_x + (func_bar_x.rangeBand() / 2)- graphdims.sample_buffer - graphdims.width_buffer) + "," + graphdims.sample_label_buffer + ")")
              .text(taxa_based_bar_label)
          var comparison_x = sample_x + func_bar_x.rangeBand()
          d3.select("#func_x_axis")
            .append("text")
              .attr("class", "sample_type_label")
              .attr("x", 0)
              .attr("y", 0)
              .style("font-size", func_type_label_size)
              .style("alignment-baseline","hanging")
              .attr("dominant-baseline", "hanging")
              .attr("text-anchor", "middle")
              .attr("transform", "translate(" + (comparison_x + (func_bar_x.rangeBand() / 2) - graphdims.sample_buffer - graphdims.width_buffer) + "," + graphdims.sample_label_buffer + ")")
              .text(metagenome_based_bar_label)
        }
      }

      // Check if markers fit underneath bars
      var markers_fit = true
      d3.select("#func_x_axis")
        .selectAll(".sample_type_label")
          .each(function(){
            var this_text_object= d3.select(this);
            var curr_font_size = this_text_object.style("font-size");
            var font_size_value = curr_font_size.substring(0, curr_font_size.length - 2);
            var text_width = this_text_object[0][0].getBBox().width
            if (text_width > func_bar_x.rangeBand() & font_size_value - font_scaling_step_size > minimum_font_size){
              markers_fit = false;
            }
          })

      // Shrink marker font size untill all labels fit beneath their bars
      while (!markers_fit){
        markers_fit = true;
        d3.select("#func_x_axis")
          .selectAll(".sample_type_label")
            .each(function(){
              var this_text_object= d3.select(this);
              var curr_font_size = this_text_object.style("font-size");
              var font_size_value = curr_font_size.substring(0, curr_font_size.length - 2);
              this_text_object.style("font-size", (font_size_value - font_scaling_step_size) + "px")
              var text_width = this_text_object[0][0].getBBox().width
              if (text_width > func_bar_x.rangeBand() & font_size_value - font_scaling_step_size > minimum_font_size){
                markers_fit = false;
              }
            })
      }

      d3.select("#func_x_axis")
        .selectAll(".sample_type_label")
          .each(function(){
            var text_height = d3.select(this)
              .node()
                .getBBox()
                  .height
            if (text_height > max_sample_type_text_height){
              max_sample_type_text_height = text_height
            }
          })
    }

    // Position x axis ticks
    d3.select("#func_x_axis")
      .selectAll(".tick")
        .each(function(d){
          var tick = d3.select(this);
          // Skip comparison sample ticks which have no text
          if (tick.select("text")[0][0]){
            var sample_name = tick.select("text")[0][0].textContent;

            // If there are comparison samples, then there is only one padding gap every two samples
            if (num_comparison_samples > 0){
              // If there are comparison samples, then we make space for comparisons for all samples
              var fixed_sample_order = []
              for (var sample_index = 0; sample_index < sample_order.length; sample_index++){
                if (sample_order[sample_index].indexOf("_comparison") < 0){
                  fixed_sample_order.push(sample_order[sample_index])
                  fixed_sample_order.push(sample_order[sample_index] + "_comparison")
                }
              }

              var sample_index = fixed_sample_order.indexOf(sample_name);

              tick.attr("transform", "translate(" + ((func_bar_x.rangeBand() * sample_index) + (new_padding * (sample_index / 2))) + ",0)")
            // Otherwise, there's a padding gap between every pair of samples
            } else {

              var sample_index = sample_order.indexOf(sample_name);

              tick.attr("transform", "translate(" + ((func_bar_x.rangeBand() * sample_index) + (new_padding * sample_index)) + ",0)")
            }
          }
        })

    // Vertically center text relative to the bars they label
    d3.select("#func_x_axis")
      .selectAll(".tick")
        .selectAll("text")
          .each(function(){
            var text_object = d3.select(this)
            var text_height = text_object.node()
              .getBBox()
                .height
            // Check if comparison bar exists and if so, we center the label between the two bars
            if (num_comparison_samples > 0){
              text_object.attr("transform", "translate(" + (func_bar_x.rangeBand() - (text_height / 2)) + "," + (graphdims.sample_label_buffer + max_sample_type_text_height) + ") rotate(-90)")
            // Otherwise, center on the bar itself
            } else {
              text_object.attr("transform", "translate(" + ((func_bar_x.rangeBand() / 2) - (text_height / 2)) + "," + (graphdims.sample_label_buffer + max_sample_type_text_height) + ") rotate(-90)")
            }
          })


    // Check if sample labels fit underneath bars (height of text because we rotate it)
    var sample_labels_fit = true
    d3.select("#func_x_axis")
      .selectAll(".tick")
        .selectAll("text")
          .each(function(){
            var this_text_object = d3.select(this);
            var curr_font_size = this_text_object.style("font-size");
            var font_size_value = curr_font_size.substring(0, curr_font_size.length - 2);
            var text_height = this_text_object[0][0].getBBox().height;

            // If there are comparison samples, then labels have two bar widths to fit under
            if (num_comparison_samples > 0){
              if (text_height > func_bar_x.rangeBand() * 2 & font_size_value - font_scaling_step_size > minimum_font_size){
                sample_labels_fit = false;
              }

            // Otherwise, there's only one bar above the label
            } else if (text_height > func_bar_x.rangeBand() & font_size_value - font_scaling_step_size > minimum_font_size){
              sample_labels_fit = false;
            }
          })

    // Shrink sample label font size untill all labels fit beneath their bars
    while (!sample_labels_fit){
      sample_labels_fit = true;
      d3.select("#func_x_axis")
      .selectAll(".tick")
        .selectAll("text")
          .each(function(){
            var this_text_object = d3.select(this);
            var curr_font_size = this_text_object.style("font-size");
            var font_size_value = curr_font_size.substring(0, curr_font_size.length - 2);
            this_text_object.style("font-size", (font_size_value - font_scaling_step_size) + "px")
            var text_height = this_text_object[0][0].getBBox().height;

            // If there are comparison samples, then labels have two bar widths to fit under
            if (num_comparison_samples > 0){
              if (text_height > func_bar_x.rangeBand() * 2 & font_size_value - font_scaling_step_size > minimum_font_size){
                sample_labels_fit = false;
              }

            // Otherwise, there's only one bar above the label
            } else if (text_height > func_bar_x.rangeBand() & font_size_value - font_scaling_step_size > minimum_font_size){
              sample_labels_fit = false;
            }
          })
    }

    // Calculate the maximum width of x-axis text (for non-comparison samples) (height after rotation)
    var max_x_axis_text_width = 0;
    d3.select("#func_x_axis")
      .selectAll(".tick")
        .selectAll("text")
          .each(function(){
            var text_width = d3.select(this)
              .node()
                .getBBox()
                  .width
            if (text_width > max_x_axis_text_width & this.textContent.indexOf("_comparison") < 0){
              max_x_axis_text_width = text_width
            }
          })

    var max_group_label_height = 0;

    // If we are grouping samples, create colored backgrounds and group labels for the samples in those groups
    if (grouping != "N/A") {

      // Get the set of group names in order
      var groupnames = sampledata.map(function(e) { return e[grouping]; });
      groupnames = groupnames.filter(function(v,i) { return groupnames.indexOf(v) == i; });
      
      // Create a map associating each group with its name and the minimum and maximum x positions of samples in the group
      var groups = [];
      groupnames.forEach( function(gn) { groups.push({ "Name": gn, "Min": width, "Max": 0}); } );
            
    
      d3.selectAll("#func_bars").selectAll(".g").each( function(d) {
      	samp_col = d3.keys(d).pop()
        var curg = fB.getSampleGroup(d[samp_col], sampledata, grouping);
        var gindex = groups.map(function(e) { return e.Name; }).indexOf(curg);
        var xpos = this.getAttribute("transform");
        xpos = parseFloat(xpos.substring(10,xpos.indexOf(",")));
        if (xpos < groups[gindex].Min) { groups[gindex].Min = xpos; }
        if (xpos > groups[gindex].Max) { groups[gindex].Max = xpos; }
      });

      d3.select("#func_bar_xtick_svg").selectAll("g.x_samp_g_label")
        .data(groups)
          .enter()
          .insert("g", "g.x_axis")
          .classed("x_samp_g_label",true)
          .append("rect")
            .attr("x", function(d) { return d.Min - graphdims.width_buffer; } )
            .attr("y", 0)
            .attr("width", function(d) { return d.Max - d.Min + func_bar_x.rangeBand(); })
            .attr("fill", function(d) { return sampleColor(d.Name); });

      d3.select("#func_bar_xtick_svg").selectAll(".x_samp_g_label")
        .append("text")
          .attr("x", function(d) { return d.Min - graphdims.width_buffer + (d.Max - d.Min + func_bar_x.rangeBand())/2 })
          .attr("text-anchor","middle")
          .attr("font-size", group_label_size)
          .text(function(d) { return d.Name; });

      // Check if any group label is too wide to fit underneath its group
      var group_labels_fit = true;
      d3.select("#func_bar_xtick_svg")
        .selectAll(".x_samp_g_label")
          .each( function(d){
            var this_text_object = d3.select(this).select("text");
            var curr_font_size = this_text_object.style("font-size");
            var font_size_value = curr_font_size.substring(0, curr_font_size.length - 2);
            var text_width = this_text_object[0][0].getBBox().width
            if (text_width > d.Max - d.Min + func_bar_x.rangeBand() & font_size_value - font_scaling_step_size > minimum_font_size){
              group_labels_fit = false;
            }
          })

      // Scale group label font size to fit underneath group
      while (!group_labels_fit){
        group_labels_fit = true;
        d3.select("#func_bar_xtick_svg")
        .selectAll(".x_samp_g_label")
          .each( function(d){
            var this_text_object = d3.select(this).select("text");
            var curr_font_size = this_text_object.style("font-size");
            var font_size_value = curr_font_size.substring(0, curr_font_size.length - 2);
            this_text_object.style("font-size", (font_size_value - font_scaling_step_size) + "px");
            var text_width = this_text_object[0][0].getBBox().width;
            if (text_width > d.Max - d.Min + func_bar_x.rangeBand() & font_size_value - font_scaling_step_size > minimum_font_size){
              group_labels_fit = false;
            }
          })
      }


      for (var group_index = 0; group_index < groups.length - 1; group_index++){
        d3.select("#func_bars").append("line")
          .attr("class", "bar_group_divider")
          .attr("y1", graphdims.height_buffer)
          .attr("x1", groups[group_index].Max + func_bar_x.rangeBand() + ((groups[group_index + 1].Min - groups[group_index].Max - func_bar_x.rangeBand()) / 2))
          .attr("x2", groups[group_index].Max + func_bar_x.rangeBand() + ((groups[group_index + 1].Min - groups[group_index].Max - func_bar_x.rangeBand()) / 2))
      }

      // Determine the maximum height of any of the group labels
      d3.select("#func_bar_xtick_svg").selectAll(".x_samp_g_label")
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
    var x_axis_height = max_sample_type_text_height + max_x_axis_text_width + max_group_label_height + graphdims.sample_label_buffer + buffer_between_sample_labels_and_bottom;
    d3.select("#func_bar_xtick_svg")
      .attr("y", dims.height - x_axis_height)
      .attr("height", x_axis_height)

    // Make the colored label backgrounds the correct height
    d3.select("#func_bar_xtick_svg").selectAll("rect")
        .attr("height", x_axis_height)

    // Position the group labels
    d3.select("#func_bar_xtick_svg").selectAll(".x_samp_g_label")
      .selectAll("text")
        .each(function(){
          d3.select(this)
            .attr("y", x_axis_height - buffer_between_sample_labels_and_bottom)
        })

    // Set the height of the group dividers
    d3.select("#func_bars").selectAll("line.bar_group_divider")
      .each(function(){
        d3.select(this)
          .attr("y2", dims.height - x_axis_height)
      })

    // Set the y range to be between the top of the barplot svg and the top of the x-axis
    func_bar_y.range([dims.height - x_axis_height - graphdims.height_buffer, 0]);

    // Initialize y-axis
    svglink.append("g")
      .attr("class", "y axis")
      .attr("transform","translate(" + (dims.width - graphdims.width) + "," + graphdims.height_buffer + ")")
      .call(func_bar_y_axis)
      .selectAll("text")
        .style("font-size", y_axis_tick_size)

    // Initialize the y axis label
    svglink.append("text")
      .attr("class", "y_label")
      .attr("id", "func_bar_y_label")
      .attr("text-anchor", "middle")
      .attr("y", 0)
      .attr("x", -(dims.height - x_axis_height) / 2)
      .attr("font-size", y_axis_label_size)
      .attr("dy", ".75em")
      .attr("transform", "rotate(-90)")
      .text(function_abundance_y_axis_title);

    // Now that we know the y range, position the tops and bottoms of the bar rectangles
    Sample.selectAll("rect")
      .attr("y", function(d){
        return func_bar_y(d.y1);
      })
      .attr("height", function(d){
        return func_bar_y(d.y0) - func_bar_y(d.y1) + 1;
      })
  }

  fB.select_bars = function(func, colors){
    selected = d3.select("#func_bars")
      .selectAll(".g")
      .selectAll("rect")
      .filter(function(d) {
        return d.func == func;
      });
    current_color = selected.style("fill");
    var trimstr = func.replace(/\W+/g,'') + "_tx_func_bar";
    if (d3.select("#" + trimstr)[0][0] == null) {
      var t = textures.lines()
        .thicker()
        .orientation("diagonal", "6/8")
        .background(colors(func).brighter(0.2))
        .id(trimstr)
        .stroke("white");
      d3.select("#patternsvg").call(t);
    }
    selected.style("opacity", 1)
      .style("fill", "url(#" + trimstr + ")");
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
    selected.style("fill", function(d){
      var trimstr = d.func.replace(/\W+/g,'') + "_tx_contribution";
      if (d3.select("#" + trimstr)[0][0] == null) {
        var t = textures.lines()
          .thicker()
          .background(d3.rgb(colors(d.func)).brighter(0.2))
          .id(trimstr)
          .stroke("white");
        d3.select("#patternsvg").call(t);
      }

      return "url(#" + trimstr + ")";
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
    var trimstr = func.replace(/\W+/g,'') + "_tx_contribution";
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
