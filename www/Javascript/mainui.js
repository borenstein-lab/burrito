(function(){
	var mainui={};
	
	mainui.datamode = "";

	mainui.uploadMode = "";
	
	mainui.sampleSelected = "none";
	
	mainui.read_counts_changed = 0;
	mainui.taxonomic_abundances_2_changed = 0;
	mainui.function_contributions_changed = 0;
	mainui.taxonomic_abundances_1_changed = 0;
	mainui.genome_annotations_changed = 0;
	mainui.taxonomic_hierarchy_changed = 0;
	mainui.function_hierarchy_changed = 0;
	mainui.sample_map_changed = 0;
	mainui.isSvg = 0;

	
	mainui.createUI = function() {
		
		console.log("setting stuff up");
		document.getElementById("sampleselector").addEventListener("change", function() {
			mainui.checkSampleDataSelect();
		});
		
		mainui.checkInpDataRadio();
		mainui.checkSampleDataSelect();
		mainui.checkWhichInput();
		mainui.RefreshUploadReady();
			
		document.getElementById("submit_button").addEventListener("click", function() {
			if (mainui.datamode == "sample") {
				draw_svg();
				uploader.load_default_data();
			} else if (mainui.datamode == "upload") {
				draw_svg();
				document.getElementById("update_button").click();
			}
		});
	}
		
		


	mainui.checkWhichInput = function() {
		if (document.getElementById("usesample").checked) {
			d3.select("#sampletable").attr("bgcolor","#b3ff99");
			d3.select("#uploadtable").attr("bgcolor","white");
			mainui.datamode = "sample";
		} else if (document.getElementById("useupload").checked) {
			d3.select("#sampletable").attr("bgcolor","white");
			d3.select("#uploadtable").attr("bgcolor","#b3ff99");
			mainui.datamode = "upload";
		} else {
			d3.selectAll("#sampletable, #uploadtable").attr("bgcolor","white");
			mainui.datamode = "";
		}
		mainui.RefreshUploadReady();

	}

	

	mainui.checkSampleDataSelect = function() {
		d3.select("#samplesetinfo").selectAll("div").classed("hidexp",true);
		var sampsel = document.getElementById("sampleselector");
		var dsel = d3.select("#samplesetinfo").select("#" + sampsel.options[sampsel.selectedIndex].value + "exp");
		console.log(dsel);
		dsel.classed("hidexp",false);
		mainui.sampleSelected = sampsel.options[sampsel.selectedIndex].value;
		mainui.RefreshUploadReady();
	}

	mainui.checkInpDataRadio = function() {
		if (document.getElementById("sixteenradio").checked) {
			mainui.deselAllInps();
			d3.select("#read_counts_g").classed("hidexp", false);
			
			mainui.uploadMode = "16s";
			Shiny.onInputChange("input_type", "16S");
			
		} else if (document.getElementById("funcradio").checked) {
			mainui.deselAllInps();
			d3.selectAll("#taxonomic_abundances_2_g, #function_contributions_g").classed("hidexp",false);
			
			mainui.uploadMode = "Function";
			Shiny.onInputChange("input_type", "contribution");
			
		} else if (document.getElementById("genomeradio").checked) {
			mainui.deselAllInps();
			d3.selectAll("#taxonomic_abundances_1_g, #genome_annotations_g").classed("hidexp",false);
			
			mainui.uploadMode = "Genome";
			Shiny.onInputChange("input_type", "genome_annotation");
		}
		
		mainui.RefreshUploadReady();
	}

	mainui.deselAllInps = function() {
		d3.selectAll("#read_counts_g, #taxonomic_abundances_1_g, #taxonomic_abundances_2_g, #function_contributions_g, #genome_annotations_g")
			.classed("hidexp", true)
			.classed("hidbut", false);
	}

	mainui.fileloading = function(buttonname, filename) {
		eval("mainui." + buttonname + "_changed = 1;");
		mainui.RefreshUploadReady();
	}
	
	mainui.RefreshUploadReady = function() {
		var readytogo = false;
		if (mainui.datamode == "upload") {
			if (mainui.uploadMode == "Genome") {
				if (mainui.taxonomic_abundances_1_changed == 1 && mainui.genome_annotations_changed == 1) {
					readytogo = true;
				}
			}
			if (mainui.uploadMode == "16s") {
				if (mainui.read_counts_changed == 1) {
					readytogo = true;
				}
			}
			if (mainui.uploadMode == "Function") {
				if (mainui.taxonomic_abundances_2_changed == 1 && mainui.function_contributions_changed == 1) {
					readytogo = true;
				}
			}
		} else if (mainui.datamode == "sample") {
			if (mainui.sampleSelected != "none") {
				readytogo = true;
			}
		}

		if (readytogo) {
			document.getElementById("update_button").disabled = false;
		} else {
			document.getElementById("update_button").disabled = true;
		}
	}

	this.mainui = mainui;
})();
