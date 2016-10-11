// main.js
//

mainui.createUI();

var aspecrat, width, height, hidewidth, margin;
var barDimensions, navDims, bpdims;
var duration; //used in trees to set animation speed

var MainSVG, plotSVG, sidebarSVG;

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

		trees.SetUp(navDims);
		
// 		patternSVG = d3.select("#patternsvg")
// 			.attr("viewBox","0 0 " + width + " " + height + "")
// 			.attr("preserveAspectRatio","none");
// 
// 		console.log("modified patternsvg")
		d3.select("body").attr("class","svgBody");

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
			.attr("fill","#DADADA");

		document.getElementById("sidebar_hide").addEventListener('click', function() {
			var sidebarz = d3.select("#sidebar_svg");
			var curpos = parseFloat(sidebarz[0][0].attributes.x.value);
			if (curpos > -10) {
				sidebarz.transition().attr("x",-150);
				d3.select("#sidebar_hide").attr("points","150,0 150,60 180,30");
			} else {
				sidebarz.transition().attr("x",0);
				d3.select("#sidebar_hide").attr("points","150,30 180,0 180,60");
			}
		});

		
		d3.select("#sidebar_svg").append("foreignObject")
			.attr("x", 20)
			.attr("y", 20)
		.append("xhtml:div")
			.attr("id","SaveInputDiv")
			.style("width","120px")
			.html("<p>Output file prefix:</p>" + 
				"<input style='width:110px' id='saveFileNameInput' type='text' name='outfilename' value='burrito'><br><br><p>Image format:</p>" +
				"<form action=''><label> <input type='radio' name='format' value='PNG' checked='checked'> PNG</label><br><label><input type='radio' name='format' value='SVG'> SVG </label></form>" + 
			"<br><br><button id='save_screenshot' class='savebutton' type='button'>Save screenshot</button>" +	
			"<br><br><button id='save_taxa_bar' class='savebutton' type='button'>Save taxonomy plot</button>" +	
			"<br><br><button id='save_taxonomy_leg' class='savebutton' type='button'>Save taxonomy legend</button>" +	
			"<br><br><button id='save_func_bar' class='savebutton' type='button'>Save function plot</button>" +
			"<br><br><button id='save_function_leg' class='savebutton' type='button'>Save function legend</button>");

	
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

		draw_loading();
	}
}

draw_loading = function() {
	var loadg = MainSVG.append("g")
		.attr("id","loadingG");
	
	loadg.append("text")
		.attr("id", "main_loading_text")
		.attr("x",width / 2)
		.attr("y", height / 3)
		.attr("text-anchor","middle")
		.text("Loading");

	loadg.append("text")
		.attr("id", "loading_sample_text")
		.attr("x", width / 2)
		.attr("y", height * 2 / 3)
		.attr("text-anchor", "middle")
		.text("Determining number of samples")

/*	var loadspin = loadg.append("ellipse")
		.attr("id","loadcirc")
		.attr("cx",(width / 2) - 100)
		.attr("cy",height / 2)
		.attr("rx", 30)
		.attr("ry", 30)
		.attr("fill","red")
		.attr("stroke","none")*/

	loadg.append("rect")
		.attr("x", (width / 2) - (width / 8))
		.attr("y", (height / 2) - (height / 20))
		.attr("width", width / 4)
		.attr("height", height / 10)
		.attr("fill", "grey")

	loadg.append("rect")
		.attr("id", "progress_bar")
		.attr("x", (width / 2) - (width / 9))
		.attr("y", (height / 2) - (height / 22))
		.attr("width", 0)
		.attr("height", height / 11)
		.attr("fill", "blue")
}
Shiny.addCustomMessageHandler("upload_status", function(message){
	message_element = document.getElementById("loading_sample_text")
	if (message_element){
		message_element.innerHTML = message
	}
})
Shiny.addCustomMessageHandler("number_of_samples_message", function(num_samples){
	message_element = document.getElementById("loading_sample_text")
	if (message_element){
		message_element.innerHTML = "Formatting " + num_samples + " samples"
	}
})
Shiny.addCustomMessageHandler("abort", function(message){
	d3.select("#mainsvg").remove();
	alert(message);
	document.getElementById("taxonomic_abundances_1").value = null
	document.getElementById("taxonomic_abundances_2").value = null
	document.getElementById("read_counts").value = null
	document.getElementById("genome_annotations").value = null
	document.getElementById("function_contributions").value = null
	document.getElementById("function_abundances").value = null
	document.getElementById("taxonomic_hierarchy").value = null
	document.getElementById("function_hierarchy").value = null
	document.getElementById("sample_map").value = null
})

