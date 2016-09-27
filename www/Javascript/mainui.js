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
		/*
		//console.log("setting stuff up");
		document.getElementById("sampleselector").addEventListener("change", function() {
			mainui.checkSampleDataSelect();
		});
		
		mainui.checkInpDataRadio();
		mainui.checkSampleDataSelect();
		mainui.checkWhichInput();
		mainui.RefreshUploadReady();
			
		document.getElementById("update_button").addEventListener("click", function() {
			uploader.reset_load_flags();
			draw_svg();
			if (mainui.datamode == "sample") {
				// draw_svg();
				uploader.load_default_data();
				//document.getElementById("update_button").click();
			}
		});
		*/
		document.getElementById("ReadOption").addEventListener("click", function() {
			if (mainui.uploadMode == "Read") {
				mainui.uploadMode = "";
				d3.select("#ReadMenu").classed("hidexp",true);
			} else {
				mainui.uploadMode = "Read";
				d3.select("#ReadMenu").classed("hidexp",false);
				d3.select("#ContributionMenu").classed("hidexp",true);
				d3.select("#GenomeMenu").classed("hidexp",true);
			}
		});
		document.getElementById("ContributionOption").addEventListener("click", function() {
			if (mainui.uploadMode == "Contribution") {
				mainui.uploadMode = "";
				d3.select("#ContributionMenu").classed("hidexp",true);
			} else {
				mainui.uploadMode = "Contribution";
				d3.select("#ReadMenu").classed("hidexp",true);
				d3.select("#ContributionMenu").classed("hidexp",false);
				d3.select("#GenomeMenu").classed("hidexp",true);
			}
		});
		document.getElementById("GenomeOption").addEventListener("click", function() {
			if (mainui.uploadMode == "Genome") {
				mainui.uploadMode = "";
				d3.select("#GenomeMenu").classed("hidexp",true);
			} else {
				mainui.uploadMode = "Genome";
				d3.select("#ReadMenu").classed("hidexp",true);
				d3.select("#ContributionMenu").classed("hidexp",true);
				d3.select("#GenomeMenu").classed("hidexp",false);
			}
		});
	
			
			}
		
		/*document.getElementById("update_button").addEventListener("click", function() {
			console.log("update button clicked");
		}); */	

/* % out of date with UI change, delete
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
		dsel.classed("hidexp",false);
		mainui.sampleSelected = sampsel.options[sampsel.selectedIndex].value;
		mainui.RefreshUploadReady();
	}
*/
	/*mainui.checkInpDataRadio = function() {
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
		if (document.getElementById(buttonname).files[0].size > max_upload_size){
				alert("The file '" + document.getElementById(buttonname).files[0].name + "'' is too large to upload at this time. We apologize for the inconvienence.")
		}
		mainui.RefreshUploadReady();
	}*/
	
	/*
	 * mainui.RefreshUploadReady = function() {
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
	}*/

	this.mainui = mainui;
})();
