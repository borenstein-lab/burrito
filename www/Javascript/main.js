// main.js
//

mainui.createUI();

var aspecrat, width, height, hidewidth, margin;
var barDimensions, navDims, bpdims;
var duration; //used in trees to set animation speed
var showScale;
var data_cube;
var currently_displayed_taxa = [];
var currently_displayed_functions = [];
var resize_timeout;
var curr_window_width = window.innerWidth;
var curr_window_height = window.innerHeight;

var MainSVG, plotSVG, sidebarSVG;

var upload_steps = ["file_upload", "contribution_calculation", "data_validation", "hierarchy_processing", "contribution_formatting", "taxonomic_abundance_formatting", "hierarchy_formatting", "average_function_abundance_formatting", "metadata_formatting"]

var upload_step_text = ["File upload", "Contribution calculation", "Data validation", "Hierarchy processing", "Contribution formatting", "Taxonomic abundance formatting", "Hierarchy formatting", "Average function abundance formatting", "Metadata formatting"]

var upload_step_message_text = ["Uploading files", "Calculating contributions", "Validating data", "Processing hierarchies", "Formatting contributions", "Formatting taxonomic abundances", "Formatting hierarchies", "Formatting average function abundances", "Formatting metadata"]

draw_svg = function() {
	if (d3.select("#mainsvg")[0][0] === null) {
		aspecrat = window.innerWidth / window.innerHeight;

		width = 1000 * aspecrat;
		height = 1000;
		//hidewidth = 0;
		margin ={left:20, right:20, top:20, bottom:20 , btwnavbar:40, btwbars:40};
		barDimensions = {width: (width/2 - (margin.btwbars/2) - margin.left), height: (height / 2) - margin.bottom - (margin.btwnavbar/2) };
		navDims = {width: (width - margin.left - margin.right), height: (height/2) - margin.top - (margin.btwbars/2)};
		navDims.treewidth = navDims.width * 2/9;
		bpdims = {height:navDims.height, width: navDims.width, header:margin.top};
		duration = 300;
		roots = {};
		showScale = false;

		trees.SetUp(navDims);
		
		d3.select("body").classed("svgBody", true);

		MainSVG = d3.select("#mainplot").append("svg")
			.attr("id","mainsvg")
			.attr("viewBox","0 0 " + width + " " + height + "")
			.attr("preserveAspectRatio","none");

		uploader.svgCreated = true;	
		plotSVG = d3.select("#mainsvg").append("svg")
			.attr("id","plots_svg")
			.attr("viewBox","0 0 " + width + " " + height + "")
			.attr("preserveAspectRatio","none")
			.style("font-family", "Verdana");
	
		sidebarSVG = d3.select("#mainsvg").append("svg")
			.attr("id","sidebar_svg")
			.attr("x",-150)
			.attr("y",0)
			.attr("width",180)
			.attr("height",height);
		
		sidebarSVG.append("rect")
			.attr("x",0)
			.attr("y",0)
			.attr("width",150)
			.attr("height",height)
			.attr("fill","#E6E6E6");

		d3.select("#sidebar_svg").append("polygon")
			.attr("id","sidebar_hide")
			.attr("points","150,0 150,60 180,30")
			.attr("fill","#D0D0D0");

		document.getElementById("sidebar_hide").addEventListener('click', function() {
			var sidebarz = d3.select("#sidebar_svg");
			var curpos = parseFloat(sidebarz[0][0].attributes.x.value);
			if (curpos > -10) {
				sidebarz.transition().attr("x",-150);
				d3.select("#sidebar_hide")
					.attr("points","150,0 150,60 180,30")
					.attr("fill","#D0D0D0");
			} else {
				sidebarz.transition().attr("x",0);
				d3.select("#sidebar_hide")
					.attr("points","120,30 150,0 150,60")
					.attr("fill","#606060");
			}
		});

		
		d3.select("#sidebar_svg").append("foreignObject")
			.attr("x", 20)
			.attr("y", 80)
		.append("xhtml:div")
			.attr("id","SaveInputDiv")
			.style("width","120px")
			.html("<button id='switch_scale' type='button'>Show scale</button><br><br><br><br><br><br><br>" +
				"<p>Output file prefix:</p>" + 
				"<input style='width:110px' id='saveFileNameInput' type='text' name='outfilename' value='burrito'><br><br><p>Image format:</p>" +
				"<form action=''><label> <input type='radio' name='format' value='PNG' checked='checked'> PNG</label><br><label><input type='radio' name='format' value='SVG'> SVG </label></form>" + 
			"<br><br><button id='save_screenshot' class='savebutton' type='button'>Save screenshot</button>" +	
			"<br><br><button id='save_taxa_bar' class='savebutton' type='button'>Save taxonomy plot</button>" +	
			"<br><br><button id='save_taxonomy_leg' class='savebutton' type='button'>Save taxonomy legend</button>" +	
			"<br><br><button id='save_func_bar' class='savebutton' type='button'>Save function plot</button>" +
			"<br><br><button id='save_function_leg' class='savebutton' type='button'>Save function legend</button>" +
			"<br><br><br><br><button id='return_to_upload' type='button'>Return to the upload page</button>");

	
	document.getElementById('save_screenshot').addEventListener('click', function() {
			if (d3.select('input[name="format"]:checked').node().value === 'PNG') {
				var fileString = d3.select("#saveFileNameInput").property("value") + "_screenshot.png";
				saveSvgAsPng(document.getElementById("plots_svg"), fileString, { backgroundColor : "white", scale: 1.5})
			} else { // SVG
				var fileString = d3.select("#saveFileNameInput").property("value") + "_screenshot.svg";
				svgAsDataUri(document.getElementById("plots_svg"), {}, function(uri) { 
					saveSvg(uri, fileString)
				});
			}
		}); 	
	
	document.getElementById('save_taxa_bar').addEventListener('click', function(){
			if (d3.select('input[name="format"]:checked').node().value === 'PNG') {
				var fileString = d3.select("#saveFileNameInput").property("value") + "_taxa_bar.png";
				saveSvgAsPng(document.getElementById("taxa_bars"), fileString, { backgroundColor : "white", scale: 1.5})
			} else { // SVG
				var fileString = d3.select("#saveFileNameInput").property("value") + "_taxa_bar.svg";
				svgAsDataUri(document.getElementById("taxa_bars"), {}, function(uri) { 
					saveSvg(uri, fileString)
				});
			}
		});
		
		document.getElementById('save_taxonomy_leg').addEventListener('click', function(){
			if (d3.select('input[name="format"]:checked').node().value === 'PNG') {
				var fileString = d3.select("#saveFileNameInput").property("value") + "_taxa_legend.png";
				saveSvgAsPng(document.getElementById("saveLegBar0"), fileString, { backgroundColor : "white", scale: 1.5})
			} else { // SVG
				var fileString = d3.select("#saveFileNameInput").property("value") + "_taxa_legend.svg";
				svgAsDataUri(document.getElementById("saveLegBar0"), {}, function(uri) {
					saveSvg(uri, fileString)
				});
			}
		
		});
		
		document.getElementById('save_func_bar').addEventListener('click', function(){
			if (d3.select('input[name="format"]:checked').node().value === 'PNG') {
				var fileString = d3.select("#saveFileNameInput").property("value") + "_func_bar.png";
				saveSvgAsPng(document.getElementById("func_bars"), fileString, { backgroundColor : "white", scale: 1.5})
			} else { // SVG
				var fileString = d3.select("#saveFileNameInput").property("value") + "_func_bar.svg";
				svgAsDataUri(document.getElementById("func_bars"), {}, function(uri) { 
					saveSvg(uri, fileString)
				});
			}
		});

		document.getElementById('save_function_leg').addEventListener('click', function(){
			if (d3.select('input[name="format"]:checked').node().value === 'PNG') {
				var fileString = d3.select("#saveFileNameInput").property("value") + "_func_legend.png";
				saveSvgAsPng(document.getElementById("saveLegBar1"), fileString, { backgroundColor : "white", scale: 1.5})
			} else { // SVG
				var fileString = d3.select("#saveFileNameInput").property("value") + "_func_legend.svg";
				svgAsDataUri(document.getElementById("saveLegBar1"), {}, function(uri) { 
					saveSvg(uri, fileString)
				});
			} 
		});

		document.getElementById('switch_scale').addEventListener('click', function() {
			if (showScale) {
				d3.select("#switch_scale").text("Show scale");
				showScale = false;
			} else {
				d3.select("#switch_scale").text("Hide scale");
				showScale = true;
			}
			uploader.update_plots();
		});

		document.getElementById('return_to_upload').addEventListener('click', function(){
			d3.select("#mainsvg").remove();
			d3.select("body").classed("svgBody", false);
			mainui.uploadMode = "";
			uploader.reset_load_flags();
		})

		// Make the help svg overlay and mouseover trigger
		
		helpSVG = d3.select("#mainsvg").append("svg")
			.attr("id","help_svg")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", width)
			.attr("height", height);

		helpSVG.append("rect")
			.attr("id", "help_background")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", width)
			.attr("height", height)
			.attr("fill", "#404040")
			.attr("fill-opacity", "0");

		helpSVG_button = helpSVG.append("g")
			.attr("id", "help_button")
			.attr("transform", "translate( " +  0.97 * width + ", " + 0.03 * height + ")");

		helpSVG_button.append("circle")
			.attr("fill", "#202020")
			.attr("r", 12)
			.attr("stroke", "none");

		helpSVG_button.append("text")
			.attr("stroke","white")
			.attr("text-anchor","middle")
			.attr("y", 6)
			.attr("font-size",16)
			.classed("noselect","true")
			.text("?");

		helpSVGitems = helpSVG.append("g")
			.attr("id","help_items")
			.attr("visibility", "hidden");

		helpSVG_button.on("mouseover", function(d) { 
				d3.select("#help_background").attr("fill-opacity", "0.2");
				d3.select("#help_items").attr("visibility", "visible"); 
			})
			.on("mouseout", function(d) {
				d3.select("#help_background").attr("fill-opacity", "0");
				d3.select("#help_items").attr("visibility", "hidden");
			});

		helpOverlay.createItems();

		draw_loading();
	}
}

