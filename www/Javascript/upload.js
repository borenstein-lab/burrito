(function(){
	var uploader_wrapper = {};

	uploader_wrapper.make_uploader = function(draw_everything, update_progress){

		var uploader = {};

		// Initializing the flags that keep track of when files are loaded
		uploader.contribution_table_loaded = false;
		uploader.tax_hierarchy_loaded = false;
		uploader.func_hierarchy_loaded = false;
		uploader.func_averages_loaded = false;
		uploader.samp_map_loaded = false;
		uploader.otu_table_loaded = false;
		uploader.otu_sample_order_loaded = false;
		uploader.func_sample_order_loaded = false;
		
		uploader.svgCreated = false;

		// Initializing the variables to hold the results of file loading
		uploader.tax_hierarchy_text = "";
		uploader.func_hierarchy_text = "";
		uploader.samp_map_text = "";

		// Initializing file readers
		uploader.samp_map_reader = new FileReader();

		// Initializing default data readers
		uploader.default_samp_map_file = new XMLHttpRequest();

		// Initializing the parsed contribution data object
		uploader.contribution_table = {};
		uploader.otu_table = [];
		uploader.current_contribution_sample_index = 0;
		uploader.current_otu_sample_index = 0;
		uploader.otu_sample_order = [];
		uploader.func_sample_order = [];

		/*
		load_default_data()

		Sends http requests to grab the default data
		*/
		uploader.load_default_data = function(){

			// Add listeners for when the default files have successfully loaded
			this.default_samp_map_file.addEventListener("load", this.execute_on_default_samp_map_load);
			this.default_samp_map_file.open("GET", "Data/mice_samplemap.txt", true);
			this.default_samp_map_file.send();
		}

		/*
		reset_load_flags()

		Sets the load flags to false for data that needs to be received from the server
		*/
		uploader.reset_load_flags = function(){
			var load_flags = [uploader.otu_table_loaded, uploader.contribution_table_loaded, uploader.tax_hierarchy_loaded, uploader.func_hierarchy_loaded, uploader.func_averages_loaded];

			// Check each flag to see if the file has been loaded
			for (var i = 0; i < load_flags.length; i++){
				load_flags[i] = false
			}
		}

		/*
		update_plots()

		Checks to see if the necessary data is available to update the plots. If not, waits to update until the data is ready.
		*/
		uploader.update_plots = function(){
			var all_loaded = true;
			var load_flags = [uploader.otu_table_loaded, uploader.contribution_table_loaded, uploader.tax_hierarchy_loaded, uploader.func_hierarchy_loaded, uploader.func_averages_loaded, uploader.svgCreated, uploader.otu_sample_order_loaded, uploader.func_sample_order_loaded];

			// Check each flag to see if the file has been loaded
			for (var i = 0; i < load_flags.length; i++){
				if (!load_flags[i]){
					all_loaded = false;
				}
			}

			// If all of the flags are true, redraw the graphics
			if (all_loaded){
				draw_everything(uploader.otu_table, uploader.contribution_table, uploader.tax_hierarchy_text, uploader.func_hierarchy_text, uploader.samp_map_text, uploader.func_averages_text, uploader.otu_sample_order, uploader.func_sample_order);
			}
		}

		/*
		otu_table_ready handler

		Initializes the otu table in the uploader class in preparation for receiving the otu table from the server.
		*/
		Shiny.addCustomMessageHandler("otu_table_ready", function(size){

			// Update the flag to indicate the otu table has not been loaded yet and initialize it
			uploader.otu_table_loaded = false;
			uploader.otu_table = [];
			uploader.otu_table_length = size;
			uploader.current_otu_sample_index = 0;

			// After initializing the data structure, request the first sample
			Shiny.onInputChange("otu_sample_request", 0);
		})

		/*
		otu_sample_return handler

		Reads the otu table entry for a sample returned by the server and requests the next sample, or if this is the last sample then calls for a plot update.
		*/
		Shiny.addCustomMessageHandler("otu_sample_return", function(otu_sample){

			// Append the most recent sample received and ask for next sample
            uploader.otu_table.push(otu_sample[0]);
			++uploader.current_otu_sample_index;

			// Fixes the disconnect issue by requesting pieces of the data rather than the full table
			setTimeout(function(){

				// If there is another sample to request, then request it
				if (uploader.current_otu_sample_index < uploader.otu_table_length){
		            Shiny.onInputChange("otu_sample_request", uploader.current_otu_sample_index);

		        // Otherwise, update the flag to indicate the otu table has been fully loaded and call for a plot update
				} else {
					Shiny.onInputChange("otu_sample_request", -1);
					uploader.otu_table_loaded = true;
					uploader.update_plots();
				}
			}, 2);
        });

		/*
		execute_on_samp_map_load()

		Loads the sample map text and updates the appropriate flag to indicate the sample map has been loaded.
		*/
		uploader.execute_on_samp_map_load = function() {
			uploader.samp_map_loaded = false;
			uploader.samp_map_text = this.result;
			uploader.samp_map_loaded = true;
		}

		/*
		contribution_table_ready handler

		Initializes the contribution table in the uploader class in prepartion for receiving the contribution table from the server.
		*/
		Shiny.addCustomMessageHandler("contribution_table_ready", function(size){

			// Update the flag to indicate the contribution table has not been loaded yet and initialize it
			uploader.contribution_table_loaded = false;
			uploader.contribution_table = {};
			uploader.contribution_table_length = size;
			uploader.current_contribution_sample_index = 0;

			// Update the upload progress bar
			update_progress(uploader.current_contribution_sample_index, uploader.contribution_table_length);

			// After initializing the data structure and updating the progress bar, request the first sample
			Shiny.onInputChange("contribution_sample_request", 0);
		})

		/*
		contribution_sample_return handler

		REads the contribution table netry for a sample returned by the server and requests the next sample, or if this is the last sample then calls for a plot update.
		*/
		Shiny.addCustomMessageHandler("contribution_sample_return", function(contribution_sample){

			// Add the most recent sample to the map of contribution table samples by sample name and ask for the next sample
			contribution_sample_name = Object.keys(contribution_sample)[0]
            uploader.contribution_table[contribution_sample_name] = contribution_sample[contribution_sample_name];
			++uploader.current_contribution_sample_index;

			// Update the progress bar
			update_progress(uploader.current_contribution_sample_index, uploader.contribution_table_length);

			// Fixes the disconnect issue by requesting pieces of the data rather than the full table
			setTimeout(function(){

				// If there is another sample, request it
				if (uploader.current_contribution_sample_index < uploader.contribution_table_length){
		            Shiny.onInputChange("contribution_sample_request", uploader.current_contribution_sample_index);

		        // Otherwise, update the flag to indicate the contribution table has been loaded and request a plot update
				} else {
					Shiny.onInputChange("contribution_sample_request", -1);
					uploader.contribution_table_loaded = true;
					uploader.update_plots();
				}
			}, 2);
        });

		/*
		otu_sample_order handler

		Reads the sample display order for the otu table and updates the appropriate flag.
		*/
		Shiny.addCustomMessageHandler("otu_sample_order", function(sample_order){
        	uploader.otu_sample_order_loaded = false;
        	uploader.otu_sample_order = sample_order;
        	uploader.otu_sample_order_loaded = true;
        });

		/*
		func_sample_order handler

		Reads the sample display order for the function table and updates the appropriate flag.
		*/
        Shiny.addCustomMessageHandler("func_sample_order", function(sample_order){
        	uploader.func_sample_order_loaded = false;
        	uploader.func_sample_order = sample_order;
        	uploader.func_sample_order_loaded = true;
        });

        /*
		tax_hierarchy handler

		Reads the taxonomic hierarchy, updates the appropriate flag, and calls for a plot update.
        */
		Shiny.addCustomMessageHandler("tax_hierarchy", function(taxa_hierarchy){
			uploader.tax_hierarchy_loaded = false;
			uploader.tax_hierarchy_text = taxa_hierarchy;
			uploader.tax_hierarchy_loaded = true;
			uploader.update_plots();
		});

		/*
		tax_hierarchy_lables handler

		Updates the taxonomic hierarchy level-of-detail dropdown labels based on the taxonomic hierarchy being used. Default to the default taxonomic hierarchy labels with Genus selected.
		*/
		Shiny.addCustomMessageHandler("tax_hierarchy_labels", function(labels){
			tax_dropdown = null;
			if (mainui.uploadMode == "Read"){
				tax_dropdown = document.getElementById("taxLODselector_R")
			} else if (mainui.uploadMode == "Contribution"){
				tax_dropdown = document.getElementById("taxLODselector_C")
			} else if (mainui.uploadMode == "Genome"){
				tax_dropdown = document.getElementById("taxLODselector_G")
			}
			if (tax_dropdown != null){
				var old_options = jQuery.extend(true, [], tax_dropdown.options)
				for (var i = 0; i < old_options.length; i++){
					tax_dropdown.remove(old_options[i])
				}
				var blank_option = document.createElement("option");
				for (var i = 0; i < labels.length; i++){
					var option = document.createElement("option");
					option.text = labels[i];
					option.value = labels[i];
					tax_dropdown.add(option);
				}
				for (var i, j = 0; i = tax_dropdown.options[j]; j++){
					if (i.value == "Genus") {
						tax_dropdown.selectedIndex = j;
						break;
					}
				}
			} else {
				tax_selectors = ["taxLODselector_R", "taxLODselector_C", "taxLODselector_G"]
				for (var k = 0; k < tax_selectors.length; k++){
					tax_dropdown = document.getElementById(tax_selectors[k]);
					var old_options = jQuery.extend(true, [], tax_dropdown.options)
					for (var i = 0; i < old_options.length; i++){
						tax_dropdown.remove(old_options[i])
					}
					var blank_option = document.createElement("option");
					for (var i = 0; i < labels.length; i++){
						var option = document.createElement("option");
						option.text = labels[i];
						option.value = labels[i];
						tax_dropdown.add(option);
					}
					for (var i, j = 0; i = tax_dropdown.options[j]; j++){
						if (i.value == "Genus") {
							tax_dropdown.selectedIndex = j;
							break;
						}
					}	
				}
			}
		});
		
		/*
		function_hierarchy handler

		Reads the function hierarchy and updates the appropriate flag.
		*/
		Shiny.addCustomMessageHandler("function_hierarchy", function(func_hierarchy){
			uploader.func_hierarchy_loaded = false;
			uploader.func_hierarchy_text = func_hierarchy;
			uploader.func_hierarchy_loaded = true;		
			uploader.update_plots();
		});

		/*
		func_hierarchy_labels handler

		Updates the function hierarchy level-of-detail dropdown labels based on the function hierarchy being used. Default to the default function hierarchy labels with SubPathway selected.
		*/
		Shiny.addCustomMessageHandler("func_hierarchy_labels", function(labels){
			func_dropdown = null;
			if (mainui.uploadMode == "Read"){
				func_dropdown = document.getElementById("funcLODselector_R")
			} else if (mainui.uploadMode == "Contribution"){
				func_dropdown = document.getElementById("funcLODselector_C")
			} else if (mainui.uploadMode == "Genome"){
				func_dropdown = document.getElementById("funcLODselector_G")
			}
			if (func_dropdown != null){
				var old_options = jQuery.extend(true, [], func_dropdown.options)
				for (var i = 0; i < old_options.length; i++){
					func_dropdown.remove(old_options[i])
				}
				var blank_option = document.createElement("option");
				for (var i = 0; i < labels.length; i++){
					var option = document.createElement("option");
					option.text = labels[i];
					option.value = labels[i];
					func_dropdown.add(option);
				}
				for (var i, j = 0; i = func_dropdown.options[j]; j++){
					if (i.value == "SubPathway") {
						func_dropdown.selectedIndex = j;
						break;
					}
				}
			} else {
				func_selectors = ["funcLODselector_R", "funcLODselector_C", "funcLODselector_G"]
				for (var k = 0; k < func_selectors.length; k++){
					func_dropdown = document.getElementById(func_selectors[k]);
					var old_options = jQuery.extend(true, [], func_dropdown.options)
					for (var i = 0; i < old_options.length; i++){
						func_dropdown.remove(old_options[i])
					}
					var blank_option = document.createElement("option");
					for (var i = 0; i < labels.length; i++){
						var option = document.createElement("option");
						option.text = labels[i];
						option.value = labels[i];
						func_dropdown.add(option);
					}
					for (var i, j = 0; i = func_dropdown.options[j]; j++){
						if (i.value == "SubPathway") {
							func_dropdown.selectedIndex = j;
							break;
						}
					}	
				}
			}
		});

		/*
		func_averages handler

		Reads the function abundance averages, updates the appropriate flag, and calls for a plot update.
		*/
		Shiny.addCustomMessageHandler("func_averages", function(func_averages){
			uploader.func_averages_loaded = false;
			uploader.func_averages_text = func_averages;
			uploader.func_averages_loaded = true;
			uploader.update_plots();
		});

		/*
		sample_map_labels handler

		Updates the sample map factor-to-order-by dropdown labels based on the sample map labels being used. Default to no selected sample ordering.
		*/
		Shiny.addCustomMessageHandler("sample_map_labels", function(labels){
			sample_group_dropdown = null;
			if (mainui.uploadMode == "Read"){
				sample_group_dropdown = document.getElementById("sampgroupselector_R")
			} else if (mainui.uploadMode == "Contribution"){
				sample_group_dropdown = document.getElementById("sampgroupselector_C")
			} else if (mainui.uploadMode == "Genome"){
				sample_group_dropdown = document.getElementById("sampgroupselector_G")
			}
			if (sample_group_dropdown != null){
				var old_options = jQuery.extend(true, [], sample_group_dropdown.options)
				for (var i = 0; i < old_options.length; i++){
					sample_group_dropdown.remove(old_options[i])
				}
				var blank_option = document.createElement("option");
				blank_option.text="";
				blank_option.value="";
				sample_group_dropdown.add(blank_option);
				if (typeof labels === 'string' || labels instanceof String){ //if only one grouping option, to keep from splitting into characters
					var option = document.createElement("option");
					option.text = labels;
					option.value = labels;
					sample_group_dropdown.add(option);
				} else {
					for (var i = 0; i < labels.length; i++){
						var option = document.createElement("option");
						option.text = labels[i];
						option.value = labels[i];
						sample_group_dropdown.add(option);
					}
				}
			}
		});

		/*
		execute_on_default_samp_map_load()

		Reads the default sample map labels for the example dataset, updates the appropriate flag, and calls for a plot update.
		*/
		uploader.execute_on_default_samp_map_load = function() {
			uploader.samp_map_loaded = false;
			uploader.samp_map_text = this.responseText;
			uploader.samp_map_loaded = true;
			uploader.update_plots();
		}

		/*
		retry_upload handler

		If it takes a non-negligble amount of time to upload data to the server, then repeats the update request until the data finishes uploading.
		*/
		Shiny.addCustomMessageHandler("retry_upload", function(message){
			setTimeout(function(){
				document.getElementById("update_button").click()
			}, 2000)
		})

		// Add listeners for when files have successfully loaded
		// uploader.tax_abund_1_reader.addEventListener('load', uploader.execute_on_tax_abund_1_load);
		// uploader.tax_abund_2_reader.addEventListener('load', uploader.execute_on_tax_abund_2_load);
		// uploader.reads_reader.addEventListener('load', uploader.execute_on_reads_load);
		uploader.samp_map_reader.addEventListener('load', uploader.execute_on_samp_map_load);

		// Set up the event handlers for loading files when they get chosen for upload
		document.getElementById("taxonomic_abundances_1").addEventListener('change', function(e) {
			mainui.fileloading("taxonomic_abundances_1",this.files[0].name);
			});
		document.getElementById("taxonomic_abundances_2").addEventListener('change', function(e) {
			mainui.fileloading("taxonomic_abundances_2",this.files[0].name);
			});
		document.getElementById("read_counts").addEventListener('change', function(e) {
			mainui.fileloading("read_counts",this.files[0].name);
			});
		document.getElementById("sample_map_R").addEventListener('change', function(e) {
			uploader.samp_map_reader.readAsText(this.files[0]);
			mainui.fileloading("sample_map_R",this.files[0].name);
			});
		document.getElementById("sample_map_C").addEventListener('change', function(e) {
			uploader.samp_map_reader.readAsText(this.files[0]);
			mainui.fileloading("sample_map_C",this.files[0].name);
			});
		document.getElementById("sample_map_G").addEventListener('change', function(e) {
			uploader.samp_map_reader.readAsText(this.files[0]);
			mainui.fileloading("sample_map_G",this.files[0].name);
			});
			
		// Set up event handlers for selecting other files, only for UI
		document.getElementById("function_contributions").addEventListener('change', function(e) {
			mainui.fileloading("function_contributions",this.files[0].name);
			});
		document.getElementById("genome_annotations").addEventListener('change', function(e) {
			mainui.fileloading("genome_annotations",this.files[0].name);
			});
		document.getElementById("taxonomic_hierarchy_R").addEventListener('change', function(e) {
			mainui.fileloading("taxonomic_hierarchy_R",this.files[0].name);
			});
		document.getElementById("taxonomic_hierarchy_C").addEventListener('change', function(e) {
			mainui.fileloading("taxonomic_hierarchy_C",this.files[0].name);
			});
		document.getElementById("taxonomic_hierarchy_G").addEventListener('change', function(e) {
			mainui.fileloading("taxonomic_hierarchy_G",this.files[0].name);
			});
		document.getElementById("function_hierarchy_R").addEventListener('change', function(e) {
			mainui.fileloading("function_hierarchy_R",this.files[0].name);
			});
		document.getElementById("function_hierarchy_C").addEventListener('change', function(e) {
			mainui.fileloading("function_hierarchy_C",this.files[0].name);
			});
		document.getElementById("function_hierarchy_G").addEventListener('change', function(e) {
			mainui.fileloading("function_hierarchy_G",this.files[0].name);
			});
		document.getElementById("function_abundances_R").addEventListener('change', function(e) {
			mainui.fileloading("function_abundances_R",this.files[0].name);
			});
		document.getElementById("function_abundances_C").addEventListener('change', function(e) {
			mainui.fileloading("function_abundances_C",this.files[0].name);
			});
		document.getElementById("function_abundances_G").addEventListener('change', function(e) {
			mainui.fileloading("function_abundances_G",this.files[0].name);
			});
			
		return(uploader);
	}

	this.uploader_wrapper = uploader_wrapper;
})();