update_progress = function(curr_sample, total_samples){
	if(curr_sample==1){
		document.getElementById("loading_sample_text").innerHTML = "Sample averages loaded"	
 	} else{
		document.getElementById("loading_sample_text").innerHTML = "Samples loaded " + (curr_sample-1) + "/" + (total_samples-1)
 	}
	document.getElementById("progress_bar").setAttribute("width", (width / 4.5) * (curr_sample / total_samples))
}

draw_everything = function(otu_table, contribution_table, tax_hierarchy_text, func_hierarchy_text, samp_map_text, func_averages, otu_sample_order, func_sample_order){
	
	var grouping = null;
	if (mainui.uploadMode == "example"){
		grouping = "Group";
	} else if (mainui.uploadMode == "Read"){
		grouping = document.getElementById("sampgroupselector_R").value;
	} else if (mainui.uploadMode == "Contribution"){
		grouping = document.getElementById("sampgroupselector_C").value;
	} else if (mainui.uploadMode == "Genome"){
		grouping = document.getElementById("sampgroupselector_G").value;
	}
	// Find the new window size, adjust the aspect ratio
	aspecrat = window.innerWidth / window.innerHeight;
	width = 1000 * aspecrat;
	barDimensions = {width: (width/2 - (margin.btwbars/2) - margin.left), height: (height / 2) - margin.bottom - (margin.btwnavbar/2) };
	navDims = {width: (width - margin.left - margin.right), height: (height/2) - margin.top - (margin.btwbars/2)};
	navDims.treewidth = navDims.width * 2/9;
	bpdims = {height:navDims.height, width: navDims.width, header:margin.top, treewidth: navDims.treewidth};
	
	MainSVG.attr("viewBox","0 0 " + width + " " + height + "")
	plotSVG.attr("viewBox","0 0 " + width + " " + height + "")
	
	d3.select("#navbar").remove()
	d3.select("#taxa_bars").remove()
	d3.select("#func_bars").remove()
	d3.select("#loadingG").remove()	
/*	d3.select("#navbar").remove()
	d3.select("#taxa_bars").remove()
	d3.select("#func_bars").remove()*/

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
		.attr("width",(width/2) - margin.left - (margin.btwbars/2))
		.attr("height",(height/2) - margin.bottom - (margin.btwnavbar/2))
		//.attr("width",100)
		//.attr("height",100)
		//.attr("viewBox","0 0 100 100")
		.attr("id", "taxa_bars")
		.style("font-family", "Verdana");
		//.attr("preserveAspectRatio","none");
		//.attr("transform","scale(2.0)");
		
	var FunctionBar = plotSVG.insert("svg", "#sidebar")
		.attr("x",(width/2) + (margin.btwbars/2))
		.attr("y",(height/2) + (margin.btwnavbar/2))
		.attr("width",(width/2) - margin.right - (margin.btwbars/2))
		.attr("height",(height/2) - margin.bottom - (margin.btwnavbar/2))
		//.attr("viewBox","0 0 100 100")
		.attr("id", "func_bars")
		.style("font-family", "Verdana");
		
	var bpvisdata;
	
	
	func_averages = d3.tsv.parse(func_averages);
	samplemap = d3.tsv.parse(samp_map_text);

	/*	otu_abundance_data_transpose = d3.tsv.parse(tax_abund_text);
	var fix_otus = function(otu_data, samples){
		new_otu_data = []
		for(j=0; j < samples.length; j++){
			new_otu_data[j] = {}
			new_otu_data[j]["Sample"] = samples[j]
			for(k=0; k < otu_data.length; k++){
				new_key = "OTU_ID_"+otu_data[k]["OTU_ID"] // Can we key anonymously? Maybe set name of column ourselves so it always matches
				new_otu_data[j][new_key] = +otu_data[k][samples[j]]
			}
		}	
		return new_otu_data;
	}
	otu_abundance_data = fix_otus(otu_abundance_data_transpose, d3.keys(contribution_table).sort()) //this puts samples in alphabetical order currently*/
	
	otu_abundance_data = otu_table

	//initialize display cube
	var data_cube = data_cube_wrapper.make_cube(); //defines the functions needed

	data_cube.initialize_cube(contribution_table, trees.getTaxaTreeData(), trees.getFuncTreeData(), func_averages);
			
	//if( not expand to OTU level
	/*genus_abundance_data = data_cube.reduce_to_genus(otu_abundance_data)*/

	////////////////////////// Colors
	//color_option = "Categories" //Categories or Random
	var color_option = null;
	if (mainui.uploadMode == "example"){
		color_option = "Categories";
	} else if (mainui.uploadMode == "Read"){
		color_option = d3.select("#color_option_selector_R").property("value")	
	} else if (mainui.uploadMode == "Contribution"){
		color_option = d3.select("#color_option_selector_C").property("value")	
	} else if (mainui.uploadMode == "Genome"){
		color_option = d3.select("#color_option_selector_G").property("value")	
	}
	
// 	var changeAlpha = function(color, alphaVal){ 
// 		color = d3.rgb(color.toString())
// 		color["r"] = alphaVal * color["r"]
// 		color["g"] = alphaVal * color["g"]
// 		color["b"] = alphaVal * color["b"]
// 		return color;
// 	}
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
				new_color["l"] = core_color["l"] - 32*flip*(k + (k%2))/(color_range+1)
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
		if(num_taxa_categories > d3.keys(colorbrewer["Set3"]).pop()+d3.keys(colorbrewer["Dark2"]).pop()){
			console.log("too many taxa categories, colors will repeat")
		}
		if(num_taxa_categories <= d3.keys(colorbrewer["Set3"]).pop() & num_taxa_categories >= d3.keys(colorbrewer["Set3"]).shift()){
			taxa_palette = colorbrewer["Set3"][num_taxa_categories]
			//taxa_palette = taxa_palette.reverse()
		} else if (num_taxa_categories > d3.keys(colorbrewer["Set3"]).pop()){
			taxa_palette = colorbrewer["Set3"][(d3.keys(colorbrewer["Set3"]).pop()-1)].concat(colorbrewer["Dark2"][num_taxa_categories -  d3.keys(colorbrewer["Set3"]).pop()])
		} else if (num_taxa_categories == 2){
			taxa_palette = ["#8dd3c7", "#ffffb3"]
		} else {
			taxa_palette = ["#8dd3c7"]
		}
		if(num_function_categories > d3.keys(colorbrewer["Set1"]).pop()+d3.keys(colorbrewer["Dark2"]).pop()){
			console.log("too many function categories, colors will repeat")
		}
		
		if(num_function_categories <= d3.keys(colorbrewer["Set1"]).pop()){
			func_palette = colorbrewer["Set1"][num_function_categories]
		} else {
			func_palette = colorbrewer["Set1"][(d3.keys(colorbrewer["Set1"]).pop()-1)].concat(colorbrewer["Dark2"][num_function_categories - d3.keys(colorbrewer["Set1"]).pop()])
		}
		
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
		col1 = d3.rgb("black") //.brighter()
		//if there are other kingdoms besides Bacteria, shades of grey
		if (data_cube.taxa_tree[0].level != 0){
			for(j=0; j < kingdoms.length; j++){
				taxa_colors.range().push(col1)
				taxa_colors(kingdoms[j])
				col1["l"] +=  (j+1)/(kingdoms.length + 1)
			}
		}
		taxa_colors.range().push(d3.rgb("black"))//.brighter())
		taxa_colors("All Taxa")

		//func colors
		var func_colors = d3.scale.ordinal()
		func_colors.range(func_palette)
		main_funcs = data_cube.func_tree.map(function(d){ return d.key;})
		func_colors.domain(main_funcs)
		func_colors = setUpColorScale(main_funcs, "funcs", func_colors)
		func_colors.range().push(d3.rgb("black"))//.brighter())
		func_colors("All Functions")
	
		
	} else if(color_option == "Random"){
		taxa_colors_palette = (d3.scale.category20()).range()
// 		for(j=0; j < taxa_colors_palette.length; j++){
// 			taxa_colors_palette[j] = d3.rgb(taxa_colors_palette[j]).brighter()
// 		}
		taxa_colors = d3.scale.ordinal()
		taxa_colors.range(taxa_colors_palette)
		taxa_colors.domain(d3.keys(data_cube.taxa_tree_lookup))
		
		func_colors_palette = colorbrewer["Set3"]["12"].concat(colorbrewer["Dark2"]["8"])
// 		for(j=0; j < func_colors_palette.length; j++){
// 			func_colors_palette[j] = d3.rgb(func_colors_palette[j]).brighter()
// 		}		
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

	fB.Draw(stackData, samplemap, func_colors, FunctionBar, barDimensions, highlightOverall, dehighlightOverall, sampleColor, func_sample_order, grouping);


	var otu_bar_data = otu_bar.make_data(otu_abundance_data, data_cube, otu_sample_order);

	otu_bar.draw(otu_bar_data, samplemap, taxa_colors, TaxaBar, barDimensions, highlightOverall, dehighlightOverall, sampleColor, otu_sample_order, grouping);


	bP.draw(data, bpG, bpdims, taxa_colors, func_colors, data_cube.displayed_taxa, data_cube.displayed_funcs,highlightOverall, dehighlightOverall, avg_contrib_data);


	function update_otu_bar(){
		//remove old graph before redrawing new
		TaxaBar.selectAll("g").remove();
		otu_bar_data = otu_bar.make_data(otu_abundance_data, data_cube, otu_sample_order);
		otu_bar.draw(otu_bar_data, samplemap, taxa_colors, TaxaBar, barDimensions, highlightOverall, dehighlightOverall, sampleColor, otu_sample_order, grouping);
	}

	function update_func_bar(){
		//remove old graph before redrawing new
			FunctionBar.selectAll("g").remove();
			var func_data = getFuncBarData();
			fB.Draw(func_data, samplemap, func_colors, FunctionBar, barDimensions, highlightOverall, dehighlightOverall, sampleColor, func_sample_order, grouping);

	}

	//data_cube.expand_func("Metabolism");
	var bpData = getLinkData();
	var data = {data:bP.partData(bpData, data_cube.displayed_taxa, data_cube.displayed_funcs), id:'Genomes', header:["Taxa","Functions", "Genomes"]};
	bpvisdata = bP.updateGraph(data, bpG, bpdims, taxa_colors, func_colors, data_cube.displayed_taxa, data_cube.displayed_funcs, highlightOverall, dehighlightOverall, avg_contrib_data);


    //d3.select(self.frameElement).style("height", "800px");

	trees.SetUp3(height, data_cube, otu_abundance_data, bpvisdata, highlightOverall, dehighlightOverall, taxa_colors, func_colors, function() {
		trees.updateBPvisdata( updateBPgraph() );
		update_otu_bar();
		update_func_bar();
	});


	/*
    var curr_funcs = [];
    for (var i = 0; i < function_data.length; i++){
	    curr_funcs.push(function_data[i]);
	}
    for (; curr_funcs.length > 0;){
    	curr_func = curr_funcs.shift();
    	if (!data_cube.is_leaf(curr_func)){
    		curr_func.values.sort(sort_nest);
    		for (var i = 0; i < curr_func.values.length; i++){
    			curr_funcs.push(curr_func.values[i]);
    		}
    	}
    } */  

    

		
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
	
	// Update the bipartite graph after changes to data_cube
	function updateBPgraph() {
		var bpData = getLinkData();
		var data = {data:bP.partData(bpData, data_cube.displayed_taxa, data_cube.displayed_funcs), id:'Genomes', header:["Taxa","Functions", "Genomes"]};
		var visdata = bP.updateGraph(data, bpG, bpdims, taxa_colors, func_colors, data_cube.displayed_taxa, data_cube.displayed_funcs, highlightOverall, dehighlightOverall, avg_contrib_data);
		return visdata;
	}
}

function resizeRedraw() {
	uploader.update_plots();
}

var uploader = uploader_wrapper.make_uploader(draw_everything, update_progress);

mainui.uploadMode = "Function"; // Should not have to do this, try to eliminate later

Shiny.addCustomMessageHandler("shiny_test", function(message){console.log(message)})