add_upload_step = function(upload_step_name, initial_text, step_number, upload_stepsg, last_step){

	var xpos = width * step_number / (upload_steps.length + 1)
	var ypos = height / 3

	var upload_stepg = upload_stepsg.append("g")
		.attr("id", upload_step_name)
		.attr("class", "pending")

	if (!last_step){
		upload_stepg.append("rect")
			.attr("x", xpos)
			.attr("y", ypos)
			.attr("width", width / (upload_steps.length + 1))
	}

	upload_stepg.append("circle")
		.attr("cx", xpos)
		.attr("cy", ypos)

	// Uncomment to add text underneath the circle for each step
	// var upload_text = upload_stepsg.append("text")
	// 		.attr("id", upload_step_name + "_text_" + word_index)
	// 		.attr("x", xpos)
	// 		.attr("y", ypos + (width / 49))

	// var text_words = initial_text.split(" ")
	// for (var word_index = 0; word_index < text_words.length; word_index++){
	// 	upload_text.append("tspan")
	// 		.attr("x", xpos)
	// 		.attr("text-anchor", "middle")
	// 		.attr("dy", "1.4em")
	// 		.text(text_words[word_index])
	// }
}

add_table_loading_bar = function(loading_bar_name, loading_text_name, table_name, ypos, loadg){
	
	var bar_width = width / 2
	var bar_height = height / 40
	var xpos = (width / 2) - (bar_width / 2)

	loadg.append("text")
		.attr("x", width / 2)
		.attr("y", ypos)
		.attr("text-anchor", "middle")
		.text(table_name)

	loadg.append("rect")
		.attr("class", "background_bar")
		.attr("x", xpos)
		.attr("y", ypos + 6)
		.attr("width", bar_width)
		.attr("height", bar_height)

	loadg.append("rect")
		.attr("id", loading_bar_name)
		.attr("class", "load_bar")
		.attr("x", xpos)
		.attr("y", ypos + 6)
		.attr("width", 0)
		.attr("height", bar_height)

	loadg.append("text")
		.attr("id", loading_text_name)
		.attr("x", width / 2)
		.attr("y", ypos + 6 + bar_height + 18)
		.attr("text-anchor", "middle")
		.attr("No samples loaded")
}

