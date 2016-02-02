(function(){
	var uploader_wrapper = {};

	uploader_wrapper.make_uploader = function(draw_everything){

		var uploader = {};

		// Constants for parsing
		uploader.otu_col = 1;
		uploader.sample_col = 0;
		uploader.ko_col = 2;
		uploader.read_count_col = 3;

		uploader.default_otu_col = 2;
		uploader.default_sample_col = 1;
		uploader.default_ko_col = 0;
		uploader.default_read_count_col = 5;

		// These variables keep track of when files are loaded
		uploader.tax_abund_1_loaded = false;
		uploader.tax_abund_2_loaded = false;
		uploader.reads_loaded = false;
		uploader.genome_annotation_loaded = false;
		uploader.func_contrib_loaded = false;
		uploader.contribution_table_loaded = false;
		uploader.tax_hierarchy_loaded = false;
		uploader.func_hierarchy_loaded = false;
		uploader.func_averages_loaded = false;
		uploader.samp_map_loaded = false;

		// These variables hold the results of file loading
		uploader.tax_abund_1_text = "";
		uploader.tax_abund_2_text = "";
		uploader.reads_text = "";
		uploader.genome_annotation_text = "";
		uploader.func_contrib_text = "";
		uploader.tax_hierarchy_text = "";
		uploader.func_hierarchy_text = "";
		uploader.samp_map_text = "";

		// These are the file readers
		uploader.tax_abund_1_reader = new FileReader();
		uploader.tax_abund_2_reader = new FileReader();
		uploader.func_contrib_reader = new FileReader();
		uploader.reads_reader = new FileReader();
		uploader.genome_annotation_reader = new FileReader();
		uploader.tax_hierarchy_reader = new FileReader();
		uploader.func_hierarchy_reader = new FileReader();
		uploader.samp_map_reader = new FileReader();

		// These are the default data readers
		uploader.default_tax_abund_file = new XMLHttpRequest();
		uploader.default_tax_hierarchy_file = new XMLHttpRequest();
		uploader.default_samp_map_file = new XMLHttpRequest();

		// This is the parsed contribution data object
		uploader.contribution_table = [];

		/*
		load_default_data()

		Sends http requests to grab the default data
		*/
		uploader.load_default_data = function(){

			// Add listeners for when the default files have successfully loaded
			this.default_tax_abund_file.addEventListener("load", this.execute_on_default_tax_abund_load);
			//this.default_tax_hierarchy_file.addEventListener("load", this.execute_on_default_tax_hierarchy_load);
			this.default_samp_map_file.addEventListener("load", this.execute_on_default_samp_map_load);

			this.default_tax_abund_file.open("GET", "Data/otu_table_even_2.txt", true);
			//this.default_tax_abund_file.open("GET", "Data/reduced_genus_taxa_transpose.txt", true);
			this.default_tax_abund_file.send();
			//this.default_tax_hierarchy_file.open("GET", "Data/full_gg_taxa_mapping_parsed.txt", true);
			//this.default_tax_hierarchy_file.open("GET", "Data/taxa_mapping2.txt", true);
			//this.default_tax_hierarchy_file.send();
			this.default_samp_map_file.open("GET", "Data/mice_samplemap.txt", true);
			this.default_samp_map_file.send();
		}

		/*
		update_plots()

		Checks to see what files have been selected for upload. If no files are selected, then just reset the plots using the current data. If some, but not all of the necessary files have been uploaded, then display messages to the user indicating which files still need to be selected. If all necessary files have been selected, upload the data and generate new plots.
		*/
		uploader.update_plots = function(){
			var tax_abund_1 = false;
			var tax_abund_2 = false;
			var reads = false;
			var genome_annotation = false;
			var func_contrib = false;
			var tax_hierarchy = false;
			var func_hierarchy = false;
			var samp_map = false;
			var func_averages = false;

			// Check to see which upload type has been chosen
			if (mainui.uploadMode == "Genome"){

				// Check to see if we have a file of taxonomic abundances
				if (document.getElementById("taxonomic_abundances_1").value != ""){
					tax_abund_1 = true;
				}

				// Check to see if we have a file of genome annotations
				if (document.getElementById("genome_annotations").value != ""){
					genome_annotation = true;
				}

			} else if (mainui.uploadMode == "16s"){

				// Check to see if we have a 16S read count file
				if (document.getElementById("read_counts").value != ""){
					reads = true;
				}

			} else if (mainui.uploadMode == "Function"){

				// Check to see if we have a file of taxonomic abundances
				if (document.getElementById("taxonomic_abundances_2").value != "" && document.getElementById("svg_contribution_select_button").getAttribute("selected") == "true"){
					tax_abund_2 = true;
				}

				// Check to see if we have a file of function contributions
				if (document.getElementById("function_contributions").value != "" && document.getElementById()){
					func_contrib = true;
				}

			}

			// Check to see if we have a file describing the taxonomic hierarchy
			if (document.getElementById("taxonomic_hierarchy").value != ""){
				tax_hierarchy = true;
			}	

			// Check to see if we have a file describing the functional hierarchy
			if (document.getElementById("function_hierarchy").value != ""){
				func_hierarchy = true;
			}
			if (document.getElementById("func_averages").value != ""){
				func_averages = true;
			}

			// Check to see if we have a file describing the samples
			if (document.getElementById("sample_map").value != ""){
				samp_map = true;
			}

			// Now check if any new files have been selected
			if (tax_abund_1 || tax_abund_2 || reads || genome_annotation || func_contrib || tax_hierarchy || func_hierarchy || samp_map){

				// If all of the necessary files have been selected for the chosen option, then we can try to update
				var to_load = [];
				var load_ready = false;
				if ( (mainui.uploadMode == "Genome") && tax_abund_1 && genome_annotation){

					to_load.push(this.tax_abund_1_loaded);
					load_ready = true;

				} else if ( (mainui.uploadMode == "16s") && reads){

					to_load.push(this.reads_loaded);
					load_ready = true;

				} else if ( (mainui.uploadMode == "Function") && tax_abund_2 && func_contrib){

					to_load.push(this.tax_abund_2_loaded);
					load_ready = true;
				}

				if (load_ready){

					// Check which optional files we should wait for
					if (tax_hierarchy){
						to_load.push(this.tax_hierarchy_loaded)
					}
					if (func_hierarchy){
						to_load.push(this.func_hierarchy_loaded)
					}
					if (samp_map){
						to_load.push(this.samp_map_loaded)
					}

					this.check_loaded(to_load, draw_everything);

				}
				
				// If no files have been uploaded, then we can just reset 
			} else if (!tax_abund_1 && !tax_abund_2 && !reads && !genome_annotation && !func_contrib && !tax_hierarchy && !func_hierarchy && !samp_map){
				draw_everything(this.tax_abund_text, this.contribution_table, this.tax_hierarchy_text, this.func_hierarchy_text, this.samp_map_text, this.func_averages_text);
			}
		}
		
		/*
		check_loaded()
		Checks to see if the indicate files have been loaded. If so, redraw the graphics.
		*/
		uploader.check_loaded = function(load_flags, draw_everything) {
				
			var all_loaded = true;

			// Check each flag to see if the file has been loaded
			for (var i = 0; i < load_flags.length; i++){
				if (!load_flags[i]){
					all_loaded = false;
				}
			}

			// If all of the flags are true, redraw the graphics
			if (all_loaded ){

				draw_everything(this.tax_abund_text, this.contribution_table, this.tax_hierarchy_text, this.func_hierarchy_text, this.samp_map_text, this.func_averages_text);
				
				// Reset the upload buttons and flags so if new files are uploaded, we wait for them
				if (mainui.uploadMode == "Genome"){

					this.tax_abund_1_loaded = false;
					this.genome_annotation_loaded = false;
					document.getElementById("taxonomic_abundances_1").value = "";
					document.getElementById("genome_annotations").value = "";

				} else if (mainui.uploadMode == "16s"){

					this.reads_loaded = false;
					document.getElementById("read_counts").value = "";

				} else if (mainui.uploadMode == "Function"){

					this.tax_abund_2_loaded = false;
					this.func_contrib_loaded = false;
					document.getElementById("taxonomic_abundances_2").value = "";
					document.getElementById("function_contributions").value = "";

				}

				this.contribution_table_loaded = false;
				this.tax_hierarchy_loaded = false;
				this.func_hierarchy_loaded = false;
				this.func_averages_loaded = false;
				this.samp_map_loaded = false;
				document.getElementById("taxonomic_hierarchy").value = "";
				document.getElementById("sample_map").value = "";
			}
		}

		uploader.execute_on_tax_abund_1_load = function() {
			uploader.tax_abund_text = this.result;
			uploader.tax_abund_1_loaded = true;
			mainui.fileloaded("taxonomic_abundances_1");
		}

		uploader.execute_on_tax_abund_2_load = function() {
			uploader.tax_abund_text = this.result;
			uploader.tax_abund_2_loaded = true;
			mainui.fileloaded("taxonomic_abundances_2");
		}

		uploader.execute_on_reads_load = function() {
			uploader.reads_text = this.result;
			uploader.reads_loaded = true;
			mainui.fileloaded("read_counts");
		}

 		uploader.execute_on_tax_hierarchy_load = function() {
 			uploader.tax_hierarchy_text = this.result;
 			uploader.tax_hierarchy_loaded = true;
			mainui.fileloaded("taxonomic_hierarchy");
 		}

		uploader.execute_on_func_hierarchy_load = function() {
			uploader.func_hierarchy_text = this.result;
			uploader.func_hierarchy_loaded = true;
			mainui.fileloaded("function_hierarchy");
		}

		uploader.execute_on_samp_map_load = function() {
			uploader.samp_map_text = this.result;
			uploader.samp_map_loaded = true;
			mainui.fileloaded("sample_map");
		}

		uploader.execute_on_func_contrib_load = function() {
		    uploader.func_contrib_text = this.result;
		    uploader.func_contrib_loaded = true;
		    mainui.fileloaded("function_contributions");
		}

		uploader.execute_on_genome_annotation_load = function() {
		    uploader.genome_annotation_text = this.result;
		    uploader.genome_annotation_loaded = true;
		    mainui.fileloaded("genome_annotations");
		}

		Shiny.addCustomMessageHandler("tax_hierarchy", function(taxa_hierarchy){
			uploader.tax_hierarchy_text = taxa_hierarchy;
			uploader.tax_hierarchy_loaded = true;
		});
		
		
		Shiny.addCustomMessageHandler("contribution_table", function(contribution_table){
			this.contribution_table = contribution_table;
			this.contribution_table_loaded = true;
		});

		Shiny.addCustomMessageHandler("function_hierarchy", function(func_hierarchy){
			this.func_hierarchy_text = func_hierarchy;
			this.func_hierarchy_loaded = true;
		});

		uploader.execute_on_default_tax_abund_load = function() {
			uploader.tax_abund_text = this.responseText;
			uploader.tax_abund_1_loaded = true;
			uploader.check_loaded([uploader.tax_abund_1_loaded, uploader.contribution_table_loaded, uploader.tax_hierarchy_loaded, uploader.func_hierarchy_loaded, uploader.samp_map_loaded, uploader.func_averages_loaded], draw_everything);
		}

		uploader.execute_on_default_tax_hierarchy_load = function() {
			uploader.tax_hierarchy_text = this.responseText;
			uploader.tax_hierarchy_loaded = true;
			uploader.check_loaded([uploader.tax_abund_1_loaded, uploader.contribution_table_loaded, uploader.tax_hierarchy_loaded, uploader.func_hierarchy_loaded, uploader.samp_map_loaded, uploader.func_averages_loaded], draw_everything);
		}

		uploader.execute_on_default_samp_map_load = function() {
			uploader.samp_map_text = this.responseText;
			uploader.samp_map_loaded = true;
			uploader.check_loaded([uploader.tax_abund_1_loaded, uploader.contribution_table_loaded, uploader.tax_hierarchy_loaded, uploader.func_hierarchy_loaded, uploader.samp_map_loaded, uploader.func_averages_loaded], draw_everything);
		}

		Shiny.addCustomMessageHandler("default_contribution_table", function(contribution_table){
			uploader.contribution_table = contribution_table;
			uploader.contribution_table_loaded = true;
			uploader.check_loaded([uploader.tax_abund_1_loaded, uploader.contribution_table_loaded, uploader.tax_hierarchy_loaded, uploader.func_hierarchy_loaded, uploader.samp_map_loaded, uploader.func_averages_loaded], draw_everything);
		});

		Shiny.addCustomMessageHandler("default_function_hierarchy", function(func_hierarchy){
			uploader.func_hierarchy_text = func_hierarchy;
			uploader.func_hierarchy_loaded = true;
			uploader.check_loaded([uploader.tax_abund_1_loaded, uploader.contribution_table_loaded, uploader.tax_hierarchy_loaded, uploader.func_hierarchy_loaded, uploader.samp_map_loaded, uploader.func_averages_loaded], draw_everything);
		});

		Shiny.addCustomMessageHandler("default_tax_hierarchy", function(taxa_hierarchy){
			uploader.tax_hierarchy_text = taxa_hierarchy;
			uploader.tax_hierarchy_loaded = true;
			uploader.check_loaded([uploader.tax_abund_1_loaded, uploader.contribution_table_loaded, uploader.tax_hierarchy_loaded, uploader.func_hierarchy_loaded, uploader.samp_map_loaded, uploader.func_averages_loaded], draw_everything);
		});
		console.log(uploader.tax_hierarchy_text)

		Shiny.addCustomMessageHandler("func_averages", function(func_averages){
			uploader.func_averages_text = func_averages;
			uploader.func_averages_loaded = true;
			uploader.check_loaded([uploader.tax_abund_1_loaded, uploader.contribution_table_loaded, uploader.tax_hierarchy_loaded, uploader.func_hierarchy_loaded, uploader.samp_map_loaded, uploader.func_averages_loaded], draw_everything);
		});

		// Add listeners for when files have successfully loaded
		uploader.tax_abund_1_reader.addEventListener('load', uploader.execute_on_tax_abund_1_load);
		uploader.tax_abund_2_reader.addEventListener('load', uploader.execute_on_tax_abund_2_load);
		uploader.reads_reader.addEventListener('load', uploader.execute_on_reads_load);
		uploader.tax_hierarchy_reader.addEventListener('load', uploader.execute_on_tax_hierarchy_load);
		uploader.samp_map_reader.addEventListener('load', uploader.execute_on_samp_map_load);
		uploader.func_contrib_reader.addEventListener('load', uploader.execute_on_func_contrib_load);
		uploader.genome_annotation_reader.addEventListener('load', uploader.execute_on_genome_annotation_load);
		uploader.func_hierarchy_reader.addEventListener('load', uploader.execute_on_func_hierarchy_load);

		// Set up the event handlers for loading files when they get chosen for upload
		document.getElementById("taxonomic_abundances_1").addEventListener('change', function(e) {
			uploader.tax_abund_1_reader.readAsText(this.files[0]);
			mainui.fileloading("taxonomic_abundances_1",this.files[0].name);
			});
		document.getElementById("taxonomic_abundances_2").addEventListener('change', function(e) {
			uploader.tax_abund_2_reader.readAsText(this.files[0]);
			mainui.fileloading("taxonomic_abundances_2",this.files[0].name);
			});
		document.getElementById("read_counts").addEventListener('change', function(e) {
			uploader.reads_reader.readAsText(this.files[0]);
			mainui.fileloading("read_counts",this.files[0].name);
			});
 		document.getElementById("taxonomic_hierarchy").addEventListener('change', function(e) {
 			uploader.tax_hierarchy_reader.readAsText(this.files[0]);
			mainui.fileloading("taxonomic_hierarchy",this.files[0].name);
 			});
		document.getElementById("sample_map").addEventListener('change', function(e) {
			uploader.samp_map_reader.readAsText(this.files[0]);
			mainui.fileloading("sample_map",this.files[0].name);
			});
		document.getElementById("function_contributions").addEventListener('change', function(e) {
			uploader.func_contrib_reader.readAsText(this.files[0]);
			mainui.fileloading("function_contributions",this.files[0].name);
		    });
		document.getElementById("genome_annotations").addEventListener('change', function(e) {
			uploader.genome_annotation_reader.readAsText(this.files[0]);
			mainui.fileloading("genome_annotations",this.files[0].name);
		    });
		document.getElementById("function_hierarchy").addEventListener('change', function(e) {
			uploader.func_hierarchy_reader.readAsText(this.files[0]);
			mainui.fileloading("function_hierarchy",this.files[0].name);
		    });


		return(uploader);
	}

	this.uploader_wrapper = uploader_wrapper;
})();
