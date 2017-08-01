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

		document.getElementById("update_button").addEventListener("click", function() {
			uploader.reset_load_flags();
			if (mainui.uploadMode == "example"){
				Shiny.onInputChange("example_visualization", "TRUE");
			} else {
				Shiny.onInputChange("example_visualization", "FALSE");
			}
			draw_svg();
		});

		document.getElementById("example_button").addEventListener("click", function() {
			mainui.uploadMode = "example";
			document.getElementById("update_button").click();
		});
	}

	mainui.fileloading = function(buttonname, filename) {
		if (document.getElementById(buttonname).files[0].size > max_upload_size){
				alert("The file '" + document.getElementById(buttonname).files[0].name + "'' is too large to upload at this time. We apologize for the inconvienence.")
		}
	}

	this.mainui = mainui;
})();