draw_loading = function() {
	var loadg = MainSVG.append("g")
		.attr("id","loadingG");
	
	var upload_stepsg = loadg.append("g")
		.attr("id", "upload_stepsG")
		.attr("class", "upload_steps")

	for (var upload_step_index = 0; upload_step_index < upload_steps.length; upload_step_index++){

		var last_step = !(upload_step_index < upload_steps.length - 1)
		add_upload_step(upload_steps[upload_step_index], upload_step_text[upload_step_index], upload_step_index + 1, upload_stepsg, last_step)
	}

	loadg.append("text")
		.attr("id", "upload_step_message")
		.attr("x", width / 2)
		.attr("y", (height / 3) + (width / 15))
		.attr("text-anchor", "middle")

	var loading_barsg = loadg.append("g")
		.attr("id", "loading_barsG")
		.attr("class", "loading_bars")

	add_table_loading_bar("taxonomic_abundance_loading_bar", "taxonomic_abundance_loading_text", "Taxonomic abundance table", (height / 2) - (height / 20), loading_barsg)

	add_table_loading_bar("contribution_loading_bar", "contribution_loading_text", "Contribution table", (height / 2) + (height / 20), loading_barsg)
}

Shiny.addCustomMessageHandler("upload_status", function(step){
	var upload_done = true
	for (var upload_step_index = 0; upload_step_index < upload_steps.length; upload_step_index++){
		if (step != upload_steps[upload_step_index]){
			document.getElementById(upload_steps[upload_step_index]).setAttribute("class", "complete")
		} else if (step == upload_steps[upload_step_index]){
			document.getElementById(step).setAttribute("class", "in_progress")
			document.getElementById("upload_step_message").innerHTML = upload_step_message_text[upload_step_index]
			upload_done = false
			break
		}
	}

	if (upload_done){
		document.getElementById("upload_step_message").innerHTML = "Downloading tables"
	}
})

Shiny.addCustomMessageHandler("number_of_samples_message", function(num_samples){
	document.getElementById("taxonomic_abundance_loading_text").innerHTML = "0/" + num_samples + "samples loaded"
	document.getElementById("contribution_loading_text").innerHTML = "0/" + num_samples + "samples loaded"
})

Shiny.addCustomMessageHandler("abort", function(message){
	d3.select("#mainsvg").remove();
	d3.select("body").classed("svgBody", false);
	alert(message);
})

update_progress = function(curr_sample, total_samples, table_name){
	if (table_name == "contribution"){
		curr_sample = curr_sample - 1
		total_samples = total_samples-1
	}
	if (curr_sample > 0){
		document.getElementById(table_name + "_loading_text").innerHTML = curr_sample + "/" + (total_samples) + " samples loaded"
		if (curr_sample <= total_samples){
			document.getElementById(table_name + "_loading_bar").setAttribute("width", (width / 2) * (curr_sample / total_samples))
		}
		if (curr_sample == total_samples){
			document.getElementById(table_name + "_loading_bar").setAttribute("class", "complete")
		}
	}
}

