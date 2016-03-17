(function(){
	var uploader_wrapper = {};

	uploader_wrapper.make_uploader = function(draw_everything){

		var uploader = {};

		// These variables keep track of when files are loaded
		// uploader.tax_abund_loaded = false;
		uploader.contribution_table_loaded = false;
		uploader.tax_hierarchy_loaded = false;
		uploader.func_hierarchy_loaded = false;
		uploader.func_averages_loaded = false;
		uploader.samp_map_loaded = false;
		uploader.otu_table_loaded = false;
		
		uploader.svgCreated = false;

		// These variables hold the results of file loading
		// uploader.tax_abund_text = "";
		uploader.tax_hierarchy_text = "";
		uploader.func_hierarchy_text = "";
		uploader.samp_map_text = "";

		// These are the file readers
		// uploader.tax_abund_1_reader = new FileReader();
		// uploader.tax_abund_2_reader = new FileReader();
		// uploader.reads_reader = new FileReader();
		// uploader.tax_hierarchy_reader = new FileReader();
		// uploader.func_hierarchy_reader = new FileReader();
		uploader.samp_map_reader = new FileReader();

		// These are the default data readers
		// uploader.default_tax_abund_file = new XMLHttpRequest();
		uploader.default_samp_map_file = new XMLHttpRequest();

		// This is the parsed contribution data object
		uploader.contribution_table = {};
		uploader.otu_table = [];
		uploader.current_contribution_sample_index = 0;
		uploader.current_otu_sample_index = 0;

		/*
		load_default_data()

		Sends http requests to grab the default data
		*/
		uploader.load_default_data = function(){

			// Add listeners for when the default files have successfully loaded
			// this.default_tax_abund_file.addEventListener("load", this.execute_on_default_tax_abund_load);
			this.default_samp_map_file.addEventListener("load", this.execute_on_default_samp_map_load);

			// this.default_tax_abund_file.open("GET", "Data/otu_table_even_2.txt", true);
			// this.default_tax_abund_file.send();

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
			var load_flags = [uploader.otu_table_loaded, uploader.contribution_table_loaded, uploader.tax_hierarchy_loaded, uploader.func_hierarchy_loaded, uploader.func_averages_loaded, uploader.svgCreated];

			// Check each flag to see if the file has been loaded
			for (var i = 0; i < load_flags.length; i++){
				if (!load_flags[i]){
					all_loaded = false;
				}
			}

			// If all of the flags are true, redraw the graphics
			if (all_loaded){

				draw_everything(uploader.otu_table, uploader.contribution_table, uploader.tax_hierarchy_text, uploader.func_hierarchy_text, uploader.samp_map_text, uploader.func_averages_text);
			}
		}

		Shiny.addCustomMessageHandler("otu_table_ready", function(size){
			uploader.otu_table_loaded = false;
			uploader.otu_table = [];
			uploader.otu_table_length = size;
			uploader.current_otu_sample_index = 0;
			Shiny.onInputChange("otu_sample_request", 0);
		})

		Shiny.addCustomMessageHandler("otu_sample_return", function(otu_sample){
            uploader.otu_table.push(otu_sample[0]);
			++uploader.current_otu_sample_index;
			setTimeout(function(){ // Fixes the disconnect issue, no idea why (Alex)
				if (uploader.current_otu_sample_index < uploader.otu_table_length){
		            Shiny.onInputChange("otu_sample_request", uploader.current_otu_sample_index);
				} else {
					Shiny.onInputChange("otu_sample_request", -1);
					uploader.otu_table_loaded = true;
					uploader.update_plots();
				}
			}, 2);
        });

		uploader.execute_on_samp_map_load = function() {
			uploader.samp_map_loaded = false;
			uploader.samp_map_text = this.result;
			uploader.samp_map_loaded = true;
			//mainui.fileloaded("sample_map");
		}

		Shiny.addCustomMessageHandler("contribution_table_ready", function(size){
			uploader.contribution_table_loaded = false;
			uploader.contribution_table = {};
			uploader.contribution_table_length = size;
			uploader.current_contribution_sample_index = 0;
			Shiny.onInputChange("contribution_sample_request", 0);
		})

		Shiny.addCustomMessageHandler("contribution_sample_return", function(contribution_sample){	
			contribution_sample_name = Object.keys(contribution_sample)[0]
            uploader.contribution_table[contribution_sample_name] = contribution_sample[contribution_sample_name];
			++uploader.current_contribution_sample_index;
			setTimeout(function(){ // Fixes the disconnect issue, no idea why (Alex)
				if (uploader.current_contribution_sample_index < uploader.contribution_table_length){
		            Shiny.onInputChange("contribution_sample_request", uploader.current_contribution_sample_index);
				} else {
					Shiny.onInputChange("contribution_sample_request", -1);
					uploader.contribution_table_loaded = true;
					uploader.update_plots();
				}
			}, 2);
        });

		Shiny.addCustomMessageHandler("tax_hierarchy", function(taxa_hierarchy){
			uploader.tax_hierarchy_loaded = false;
			uploader.tax_hierarchy_text = taxa_hierarchy;
			uploader.tax_hierarchy_loaded = true;
			uploader.update_plots();
		});

		Shiny.addCustomMessageHandler("tax_hierarchy_labels", function(labels){
			tax_dropdown = document.getElementById("taxLODselector")
			var old_options = jQuery.extend(true, [], tax_dropdown.options)
			for (var i = 0; i < old_options.length; i++){
				tax_dropdown.remove(old_options[i])
			}
			var blank_option = document.createElement("option");
			blank_option.text="";
			blank_option.value="";
			tax_dropdown.add(blank_option);
			for (var i = 0; i < labels.length; i++){
				var option = document.createElement("option");
				option.text = labels[i];
				option.value = labels[i];
				tax_dropdown.add(option);
			}
		});

		Shiny.addCustomMessageHandler("function_hierarchy", function(func_hierarchy){
			uploader.func_hierarchy_loaded = false;
			uploader.func_hierarchy_text = func_hierarchy;
			uploader.func_hierarchy_loaded = true;		
			uploader.update_plots();
		});

		Shiny.addCustomMessageHandler("func_averages", function(func_averages){
			uploader.func_averages_loaded = false;
			uploader.func_averages_text = func_averages;
			uploader.func_averages_loaded = true;
			uploader.update_plots();
		});

		uploader.execute_on_default_samp_map_load = function() {
			uploader.samp_map_loaded = false;
			uploader.samp_map_text = this.responseText;
			uploader.samp_map_loaded = true;
			uploader.update_plots();
		}

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
		document.getElementById("sample_map").addEventListener('change', function(e) {
			uploader.samp_map_reader.readAsText(this.files[0]);
			mainui.fileloading("sample_map",this.files[0].name);
			});
			
		// Set up event handlers for selecting other files, only for UI
		document.getElementById("function_contributions").addEventListener('change', function(e) {
			mainui.fileloading("function_contributions",this.files[0].name);
			});
		document.getElementById("genome_annotations").addEventListener('change', function(e) {
			mainui.fileloading("genome_annotations",this.files[0].name);
			});
		document.getElementById("taxonomic_hierarchy").addEventListener('change', function(e) {
			mainui.fileloading("taxonomic_hierarchy",this.files[0].name);
			});
		document.getElementById("function_hierarchy").addEventListener('change', function(e) {
			mainui.fileloading("function_hierarchy",this.files[0].name);
			});
			
		return(uploader);
	}

	this.uploader_wrapper = uploader_wrapper;
})();
