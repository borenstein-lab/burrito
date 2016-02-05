(function(){
	var mainui={};

	mainui.uploadMode = "";
	
	function insertFileSymb(element, x, y) {
		var FSG = element.append("g")
			.attr("class","nullfilesymb")
			.attr("transform","translate(" + x + "," + y + ") scale(.6,.6)");
		FSG.append("path").attr("d","m 0,0 46,0 0,-61 -16,-14 -30,0 z")
		    .attr("fill","white").classed("outline",true);
		FSG.append("path").attr("d","m 29.546589,-75.5 0,14.774839 16.953411,0");
		FSG.append("path").attr("d","m 6,-55 18.5,0");
		FSG.append("path").attr("d","m 6,-41 33,0");
		FSG.append("path").attr("d","m 6,-27 33,0");
		FSG.append("path").attr("d","m 6,-13 33,0");
	}
	
	
	mainui.createUI = function(element) {
		
		element.append("text")
			.attr("x",50)
			.attr("y",50)
			.attr("font-size","40px")
			.text("Burrito: A Marriage of Taxonomy and Function");
			
		element.append("text")
			.attr("x",80)
			.attr("y",100)
			.attr("font-size","15px")
		.text("Some information about what it is that this site does and maybe a link to the paper and to the manual");
			
		element.append("text")
			.attr("x",100)
			.attr("y",150)
			.attr("font-size","20px")
			.text("UPLOAD YOUR OWN DATA");
			
		element.append("text")
			.attr("x",800)
			.attr("y",150)
			.attr("font-size","20px")
			.text("EXPLORE SAMPLE DATA");
		
		element.append("text")
			.attr("x",150)
			.attr("y",180)
			.attr("font-size","15px")
			.text("Choose data type");
			
		button_maker.add_rect_button(element, "sixteen_selector", 100,200,140,70,"switchb activebutton","","16s Reads", function() {
				mainui.Select_16s();
			});
			
		button_maker.add_rect_button(element, "func_contr_selector", 250,200,140,70,"switchb activebutton","","Functional Contributions", function() {
				mainui.Select_Func();
			});
			
		button_maker.add_rect_button(element, "genome_annot_selector", 400,200,140,70,"switchb activebutton","","Genomic Annotations", function() {
				mainui.Select_Genomes();
			});
			
			
		var sixinp = element.append("g")
			.attr("id","read_counts_g")
			.attr("transform","translate(100,330)");
		sixinp.append("text")
			.attr("font-size","18px")
			.text("16s counts");
		insertFileSymb(sixinp,40,60);
		sixinp.append("text")
			.attr("y",80)
			.attr("font-size","15px")
		.attr("class","filenamelabel")
			.text("No file uploaded");
		button_maker.add_input_button(sixinp, "button_holder", "svg_16S_button", "read_counts", 10,90,80,50,"","Upload");
		
		var taxa2binp = element.append("g")
			.attr("id","taxonomic_abundances_2_g")
			.attr("transform","translate(100,330)");
		taxa2binp.append("text")
			.attr("font-size","18px")
			.text("Taxanomic Abundances");
		insertFileSymb(taxa2binp,40,60);
		taxa2binp.append("text")
			.attr("y",80)
			.attr("font-size","15px")
		.attr("class","filenamelabel")
			.text("No file uploaded");
		button_maker.add_input_button(taxa2binp, "button_holder", "svg_tax_abund_button_2", "taxonomic_abundances_2", 10,90,80,50,"","Upload");

		var funccinp = element.append("g")
			.attr("id","function_contributions_g")
			.attr("transform","translate(400,330)");
		funccinp.append("text")
			.attr("font-size","18px")
			.text("Function Contributions");
		insertFileSymb(funccinp,40,60);
		funccinp.append("text")
			.attr("y",80)
			.attr("font-size","15px")
		.attr("class","filenamelabel")
			.text("No file uploaded");
		button_maker.add_input_button(funccinp, "button_holder", "svg_func_contrib_button", "function_contributions", 10,90,80,50,"","Upload");

		var taxabinp = element.append("g")
			.attr("id","taxonomic_abundances_1_g")
			.attr("transform","translate(100,330)");
		taxabinp.append("text")
			.attr("font-size","18px")
			.text("Genome Abundances");
		insertFileSymb(taxabinp,40,60);
		taxabinp.append("text")
			.attr("y",80)
			.attr("font-size","15px")
		.attr("class","filenamelabel")
			.text("No file uploaded");
		button_maker.add_input_button(taxabinp, "button_holder", "svg_tax_abund_button", "taxonomic_abundances_1", 10,90,80,50,"","Upload");

		var geneainp = element.append("g")
			.attr("id","genome_annotations_g")
			.attr("transform","translate(400,330)");
		geneainp.append("text")
			.attr("font-size","18px")
			.text("Genome Annotations");
		insertFileSymb(geneainp,40,60);
		geneainp.append("text")
			.attr("y",80)
			.attr("font-size","15px")
		.attr("class","filenamelabel")
			.text("No file uploaded");
		button_maker.add_input_button(geneainp, "button_holder", "svg_genome_annotation_button", "genome_annotations", 10,90,80,50,"","Upload");

		mainui.Deac_16s();
		mainui.Deac_FuncCont();
		mainui.Deac_GenAno();
	
		//button_maker.add_radio_button(element, "button_holder", "svg_genome_annotation_select_button", 125, 590, 15, ["svg_16S_select_button", "svg_contribution_select_button"], ["svg_tax_abund_button", "svg_genome_annotation_button"], ["svg_16S_button", "svg_tax_abund_button_2", "svg_func_contrib_button"], "genome_annotation_select_button")
		//button_maker.add_input_button(element, "button_holder", "svgd_tax_abund_button", "taxonomic_abundances_1", 170, 555, 140, 70, button_maker.button_off_color, "Taxonomic Abundances")
		//button_maker.add_input_button(element, "button_holder", "svg_genome_annotation_button", "genome_annotations", 320, 555, 140, 70, button_maker.button_off_color, "Genome Annotations")

		//button_maker.add_radio_button(element, "button_holder", "svg_16S_select_button", 125, 700, 15, ["svg_genome_annotation_select_button", "svg_contribution_select_button"], ["svg_16S_button"], ["svg_tax_abund_button", "svg_genome_annotation_button", "svg_tax_abund_button_2", "svg_func_contrib_button"], "16S_select_button")
		//button_maker.add_input_button(element, "button_holder", "svg_16S_button", "16S_counts", 170, 605, 140, 70, button_maker.button_off_color, "16S Read Counts")

		//button_maker.add_radio_button(element, "button_holder", "svg_contribution_select_button", 125, 510, 15, ["svg_genome_annotation_select_button", "svg_16S_select_button"], ["svg_tax_abund_button_2", "svg_func_contrib_button"], ["svg_tax_abund_button", "svg_genome_annotation_button", "svg_16S_button"], "contribution_select_button")
		//button_maker.add_input_button(element, "button_holder", "svg_tax_abund_button_2", "taxonomic_abundances_2", 170, 475, 140, 70, button_maker.button_off_color, "Taxonomic Abundances")
		//button_maker.add_input_button(element, "button_holder", "svg_func_contrib_button", "function_contributions", 320, 475, 140, 70, button_maker.button_off_color, "Function Contributions")

		element.append("text")
		.attr("x", 110)
		.attr("y", 570)
		.attr("font-size", "20px")
		.text("Optional Files");

		var taxhinp = element.append("g")
			.attr("id","taxonomic_hierarchy_g")
			.attr("transform","translate(100,630)");
		taxhinp.append("text")
			.attr("font-size","18px")
			.text("Taxonomic Hierarchy");
		insertFileSymb(taxhinp,40,60);
		taxhinp.append("text")
			.attr("y",80)
			.attr("font-size","15px")
		.attr("class","filenamelabel")
			.text("Default: KEGG BRITE");
		button_maker.add_input_button(taxhinp, "button_holder", "svg_tax_hierarchy_button", "taxonomic_hierarchy", 10,90,80,50,"","Upload");
		button_maker.activate(d3.select("#svg_tax_hierarchy_button"));

		var funhinp = element.append("g")
			.attr("id","function_hierarchy_g")
			.attr("transform","translate(300,630)");
		funhinp.append("text")
			.attr("font-size","18px")
			.text("Function Hierarchy");
		insertFileSymb(funhinp,40,60);
		funhinp.append("text")
			.attr("y",80)
			.attr("font-size","15px")
		.attr("class","filenamelabel")
			.text("Default: Greengenes");
		button_maker.add_input_button(funhinp, "button_holder", "svg_func_hierarchy_button", "function_hierarchy", 10,90,80,50,"","Upload");
		button_maker.activate(d3.select("#svg_func_hierarchy_button"));

		var sampminp = element.append("g")
			.attr("id","sample_map_g")
			.attr("transform","translate(500,630)");
		sampminp.append("text")
			.attr("font-size","18px")
			.text("Sample Mapping");
		insertFileSymb(sampminp,40,60);
		sampminp.append("text")
			.attr("y",80)
			.attr("font-size","15px")
		.attr("class","filenamelabel")
			.text("No file uploaded");
		button_maker.add_input_button(sampminp, "button_holder", "svg_samp_map_button", "sample_map", 10,90,80,50,"","Upload");
		button_maker.activate(d3.select("#svg_samp_map_button"));

		button_maker.add_rect_button(element, "svg_update_button", 200, 800, 140, 70,"", "#0000FF", "Update Graphics", function(){
			document.getElementById("update_button").click();
			})
		d3.select("#svg_update_button").classed("activebutton",true);


		/// Sample data
		
		button_maker.add_rect_button(element, "samp_data_1", 800,300,140,90,"switchb activebutton","","Theriot et. al 2014", function() {
				d3.select("#samp_data_1").classed("selectedbutton",true).classed("activebutton",false);
			});

		button_maker.add_rect_button(element, "svg_sample_update_button", 800, 800, 140, 70,"", "#0000FF", "Display Sample Data", function(){
			document.getElementById("update_button").click();
			})
		d3.select("#svg_sample_update_button").classed("activebutton",true);
	}
	
	mainui.refreshUI = function() {
		d3.select("#sidebar").selectAll("*").remove();
		mainui.createUI(d3.select("#sidebar"));
		
	}

	mainui.Select_16s = function() {
		d3.select("#sixteen_selector").classed("selectedbutton",true)
			.classed("activebutton",false);
		d3.select("#func_contr_selector").classed("selectedbutton",false).classed("activebutton",true);
		d3.select("#genome_annot_selector").classed("selectedbutton",false).classed("activebutton",true);
	
		mainui.uploadMode = "16s";
		
		mainui.Deac_FuncCont();
		mainui.Deac_GenAno();
		
		d3.select("#read_counts_g").attr("visibility","visible");
		button_maker.activate(d3.select("#svg_16S_button"));

		Shiny.onInputChange("input_type", "16S");
	}
	
	mainui.Select_Func = function() {
		d3.select("#func_contr_selector").classed("selectedbutton",true)
			.classed("activebutton",false);
		d3.select("#sixteen_selector").classed("selectedbutton",false).classed("activebutton",true);
		d3.select("#genome_annot_selector").classed("selectedbutton",false).classed("activebutton",true);
	
		mainui.uploadMode = "Function";
	
		mainui.Deac_16s();
		mainui.Deac_GenAno();
		
		d3.select("#taxonomic_abundances_2_g").attr("visibility","visible");
		d3.select("#function_contributions_g").attr("visibility","visible");
		button_maker.activate(d3.select("#svg_tax_abund_button_2"));
		button_maker.activate(d3.select("#svg_func_contrib_button"));

		Shiny.onInputChange("input_type", "contribution");
	}
	
	mainui.Select_Genomes = function() {
		d3.select("#genome_annot_selector").classed("selectedbutton",true)
			.classed("activebutton",false);
		d3.select("#sixteen_selector").classed("selectedbutton",false).classed("activebutton",true);
		d3.select("#func_contr_selector").classed("selectedbutton",false).classed("activebutton",true);
		
		mainui.uploadMode = "Genome";
		
		mainui.Deac_16s();
		mainui.Deac_FuncCont();
		
		d3.select("#taxonomic_abundances_1_g").attr("visibility","visible");
		d3.select("#genome_annotations_g").attr("visibility","visible");
		button_maker.activate(d3.select("#svg_tax_abund_button"));
		button_maker.activate(d3.select("#svg_genome_annotation_button"));

		Shiny.onInputChange("input_type", "genome_annotation");
	}
	
	mainui.Deac_16s = function() {
		d3.select("#read_counts_g").attr("visibility","hidden");
		button_maker.deactivate(d3.select("#svg_16S_button"));
	}
	
	mainui.Deac_FuncCont = function() {
		d3.select("#taxonomic_abundances_2_g").attr("visibility","hidden");
		d3.select("#function_contributions_g").attr("visibility","hidden");
		button_maker.deactivate(d3.select("#svg_tax_abund_button_2"));
		button_maker.deactivate(d3.select("#svg_func_contrib_button"));
	}
	
	mainui.Deac_GenAno = function() {
		d3.select("#taxonomic_abundances_1_g").attr("visibility","hidden");
		d3.select("#genome_annotations_g").attr("visibility","hidden");
		button_maker.deactivate(d3.select("#svg_tax_abund_button"));
		button_maker.deactivate(d3.select("#svg_genome_annotation_button"));
	}

	mainui.fileloading = function(buttonname, filename) {
	    var thisg = d3.select("#" + buttonname + "_g");
	    thisg.select(".outline").attr("fill","yellow");
	    thisg.select(".filenamelabel").text(filename);
	}

	mainui.fileloaded = function(buttonname) {
	    d3.select("#" + buttonname + "_g").select(".outline").attr("fill","green");
	}

	this.mainui = mainui;
})();