draw_everything = function(otu_table, contribution_table, tax_hierarchy_text, func_hierarchy_text, samp_map_text, func_averages, otu_sample_order, func_sample_order, taxonomic_levels, function_levels){
	
	var grouping = null;
	if (mainui.uploadMode == "example"){
		grouping = "Group";
	} else {
		grouping = document.getElementById("metadata_factor_selector").value;
	}
	
	// Find the new window size, adjust the aspect ratio
	aspecrat = window.innerWidth / window.innerHeight;
	width = aspecrat * 1000;
	if (showScale) {
		margin.right = 20 + (width * 0.1);
	} else {
		margin.right = 20;
	}
	barDimensions = {width: (width - margin.left - margin.right - margin.btwbars) /2, height: (height / 2) - margin.bottom - (margin.btwnavbar/2) };
	navDims = {width: (width - margin.left - margin.right), height: (height/2) - margin.top - (margin.btwbars/2)};
	navDims.treewidth = navDims.width * 2/9;
	bpdims = {height:navDims.height, width: navDims.width, header:margin.top, treewidth: navDims.treewidth};
	
	MainSVG.attr("viewBox","0 0 " + width + " " + height + "")
	plotSVG.attr("viewBox","0 0 " + width + " " + height + "")
	
	d3.select("#navbar").remove()
	d3.select("#taxa_bars").remove()
	d3.select("#func_bars").remove()
	d3.select("#scalebar").remove()
	d3.select("#loadingG").remove()

	helpOverlay.redraw();

	var NavSVG = plotSVG.insert("svg", "#sidebar")
    	.attr("x",margin.left)
	.attr("y",margin.top)
	.attr("width", width - margin.left - margin.right)
	.attr("height", (height/2) - margin.top - (margin.btwnavbar / 2))
	.attr("id","navbar")
	.style("font-family", "Verdana");
			
	var bpG = NavSVG.append("g")
		.attr("transform","translate("+ (navDims.width / 2) +","+ margin.top +")");
		
	trees.SetUp2("navbar", margin, navDims, tax_hierarchy_text, func_hierarchy_text);
	
	var TaxaBar = plotSVG.insert("svg", "#sidebar")
		.attr("x",margin.left)
		.attr("y",(height/2) + (margin.btwnavbar/2))
		.attr("width", barDimensions.width)
		.attr("height",barDimensions.height)
		//.attr("width",100)
		//.attr("height",100)
		//.attr("viewBox","0 0 100 100")
		.attr("id", "taxa_bars")
		.style("font-family", "Verdana");
		//.attr("preserveAspectRatio","none");
		//.attr("transform","scale(2.0)");
		
	var FunctionBar = plotSVG.insert("svg", "#sidebar")
		.attr("x", margin.left + barDimensions.width + margin.btwbars)
		.attr("y",(height/2) + (margin.btwnavbar/2))
		.attr("width", barDimensions.width)
		.attr("height",barDimensions.height)
		//.attr("viewBox","0 0 100 100")
		.attr("id", "func_bars")
		.style("font-family", "Verdana");
		
	var ScaleSVG = plotSVG.insert("svg", "#sidebar")
		.attr("x", width * 0.9)
		.attr("y", margin.top)
		.attr("width", width * 0.1)
		.attr("height", height - margin.top - margin.bottom)
		.attr("id", "scalebar");

	var bpvisdata;
	
	
	func_averages = d3.tsv.parse(func_averages);
	samplemap = d3.tsv.parse(samp_map_text);
	
	otu_abundance_data = otu_table

	// If the data cube already exists, use it to determine the current tree state before re-initializing so we can open back up to the right state
	if (data_cube){
		currently_displayed_taxa = [];
		currently_displayed_functions = [];
		for (var i = 0; i < data_cube.displayed_taxa.length; i++){
			currently_displayed_taxa.push(data_cube.displayed_taxa[i])
		}
		for (var i = 0; i < data_cube.displayed_funcs.length; i++){
			currently_displayed_functions.push(data_cube.displayed_funcs[i])
		}
	}


	//initialize display cube
	data_cube = data_cube_wrapper.make_cube(); //defines the functions needed
	data_cube.initialize_cube(contribution_table, trees.getTaxaTreeData(), trees.getFuncTreeData(), func_averages);
	//if( not expand to OTU level
	/*genus_abundance_data = data_cube.reduce_to_genus(otu_abundance_data)*/
	////////////////////////// Colors
	//color_option = "Categories" //Categories or Random
	var color_option = null;
	if (mainui.uploadMode == "example"){
		color_option = "Categories";
	} else {
		color_option = d3.select("#color_option_selector").property("value");
	}

	var setUpColorScale = function(main_list, list_type, color_scale){ //list_type is taxa or funcs
		//color scale already has core colors set up
		//1st - divide up color space into number of leaves
		//then assign each subgroup of leaves alternating extremes
		//then assign each parent extreme or average value of its children
		for(j=0; j < main_list.length; j++){
			if(list_type=="taxa"){
				var leaves = data_cube.get_leaves(main_list[j], data_cube.taxa_lookup)
			} else {
				var leaves = data_cube.get_leaves(main_list[j], data_cube.func_lookup)
			}
		    color_range = leaves.length //number of colors to expand in each direction depends on # of leaves
			//generate variations of core color
		    var core_color = d3.hcl(color_scale(main_list[j]))
	    	new_colors = []
	    	flip = -1
	    	for(k=0; k < color_range; k++){
	    		var new_color = d3.hcl()
	    		if(list_type == "taxa"){
	    			light_range = 14
	    			} else {
	    				light_range = 28
	    			}
				new_color["l"] = core_color["l"] - light_range*flip*(k + (k%2))/(color_range+1)
	      		new_color["h"] = core_color["h"] - 7.5*flip*(k+ (k%2))/(color_range+1)
	      		new_color["c"] = core_color["c"] - 4*flip*(k+ (k%2))/(color_range+1)
	      		new_colors.push(d3.hcl(new_color))
	      		flip *= -1
	      	}
			new_colors = new_colors.sort(function(a,b){ return a.l - b.l })
			
			
	      	if(list_type=="taxa"){
	      		layer1 = data_cube.taxa_lookup[main_list[j]]
	      		descendents = data_cube.get_descendents(main_list[j], data_cube.taxa_lookup)
	      		first_level = descendents.filter(function(d){ if(layer1.level != 1){ return data_cube.taxa_lookup[d].level == 1 } else { return data_cube.taxa_lookup[d].level == 0 }})
	      	} else {
	      		layer1 = data_cube.func_lookup[main_list[j]]
	      		descendents = data_cube.get_descendents(main_list[j], data_cube.func_lookup)
	      		first_level = descendents.filter(function(d){ if(layer1.level != 1){ return data_cube.func_lookup[d].level == 1 } else { return data_cube.func_lookup[d].level == 0 }})
	      	}
	      	num_levels = layer1.level
			
	      	color_count = 0	      	
	      	for(k=0; k < first_level.length; k++){
	      		if(list_type=="taxa"){
	      			desc_leaves = data_cube.get_leaves(first_level[k], data_cube.taxa_lookup)
	      		} else {
	      			desc_leaves = data_cube.get_leaves(first_level[k], data_cube.func_lookup)	      			
	      		}
	      		color_slice = new_colors.slice(color_count, color_count + desc_leaves.length) 
	      		color_count += desc_leaves.length
	      		
	      		//add leaf colors to scale
	      		for(m=0; m < desc_leaves.length; m++){
	      			if(color_scale.domain().indexOf(desc_leaves[m])==-1){
	      				if(m % 2==0){ //go from front or back of slice
			    			color_scale.range().push(color_slice[m].toString())
	      				} else {
	      					color_scale.range().push(color_slice[desc_leaves.length-m].toString())
	      				}
	      				color_scale(desc_leaves[m])
	      			}
	      		}
	      	}
	      	//now get the rest of the levels, assign mean or most extreme value of descendents
	      	if(layer1.level != 1){ level = 1 } else { level = 0; }
	      	while(level < num_levels){
	      		if(list_type=="taxa"){
	      			level_items = descendents.filter(function(d){ return data_cube.taxa_lookup[d].level == level })
	      		} else {
	      			level_items = descendents.filter(function(d){ return data_cube.func_lookup[d].level == level })
	      		}
	      		parent_color = core_color
	      		for(m=0; m < level_items.length; m++){
	      			if(list_type=="taxa"){
	      				desc_leaves = data_cube.get_leaves(level_items[m], data_cube.taxa_lookup)
	      			} else {
	      				desc_leaves = data_cube.get_leaves(level_items[m], data_cube.func_lookup)
	      			}
	      			desc_colors = desc_leaves.map(function(d){ return d3.hcl(color_scale(d)) })
	      		if(m%2 == 0 & level_items.length > 1){
	      			parent_color.h = d3.mean(desc_colors.map(function(d){ return d.h}))
	      			parent_color.c = d3.mean(desc_colors.map(function(d){ return d.c}))
	      			parent_color.l = d3.min(desc_colors.map(function(d){ return d.l}))
	      		} else if((level_items.length > 1) & m%2 != 0) {
	      			parent_color.h = d3.mean(desc_colors.map(function(d){ return d.h}))
	      			parent_color.c = d3.mean(desc_colors.map(function(d){ return d.c}))
	      			parent_color.l = d3.max(desc_colors.map(function(d){ return d.l}))
	      		} else{
					parent_color.h = d3.mean(desc_colors.map(function(d){ return d.h}))
	      			parent_color.c = d3.mean(desc_colors.map(function(d){ return d.c}))
	      			parent_color.l = d3.mean(desc_colors.map(function(d){ return d.l}))
	      		
 	      		}
		      	if(color_scale.domain().indexOf(level_items[m])==-1){
		      		color_scale.range().push(parent_color.toString())
	      			color_scale(level_items[m])
	      		}
	      		}
	      		level++;
	      	}
	      }
		return color_scale;
	}
	if(color_option == "Categories"){
	
		//set up colors using data cube
		//colors	
		//start one level in for bacteria but at the 0th level for functions
		num_function_categories = data_cube.func_tree.length
		num_taxa_categories = data_cube.taxa_tree.length
		if (data_cube.taxa_tree[0].level != 0){
			num_taxa_categories = 0
			for(j=0; j < data_cube.taxa_tree.length; j++){
				num_taxa_categories += data_cube.taxa_tree[j].values.length
			}
		}
		//taxa colors
		//91 for the max # of phyla in GG
		taxa_palette = colorbrewer["Set3"][(d3.keys(colorbrewer["Set3"]).pop())].concat(colorbrewer["Dark2"][(d3.keys(colorbrewer["Dark2"]).pop())]).concat(colorbrewer["Accent"][d3.keys(colorbrewer["Accent"]).pop()]).concat(d3.shuffle(colorbrewer["Paired"][d3.keys(colorbrewer["Paired"]).pop()])).concat(d3.shuffle(colorbrewer["YlGnBu"][6].concat(colorbrewer["PuOr"][6]).concat(colorbrewer["RdYlBu"][6]).concat(colorbrewer["Spectral"][11]).concat(colorbrewer["RdPu"][6]).concat(colorbrewer["Greys"][5]).concat(colorbrewer["PiYG"][6]).concat(colorbrewer["BrBG"][5])))
		taxa_palette = taxa_palette.slice(0,num_taxa_categories)

		func_palette = colorbrewer["Set1"][(d3.keys(colorbrewer["Set1"]).pop())].concat(colorbrewer["Dark2"][d3.keys(colorbrewer["Dark2"]).pop()]).concat(colorbrewer["Accent"][d3.keys(colorbrewer["Accent"]).pop()]).concat(d3.shuffle(colorbrewer["Paired"][d3.keys(colorbrewer["Paired"]).pop()])).concat(d3.shuffle(colorbrewer["YlGnBu"][6].concat(colorbrewer["PuOr"][6]).concat(colorbrewer["RdYlBu"][6]).concat(colorbrewer["Spectral"][11]).concat(colorbrewer["RdPu"][6]).concat(colorbrewer["Greys"][5]).concat(colorbrewer["PiYG"][6]).concat(colorbrewer["BrBG"][5])))
		
		if(num_function_categories > func_palette.length){
			console.log("too many function categories, colors will repeat")
		}
		func_palette = func_palette.slice(0, num_function_categories)
		
		var taxa_colors = d3.scale.ordinal()
		taxa_colors.range(taxa_palette)
		main_taxa = []
		for(j=0; j < data_cube.taxa_tree.length; j++){
			if (data_cube.taxa_tree[0].level != 0){
				main_taxa = main_taxa.concat(data_cube.taxa_tree[j].values.map(function(d){ return d.key;}))
			} else {
				main_taxa = data_cube.taxa_tree.map(function(d){ return d.key})
			}
		}
		
		taxa_colors.domain(main_taxa)
		taxa_colors = setUpColorScale(main_taxa, "taxa", taxa_colors)

		kingdoms = data_cube.taxa_tree.map(function(d){ return d.key})
		col1 = d3.hcl("black") //.brighter()
		//if there are other kingdoms besides Bacteria, shades of grey
		if (data_cube.taxa_tree[0].level != 0){
			for(j=0; j < kingdoms.length; j++){
				col1.l = col1.l + 20
				taxa_colors.range().push(col1.toString())
				taxa_colors(kingdoms[j])
			}
		}
		taxa_colors.range().push(d3.hcl("black").toString())//.brighter())
		taxa_colors("All Taxa")

		//func colors
		var func_colors = d3.scale.ordinal()
		func_colors.range(func_palette)
		main_funcs = data_cube.func_tree.map(function(d){ return d.key;})
		func_colors.domain(main_funcs)
		func_colors = setUpColorScale(main_funcs, "funcs", func_colors)
		func_colors.range().push(d3.hcl("black").toString())//.brighter())
		func_colors("All Functions")
	
		
	} else if(color_option == "Random"){
		taxa_colors_palette = (d3.scale.category20()).range()
		taxa_colors = d3.scale.ordinal()
		taxa_colors.range(taxa_colors_palette)
		taxa_colors.domain(d3.keys(data_cube.taxa_tree_lookup))
		
		func_colors_palette = colorbrewer["Set3"]["12"].concat(colorbrewer["Dark2"]["8"])	
		func_colors = d3.scale.ordinal()
		func_colors.range(func_colors_palette)
		func_colors.domain(d3.keys(data_cube.func_tree_lookup))
	}

	//sample colors
	groupValsAll = samplemap.map(function(d,i){ 
		return d[grouping]; })

	groupVals = groupValsAll.filter(function(d,i){ return groupValsAll.indexOf(d)===i; })

	var sampleColor = d3.scale.ordinal().domain(groupVals).range(colorbrewer["Paired"][Math.max(4,groupVals.length)].slice(0,groupVals.length));
	
	getLinkData = function(){
		//get unique linked functions for each taxon
		allSamples = d3.keys(data_cube.displayed_contribution_cube);
		allSamples = allSamples.filter(function(d){ return d != average_contrib_sample_name })
		var fixed_allSamples = [];
		// Remove samples without taxa links to functions
		for (var i = 0; i < allSamples.length; i++){
			sample = allSamples[i];
			if (!(unlinked_taxon_name in data_cube.displayed_contribution_cube[sample])){
				fixed_allSamples.push(sample);
			}
		}
		allSamples = fixed_allSamples;
		var all_taxa_links = []; //{Taxa:[], Functions:[]};
		data_cube.displayed_taxa.map(function(t,i){
			data_cube.displayed_funcs.map(function(f,i){
				var foo = allSamples.map(function(d){
					return data_cube.get_contribution(d,t,f);
				})
				if(d3.sum(foo)!==0){
					all_taxa_links.push({Taxa:t, Functions:f, numKO:1});
				}
			})
		});
		return all_taxa_links;
	}

	//this gets the data for the functional bar chart

	getFuncBarData = function(){
		var contributions = [];
		var samples = [];
		var funcs = [];
		var taxa = [];

		var all_func_data = [];
		var count = 0;
		var tcount = 0;

		allSamples = d3.keys(data_cube.displayed_contribution_cube).sort();
		var all_taxa_links = []; //{Taxa:[], Functions:[]};
		//loop through all the functions
		//this keeps all functions together

		//loop through Samples, funcs and taxa and create arrays of the data
		allSamples.map(function(d){	
			samples.push({sample:d});
		});
		var my_displayed_funcs = data_cube.displayed_funcs.slice(0);
		my_displayed_funcs.reverse();
		(my_displayed_funcs).map(function(z){
			funcs.push(z);
		});
		var my_displayed_taxa = data_cube.displayed_taxa.slice(0);
		my_displayed_taxa.reverse();
		(my_displayed_taxa).map(function(t,i){
			taxa.push(t)
		});
		//then loop through sequentially to populate an array of all the samples
		samples.map(function(n){
			funcs.map(function(m){

				// Don't iterate over taxa if there are no taxa linked to the functions
				if (!(unlinked_taxon_name in data_cube.displayed_contribution_cube[n.sample])){
					taxa.map(function(tt){	
						contributions.push({func:m, Taxa:tt, Sample:n.sample, contributions:data_cube.get_contribution([n.sample],[tt],[m])});
					})
				} else {
					contributions.push({func:m, Taxa:unlinked_taxon_name, Sample:n.sample, contributions:data_cube.get_contribution([n.sample], [unlinked_taxon_name], [m])});
				}
			})
		var temp = [];
		contributions.map(function(q){
			if (q.Sample == n.sample) {
				temp.push({func:q.func, Taxa:q.Taxa, Sample:q.Sample, contributions:q.contributions});}
		})

		all_func_data.push({data:temp, Sample:n.sample});
		count = count + 1
		});
		return all_func_data;
	}

	function sort_nest(x, y){
		if (x.key < y.key){
			return -1;
		} else if (x.key > y.key){
			return 1;
		} else {
			return 0;
		}
	}

	//data_cube.expand_taxon("Bacteria");
	
	var bpData = getLinkData();
	var avg_contrib_data = data_cube.displayed_contribution_cube["Average_contrib"]

	var data = {data:bP.partData(bpData, data_cube.displayed_taxa, data_cube.displayed_funcs), id:'Genomes', header:["Taxa","Functions", "Genomes"]};


	//draw the stacked bar

	var stackData = getFuncBarData();
	fB.Draw(stackData, samplemap, func_colors, FunctionBar, barDimensions, highlightOverall, dehighlightOverall, sampleColor, func_sample_order, grouping, data_cube.displayed_taxa, data_cube.displayed_funcs, clickResponse);


	var otu_bar_data = otu_bar.make_data(otu_abundance_data, data_cube, otu_sample_order);

	otu_bar.draw(otu_bar_data, samplemap, taxa_colors, TaxaBar, barDimensions, highlightOverall, dehighlightOverall, sampleColor, otu_sample_order, grouping, data_cube.displayed_taxa, data_cube.displayed_funcs, clickResponse);


	bP.draw(data, bpG, bpdims, taxa_colors, func_colors, data_cube.displayed_taxa, data_cube.displayed_funcs,highlightOverall, dehighlightOverall, avg_contrib_data, clickResponse);

	function update_otu_bar(){
		//remove old graph before redrawing new
		TaxaBar.selectAll("g").remove();
		otu_bar_data = otu_bar.make_data(otu_abundance_data, data_cube, otu_sample_order);
		otu_bar.draw(otu_bar_data, samplemap, taxa_colors, TaxaBar, barDimensions, highlightOverall, dehighlightOverall, sampleColor, otu_sample_order, grouping, data_cube.displayed_taxa, data_cube.displayed_funcs, clickResponse);
	}

	function update_func_bar(){
		//remove old graph before redrawing new
			FunctionBar.selectAll("g").remove();
			var func_data = getFuncBarData();
			fB.Draw(func_data, samplemap, func_colors, FunctionBar, barDimensions, highlightOverall, dehighlightOverall, sampleColor, func_sample_order, grouping, data_cube.displayed_taxa, data_cube.displayed_funcs, clickResponse);

	}

	var bpData = getLinkData();
	var data = {data:bP.partData(bpData, data_cube.displayed_taxa, data_cube.displayed_funcs), id:'Genomes', header:["Taxa","Functions", "Genomes"]};
	bpvisdata = bP.updateGraph(data, bpG, bpdims, taxa_colors, func_colors, data_cube.displayed_taxa, data_cube.displayed_funcs, highlightOverall, dehighlightOverall, avg_contrib_data, clickResponse);

	if (showScale) {
		drawScale();
	}

	trees.SetUp3(height, data_cube, otu_abundance_data, bpvisdata, highlightOverall, dehighlightOverall, taxonomic_levels, function_levels, currently_displayed_taxa, currently_displayed_functions, taxa_colors, func_colors, function() {
		for (var i=0; i < data_cube.displayed_taxa; i++){
			dehighlightOverall(data_cube.displayed_taxa[i], "", 1)
			for (var j=0; j < data_cube.displayed_funcs; j++){
				if(i==0){
					dehighlightOverall("", data_cube.displayed_funcs[j], 2)
				}
				dehighlightOverall(data_cube.displayed_taxa[i], data_cube.displayed_funcs[j], 3)
			}
		}
		trees.updateBPvisdata( updateBPgraph() );
		update_otu_bar();
		update_func_bar();
	});
		
	function highlightOverall(taxonName, functionName, highlightwhat) {
		if (highlightwhat == 1) {
			// Highlight taxa tree
			trees.highlightTree(taxonName, 'taxa');
			
			// Highlight BP graph
			m = 0;
			displayed = data_cube.displayed_taxa;
			ind = displayed.indexOf(taxonName);	
			if (ind > -1) {
				bP.selectSegment(m, ind, taxa_colors, func_colors, data_cube.displayed_taxa, data_cube.displayed_funcs);
			
				// Highlight  Taxa Bar Chart
				otu_bar.select_bars(taxonName);

				// Highlight Function Bar Chart
				fB.select_contribution(taxonName, func_colors);
			}
		}
		
		if (highlightwhat == 2) {
			// Highlight function tree
			trees.highlightTree(functionName, 'func');
			
			// Highlight BP graph
			m = 1;
			displayed = data_cube.displayed_funcs;
			ind = displayed.indexOf(functionName);
			if (ind > -1) {
				bP.selectSegment(m, ind, taxa_colors, func_colors, data_cube.displayed_taxa, data_cube.displayed_funcs);

				// Highlight Function Bar Chart
				fB.select_bars(functionName, func_colors);
			}
		}
		
		if (highlightwhat == 3) {
			//highlight taxa tree
			trees.highlightTree(taxonName, 'taxa');
			
			//highlight function tree
			trees.highlightTree(functionName, 'func');
		
			// Highlight Taxa Bar Chart
			otu_bar.select_bars(taxonName);

			// Highlight Function Bar Chart
			fB.select_single_contribution(taxonName, functionName, func_colors);
		}
	}

	function dehighlightOverall(taxonName, functionName, highlightwhat, bars_only = false) {
		if (highlightwhat == 1) {
			// dehighlight tree
			trees.dehighlightTree(taxonName, 'taxa');
			
			// dehighlight BP graph
			m = 0;
			displayed = data_cube.displayed_taxa;	
			ind = displayed.indexOf(taxonName);
			if (ind > -1) {
				bP.deSelectSegment(m, ind, taxa_colors, func_colors, data_cube.displayed_taxa, data_cube.displayed_funcs);

				// dehighlight Taxon Bar Chart
				otu_bar.deselect_bars(taxonName, taxa_colors);

				// dehighlight Function Bar Chart
				fB.deselect_contribution(taxonName, func_colors);
			}
		}
		
		if (highlightwhat == 2) {
			trees.dehighlightTree(functionName, 'func');
			
			//dehighlight BP graph
			m = 1;
			displayed = data_cube.displayed_funcs;
			ind = displayed.indexOf(functionName);
			if (ind > -1) {
				bP.deSelectSegment(m, ind, taxa_colors, func_colors, data_cube.displayed_taxa, data_cube.displayed_funcs);

				// dehighlight Function Bar Chart
				fB.deselect_bars(functionName, func_colors);
			}
		}
		
		if (highlightwhat == 3) {
			if(bars_only == false){
			// dehighlight taxa tree
			trees.dehighlightTree(taxonName, 'taxa');
			
			//dehighlight function tree
			trees.dehighlightTree(functionName, 'func');
			}
			// dehighlight Taxa Bar Chart
			otu_bar.deselect_bars(taxonName, taxa_colors);

			// dehighlight Function Bar Chart
			fB.deselect_single_contribution(taxonName, functionName, func_colors);
		
		}
	}
	
	function clickResponse(id, name, list_type, displayed_taxa, displayed_funcs){ //unclick everything not associated with a particular taxon or function
		    if(d3.select("#"+id).classed("clicked") == false){ //if not already clicked
						//Unselect things currently clicked
						displayed_taxa.map(function(e,j){
							d_id = "Genomes0"+e.replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")
							//if(d_id !== current_id){ //if not currently selected thing
								if(d3.select("#"+d_id).classed("highlighted")==true){
									d3.select("#"+d_id).classed("highlighted",false)
									d3.select("#"+d_id).classed("clicked",false)
									assocEdges = d3.select("#Genomes").select(".edges").selectAll(".edge")
										.filter(function(f,k){ 
										return (f["key1"]==j); })
									assocEdges.select(".clicked").each(function(m){
										dehighlightOverall(m.key1, m.key2, 3)
									})
									assocEdges.classed("highlighted", false)
									assocEdges.classed("clicked", false)
									assocEdges.style("opacity", 0)
									dehighlightOverall(e,"",1);
								//}
								}})
						
						displayed_funcs.map(function(e,j){
							d_id = "Genomes1"+e.replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")
								if(d3.select("#"+d_id).classed("highlighted")==true){
									d3.select("#"+d_id).classed("highlighted",false)
									d3.select("#"+d_id).classed("clicked",false)
									assocEdges = d3.select("#Genomes").select(".edges").selectAll(".edge").filter(function(f,k){ 
										return (f["key2"]==j); })
									assocEdges.select(".clicked").each(function(m){
										dehighlightOverall(m.key1, m.key2, 3)
									})

									assocEdges.classed("highlighted", false)
									assocEdges.classed("clicked", false);
																			
									assocEdges.attr("visibility", "hidden")
									assocEdges.style("opacity", 0)
									dehighlightOverall("", e, 2)
								}})

						d3.select("#"+id).classed("highlighted",true)
						d3.select("#"+id).classed("clicked",true)
						
						//connecting edges
						if(list_type == "taxa"){
							selectedEdges = d3.select("#Genomes").select(".edges").selectAll(".edge")
								.filter(function(e,j){ 
								return (e["key1"]==displayed_taxa.indexOf(name)) })
						} else {
							selectedEdges = d3.select("#Genomes").select(".edges").selectAll(".edge")
								.filter(function(e,j){ 
								return (e["key2"]==displayed_funcs.indexOf(name)) })
						}
						selectedEdges.classed("highlighted", true);
						if(list_type == "taxa"){
							return highlightOverall(name,"",1);
						} else {
							return highlightOverall("", name, 2);
						}
				} else { //if already clicked
					clickedEdges = d3.select("#Genomes").select(".edges").selectAll(".clicked")
					if(list_type == "taxa"){
							selectedEdges = d3.select("#Genomes").select(".edges").selectAll(".edge")
								.filter(function(e,j){ 
								return (e["key1"]==displayed_taxa.indexOf(name)) })
						} else {
							selectedEdges = d3.select("#Genomes").select(".edges").selectAll(".edge")
								.filter(function(e,j){ 
								return (e["key2"]==displayed_funcs.indexOf(name)) })
					}
					if(clickedEdges.empty()==false && list_type=="funcs"){
						//special case
						//Revert to original highlighting

						clickedEdges.classed("clicked", false)
						dehighlightOverall(displayed_taxa[clickedEdges.datum().key1], displayed_funcs[clickedEdges.datum().key2], 3, bars_only = false)
						d3.select("#Genomes0"+displayed_taxa[clickedEdges.datum().key1].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")).classed("highlighted", false)
						d3.select("#Genomes0"+displayed_taxa[clickedEdges.datum().key1].replace(/ /g,"_").replace(/(,|\(|\)|\[|\]|\\|\/)/g, "_")).classed("clicked", false)
						dehighlightOverall(displayed_taxa[clickedEdges.datum().key1], "", 1) //bP.deSelectSegment(0, clickedEdges.datum().key1, taxa_colors, func_colors, displayed_taxa, displayed_funcs)
						highlightOverall("", name, 2)
					} else{
						//do normal stuff
						d3.select("#"+id).classed("highlighted",false)
						d3.select("#"+id).classed("clicked",false)
						//dehighlight everything for good measure
						d3.select("#Genomes").select(".part0").selectAll(".mainbars").classed("highlighted", false).classed("clicked",false)
						//clicked edges

						selectedEdges.classed("highlighted", false)
						selectedEdges.classed("clicked", false);
						//dehighlight bar on other side assoicated with edge
						clickedEdges.classed("clicked", false)
						if(clickedEdges.empty()==false){
						if(list_type=="taxa"){
								edgeOtherSide = clickedEdges.datum().key2
								dehighlightOverall("", displayed_funcs[edgeOtherSide], 2)
						} else {
								edgeOtherSide = clickedEdges.datum().key1
								dehighlightOverall(displayed_taxa[edgeOtherSide],"", 1)
						}
						}
												
						if(list_type == "taxa"){
							return dehighlightOverall(name,"",1);
						} else {
							return dehighlightOverall("", name, 2);
						}

						}
					}
	}
	
	// Update the bipartite graph after changes to data_cube
	function updateBPgraph() {
		var bpData = getLinkData();
		var data = {data:bP.partData(bpData, data_cube.displayed_taxa, data_cube.displayed_funcs), id:'Genomes', header:["Taxa","Functions", "Genomes"]};
		var visdata = bP.updateGraph(data, bpG, bpdims, taxa_colors, func_colors, data_cube.displayed_taxa, data_cube.displayed_funcs, highlightOverall, dehighlightOverall, avg_contrib_data, clickResponse);
		if (showScale) {
			redrawScale();
		}
		return visdata;
	}
}

function resizeRedraw() {
	if (resize_timeout){
		clearTimeout(resize_timeout);
	}
	resize_timeout = setTimeout(function(){
		if (curr_window_width != window.innerWidth | curr_window_height != window.innerHeight){
			uploader.update_plots();
			curr_window_width = window.innerWidth;
			curr_window_height = window.innerHeight;
		}
	}, 100)
}

function drawScale() {
	sbh = height - margin.top - margin.bottom;
	sbw = width * 0.1;
	SB = d3.select("#scalebar");
	
	SB.append("line")
		.attr("x1",0)
		.attr("y1",0)
		.attr("x2",0)
		.attr("y2",height)
		.style("stroke-width",3)
		.style("stroke","#000000");

	TaxaNodes = SB.append("g")
		.attr("id", "scale_taxa_nodes")
		.attr("transform", "translate(" + 0  + "," + 0  + ")");
	
	taxBarH = Math.min( d3.select("#part0").select(".mainrect").attr("height"), 100);
	sampAv = [0.25, 0.05, 0.01];
	sampAvName = ["25", "5", "1"];
	
	TaxaNodes.append("text")
		.attr("x", sbw / 2)
		.attr("y", 20)
		.attr("text-anchor","middle")
		.text("Taxa node scale");

	for (scalei = 0; scalei < sampAv.length; scalei++) {
		TaxaNodes.append("circle")
			.attr("cx", 40)
			.attr("cy", 50 + scalei * 50)
			.attr("fill", "#8c8c8c")
			.attr("stroke","grey")
			.attr("stroke-width",1)
			.attr("r", taxBarH/2 * Math.sqrt(sampAv[scalei]));

		TaxaNodes.append("text")
			.attr("x", 90)
			.attr("y", 50 + scalei * 50)
			.attr("dominant-baseline","central")
			.text(sampAvName[scalei] + "%");
	}

	FuncNodes = SB.append("g")
		.attr("id", "scale_func_nodes")
		.attr("transform", "translate(" + 0  + "," + sbh/3  + ")");
	
	funcBarH = Math.min( d3.select("#part1").select(".mainrect").attr("height"), 100);
	
	FuncNodes.append("text")
		.attr("x", sbw / 2)
		.attr("y", 20)
		.attr("text-anchor","middle")
		.text("Function node scale");

	for (scalei = 0; scalei < sampAv.length; scalei++) {
		FuncNodes.append("circle")
			.attr("cx", 40)
			.attr("cy", 50 + scalei * 50)
			.attr("fill", "#8c8c8c")
			.attr("stroke","grey")
			.attr("stroke-width",1)
			.attr("r", funcBarH/2 * Math.sqrt(sampAv[scalei]));

		FuncNodes.append("text")
			.attr("x", 90)
			.attr("y", 50 + scalei * 50)
			.attr("dominant-baseline","central")
			.text(sampAvName[scalei] + "%");
	}
	
	EdgeBars = SB.append("g")
		.attr("id", "scale_edge_bars")
		.attr("transform", "translate(" + 0 + "," + 2/3*sbh + ")");

	EdgeBars.append("text")
		.attr("x", sbw / 2)
		.attr("y", 20)
		.attr("text-anchor","middle")
		.text("Edge bar width");

	for (scalei = 0; scalei < sampAv.length; scalei++) {
		EdgeBars.append("rect")
			.attr("x", 10)
			.attr("y", 50 + scalei * 50)
			.attr("width", sbw / 3)
			.attr("height", 2 * Math.sqrt(100 * sampAv[scalei]))
			.attr("fill", "#505050");

		EdgeBars.append("text")
			.attr("x", 10 + sbw/3 + 30)
			.attr("y", 50 + scalei * 50 + Math.sqrt(100 * sampAv[scalei]))
			.attr("dominant-baseline","central")
			.text(sampAvName[scalei] + "%");
	}
}

function redrawScale() {
	d3.select("#scalebar").selectAll("*").remove();
	drawScale();
}

var uploader = uploader_wrapper.make_uploader(draw_everything, update_progress);

mainui.uploadMode = "Function"; // Should not have to do this, try to eliminate later

Shiny.addCustomMessageHandler("shiny_test", function(message){console.log(message)})
