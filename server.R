# R server code interacting with the main webpage
library(shiny)
library(data.table)

# Default files, tables for contribution calculations, a file of shared constants, and the html input elements we interact with
default_taxonomic_hierarchy_table_filename = "www/Data/97_otu_taxonomy_split_with_header.txt"
default_function_hierarchy_table_filename = "www/Data/brite_hierarchy.tab"
default_metadata_table_filename = "www/Data/mice_samplemap.txt"
default_contribution_table_filename = "www/Data/mice_metagenome_contributions_K01516_removed.txt"
default_otu_table_filename = "www/Data/otu_table_even_2.txt"
picrust_normalization_table_filename = "www/Data/16S_13_5_precalculated.tab.gz"
picrust_ko_table_directory = "www/Data/individual_picrust_otu_tables/"
picrust_ko_table_suffix = "_genomic_content.tab"
picrust_nsti_table_filename = "www/Data/otu_nsti_values.tab"
constants_filename = "www/Javascript/constants.js"
html_elements = c("taxonomic_abundance_table", "genomic_content_table", "contribution_table", "function_abundance_table", "custom_taxonomic_hierarchy_table", "custom_function_hierarchy_table", "metadata_table")
log_filename = "www/Data/app.log"

# Read the shared constants table
constants_table = fread(constants_filename, header=F)
unlinked_name = unname(unlist(constants_table[unlist(constants_table[,2,with=F]) == "unlinked_name",4,with=F]))
default_taxonomic_summary_level = unname(unlist(constants_table[unlist(constants_table[,2,with=F]) == "default_taxonomic_summary_level",4,with=F]))
default_function_summary_level = unname(unlist(constants_table[unlist(constants_table[,2,with=F]) == "default_function_summary_level",4,with=F]))
default_metadata_factor = unname(unlist(constants_table[unlist(constants_table[,2,with=F]) == "default_metadata_factor",4,with=F]))
options(shiny.maxRequestSize = as.numeric(unlist(constants_table[unlist(constants_table[,2,with=F]) == "max_upload_size",4,with=F])))
options(stringsAsFactors = F)

# Tables shared between sessions
default_taxonomic_hierarchy_table = fread(default_taxonomic_hierarchy_table_filename, header=T, showProgress=F)
default_function_hierarchy_table = fread(default_function_hierarchy_table_filename, header=T, showProgress=F)
default_metadata_table = fread(default_metadata_table_filename, header=T, showProgress=F)

# Constant to mark entries for comparison in the contribution table
comparison_tag = "_comparison"

# Filtering constants
relative_abundance_cutoff = 0.005

### Shiny server session code ###
shinyServer(function(input, output, session) {

	### Session variables tracked on the server ###

	# Map of previous file paths to uploaded files, used to detect when a new file has been selected but has not finished uploading
	old_file_paths = reactiveValues()
	old_file_paths[["taxonomic_abundance_table"]] = NULL
	old_file_paths[["genomic_content_table"]] = NULL
	old_file_paths[["contribution_table"]] = NULL
	old_file_paths[["custom_taxonomic_hierarhcy_table"]] = NULL
	old_file_paths[["custom_function_hierarchy_table"]] = NULL
	old_file_paths[["metadata_table"]] = NULL
	old_file_paths[["function_abundance_table"]] = NULL

	# Map of flags indicating that a new file has been selected, used to detect when a new file has been selected but has not finished uploading
	new_file_flags = reactiveValues()
	new_file_flags[["taxonomic_abundance_table"]] = FALSE
	new_file_flags[["genomic_content_table"]] = FALSE
	new_file_flags[["contribution_table"]] = FALSE
	new_file_flags[["custom_taxonomic_hierarchy_table"]] = FALSE
	new_file_flags[["custom_function_hierarchy_table"]] = FALSE
	new_file_flags[["metadata_table"]] = FALSE
	new_file_flags[["function_abundance_table"]] = FALSE

	# Map of sample indices for tables that need to be sent to the browser, used to determine whether a new sample is being requested
	previous_sample_indices = reactiveValues()
	previous_sample_indices[["contribution_table"]] = -1
	previous_sample_indices[["otu_table"]] = -1

	# Map of tables that hold data to be sent to the browser
	tracked_tables = reactiveValues()
	tracked_tables[["contribution_table"]] = NULL
	tracked_tables[["otu_table"]] = NULL

	### Reactive values for keeping track of choices made on the upload page ###

	# Reactive elements that keep track of the name of the first level of the hierarchies (what show up in the OTU and contribution tables)
	first_taxonomic_level = reactive({

		# If the example is being displayed, an automatic single level taxonomic hierarchy is being used, or there is no custom taxonomic hierarchy, use the default
		if (input$example_visualization == "TRUE" | input$taxonomic_hierarchy_choice == "AUTOMATIC_SINGLE_LEVEL" | is.null(input$custom_taxonomic_hierarchy_table)){
			return(colnames(default_taxonomic_hierarchy_table)[1])

		# Otherwise, use the custom taxonomic hierarchy
		} else {

			# Read in the taxonomic hierarchy table
			taxonomic_hierarchy_table = process_input_file('custom_taxonomic_hierarchy_table')

			# Return the name of the first column
			return(colnames(taxonomic_hierarchy_table)[1])
		}
	})

	first_function_level = reactive({

		# If the example is being displayed, an automatic single level function hierarchy is being used, or there is no custom function hierarchy, use the default
		if (input$example_visualization == "TRUE" | input$function_hierarchy_choice == "AUTOMATIC_SINGLE_LEVEL" | is.null(input$custom_function_hierarchy_table)){
			return(colnames(default_function_hierarchy_table)[1])

		# Otherwise, use the custom function hierarchy
		} else {

			# Read in the function hierarchy table
			function_hierarchy_table = process_input_file('custom_function_hierarchy_table')

			# Return the name of the first column
			return(colnames(function_hierarchy_table)[1])
		}
	})

	first_metadata_level = reactive({

		# If the example is being displayed or there is no uploaded metadata table, use the default
		if (input$example_visualization == "TRUE" | is.null(input$metadata_table)){
			return(colnames(default_metadata_table)[1])

		# Otherwise, use the selected metadata table
		} else {

			# Read in the metadata table
			metadata_table = process_input_file('metadata_table')

			# Return the name of the first column
			return(colnames(metadata_table)[1])
		}
	})

	# Reactive elements that keep track of the current choice for summary levels and metadata factors
	taxonomic_summary_level = reactive({

		# If the example is not being displayed, look at the taxonomic level of detail selector
		if (input$example_visualization != "TRUE"){

			# If we're using an automatic single level taxonomic hierarchy, then we just use the default first taxonomic level
			if (input$taxonomic_hierarchy_choice == "AUTOMATIC_SINGLE_LEVEL"){
				return(first_taxonomic_level())

			# Otherwise, if something hasn't been selected (currently having trouble setting a selected choice when we update the dropdown), load the hierarchy and check for the default taxonomic summary level, otherwise use the first column
			} else if (is.null(input$taxonomic_level_of_detail_selector)){

				# If a custom taxonomic hierarchy has been selected, we refer to it
				if (input$taxonomic_hierarchy_choice == "CUSTOM"){
					
					# If the custom taxonoimc hierarchy has been uploaded, we refer to it
					if (!is.null(input$custom_taxonomic_hierarchy_table)){

						# Read in the taxonomic hierarchy table
						taxonomic_hierarchy_table = process_input_file('custom_taxonomic_hierarchy_table')

						# If the default exists, use it
						if (default_taxonomic_summary_level %in% colnames(taxonomic_hierarchy_table)){
							return(default_taxonomic_summary_level)
						}

						# Otherwise, return the first column name
						return(colnames(taxonomic_hierarchy_table)[1])
					}

					# Otherwise, a custom taxonomic hierarchy has not been selected and there is no selection
					return(NULL)
				}

				# Otherwise, we're looking at the default taxonomic hierarchy, in which case we just return the default since nothing has been selected
				return(default_taxonomic_summary_level)
			}

			# Otherwise, we just look at their choice
			return(unname(input$taxonomic_level_of_detail_selector))

		# Otherwise, we use the default for the example
		} else {
			return(default_taxonomic_summary_level)
		}
	})

	function_summary_level = reactive({

		# If the example is not being displayed, look at the function level of detail selector
		if (input$example_visualization != "TRUE"){

			# If we're using an automatic single level function hierarchy, then we just use the default first function level
			if (input$function_hierarchy_choice == "AUTOMATIC_SINGLE_LEVEL"){
				return(first_function_level())
			
			# Otherwise, if something hasn't been selected (currently having trouble setting a selected choice when we update the dropdown), load the hierarchy and check for the default function summary level, otherwise use the first column
			} else if (is.null(input$function_level_of_detail_selector)){


				# If a custom function hierarchy has been selected, we refer to it
				if (input$function_hierarchy_choice == "CUSTOM"){

					# If the custom taxonoimc hierarchy has been uploaded, we refer to it
					if (!is.null(input$custom_function_hierarchy_table)){

						# Read in the function hierarchy table
						function_hierarchy_table = process_input_file('custom_function_hierarchy_table')

						# If the default exists, use it
						if (default_function_summary_level %in% colnames(function_hierarchy_table)){
							return(default_function_summary_level)
						}

						# Otherwise, return the first column name
						return(colnames(function_hierarchy_table)[1])
					}

					# Otherwise, a custom function hierarchy has not been selected and there is no selection
					return(NULL)
				}

				# Otherwise, we're looking at the default function hierarchy, in which case we just return the default since nothing has been selected
				return(default_function_summary_level)
			}

			# Otherwise, we just look at their choice
			return(unname(input$function_level_of_detail_selector))

		# Otherwise, we use the default for the example
		} else {
			return(default_function_summary_level)
		}
	})

	metadata_factor = reactive({

		# If the example is not being displayed, look at the metdata factor selector
		if (input$example_visualization != "TRUE"){
			# If something hasn't been selected, we don't have a metadata factor
			if (is.null(input$metadata_factor_selector)){
				return(NULL)
			}

			# If N/A is selected, we don't have a metadata factor
			if (input$metadata_factor_selector == "N/A"){
				return(NULL)
			}

			# Otherwise, we return the selection
			return(unname(input$metadata_factor_selector))

		# Otherwise, we just use the default metadata factor for the example
		} else {
			return(default_metadata_factor)
		}
	})

	# Reactive element to calculate partial contribution factors for the taxonomic hierarchy and function hierarchy
	taxonomic_partial_contribution_table = reactive({ 

		# Initialize as the default taxonomic hierarchy table
    	taxonomic_hierarchy_table = default_taxonomic_hierarchy_table

    	# If the example is not being displayed, the custom taxonomic hierarchy option is selected, and a custom taxonomic hierarchy file has been uploaded, use the custom taxonomic hierarchy table
    	if (input$example_visualization != "TRUE" & input$taxonomic_hierarchy_choice == "CUSTOM" & !is.null(input$custom_taxonomic_hierarchy_table)){
    		taxonomic_hierarchy_table = process_input_file('custom_taxonomic_hierarchy_table')

    	# Otherwise, if the example is not being displayed, the automatic single level taxonomic hierarchy option is selected, and a taxonomic abundance table has been uploaded, use the taxon names from the taxonomic abundance table
    	} else if (input$example_visualization != "TRUE" & input$taxonomic_hierarchy_choice == "AUTOMATIC_SINGLE_LEVEL" & !is.null(input$taxonomic_abundance_table)){
    		
    		# Read the otu table to generate the taxonomic heirarchy and assign the appropriate column name
    		taxonomic_hierarchy_table = process_input_file('taxonomic_abundance_table')[,1,with=F]
    		colnames(taxonomic_hierarchy_table) = first_taxonomic_level()
    	}

    	# Make rows of the taxonomic hierarchy table unique
    	taxonomic_hierarchy_table = taxonomic_hierarchy_table[!duplicated(taxonomic_hierarchy_table)]

		# Sum the occurrences of each element in the first column
		taxonomic_hierarchy_table = taxonomic_hierarchy_table[,.N, by = eval(first_taxonomic_level())]

		# Rename normalization column for consistency
		colnames(taxonomic_hierarchy_table)[2] = "partial_contribution_factor"
		return(taxonomic_hierarchy_table)
	})

    function_partial_contribution_table = reactive({ 

    	# Initialize as the default function hierarchy table
    	function_hierarchy_table = default_function_hierarchy_table

    	# If the example is not being displayed, the custom function hierarchy option is selected, and a custom function hierarchy file has been uploaded, use the custom function hierarchy table
    	if (input$example_visualization != "TRUE" & input$function_hierarchy_choice == "CUSTOM" & !is.null(input$custom_function_hierarchy_table)){
    		function_hierarchy_table = process_input_file('custom_function_hierarchy_table')

    	# Otherwise, if the example is not being displayed and the automatic single level function hierarchy option is selected, check whether a function abundance table is being used and which linking method is being used
    	} else if (input$example_visualization != "TRUE" & input$function_hierarchy_choice == "AUTOMATIC_SINGLE_LEVEL"){

    		# Gather set of functions that need to exist in the hierarchy
    		present_functions = c()

    		# If a function abundance table is being used, add functions in that table to the list
    		if (input$function_abundance_choice == "PRESENT" & !is.null(input$function_abundance_table)){
	    		present_functions = c(present_functions, unlist(process_input_file('function_abundance_table')[,1,with=F]))
	    	}

    		# If the default PICRUSt methodology is being used to link, add the functions from the default function hierarchy table
    		if (input$contribution_method_choice == "PICRUST"){
    			present_functions = c(present_functions, unlist(default_function_hierarchy_table[,1,with=F]))

    		# Otherwise, if custom genomic content is being used to link, add the functions from the custom genomic content table
    		} else if (input$contribution_method_choice == "GENOMIC_CONTENT" & !is.null(input$genomic_content_table)){
    			present_functions = c(present_functions, unlist(process_input_file('genomic_content_table')[,2,with=F]))

    		# Otherwise, if a custom contribution table is being used to link, add the functions from the custom contribution table
    		} else if (input$contribution_method_choice == "CONTRIBUTION" & !is.null(input$contribution_table)){
    			present_functions = c(present_functions, unlist(process_input_file('contribution_table')[,1,with=F]))
    		}

    		# Create a single column function hierarchy using the present functions
    		function_hierarchy_table = data.table(a = present_functions)
    		colnames(function_hierarchy_table) = first_function_level()
    	}

    	# Make rows of the function hierarchy table unique
    	function_hierarchy_table = function_hierarchy_table[!duplicated(function_hierarchy_table)]

		# Sum the occurrences of each element in the first column
		function_hierarchy_table = function_hierarchy_table[,.N, by = eval(first_function_level())]

		# Rename normalization column for consistency
		colnames(function_hierarchy_table)[2] = "partial_contribution_factor"
		return(function_hierarchy_table)
	})

	# Observer that updates the flags indicating that a new file has been seleted for upload (necessary to detect when a new file has been selected but has not finished being uploaded)
	observe({
		if (!is.null(input$new_file_trigger)){
			isolate({
				new_file_flags[[input$new_file_trigger]] = TRUE
			})
		}
	})

	# Observers that update dropdown menu options when selected files change
	observe({

		# If a custom taxonomic hierarchy has been selected, we refer to it
		if (input$taxonomic_hierarchy_choice == "CUSTOM"){

			# If a custom taxonomic hierarchy has been uploaded, we refer to it
			if (!is.null(input$custom_taxonomic_hierarchy_table)){

				isolate({

					# Read in the taxonomic hierarchy table
					taxonomic_hierarchy_table = process_input_file('custom_taxonomic_hierarchy_table')

					# If we weren't able to read the taxonomic hierarchy table, report that the file was an invalid table format
					if (is.null(taxonomic_hierarchy_table)){
						session$sendCustomMessage("taxonomic_hierarchy_dropdown_labels", list("N/A"))
						session$sendCustomMessage("abort", "The selected taxonomic hierarchy table was in an invalid table format. Please select a file in a valid table format.")

					# Otherwise, get the column names of the hierarchy
					} else {

						# If there is more than one column, then resolution order is highest at the first column and then from lowest to second highest from left to right for the rest of the columns, so reorder the labels
						if (ncol(taxonomic_hierarchy_table) > 1){
							session$sendCustomMessage("taxonomic_hierarchy_dropdown_labels", colnames(taxonomic_hierarchy_table)[c(2:ncol(taxonomic_hierarchy_table), 1)])

						# Otherwise with a single column the order of the single label doesn't matter
						} else {
							session$sendCustomMessage("taxonomic_hierarchy_dropdown_labels", list(colnames(taxonomic_hierarchy_table)))
						}
					}
				})

			# Otherwise, we send the N/A string
			} else {
				session$sendCustomMessage("taxonomic_hierarchy_dropdown_labels", list("N/A"))
			}

		# Otherwise, if an automatic single level taxonomic hierarchy has been selected, we send the N/A string
		} else if (input$taxonomic_hierarchy_choice == "AUTOMATIC_SINGLE_LEVEL"){
			session$sendCustomMessage("taxonomic_hierarchy_dropdown_labels", list("N/A"))

		# Otherwise, we use the default taxonomic hierarchy, which has to have its column labels reordered for the dropdown to be in resolution order
		} else {
			session$sendCustomMessage("taxonomic_hierarchy_dropdown_labels", colnames(default_taxonomic_hierarchy_table)[c(2:ncol(default_taxonomic_hierarchy_table), 1)])
		}
	})

	observe({

		# If a custom function hierarchy has been selected, we refer to it
		if (input$function_hierarchy_choice == "CUSTOM"){

			# If a custom function hierarchy has been uploaded, we refer to it
			if (!is.null(input$custom_function_hierarchy_table)){

				isolate({

					# Read in the funciton hierarchy table
					function_hierarchy_table = process_input_file('custom_function_hierarchy_table')

					# If we weren't able to read the taxonomic hierarchy table, report that the file was an invalid table format
					if (is.null(function_hierarchy_table)){
						session$sendCustomMessage("function_hierarchy_dropdown_labels", list("N/A"))
						session$sendCustomMessage("abort", "The selected function hierarchy table was in an invalid table format. Please select a file in a valid table format.")

					# Otherwise, get the column names of the hierarchy
					} else {
						# If there is more than one column, then resolution order is highest at the first column and then from lowest to second highest from left to right for the rest of the columns, so reorder the labels
						if (ncol(function_hierarchy_table) > 1){
							session$sendCustomMessage("function_hierarchy_dropdown_labels", colnames(function_hierarchy_table)[c(2:ncol(function_hierarchy_table), 1)])

						# Otherwise with a single column the order of the single label doesn't matter
						} else {
							session$sendCustomMessage("function_hierarchy_dropdown_labels", list(colnames(function_hierarchy_table)))
						}
					}
				})

			# Otherwise, we send the N/A string
			} else {
				session$sendCustomMessage("function_hierarchy_dropdown_labels", list("N/A"))
			}

		# Otherwise, if an automatic single level function hierarchy has been selected, we send the N/A string
		} else if (input$function_hierarchy_choice == "AUTOMATIC_SINGLE_LEVEL"){
			session$sendCustomMessage("function_hierarchy_dropdown_labels", list("N/A"))

		# Otherwise, we use the default function hierarchy, which has to have its column labels reordered for the dropdown to be in resolution order
		} else {
			session$sendCustomMessage("function_hierarchy_dropdown_labels", colnames(default_function_hierarchy_table)[2:ncol(default_function_hierarchy_table)])
		}
	})

	observe({

		# If the option to upload metadata has been selected, we refer to it
		if (input$metadata_choice == "PRESENT"){

			# If the metadata table has been uploaded, we refer to it
			if (!is.null(input$metadata_table)){

				isolate ({

					metadata_table = process_input_file('metadata_table')

					# If we weren't able to read the metadata table, report that the file was an invalid table format
					if (is.null(metadata_table)){
						session$sendCustomMessage("metadata_table_labels", list("N/A"))
						session$sendCustomMessage("abort", "The selected sample grouping table was in an invalid table format. Please select a file in a valid table format.")

					# Otherwise, get the column names of the hierarchy
					} else {

						# If there is only one column, then we send the N/A string
						if (ncol(metadata_table) < 2){
							session$sendCustomMessage("metadata_table_labels", list("N/A"))

						# Otherwise, we can send the non-sample columns, lead by the N/A option as the default
						} else {
							session$sendCustomMessage("metadata_table_labels", c("N/A", colnames(metadata_table)[2:ncol(metadata_table)]))
						}
					}
				})

			# Otherwise, we send the N/A string
			} else {
				session$sendCustomMessage("metadata_table_labels", list("N/A"))
			}

		# Otherwise, we send the N/A string
		} else {
			session$sendCustomMessage("metadata_table_labels", list("N/A"))
		}
	})

	# Observers that handle requests for sample data from the browser
	observe({
		if (!is.null(input$contribution_sample_request)){
			isolate({
				contribution_sample = input$contribution_sample_request
				if (contribution_sample != previous_sample_indices[["contribution_table"]]){
					previous_sample_indices[["contribution_table"]] = contribution_sample

					# If the new sample exists in the table, then we can return it
					if (contribution_sample >= 0 & contribution_sample < length(tracked_tables[["contribution_table"]])){
						session$sendCustomMessage(type="contribution_sample_return", tracked_tables[["contribution_table"]][contribution_sample + 1])
					}

					# If we just sent the last sample, then we can get rid of the table to free up memory
					if (contribution_sample == length(tracked_tables[["contribution_table"]]) + 1){
						tracked_tables[["contribution_table"]] = NULL
					}
				}
			})
		}
	})

	observe({
		if (!is.null(input$taxonomic_abundance_sample_request)){
			isolate({
				otu_sample = input$taxonomic_abundance_sample_request
				if (otu_sample != previous_sample_indices[["otu_table"]]){
					previous_sample_indices[["otu_table"]] = otu_sample

					# If the new sample exists in the table, then we can return it
					if (otu_sample >= 0 & otu_sample < length(tracked_tables[["otu_table"]])){
						session$sendCustomMessage(type="taxonomic_abundance_sample_return", tracked_tables[["otu_table"]][otu_sample + 1])
					}

					# If we just sent the last sample, then we can get rid of the table to free up memory
					if (otu_sample == length(tracked_tables[["otu_table"]]) + 1){
						tracked_tables[["otu_table"]] = NULL
					}
				}
			})
		}
	})

	observe({
		session$sendCustomMessage("maintain_connection", input$contact)
	})

	# Helper functions

	# process_input_file(input_element)
	#
	# Checks if the input file associated with the specified html input element is available to read and if so then reads in the table and returns it
	process_input_file = function(input_element){

		input_table_file = input[[input_element]]

		# If the file exists, grab the file path, otherwise send the signal to retry and return NULL
		if (is.null(input_table_file)){

			session$sendCustomMessage("retry_upload", "retry")
			return(NULL)
		}

		# Otherwise, grab the name and file path'
		input_table_file_name = input_table_file$name
		input_table_file_path = input_table_file$datapath

		# If a new file has been selected and there was previously a file, check to see if the new file path is different
		if (new_file_flags[[input_element]] & !is.null(old_file_paths[[input_element]])){

			# If the new file path is the same as the old file path, then the file has not been updated and we send the signal to retry the upload process
			if (input_table_file_path == old_file_paths[[input_element]]){

				session$sendCustomMessage("retry_upload", "retry")
				return(NULL)
			}
		}

		# Reset the new file flag and update the old file path since the file has updated correctly
		new_file_flags[[input_element]] = FALSE
		old_file_paths[[input_element]] = input_table_file_path

		# Read the table and return it
		input_table = NULL

		tryCatch({
			# If the file is gzipped, we unzip and read it, otherwise just read it normally
			if (grepl("gz$", input_table_file_name)){
			  input_table = fread(paste('zcat ', input_table_file_path, sep=""), header=TRUE)
			} else {
			  input_table = fread(input_table_file_path, header=TRUE)
			}
		}, error = function(e) {
			input_table = NULL
		})

		return(input_table)
	}

	# validate_number_of_columns(input_table, column_number, comparison, table_name)
	#
	# Checks that there are the appropriate number of columns in the table based on the column number and comparison provided. If there are an incorrect number of columns, send an abort signal and return FALSE
	validate_number_of_columns = function(input_table, column_number, comparison, table_name){

		num_cols = ncol(input_table)
		if (comparison == "eq"){
			if (num_cols != column_number){
				session$sendCustomMessage("abort", paste("The ", table_name, " should have ", column_number, " column(s) but instead has ", num_cols, " column(s)", sep=""))
				return(FALSE)
			}
		} else if (comparison == "lt"){
			if (num_cols >= column_number){
				session$sendCustomMessage("abort", paste("The ", table_name, " should have fewer than ", column_number, " column(s) but instead has ", num_cols, " column(s)", sep=""))
				return(FALSE)
			}
		} else if (comparison == "le"){
			if (num_cols > column_number){
				session$sendCustomMessage("abort", paste("The ", table_name, " should have fewer than or equal to ", column_number, " column(s) but instead has ", num_cols, " column(s)", sep=""))
				return(FALSE)
			}
		} else if (comparison == "gt"){
			if (num_cols <= column_number){
				session$sendCustomMessage("abort", paste("The ", table_name, " should have more than ", column_number, " column(s) but instead has ", num_cols, " column(s)", sep=""))
				return(FALSE)
			}
		} else if (comparison == "ge"){
			if (num_cols < column_number){
				session$sendCustomMessage("abort", paste("The ", table_name, " should have more than or equal to ", column_number, " column(s) but instead has ", num_cols, " column(s)", sep=""))
				return(FALSE)
			}
		}

		return(TRUE)
	}

	# validate_unique_rows(input_table, id_column_names, element_name, table_name)
	#
	# Checks that no rows correspond to the same entity in the table as identified by the indicated ID columns. If there are any duplicates, send an abort signal and return FALSE
	validate_unique_rows = function(input_table, id_column_names, element_name, table_name){

		id_columns = input_table[,id_column_names,with=F]
		duplicate_elements = duplicated(id_columns)

		# If there are duplicated elements, send an abort signal and return FALSE
		if (any(duplicate_elements)){

			duplicate_id_columns = id_columns[duplicate_elements]
			duplicate_element_ids = sapply(1:nrow(duplicate_id_columns), function(row){
				return(paste(unlist(duplicate_id_columns[row]), collapse = "-"))
			})
			session$sendCustomMessage("abort", paste("The following ", element_name, " have multiple rows in the ", table_name, ": ", paste(unique(duplicate_element_ids), collapse = " "), sep=""))
			return(FALSE)
		}
		
		return(TRUE)
	}

	# validate_unique_columns(input_table, columns, element_name, table_name)
	#
	# Checks that no columns in the provided set of columns have the same name. If there are any duplicates, send an abort signal and return FALSE
	validate_unique_columns = function(input_table, columns, element_name, table_name){

		column_names_to_check = colnames(input_table)[columns]
		duplicate_column_names = duplicated(column_names_to_check)

		# If there are duplicated column names, send an abort signal and return FALSE
		if (any(duplicate_column_names)){
			session$sendCustomMessage("abort", paste("The following ", element_name, " have multiple columns in the ", table_name, ": ", paste(unique(column_names_to_check[duplicate_column_names]), collapse = " "), sep=""))
			return(FALSE)
		}
		
		return(TRUE)
	}

	# validate_elements_from_first_found_in_second(first_element_set, second_element_set, element_name, first_table_name, second_table_name)
	#
	# Checks that no elements are present in the first table and not in the second. If there are elements in the first table that are not in the second, send an abort signal and return FALSE
	validate_elements_from_first_found_in_second = function(first_element_set, second_element_set, element_name, first_table_name, second_table_name){

		extra_elements = !(first_element_set %in% second_element_set)

		# If there are elements in the first set that are not in the second set, send an abort signal and return FALSE
		if (any(extra_elements)){
			session$sendCustomMessage("abort", paste("The following ", element_name, " are in the ", first_table_name, " but are not present in the ", second_table_name, ": ", paste(unique(first_element_set[extra_elements]), collapse = " "), sep=""))
			return(FALSE)
		}

		return(TRUE)
	}

	# filter_elements_from_first_not_found_in_second(first_table, second_table, first_table_column_name, second_table_column_name, element_name, first_table_name, second_table_name)
	#
	# Filter elements out of the first table that do not appear in the second table
	filter_elements_from_first_not_found_in_second = function(first_table, second_table, first_table_column_name, second_table_column_name, element_name, first_table_name, second_table_name){

		first_element_set = first_table[[first_table_column_name]]
		second_element_set = second_table[[second_table_column_name]]
		extra_elements = !(first_element_set %in% second_element_set)

		# If there are elements in the first set that are not in the second set, send a warning
		if (any(extra_elements)){
			session$sendCustomMessage("warning", paste("The following ", element_name, " are in the ", first_table_name, " but are not present in the ", second_table_name, " and will be automatically removed: ", paste(unique(first_element_set[extra_elements]), collapse = " "), sep=""))
		}

		return(first_table[!extra_elements])
	}

	# validate_tables_match(otu_table, contribution_table, function_abundance_table, taxonomic_hierarchy_table, function_hierarchy_table, metadata_table)
	#
	# Checks whether the tables match with consistent labels and samples
	validate_tables_match = function(otu_table, contribution_table, function_abundance_table, taxonomic_hierarchy_table, function_hierarchy_table, metadata_table){
		
		# If the metadata table is not empty, check that samples in the OTU table are in the metadata table
		if (nrow(metadata_table) > 0){
			if (!validate_elements_from_first_found_in_second(otu_table[[first_metadata_level()]], metadata_table[[first_metadata_level()]], "samples", "OTU table", "sample grouping table")){
				return(FALSE)
			}
		}
		
		# If the metadata table is not empty, check that samples in the contribution table are in the metadata table
		if (nrow(metadata_table) > 0){
			if (!validate_elements_from_first_found_in_second(contribution_table[[first_metadata_level()]], metadata_table[[first_metadata_level()]], "samples", "contribution table", "sample grouping table")){
				return(FALSE)
			}
		}

		return(TRUE)
	}

	# process_otu_table_file()
	#
	# Processes the otu table specified from the upload page
	process_otu_table_file = function(){

		otu_table_file = input$taxonomic_abundance_table

		# If the file is unavailable, check whether a file was actually selected
		if (is.null(otu_table_file)){
			
			# If no file was ever selected, send an abort signal
			if (!new_file_flags[["taxonomic_abundance_table"]]){
				session$sendCustomMessage("abort", "No file was selected for the taxonomic abundance table. Please select one.")
				return(NULL)

			# Otherwise, if a file was selected but hasn't fully uploaded yet, we send the signal to retry
			} else {
				session$sendCustomMessage("retry_upload", "retry")
				return(NULL)
			}
		}

		# Read the otu table
		otu_table = process_input_file("taxonomic_abundance_table")
		
		# If we weren't able to read the otu table, report that the file was an invalid table format
		if (is.null(otu_table)){
			session$sendCustomMessage("abort", "The selected taxonomic abundance table was in an invalid table format. Please select a file in a valid table format.")
			return(NULL)
		}
		
		# Check that there is more than 1 column
		column_num_validated = validate_number_of_columns(otu_table, 1, 'gt', "OTU table")

		# If there were fewer than 2 columns, return NULL
		if (!column_num_validated){
			return(NULL)
		}

		# Rename the OTU label column for consistency
		colnames(otu_table)[1] = first_taxonomic_level()

		unique_otus_validated = validate_unique_rows(otu_table, first_taxonomic_level(), "taxa", "OTU table")

		# If there are duplicated OTUs, return NULL
		if (!unique_otus_validated){
			return(NULL)
		}

		unique_samples_validated = validate_unique_columns(otu_table, 2:ncol(otu_table), "samples", "OTU table")

		# If there are duplicated samples, return NULL
		if (!unique_samples_validated){
			return(NULL)
		}

		# Format the OTU table
		otu_table = format_otu_table(otu_table)

		# Convert the OTU names to character type
		otu_table[,(first_taxonomic_level()) := as.character(get(first_taxonomic_level()))]

		return(otu_table)
	}

	# process_genomic_content_table_file()
	#
	# Processes the genomic content table specified from the upload page
	process_genomic_content_table_file = function(){

		genomic_content_table_file = input$genomic_content_table

		# If the file is unavailable, check whether a file was actually selected
		if (is.null(genomic_content_table_file)){

			# If no file was ever selected, send an abort signal
			if (!new_file_flags[["genomic_content_table"]]){
				session$sendCustomMessage("abort", "The custom genomic content option was chosen, but no custom genomic content file was selected. Please select one or choose a different option.")
				return(NULL)

			# Otherwise, if a file was selected but hasn't fully uploaded yet, we send the signal to retry
			} else {
				session$sendCustomMessage("retry_upload", "retry")
				return(NULL)
			}
		}

		# Read in the genomic content table
		genomic_content_table = process_input_file("genomic_content_table")

		# If we weren't able to read the genomic content table, report that the file was an invalid table format
		if (is.null(genomic_content_table)){
			session$sendCustomMessage("abort", "The selected genomic content table was in an invalid table format. Please select a file in a valid table format.")
			return(NULL)
		}

		# Check that there are 3 columns
		column_num_validated = validate_number_of_columns(genomic_content_table, 3, 'eq', "genomic content table")

		# If there are not exactly 3 columns, return NULL
		if (!column_num_validated){
			return(NULL)
		}

		# Rename the ID columns for consistency
		colnames(genomic_content_table) = c(first_taxonomic_level(), first_function_level(), "copy_number")

		unique_genomic_content_validated = validate_unique_rows(genomic_content_table, c(first_taxonomic_level(), first_function_level()), paste(first_taxonomic_level(), "-", first_function_level(), " pairs", sep=""), "genomic content table")

		# If there is duplicated genomic content, return NULL
		if (!unique_genomic_content_validated){
			return(NULL)
		}

		# Convert the otu names and function names to character type
		genomic_content_table[,(first_taxonomic_level()) := as.character(get(first_taxonomic_level()))]
		genomic_content_table[,(first_function_level()) := as.character(get(first_function_level()))]

		return(genomic_content_table)
	}

	# process_contribution_table_file()
	#
	# Processes the contribution table specified from the upload page
	process_contribution_table_file = function(){

		contribution_table_file = input$contribution_table

		# If the file is unavailable, check whether a file was actually selected
		if (is.null(contribution_table_file)){

			# If no file was ever selected, send an abort signal
			if (!new_file_flags[["contribution_table"]]){
				session$sendCustomMessage("abort", "The custom contribution option was chosen, but no custom contribution file was selected. Please select one or choose a different option.")
				return(NULL)

			# Otherwise, if a file was selected but hasn't fully uploaded yet, we send the signal to retry
			} else {
				session$sendCustomMessage("retry_upload", "retry")
				return(NULL)
			}
		}

		# Read in the contribution table
		contribution_table = process_input_file("contribution_table")

		# If we weren't able to read the contribution table, report that the file was an invalid table format
		if (is.null(contribution_table)){
			session$sendCustomMessage("abort", "The selected contribution table was in an invalid table format. Please select a file in a valid table format.")
			return(NULL)
		}

		# Check that there are at least 6 columns
		column_num_validated = validate_number_of_columns(contribution_table, 6, 'ge', "contribution table")

		# If there are fewer than 6 columns, return NULL
		if (!column_num_validated){
			return(NULL)
		}

		# Reorder and drop columns to match internal contribution table format
		contribution_table = contribution_table[,c(2,3,1,6),with=F]

		# Rename columns for consistency
		colnames(contribution_table) = c(first_metadata_level(), first_taxonomic_level(), first_function_level(), "contribution")

		unique_contributions_validated = validate_unique_rows(contribution_table, c(first_metadata_level(), first_taxonomic_level(), first_function_level()), paste("contributions (combinations of ", first_metadata_level(), ", ", first_taxonomic_level(), ", and ", first_function_level(), ")", sep=""), "contribution table")

		# If there are duplicate rows, return NULL
		if (!unique_contributions_validated){
			return(NULL)
		}
	
		# Convert sample names, otu names, and function names to character type
		contribution_table[,(first_metadata_level()) := as.character(get(first_metadata_level()))]
		contribution_table[,(first_taxonomic_level()) := as.character(get(first_taxonomic_level()))]
		contribution_table[,(first_function_level()) := as.character(get(first_function_level()))]

		return(contribution_table)
	}

	# process_function_abundance_table_file()
	#
	# Processes the function abundance table specified from the upload page
	process_function_abundance_table_file = function(){

		# If the option to upload a table of function abundances for comparison is selected, read it in
		if (input$function_abundance_choice == "PRESENT"){

			function_abundance_table_file = input$function_abundance_table

			# If the file is unavailable, check whether a file was actually selected
			if (is.null(function_abundance_table_file)){

				# If no file was ever selected, send an abort signal
				if (!new_file_flags[["function_abundance_table"]]){
					session$sendCustomMessage("abort", "The option to upload function abundances for comparison was chosen, but no function abundance file was selected. Please select one or choose the option to upload no function abundances.")
					return(NULL)

				# Otherwise, if a file was selected but hasn't fully uploaded yet, we send the signal to retry
				} else {
					session$sendCustomMessage("retry_upload", "retry")
					return(NULL)
				}
			}

			# Read in the function abundance table
			function_abundance_table = process_input_file("function_abundance_table")

			# If we weren't able to read the function abundance table, report that the file was an invalid table format
			if (is.null(function_abundance_table)){
				session$sendCustomMessage("abort", "The selected function abundance table was in an invalid table format. Please select a file in a valid table format.")
				return(NULL)
			}
			
			# Check that there are at least two columns
			column_num_validated = validate_number_of_columns(function_abundance_table, 1, 'gt', "function abundance table")

			# Rename columns for consistency
			colnames(function_abundance_table)[1] = first_function_level()

			# If there is one or fewer columns, return NULL
			if (!column_num_validated){
				return(NULL)
			}

			unique_functions_validated = validate_unique_rows(function_abundance_table, first_function_level(), paste(first_function_level(), "s", sep=""), "function abundance table")

			# If there are duplicate functions, return NULL
			if (!unique_functions_validated){
				return(NULL)
			}

			unique_samples_validated = validate_unique_columns(function_abundance_table, 2:ncol(function_abundance_table), "samples", "function abundance table")

			# If there are duplicate samples, return NULL
			if (!unique_samples_validated){
				return(NULL)
			}

			# Convert the function names to character type
			function_abundance_table[,(first_function_level()) := as.character(get(first_function_level()))]

			return(function_abundance_table)
		}

		# Othwerise, return a default empty table
		return(data.table())
	}

	# process_taxonomic_hierarchy_table_file()
	#
	# Processes the taxonomic hierarchy table specified from the upload page
	process_taxonomic_hierarchy_table_file = function(){

		# If the option to use the default taxonomic hierarchy table is selected, then return the default
		if (input$taxonomic_hierarchy_choice == "DEFAULT"){
			return(default_taxonomic_hierarchy_table)
		}

		# Othwerise, if the option to use an automatical single level taxonomic hierarchy is selected, then use the taxon IDs from the otu table to make the taxonomic hierarchy
		if (input$example_visualization != "TRUE" & input$taxonomic_hierarchy_choice == "AUTOMATIC_SINGLE_LEVEL"){

			# If the file is unavailable, check whether a file was actually selected
			if (is.null(input$taxonomic_abundance_table)){

				# If no file was ever selected, send an abort signal
				if (!new_file_flags[["taxonomic_abundance_table"]]){
					session$sendCustomMessage("abort", "The option to generate a single level taxonomic hierarchy was chosen, but no taxonomic abundance file was selected. Please select one or choose a different taxonomy option.")
					return(NULL)

				# Otherwise, if a file was selected but hasn't fully uploaded yet, we send the signal to retry
				} else {
					session$sendCustomMessage("retry_upload", "retry")
					return(NULL)
				}
			}

			# Read the otu table to generate the taxonomic heirarchy and assign the appropriate column name
    		taxonomic_hierarchy_table = process_input_file('taxonomic_abundance_table')[,1,with=F]
    		colnames(taxonomic_hierarchy_table) = first_taxonomic_level()

    		return(taxonomic_hierarchy_table)
    	}

		# Othwerise, we read the custom taxonomic hierarchy table
		custom_taxonomic_hierarchy_table_file = input$custom_taxonomic_hierarchy_table

		# If the file is unavailable, check whether a file was actually selected
		if (is.null(input$custom_taxonomic_hierarchy_table)){

			# If no file was ever selected, send an abort signal
			if (!new_file_flags[["custom_taxonomic_hierarchy_table"]]){
				session$sendCustomMessage("abort", "The option to upload a custom taxonomic hierarchy was chosen, but no custom taxonomic hierarchy file was selected. Please select one or choose the option to use the default taxonomic hierarchy.")
				return(NULL)

			# Otherwise, if a file was selected but hasn't fully uploaded yet, we send the signal to retry
			} else {
				session$sendCustomMessage("retry_upload", "retry")
				return(NULL)
			}
		}

		# Read in the custom taxonomic hierarchy table
		custom_taxonomic_hierarchy_table = process_input_file("custom_taxonomic_hierarchy_table")

		# If we weren't able to read the taxonomic hierarchy table, report that the file was an invalid table format
		if (is.null(custom_taxonomic_hierarchy_table)){
			session$sendCustomMessage("abort", "The selected taxonomic hierarchy table was in an invalid table format. Please select a file in a valid table format.")
			return(NULL)
		}

		unique_custom_taxonomic_hierarchy_entries_validated = validate_unique_rows(custom_taxonomic_hierarchy_table, first_taxonomic_level(), "taxa", "custom taxonomic hierarchy table")

		# If there are duplicate rows, return NULL
		if (!unique_custom_taxonomic_hierarchy_entries_validated){
			return(NULL)
		}

		unique_custom_taxonomic_hierarchy_levels_validated = validate_unique_columns(custom_taxonomic_hierarchy_table, 1:ncol(custom_taxonomic_hierarchy_table), "taxonomic hierarchy levels", "custom taxonomic hierarchy table")

		# If there are duplicate taxonomic hierarchy levels, return NULL
		if (! unique_custom_taxonomic_hierarchy_levels_validated){
			return(NULL)
		}

		# Convert all columns in the hierarchy table to character type
		custom_taxonomic_hierarchy_table = custom_taxonomic_hierarchy_table[,lapply(.SD, as.character)]
		
		return(custom_taxonomic_hierarchy_table)
	}

	# process_function_hierarchy_table_file()
	#
	# Processes the function hierarchy table specified from the upload page
	process_function_hierarchy_table_file = function(){

		# If the option to use the default function hierarchy is selected, then return the default
		if (input$function_hierarchy_choice == "DEFAULT"){
			return(default_function_hierarchy_table)
		}

		# Otherwise, if the option to use an automatical single level function hierarchy is selected, then check whether a function abundance table is being used and which linking method is selected to determine the functions in the hierarchy
		if (input$example_visualization != "TRUE" & input$function_hierarchy_choice == "AUTOMATIC_SINGLE_LEVEL"){

    		# Gather set of functions that need to exist in the hierarchy
    		present_functions = c()

    		# If a function abundance table is being used, check whether it is available
    		if (input$function_abundance_choice == "PRESENT"){

    			# If the file is unavailable, check whether a file was actually selected
				if (is.null(input$function_abundance_table)){

					# If no file was ever selected, send an abort signal
					if (!new_file_flags[["function_abundance_table"]]){
						session$sendCustomMessage("abort", "The option to generate a single level function hierarchy was chosen and the option to upload a function abundance table was chosen, but no function abundance file was selected. Please select one or choose to not use a function abundance table.")
						return(NULL)

					# Otherwise, if a file was selected but hasn't fully uploaded yet, we send the signal to retry
					} else {
						session$sendCustomMessage("retry_upload", "retry")
						return(NULL)
					}
				}

				# Otherwise, add the functions from the function abundance table
	    		present_functions = c(present_functions, unlist(process_input_file('function_abundance_table')[,1,with=F]))
	    	}

    		# If the default PICRUSt methodology is being used to link, add the functions from the default function hierarchy table
    		if (input$contribution_method_choice == "PICRUST"){
    			present_functions = c(present_functions, unlist(default_function_hierarchy_table[,1,with=F]))
    			
    		# Otherwise, if custom genomic content is being used to link, check whether it is available
    		} else if (input$contribution_method_choice == "GENOMIC_CONTENT"){

    			# If the file is unavailable, check whether a file was actually selected
				if (is.null(input$genomic_content_table)){

					# If no file was ever selected, send an abort signal
					if (!new_file_flags[["genomic_content_table"]]){
						session$sendCustomMessage("abort", "The option to generate a single level function hierarchy was chosen and the option to upload a genomic content table was chosen, but no genomic content file was selected. Please select one or choose a different linking method.")
						return(NULL)

					# Otherwise, if a file was selected but hasn't fully uploaded yet, we send the signal to retry
					} else {
						session$sendCustomMessage("retry_upload", "retry")
						return(NULL)
					}
				}

				# Otherwise, add the functions from the custom genomic content table
    			present_functions = c(present_functions, unlist(process_input_file('genomic_content_table')[,2,with=F]))
    			
    		# Otherwise, if a custom contribution table is being used to link, check whether it is available
    		} else if (input$contribution_method_choice == "CONTRIBUTION"){

    			# If the file is unavailable, check whether a file was actually selected
				if (is.null(input$contribution_table)){

					# If no file was ever selected, send an abort signal
					if (!new_file_flags[["contribution_table"]]){
						session$sendCustomMessage("abort", "The option to generate a single level function hierarchy was chosen and the option to upload a contribution table was chosen, but no contribution file was selected. Please select one or choose a different linking method.")
						return(NULL)

					# Otherwise, if a file was selected but hasn't fully uploaded yet, we send the signal to retry
					} else {
						session$sendCustomMessage("retry_upload", "retry")
						return(NULL)
					}
				}

				# Otherwise, add the functions from the custom contribution table
    			present_functions = c(present_functions, unlist(process_input_file('contribution_table')[,1,with=F]))
    		}

    		# Make the set of present functions unique
    		present_functions = present_functions[!duplicated(present_functions)]

    		# Create a single column function hierarchy using the present functions
    		function_hierarchy_table = data.table(a = present_functions)
    		colnames(function_hierarchy_table) = first_function_level()

    		return(function_hierarchy_table)
    	}

		# Otherwise, we read the custom function hierarchy table
		custom_function_hierarchy_table_file = input$custom_function_hierarchy_table

		# If the file is unavailable, check whether a file was actually selected
		if (is.null(input$custom_function_hierarchy_table)){

			# If no file was ever selected, send an abort signal
			if (!new_file_flags[["custom_function_hierarchy_table"]]){
				session$sendCustomMessage("abort", "The option to upload a custom function hierarchy was chosen, but no custom function hierarchy file was selected. Please select one or choose the option to use the default function hierarchy.")
				return(NULL)

			# Otherwise, if a file was selected but hasn't fully uploaded yet, we send the signal to retry
			} else {
				session$sendCustomMessage("retry_upload", "retry")
				return(NULL)
			}
		}

		# Read in the custom function hierarchy table
		custom_function_hierarchy_table = process_input_file("custom_function_hierarchy_table")

		# If we weren't able to read the function hierarchy table, report that the file was an invalid table format
		if (is.null(custom_function_hierarchy_table)){
			session$sendCustomMessage("abort", "The selected taxonomic abundance table was in an invalid table format. Please select a file in a valid table format.")
			return(NULL)
		}

		unique_custom_function_hierarchy_entries_validated = validate_unique_rows(custom_function_hierarchy_table, first_function_level(), "functions", "custom function hierarchy table")

		# If there are duplicate rows, we return NULL
		if (!unique_custom_function_hierarchy_entries_validated){
			return(NULL)
		}

		unique_custom_function_hierarchy_levels_validated = validate_unique_columns(custom_function_hierarchy_table, 1:ncol(custom_function_hierarchy_table), "function hierarchy levels", "custom function hierarchy table")

		# If there are duplicate function hierarchy levels, we return NULL
		if (!unique_custom_function_hierarchy_levels_validated){
			return(NULL)
		}

		# Replace empty function hierarchy level names with "unknown"
		custom_function_hierarchy_table[,(colnames(custom_function_hierarchy_table)[2:ncol(custom_function_hierarchy_table)]) := lapply(.SD, function(col){
				return(gsub("^$", "unknown", gsub("^.__", "", gsub(";$", "", col))))
			}), .SDcols = 2:ncol(custom_function_hierarchy_table)]

		# Convert all columns in the hierarchy table to character type
		custom_function_hierarchy_table = custom_function_hierarchy_table[,lapply(.SD, as.character)]

		return(custom_function_hierarchy_table)
	}

	# process_metadata_table_file()
	#
	# Processes the metadata table specified from the upload page
	process_metadata_table_file = function(){

		# If the option to upload a table of metadata is selected, read it in
		if (input$metadata_choice == "PRESENT"){
			metadata_table_file = input$metadata_table

			# If the file is unavailable, check whether a file was actually selected
			if (is.null(input$metadata_table)){

				# If no file was ever selected, send an abort signal
				if (!new_file_flags[["metadata_table"]]){
					session$sendCustomMessage("abort", "The option to upload a sample grouping table was chosen, but no sample grouping file was selected. Please select one or choose the option to upload no sample grouping.")
					return(NULL)

				# Otherwise, if a file was selected but hasn't fully uploaded yet, we send the signal to retry
				} else {
					session$sendCustomMessage("retry_upload", "retry")
					return(NULL)
				}
			}

			# Read in the metadata table
			metadata_table = process_input_file("metadata_table")

			# If we weren't able to read the metadata table, report that the file was an invalid table format
			if (is.null(metadata_table)){
				session$sendCustomMessage("abort", "The selected sample grouping table was in an invalid table format. Please select a file in a valid table format.")
				return(NULL)
			}

			# Check that there is at least 1 column
			column_num_validated = validate_number_of_columns(metadata_table, 0, 'gt', "sample grouping table")
			
			# If there were no columns, return NULL
			if (!column_num_validated){
				return(NULL)
			}

			unique_metadata_entries_validated = validate_unique_rows(metadata_table, first_metadata_level(), "samples", "sample grouping table")

			# If there are duplicate rows, return NULL
			if (!unique_metadata_entries_validated){
				return(NULL)
			}

			return(metadata_table)
		}

		# Otherwise, return a default empty table
		return(data.table())
	}

	# generate_and_send_nsti_table(otu_table)
	#
	# If we are using the default PICRUSt tables, we calculate sample-level NSTI values and send the resulting table to the browser
	generate_and_send_nsti_table = function(otu_table){

		# If they've chosen the PICRUSt option, then we can calculate sample NSTI values
		
		if (input$example_visualization == "TRUE" | input$contribution_method_choice == "PICRUST"){	
 		
 			# Format OTU table to use strings just in case		
 			otu_table[,(first_taxonomic_level()) := as.character(get(first_taxonomic_level()))]

			# Read in the table of OTU NSTI values
			reference_nsti_table = fread(picrust_nsti_table_filename, header=T)
			colnames(reference_nsti_table)[1] = first_taxonomic_level()
			reference_nsti_table[,(first_taxonomic_level()) := as.character(get(first_taxonomic_level()))]

			# Merge the NSTI table with the otu table
			otu_table = merge(otu_table, reference_nsti_table, by=first_taxonomic_level(), all.x = TRUE, all.y = FALSE)

			# Weight and average NSTI values by sample
			otu_table[,weighted_nsti := abundance * get(colnames(reference_nsti_table)[2])]
			nsti_table = otu_table[,sum(weighted_nsti)/sum(abundance),by=c(first_metadata_level())]
			colnames(nsti_table) = c("Sample", "NSTI")

			# Send the nsti table to the browser
			session$sendCustomMessage("nsti_table", nsti_table)

		# Otherwise, send an empty table
		} else {
			session$sendCustomMessage("nsti_table", "NULL")
		}
	}

	# filter_table_for_diff_tests(otu_table, sample_level, test_factor, test_levels, feature_level)
	#
	# Prepare feature table for wilcoxon tests (make sure nonzero variance and >1 nonzero samples)
	filter_table_for_diff_tests = function(otu_table, sample_level, test_factor, test_levels, feature_level){
		#Count how many non-zero observations there are in each group for each taxon, exclude ones with low numbers
		good_taxa = otu_table[, list(length(unique(get(sample_level)[abundance != 0 & !is.na(abundance)])), var(abundance, na.rm=T)), by=c(test_factor, feature_level)]
		good_taxa1 = dcast(good_taxa, paste(feature_level, "~", test_factor), value.var = "V1", fun.aggregate=sum)
		good_taxa2 = dcast(good_taxa, paste(feature_level, "~", test_factor), value.var = "V2", fun.aggregate=sum)
		good_taxa_list = intersect(good_taxa1[get(test_levels[1]) >= 2 & get(test_levels[2]) >= 2, get(feature_level)], good_taxa2[get(test_levels[1]) != 0 & get(test_levels[2]) != 0, get(feature_level)])
		otu_table_test_good = otu_table[get(feature_level) %in% good_taxa_list]
		return(otu_table_test_good)
	}


	# generate_and_send_statistics_table(metadata, otu_table, contribution_table)
	#
	# If metadata variable is binary, perform Wilcoxon rank-sum tests on all taxa and functions, else return NULL 
	generate_and_send_statistics_table = function(metadata, otu_table, contribution_table){
		if(nrow(metadata) > 0 & !is.null(metadata_factor())){
			# Test for whether metadata_factor() is binary
			test_levels = unique(metadata[,get(metadata_factor())])
			if(length(test_levels) == 2){
				# For all taxa - Do repeated Wilcoxon rank-sum tests, calculate difference in means
				# Wilcoxon test excludes taxa with fewer than 2 nonzero samples in any group, and with zero variance in a sample group
				otu_table_test = merge(otu_table, metadata[,c(first_metadata_level(), metadata_factor()),with=F], by=first_metadata_level(), all.x = F, all.y = F) #Only samples that have metadata assignment 
				session$sendCustomMessage("shiny_test", "Calculating differential abundance statistics")
				otu_table_test_good = filter_table_for_diff_tests(otu_table_test, first_metadata_level(), metadata_factor(), test_levels, taxonomic_summary_level())
				#Count how many non-zero observations there are in each group for each taxon, exclude ones with low numbers
				#good_taxa = otu_table_test[, list(length(unique(get(first_metadata_level())[abundance != 0 & !is.na(abundance)])), var(abundance, na.rm=T)), by=c(metadata_factor(), taxonomic_summary_level())]
				#good_taxa1 = dcast(good_taxa, paste(taxonomic_summary_level(), "~", metadata_factor()), value.var = "V1", fun.aggregate=sum)
				#good_taxa2 = dcast(good_taxa, paste(taxonomic_summary_level(), "~", metadata_factor()), value.var = "V2", fun.aggregate=sum)
				#good_taxa_list = intersect(good_taxa1[get(test_levels[1]) >= 2 & get(test_levels[2]) >= 2, get(taxonomic_summary_level())], good_taxa2[get(test_levels[1]) != 0 & get(test_levels[2]) != 0, get(taxonomic_summary_level())])
				#otu_table_test_good = otu_table_test[get(taxonomic_summary_level()) %in% good_taxa_list]

				test_results = otu_table_test_good[,wilcox.test(abundance[get(metadata_factor())==test_levels[1]], abundance[get(metadata_factor())==test_levels[2]])$p.value, by=eval(taxonomic_summary_level())]
				test_results[,BH_FDR_AdjustP:=p.adjust(V1, method="BH")]
				test_results[,Bonf_AdjustP:=p.adjust(V1, method="bonferroni")]		
				diff_means = otu_table_test[,mean(abundance[get(metadata_factor())==test_levels[1]], na.rm=T) - mean(abundance[get(metadata_factor())==test_levels[2]], na.rm=T), by=eval(taxonomic_summary_level())]
				col_name = paste0("Mean_", test_levels[1], "_", test_levels[2], "_Diff")
				test_results = merge(test_results, diff_means, by=taxonomic_summary_level(), all = T)
				setnames(test_results, c(taxonomic_summary_level(), "V1.x", "V1.y"), c("Feature", "WilcoxP", col_name))	
				test_results[,FeatureType:="Taxa"]
				test_results = test_results[order(WilcoxP, decreasing = F)]
				
				##### For all functions - aggregate contributions, do same calculations
				
				func_table_inferred = contribution_table[!grepl("_comparison", get(first_metadata_level()), fixed = T)] #Remove any paired function samples
				func_table_mg = contribution_table[grepl("_comparison", get(first_metadata_level()), fixed = T)]

				#First for the inferred functions
				func_table_inferred = func_table_inferred[,sum(contribution, na.rm=T), by=c(first_metadata_level(), function_summary_level())]
				setnames(func_table_inferred, "V1", "abundance")
				func_table_inferred = merge(func_table_inferred, metadata[,c(first_metadata_level(), metadata_factor()),with=F], by=first_metadata_level(), all.x = F, all.y = F)

				func_table_inferred_good = filter_table_for_diff_tests(func_table_inferred, first_metadata_level(), metadata_factor(), test_levels, function_summary_level())

				func_test_results = func_table_inferred_good[,wilcox.test(abundance[get(metadata_factor())==test_levels[1]], abundance[get(metadata_factor())==test_levels[2]])$p.value, by=eval(function_summary_level())]
				func_test_results[,BH_FDR_AdjustP:=p.adjust(V1, method="BH")]
				func_test_results[,Bonf_AdjustP:=p.adjust(V1, method="bonferroni")]
				diff_means = func_table_inferred[,mean(abundance[get(metadata_factor())==test_levels[1]], na.rm=T) - mean(abundance[get(metadata_factor())==test_levels[2]], na.rm=T), by=eval(function_summary_level())]
				func_test_results = merge(func_test_results, diff_means, by=function_summary_level())
				setnames(func_test_results, c(function_summary_level(), "V1.x", "V1.y"), c("Feature", "WilcoxP", col_name))			
				func_test_results[,FeatureType:="Taxa-based Functions"]
				func_test_results = func_test_results[order(WilcoxP, decreasing = F)]

				# Rbind into big table
				test_results = rbind(test_results, func_test_results, fill = T)			
				
				#Repeat if there are metagenome samples
				if(nrow(func_table_mg) > 0){
					func_table_mg = func_table_mg[,sum(contribution, na.rm=T), by=c(first_metadata_level(), function_summary_level())]
					setnames(func_table_mg, "V1", "abundance")
					func_table_mg[,OrigSample:=gsub("_comparison", "", get(first_metadata_level()))]
					func_table_mg = merge(func_table_mg, metadata[,c(first_metadata_level(), metadata_factor()),with=F], by.x = "OrigSample", by.y=first_metadata_level(), all.x = F, all.y = F)
					func_table_mg_good = filter_table_for_diff_tests(func_table_mg, "OrigSample", metadata_factor(), test_levels, function_summary_level())
					func_mg_test_results = func_table_mg[,wilcox.test(abundance[get(metadata_factor())==test_levels[1]], abundance[get(metadata_factor())==test_levels[2]])$p.value, by=eval(function_summary_level())]
					func_mg_test_results[,BH_FDR_AdjustP:=p.adjust(V1, method="BH")]
					func_mg_test_results[,Bonf_AdjustP:=p.adjust(V1, method="bonferroni")]
					diff_means = func_table_mg[,mean(abundance[get(metadata_factor())==test_levels[1]], na.rm=T) - mean(abundance[get(metadata_factor())==test_levels[2]], na.rm=T), by=eval(function_summary_level())]
					func_mg_test_results = merge(func_mg_test_results, diff_means, by=function_summary_level())
					setnames(func_mg_test_results, c(function_summary_level(), "V1.x", "V1.y"), c("Feature", "WilcoxP", col_name))
					func_mg_test_results[,FeatureType:="Metagenome-based Functions"]
					func_mg_test_results = func_mg_test_results[order(WilcoxP, decreasing = F)]
					test_results = rbind(test_results, func_mg_test_results, fill = T)			
				}			
								
				test_results[,eval(col_name):=round(get(col_name), digits = 5)]
				test_results[,WilcoxP:=round(WilcoxP, digits = 5)]
				test_results[,BH_FDR_AdjustP:=round(BH_FDR_AdjustP, digits = 5)]
				test_results[,Bonf_AdjustP:=round(Bonf_AdjustP, digits = 5)]

				test_results = test_results[,c("FeatureType", "Feature", col_name, "WilcoxP", "BH_FDR_AdjustP", "Bonf_AdjustP"), with=F]
				session$sendCustomMessage("statistics_table", test_results)
			} else {
				session$sendCustomMessage("statistics_table", "NULL")
			}
		} else {
			session$sendCustomMessage("statistics_table", "NULL")
		}
	}

	# get_genomic_content_from_picrust_table(otu)
	#
	# Returns the column from the picrust tables that corresponds to the genomic content of the indicated OTU
	get_genomic_content_from_picrust_table = function(otu){

		# Read in the file for this otu's genomic content
		otu_genomic_content = fread(paste(picrust_ko_table_directory, otu, picrust_ko_table_suffix, sep=""), header=T)		
		colnames(otu_genomic_content) = c(first_taxonomic_level(), first_function_level(), "copy_number")
		otu_genomic_content[,(first_taxonomic_level()) := as.character(get(first_taxonomic_level()))]

		# Send a message to the browser saying that we've finished grabbing the genomic content information for another OTU
		session$sendCustomMessage("otu_genomic_content_processed", "NULL")

		return(otu_genomic_content)
	}

	# get_subset_picrust_ko_table(otus)
	#
	# Returns the melted picrust ko table corresponding to the given set of OTUs
	get_subset_picrust_ko_table = function(otus){

		# Tell the browser how many OTUs we need to load genomic content data for
		session$sendCustomMessage("number_of_otus", length(otus))

		# Get all columns corresponding to the otus and transpose
		subset_picrust_ko_table = rbindlist(lapply(otus, get_genomic_content_from_picrust_table), use.names=T)
		
		return(subset_picrust_ko_table)
	}

	# generate_contribution_table_using_picrust(otu_table)
	#
	# Uses the provided OTU table to generate a contribution table based on the PICRUSt 16S normalization and genomic content tables
	generate_contribution_table_using_picrust = function(otu_table){

		# Read the normalization table and standardize column names
		picrust_normalization_table = fread(paste("zcat ", picrust_normalization_table_filename, sep=""), header=T)
		colnames(picrust_normalization_table) = c(first_taxonomic_level(), "norm_factor")
		picrust_normalization_table[,(first_taxonomic_level()) := as.character(get(first_taxonomic_level()))]

		# Check that the OTUs have normalization factors
		otus_have_normalization_validated = validate_elements_from_first_found_in_second(otu_table[[first_taxonomic_level()]], picrust_normalization_table[[first_taxonomic_level()]], paste(first_taxonomic_level(), "s", sep=""), "OTU table", "PICRUSt 16S normalization table")

		# If there are otus without genomic content, we return NULL
		if (!otus_have_normalization_validated){
			return(NULL)
		}

		# Get the subset of the ko table mapping present OTUs to their genomic content
		subset_picrust_ko_table = get_subset_picrust_ko_table(levels(factor(otu_table[[first_taxonomic_level()]])))
		
		# Merge with the table of 16S normalization factors
		contribution_table = merge(otu_table, picrust_normalization_table, by = first_taxonomic_level(), allow.cartesian = TRUE, sort = FALSE)

		# Merge with the PICRUSt genomic content table
		contribution_table = merge(contribution_table, subset_picrust_ko_table, by = first_taxonomic_level(), allow.cartesian = TRUE, sort = FALSE)

		# Make a contribution column by dividing the OTU abundances by the normalization factors and multiplying with the KO copy number
		contribution_table[,contribution := (abundance * copy_number) / norm_factor]

		contribution_table = contribution_table[,c(first_metadata_level(), first_taxonomic_level(), first_function_level(), "contribution"),with=F]

		# Convert sample, OTU, and function names to character type
		contribution_table[,(first_metadata_level()) := as.character(get(first_metadata_level()))]
		contribution_table[,(first_taxonomic_level()) := as.character(get(first_taxonomic_level()))]
		contribution_table[,(first_function_level()) := as.character(get(first_function_level()))]

		return(contribution_table)
	}

	# generate_contribution_table_using_custom_genomic_content(otu_table)
	#
	# Uses the provided OTU table to generate a contribution table
	generate_contribution_table_using_custom_genomic_content = function(otu_table){

		genomic_content_table = process_genomic_content_table_file()

		# If the genomic content table could not be processed, we return NULL
		if (is.null(genomic_content_table)){
			return(NULL)
		}

		# File checking
		otus_have_genomic_content_validated = validate_elements_from_first_found_in_second(otu_table[[first_taxonomic_level()]], genomic_content_table[[first_taxonomic_level()]], paste(first_taxonomic_level(), "s", sep=""), "OTU table", "genomic content table")

		# If there are otus without genomic content, we return NULL
		if (!otus_have_genomic_content_validated){
			return(NULL)
		}

		# Merge with the genomic content table
		contribution_table = merge(otu_table, genomic_content_table, by = first_taxonomic_level(), allow.cartesian = TRUE, sort = FALSE)

		# Make a contribution column by multiplying the OTU abundances with the gene copy number
		contribution_table[,contribution := abundance * copy_number]

		# Subset to only the relevant columsn
		contribution_table = contribution_table[,c(first_metadata_level(), first_taxonomic_level(), first_function_level(), "contribution"),with=F]

		# Convert sample, OTU, and function names to character type
		contribution_table[,(first_metadata_level()) := as.character(get(first_metadata_level()))]
		contribution_table[,(first_taxonomic_level()) := as.character(get(first_taxonomic_level()))]
		contribution_table[,(first_function_level()) := as.character(get(first_function_level()))]

		return(contribution_table)
	}

	# generate_contribution_table_using_custom_contributions(otu_table)
	#
	# Uses the provided OTU table to generate a contribution table (currently just validating that OTUs and samples match between the two)
	generate_contribution_table_using_custom_contributions = function(otu_table){

		contribution_table = process_contribution_table_file()

		# If the contribution table could not be processed, we return NULL
		if (is.null(contribution_table)){
			return(NULL)
		}

		# File checking

		# Check that OTUs have contributions
		otus_have_contributions_validated = validate_elements_from_first_found_in_second(otu_table[[first_taxonomic_level()]], contribution_table[[first_taxonomic_level()]], paste(first_taxonomic_level(), "s", sep=""), "OTU table", "contribution table")

		# If there are OTUs without contributions, we return NULL
		if (!otus_have_contributions_validated){
			return(NULL)
		}

		# Check that OTUs with contributions have abundance
		contribution_otus_exist_validated = validate_elements_from_first_found_in_second(contribution_table[[first_taxonomic_level()]], otu_table[[first_taxonomic_level()]], paste(first_taxonomic_level(), "s", sep=""), "contribution table", "OTU table")

		# If there are OTUs with contributions but no abundance, we return NULL
		if (!contribution_otus_exist_validated){
			return(NULL)
		}

		# Check that samples in the OTU table have contribution information
		otu_table_samples_have_contributions_validated = validate_elements_from_first_found_in_second(otu_table[[first_metadata_level()]], contribution_table[[first_metadata_level()]], "samples", "OTU table", "contribution table")

		# If there are samples in the OTU table that don't have contribution information, we return NULL
		if (!otu_table_samples_have_contributions_validated){
			return(NULL)
		}

		# Check that samples in the contribution table have OTU abundance information
		contribution_samples_have_otu_abundances_validated = validate_elements_from_first_found_in_second(contribution_table[[first_metadata_level()]], otu_table[[first_metadata_level()]], "samples", "contribution table", "OTU table")

		# If there are samples in the contribution table that don't have OTU abundance information, we return NULL
		if (!contribution_samples_have_otu_abundances_validated){
			return(NULL)
		}

		# Convert sample, OTU, and function names to character type
		contribution_table[,(first_metadata_level()) := as.character(get(first_metadata_level()))]
		contribution_table[,(first_taxonomic_level()) := as.character(get(first_taxonomic_level()))]
		contribution_table[,(first_function_level()) := as.character(get(first_function_level()))]

		# If all validation checks pass, then we can just return the contribution table
		return(contribution_table)
	}

	# generate_contribution_table(otu_table)
	#
	# Generates a contribution table depending on the method selected
	generate_contribution_table = function(otu_table){

		contribution_table = NULL

		# If they've chosen the genomic content option
		if (input$contribution_method_choice == "GENOMIC_CONTENT"){
			contribution_table = generate_contribution_table_using_custom_genomic_content(otu_table)

		# If they've chosen the PICRUSt option
		} else if (input$contribution_method_choice == "PICRUST"){		
			contribution_table = generate_contribution_table_using_picrust(otu_table)

		# If they've chosen the contribution table option
		} else if (input$contribution_method_choice == "CONTRIBUTION"){
			contribution_table = generate_contribution_table_using_custom_contributions(otu_table)
		}

		# If the contribution table is NULL, we return NULL
		if (is.null(contribution_table)){
			return(NULL)
		}

		# Convert sample, OTU, and function names to character type
		contribution_table[,(first_metadata_level()) := as.character(get(first_metadata_level()))]
		contribution_table[,(first_taxonomic_level()) := as.character(get(first_taxonomic_level()))]
		contribution_table[,(first_function_level()) := as.character(get(first_function_level()))]

		return(contribution_table)
	}

	# normalize_contribution_table(contribution_table)
	#
	# Normalizes the total function abundances per sample in the contribution table
	normalize_contribution_table = function(contribution_table){
		
		# Calculate total function abundances for each sample
		table_with_total_function_abundances = contribution_table[,sum(contribution), by = eval(first_metadata_level())]
		colnames(table_with_total_function_abundances)[ncol(table_with_total_function_abundances)] = "total_abundance"
		
		# Merge the total function abundances
		table_with_total_function_abundances = merge(contribution_table, table_with_total_function_abundances, by = first_metadata_level(), allow.cartesian = T)
		
		# Normalize the contributions
		table_with_total_function_abundances[,contribution := contribution / total_abundance]
		
		return(table_with_total_function_abundances[,which(colnames(table_with_total_function_abundances) != "total_abundance"),with=F])
	}

	# normalize_otu_table(otu_table)
	#
	# Normalizes the total OTU abundances per sample in the otu table
	normalize_otu_table = function(otu_table){

		# Calculate total OTU abundances for each sample
		table_with_total_otu_abundances = otu_table[,sum(abundance), by = eval(first_metadata_level())]
		colnames(table_with_total_otu_abundances)[ncol(table_with_total_otu_abundances)] = "total_abundance"

		# Merge the total OTU abundances
		table_with_total_otu_abundances = merge(otu_table, table_with_total_otu_abundances, by = first_metadata_level(), allow.cartesian = T)

		# Normalize the abundances
		table_with_total_otu_abundances[,abundance := abundance / total_abundance]

		return(table_with_total_otu_abundances[,which(colnames(table_with_total_otu_abundances) != "total_abundance"),with=F])
	}

	# format_otu_table(otu_table)
	#
	# Formats the otu table for further processing
	format_otu_table = function(otu_table){

		# Set the name for the first column to match with the taxonoimc hierarchy table
		colnames(otu_table)[1] = first_taxonomic_level()

		# Melt the OTU table to put it in an easier format to work with
		otu_table = melt(otu_table, id.vars = first_taxonomic_level(), measure.vars = names(otu_table)[2:ncol(otu_table)], variable.name = first_metadata_level(), value.name = "abundance")

		# Change the sample column to be character instead of factor
		otu_table[,(first_metadata_level()) := as.character(get(first_metadata_level()))]

		# Filter out rows with zero abundance
		otu_table = otu_table[abundance > 0]
		
		return(otu_table)
	}

	# format_default_contribution_table(contribution_table)
	#
	# Formats the default contribution table
	format_default_contribution_table = function(contribution_table){

		# Remove the unnecessary columns (keep Sample, OTU, KO, and contribution)
		contribution_table = contribution_table[,c(2,3,1,6),with=F]

		# Rename the columns for consistency
		colnames(contribution_table) = c(first_metadata_level(), first_taxonomic_level(), first_function_level(), "contribution")

		return(contribution_table)
	}

	# add_comparison_function_abundances_to_contribution_table(contribution_table, function_abundance_table)
	#
	# Adds the function abundances from the function abundance table to the contribution table for comparison
	add_comparison_function_abundances_to_contribution_table = function(contribution_table, function_abundance_table){

		# If the function abundance table is empty, just return the contribution table
		if (nrow(function_abundance_table) == 0){
			return(contribution_table)
		}

		# Add a tag to the names of samples for comparison
		colnames(function_abundance_table) = c(first_function_level(), paste(colnames(function_abundance_table)[2:ncol(function_abundance_table)], comparison_tag, sep=""))

		# Melt the function abundance table and add a dummy OTU
		function_abundance_table = melt(function_abundance_table, id.vars = first_function_level(), measure.vars = colnames(function_abundance_table)[2:ncol(function_abundance_table)], variable.name = first_metadata_level(), value.name = "contribution")
		function_abundance_table[,(first_taxonomic_level() ) := rep(unlinked_name, nrow(function_abundance_table))]

		# Change the sample column to be character instead of factor
		function_abundance_table[,(first_metadata_level()) := as.character(get(first_metadata_level()))]

		# Filter out rows with zero abundance
		function_abundance_table = function_abundance_table[contribution > 0]

		# Add the function abundances for comparison to the contribution table
		function_abundance_table = rbind(contribution_table, function_abundance_table, use.names=T)

		return(function_abundance_table)
	}

	# summarize_table_to_selected_level(table_to_summarize, summary_map, summary_level, partial_contribution_table)
	#
	# Summarizes the provided table to the indicated summary level using the given summary map to map current factors to higher-level factors, and distributes partial contributions as necessary
	summarize_table_to_selected_level = function(table_to_summarize, summary_map, summary_level, partial_contribution_table){
		
		contribution_name = colnames(table_to_summarize)[ncol(table_to_summarize)]
		first_level_name = colnames(summary_map)[1]
		
		# The list of id column names that should exist in the summarized table, leaves out the contribution column name (not an id column) and the name of the column that is being summarized to a higher level, and includes the new summary level name
		summarized_id_names = c(colnames(table_to_summarize)[which(!(colnames(table_to_summarize) %in% c(contribution_name, first_level_name)))], summary_level)
		
		# If the summary map has only one column or the summary level is the first column of the summary map, then we don't summarize
		if (ncol(summary_map) == 1 | summary_level == first_level_name){
			return(table_to_summarize)
		}

		# Filter the summary map to only include the columns for the levels we ned to map between
		summary_map = summary_map[,c(first_level_name, summary_level),with=F]

		# Convert merging columns to character type
		table_to_summarize[,(first_level_name) := as.character(get(first_level_name))]
		partial_contribution_table[,(first_level_name) := as.character(get(first_level_name))]
		summary_map = summary_map[,lapply(.SD, as.character)]
		
		# Merge the table to summarize with the summary map by the first level, duplicating rows as necessary when first level elements have multiple entries
		summary_map = merge(table_to_summarize, summary_map, by = first_level_name, all.x = T, all.y = F, allow.cartesian = T)

		# Merge with the partial contribution table
		summary_map = merge(summary_map, partial_contribution_table, by = first_level_name, all.x = T, all.y = F, allow.cartesian = T)

		# Set any NA entries to the unlinked name
		summary_map[,(summary_level) := ifelse(is.na(get(summary_level)), unlinked_name, get(summary_level))]
		
		# Create a partial contribution column
		summary_map[,partial_contribution := ifelse(is.na(partial_contribution_factor), get(contribution_name), get(contribution_name)/partial_contribution_factor)]
		
		# Sum the parital contributions for rows that match in id columns
		summary_map = summary_map[,sum(partial_contribution),by=summarized_id_names]
		
		# Label the summed column for consistency
		colnames(summary_map)[ncol(summary_map)] = contribution_name

		return(summary_map)
	}

	# format_and_truncate_hierarchy_table_to_selected_level(table_to_truncate, summary_level)
	#
	# Removes columns below the selected summary level from the hierarchy table
	format_and_truncate_hierarchy_table_to_selected_level = function(table_to_truncate, summary_level){

		# If there are multiple columns in the hierarchy table, reformat so that they go from highest to lowest level
		if (ncol(table_to_truncate) > 1){
			table_to_truncate = table_to_truncate[,c(2:ncol(table_to_truncate), 1),with=F]
		}

		# Truncate the hierarchy so that the selected summary level is now the lowest level
		table_to_truncate = table_to_truncate[,1:(which(colnames(table_to_truncate) == summary_level)),with=F]
		
		return(table_to_truncate)
	}

	# filter_hierarchy_table_entries(table_to_filter, summary_level, entries_to_keep)
	#
	# Removes duplicate rows and rows corresponding to entries in the summary level column not in the provided list of entries to keep
	filter_hierarchy_table_entries = function(table_to_filter, summary_level, entries_to_keep){

		table_to_filter = unique(table_to_filter)
		table_to_filter = table_to_filter[get(summary_level) %in% entries_to_keep]

		return(table_to_filter)
	}

	# add_unknowns(hierarchy_table)
	#
	# Add "unknown" to names of hierarchy levels with no content
	add_unknowns = function(hierarchy_table, first_level){

		if (ncol(hierarchy_table) > 1){
			hierarchy_names = names(hierarchy_table)[names(hierarchy_table) != first_level]
			hierarchy_table = data.table(V1=hierarchy_table[,get(first_level)], hierarchy_table[,lapply(.SD, function(x){
				return(ifelse(grepl("[[:alnum:]]", gsub("^[a-z]__","",x)), x, paste0(x,"_unknown")))
			}), .SDcols = hierarchy_names])
			setnames(hierarchy_table, "V1", first_level)
		} else {
			taxon_ids = as.character(unlist(hierarchy_table[[first_taxonomic_level()]]))
			hierarchy_table[[first_taxonomic_level()]] = ifelse(grepl("[[:alnum:]]", gsub("^[a-z]__","",taxon_ids)), taxon_ids, paste0(taxon_ids, "_unknown"))
		}

		return(hierarchy_table)
	}

	# make_hierarchy_table_level_entries_unique(hierarchy_table, first_level)
	#
	# Makes all of the hierarchy entries except for the first column (because that needs to match with the taxonomic abundance and contribution tables) unique by prepending that entry's hierarchy level name to the entry, allowing for duplicated entry names between different labels
	make_hierarchy_table_level_entries_unique = function(hierarchy_table, first_level){

		if (ncol(hierarchy_table) > 2){
			# Concatenate ancestor level names in case similar names are shared at the same level in different branches (for example, if two different branches have an unknown node at the same level)
			hierarchy_names = colnames(hierarchy_table)
			hierarchy_table = cbind(hierarchy_table[[first_level]], as.data.table(t(apply(hierarchy_table[,2:ncol(hierarchy_table),with=F], 1, function(row){
				return(sapply(1:length(row), function(col){
					return(paste(row[1:col], collapse = "_"))
				}))	
			}))))
			##Add option here to check if greengenes and to add "unknown" if relevant
			colnames(hierarchy_table) = hierarchy_names
		}

		return(hierarchy_table)
	}

	# convert_hierarchy_table_to_javascript_hierarchy(hierarchy_table, table_type, summary_level)
	#
	# Converts the R table format hierarchy to the javascript hierarchy format used in the visualization
	convert_hierarchy_table_to_javascript_hierarchy = function(hierarchy_table, table_type, summary_level){

		# Make the set of leaves, which are different from the internal nodes
		leaves = lapply(1:nrow(hierarchy_table), function(row){

			# A leaf value has 0 descendents, the provided type, and the names of all ancestor nodes
			l = list("Ndescendents" = 0, "type" = table_type)
			for (depth in 1:ncol(hierarchy_table)){
				l[[colnames(hierarchy_table)[depth]]] = hierarchy_table[row, depth, with=F]
			}

			return(list("key" = paste(l[[summary_level]]), "level" = 0, "values" = list(l)))
		})

		# If there are multiple levels to the hierarchy, iteratively generate the next level up in the hierarchy, gropuing the previous level of nodes by their parent
		lowest_level_nodes = leaves[order(sapply(leaves, function(leaf){return(leaf[["key"]])}))]
		javascript_hierarchy = lowest_level_nodes
		if (ncol(hierarchy_table) > 1){

			# Iterate from the second lowest to highest level
			for (depth in (ncol(hierarchy_table) - 1):1){

				# Get the unique names for the nodes in the previous level
				previous_names = sapply(lowest_level_nodes, function(node){return(node[["key"]])})
				previous_names = previous_names[order(previous_names)]

				# Get the mapping between parent nodes in the current level and children nodes in the previous level
				curr_level_names = unname(unlist(sapply(previous_names, function(prev_level_name){

					prev_depth = depth + 1
					prev_depth_name = colnames(hierarchy_table)[prev_depth]

					# Set the hierarchy table key as the names of the nodes in the previous level
					hierarchy_table = setkeyv(hierarchy_table, prev_depth_name)

					# Get the names of nodes at the current level that are parents of the previous level nodes
					curr_level_names = unique(hierarchy_table[prev_level_name, depth, with=F][[1]])

					return(curr_level_names)
				})))
				
				# Create a new node for each node in the current level
				javascript_hierarchy = lapply(levels(factor(curr_level_names)), function(curr_level_name){
					return(list("key" = curr_level_name, "level" = ncol(hierarchy_table) - depth, "values" = lowest_level_nodes[which(curr_level_names == curr_level_name)]))
				})
				
				# Set the list of lowest level nodes to the current list of nodes for the next iteration
				lowest_level_nodes = javascript_hierarchy
			}
		}

		return(javascript_hierarchy)
	}

	# calculate_average_function_abundances(contribution_table)
	#
	# Calculates the average abundance of each function across all samples
	calculate_average_function_abundances = function(contribution_table, function_hierarchy_table){

		# Identify the samples with contributions, not the ones used for comparison
		relevant_samples = grep(paste(".*", comparison_tag, "$", sep=""), contribution_table[[first_metadata_level()]], invert=T)

		# Sum over the contributions of all taxa in each sample
		function_abundances = contribution_table[relevant_samples, sum(contribution), by=c(function_summary_level(), first_metadata_level())]

		# Rename total abundance column for consistency
		colnames(function_abundances)[ncol(function_abundances)] = "abundance"

		# Convert to relative abundance
		function_abundances[,abundance := abundance/sum(abundance),by=eval(first_metadata_level())]

		# Merge with the function hierarchy so we can get average abundances for every function level
		function_abundances = merge(function_abundances, function_hierarchy_table, by = unname(function_summary_level()))

		# Melt the table so that we have each function's abundance by each sample and hierarchy level
		function_abundances = melt(function_abundances, id.vars = c(first_metadata_level(), "abundance"), measure.vars = colnames(function_hierarchy_table), variable.name = "function_level", value.name = "Function")

		# Sum the function abundances by sample and level name so that we have the total abundance of each function level in each sample
		function_abundances = function_abundances[,sum(abundance), by = c(first_metadata_level(), "Function")]

		# Rename the abundance column for consistency
		colnames(function_abundances)[ncol(function_abundances)] = "abundance"

		# Now calculate the mean of each function abundance across samples
		function_abundances = function_abundances[,mean(abundance), by = "Function"]

		# Rename the mean abundance column for consistency
		colnames(function_abundances)[ncol(function_abundances)] = "Mean"

		return(function_abundances)
	}

	# convert_otu_table_to_javascript_table(otu_table)
	#
	# Converts the R table format OTU abundance table to the javascript table used in the visualization
	convert_otu_table_to_javascript_table = function(otu_table){

		# Cast the otu table to a matrix for conversion
		javascript_otu_table = dcast(otu_table, as.formula(paste(taxonomic_summary_level(), " ~ ", first_metadata_level(), sep="")), value.var = "abundance", fill = 0)
		
		# Convert to relative abundance
		javascript_otu_table = cbind(javascript_otu_table[,taxonomic_summary_level(),with=F], as.data.table(scale(javascript_otu_table[,2:ncol(javascript_otu_table),with=F], scale = colSums(javascript_otu_table[,2:ncol(javascript_otu_table),with=F]), center = F)))
		
		# Create the javascript format OTU table
		javascript_otu_table = lapply(2:ncol(javascript_otu_table), function(col){

			sample_otu_abundance_list = split(unname(unlist(javascript_otu_table[,col,with=F])), seq(nrow(javascript_otu_table[,col,with=F])))
			names(sample_otu_abundance_list) = javascript_otu_table[[taxonomic_summary_level()]]
			sample_otu_abundance_list[[first_metadata_level()]] = colnames(javascript_otu_table)[col]
			return(sample_otu_abundance_list)
		})

		return(javascript_otu_table)
	}

	# convert_contribution_table_to_javascript_table(contribution_table)
	#
	# Converts the R table format contribution table to the javascript table used in the visualization
	convert_contribution_table_to_javascript_table = function(contribution_table){

		# Calculate average contributions for each function for each taxon
		average_contributions = contribution_table[,mean(contribution), by = c(taxonomic_summary_level(), function_summary_level())]
		colnames(average_contributions)[ncol(average_contributions)] = "contribution"

		# Add a sample called "Average_contrib" to the contribution table, include 0s for missing taxa/function combinations
		average_contributions[,(first_metadata_level()) := rep("Average_contrib", nrow(average_contributions))]
		javascript_contribution_table = rbind(contribution_table, average_contributions, use.names=T)

		# Cast the table so that the columns are functions
		javascript_contribution_table = dcast(javascript_contribution_table, as.formula(paste(first_metadata_level(), " + ", taxonomic_summary_level(), " ~ ", function_summary_level(), sep="")), value.var = "contribution")

		# Create a single column for functions that contains a list of the functions for that row's sample and taxon while removing empty elements from those lists
		javascript_contribution_table = data.table(first_metadata_level = javascript_contribution_table[[first_metadata_level()]], taxonomic_summary_level = javascript_contribution_table[[taxonomic_summary_level()]], function_summary_level = apply(javascript_contribution_table[,3:ncol(javascript_contribution_table),with=F], 1, function(row){
			return(as.list(row[!is.na(row)]))
		}))
		colnames(javascript_contribution_table) = c(first_metadata_level(), taxonomic_summary_level(), function_summary_level())

		# Cast the table so that the columns are taxa
		javascript_contribution_table = dcast(javascript_contribution_table, as.formula(paste(first_metadata_level(), " ~ ", taxonomic_summary_level(), sep="")), value.var = function_summary_level())

		# Create a single column for taxa that contains a list of taxa in the corresponding row's sample, and each element in that list is a list of the function contributions that taxon makes in that sample
		javascript_contribution_table = data.table(first_metadata_level = javascript_contribution_table[[first_metadata_level()]], taxonomic_summary_level = apply(javascript_contribution_table[,2:ncol(javascript_contribution_table),with=F], 1, function(row){
			return(as.list(row[sapply(row, function(element){
				return(!is.null(element[[1]]))
			})]))
		}))
		colnames(javascript_contribution_table) = c(first_metadata_level(), taxonomic_summary_level())

		# Cast so that each column is a sample
		javascript_contribution_table = dcast(javascript_contribution_table, as.formula(paste(". ~ ", first_metadata_level(), sep="")), value.var = taxonomic_summary_level())
		javascript_contribution_table = javascript_contribution_table[,2:ncol(javascript_contribution_table),with=F]

		# For mat so that the top level sample list s are nested properly
		javascript_contribution_table = lapply(javascript_contribution_table, function(element){
			return(element[[1]])
		})

		return(javascript_contribution_table)
	}

	# filter_missing_samples_from_metadata(metadata_table, otu_table, contribution_table)
	#
	# Removes samples from the metadata table that do not appear in the OTU or contribution tables
	filter_missing_samples_from_metadata = function(metadata_table, otu_table, contribution_table){

		# If the metadata table is not empty, filter it
		if (nrow(metadata_table) > 0){

			# Determine which samples in the metadata table appear in the other tables
			filtered_metadata_rows = which(metadata_table[[first_metadata_level()]] %in% c(otu_table[[first_metadata_level()]], contribution_table[[first_metadata_level()]]))

			# Keep only the rows that are in the other tables
			metadata_table = metadata_table[filtered_metadata_rows]
		}

		return(metadata_table)
	}

	# order_metadata_table_by_metadata_factor(metadata_table)
	#
	# Orders the samples in the metadata table by the selected metadata factor
	order_metadata_table_by_metadata_factor = function(metadata_table){

		# If the metadata table is not empty, order the rows
		if (nrow(metadata_table) > 0){

			# Determine the order of the factor by order of first appearance in the factor's column
			metadata_factor_order = c()
			for (row in 1:nrow(metadata_table)){
				row_factor = metadata_table[[metadata_factor()]][row]
				if (!(row_factor %in% metadata_factor_order)){
					metadata_factor_order = c(metadata_factor_order, row_factor)
				}
			}

			# Set the factor column to use the determined ordering
			metadata_table[[metadata_factor()]] = factor(metadata_table[[metadata_factor()]], levels = metadata_factor_order, ordered = T)

			# Now order the metadata table by the factor
			metadata_table = metadata_table[order(metadata_table[[metadata_factor()]])]

			# Convert the factor column into a character column
			metadata_table[,(metadata_factor()) := as.character(get(metadata_factor()))]
		}

		return(metadata_table)
	}

	# convert_metadata_table_to_javascript_table(metadata_table, function_abundance_table)
	#
	# Converts the R table format metadata table to the javascript table used in the visualization, if a metadata table was provided
	convert_metadata_table_to_javascript_table = function(metadata_table, function_abundance_table){

		# If the metadata table is empty, return NULL
		if (nrow(metadata_table) == 0){
			return(NULL)
		}
		
		# If comparison function abundances were provided, add metadata labels for those comparison samples
		if (nrow(function_abundance_table) != 0){
			duplicate_metadata_table = metadata_table
			duplicate_metadata_table[[first_metadata_level()]] = paste(duplicate_metadata_table[[first_metadata_level()]], comparison_tag, sep="")
			metadata_table = rbind(metadata_table, duplicate_metadata_table)
		}

		# Create a text string table that can be parsed by the d3 parser
		javascript_metadata_table = paste(paste(colnames(metadata_table), collapse="\t"), paste(sapply(1:nrow(metadata_table), function(row){return(paste(metadata_table[row,], collapse="\t"))}), collapse="\n"), sep="\n")

		return(javascript_metadata_table)
	}

	# filter_otu_table_by_relative_abundance(otu_table)
	#
	# Filters the OTU table to remove any taxon whose maximum relative abundance across all samples is below a given threshold
	filter_otu_table_by_relative_abundance = function(otu_table){

		# Determine the maximum relative abundance of each taxon
		taxa_maximum_relative_abundances = otu_table[,max(abundance),by=eval(taxonomic_summary_level())]

		# Get the names of taxa with a high enough maximum relative abundance
		filtered_taxa = taxa_maximum_relative_abundances[V1 >= relative_abundance_cutoff][[taxonomic_summary_level()]]

		# Filter the OTU table
		otu_table = otu_table[get(taxonomic_summary_level()) %in% filtered_taxa]

		return(otu_table)
	}

	# filter_contribution_table_by_relative_abundance(contribution_table, otu_table)
	#
	# Filters the contribution table to remove any function whose maximum relative abundance across all samples is below a given threshold
	filter_contribution_table_by_relative_abundance = function(contribution_table, otu_table){

		# Filter the contribution table to only contain taxa still in the otu table
		contribution_table = contribution_table[get(taxonomic_summary_level()) %in% c(otu_table[[taxonomic_summary_level()]], unlinked_name)]
		
		# Renormalize the contribution table
		contribution_table = normalize_contribution_table(contribution_table)
		
		# Determine the relative abundance of each funtion in each sample
		function_abundances = contribution_table[,sum(contribution),by=c(first_metadata_level(), function_summary_level())]
		
		# Determine the maximum relative abundance of each function across all samples
		maximum_function_abundances = function_abundances[,max(V1),by=eval(function_summary_level())]
		
		# Get the names of functions with a high enough maximum relative abundance
		filtered_functions = maximum_function_abundances[V1 >= relative_abundance_cutoff][[function_summary_level()]]
		
		# Filter the contribution table to only contain functions with a high enough maximum relative abundance
		contribution_table = contribution_table[get(function_summary_level()) %in% filtered_functions]
		
		# Renormalize the contribution table
		contribution_table = normalize_contribution_table(contribution_table)
		
		return(contribution_table)
	}

	# prepare_and_send_otu_table_sample_order_for_visualization(otu_table, metadata_table, alphabetical = F)
	#
	# Determines the order in which samples should be displayed for the taxonomic abundance barplot
	prepare_and_send_otu_table_sample_order_for_visualization = function(otu_table, metadata_table, alphabetical = F){

		# Get the set of relevant samples
		samples = levels(factor(otu_table[[first_metadata_level()]]))

		# If specified, we sort alphabetically
		# If specified with no sample grouping, we just sort alphabetically
		if (input$metadata_choice == "ABSENT" & alphabetical){
			otu_table_sample_order = rank(samples)
		# Otherwise, if there is metadata to order by, use that order instead
		} else if (input$metadata_choice == "PRESENT" & nrow(metadata_table) > 0){ 

			# Order all samples but the "Average_contrib" sample and the comparison samples by the metadata table order
			otu_table_sample_order = sapply(metadata_table[get(first_metadata_level()) %in% samples][[first_metadata_level()]], function(sample_name){
				return(which(samples == sample_name))
			})

			# Add any remaining samples that didn't have metadata (though they should not have gotten to this point if that is the case) excluding the "Average_contrib" sample and the comparison samples
			otu_table_sample_order = c(otu_table_sample_order, which(!(samples %in% metadata_table[get(first_metadata_level()) %in% samples][[first_metadata_level()]]) & samples != "Average_contrib" & !grepl(comparison_tag, samples)))

		# Otherwise, by default just use the order of the samples from the otu table
		} else {
			otu_table_sample_order = 1:length(samples)
		}

		# Send the sample order to the browser
		session$sendCustomMessage("taxonomic_abundance_sample_order", samples[otu_table_sample_order])

		return(otu_table_sample_order)
	}

	# prepare_and_send_function_table_sample_order_for_visualization(contribution_table, metadata_table, alphabetical = F)
	#
	# Determines the order in which samples should be displayed for the function abundance barplot
	prepare_and_send_function_table_sample_order_for_visualization = function(contribution_table, metadata_table, alphabetical = F){

		# Get the set of relevant samples
		samples = levels(factor(contribution_table[[first_metadata_level()]]))
		function_table_sample_order = c()
		
		# If specified with no sample grouping, we just sort alphabetically
		if(input$metadata_choice == "ABSENT" & alphabetical){
			orig_samps = samples[!grepl(comparison_tag,samples) & samples != "Average_contrib"]
			if(any(grepl(comparison_tag, samples))){
				new_samp_order = c(sapply(sort(orig_samps), function(samp){
					return(c(samp, paste0(samp, comparison_tag)))
				}))
				function_table_sample_order = match(new_samp_order, samples)
			} else {
				function_table_sample_order = rank(samples)
			}

		# Otherwise, if there is metadata to order by, use that order instead
		} else if (input$metadata_choice == "PRESENT" & nrow(metadata_table) > 0){ 

			# Order all samples but the "Average_contrib" sample by the metadata table order
			for (sample_name in metadata_table[[first_metadata_level()]]){

				function_table_sample_order = c(function_table_sample_order, which(samples == sample_name))

				# If they provided comparison function abundances, put the normal sample and the comparison sample next to each other
				if (input$example_visualization != "TRUE" & input$function_abundance_choice == "PRESENT" & paste(sample_name, comparison_tag, sep="") %in% samples){
					function_table_sample_order = c(function_table_sample_order, which(samples == paste(sample_name, comparison_tag, sep="")))
				}
			}

			# Add any remaining samples that didn't have metadata excluding the "Average_contrib" sample
			for (sample_name in samples[which((!(samples %in% metadata_table[[first_metadata_level()]])) & !grepl(comparison_tag, samples) & samples != "Average_contrib")]){

				function_table_sample_order = c(function_table_sample_order, which(samples == sample_name))

				# If they provided comparison function abundances, put the normal sample and the comparison sample next to each other
				if (input$example_visualization != "TRUE" & input$function_abundance_choice == "PRESENT" & paste(sample_name, comparison_tag, sep="") %in% samples){
					function_table_sample_order = c(function_table_sample_order, which(samples == paste(sample_name, comparison_tag, sep="")))
				}
			}

		# By default, remove the average contribution sample and order the rest so comparison samples are next to the right sample
		} else {
			for (sample_name in samples[!grepl(comparison_tag, samples) & samples != "Average_contrib"]){
				function_table_sample_order = c(function_table_sample_order, which(samples == sample_name))
				if (paste(sample_name, comparison_tag, sep="") %in% samples){
					function_table_sample_order = c(function_table_sample_order, which(samples == paste(sample_name, comparison_tag, sep="")))
				}
			}
		}

		# Send the function table sample order to the browser
   		session$sendCustomMessage("function_abundance_sample_order", samples[function_table_sample_order])

		return(function_table_sample_order)
	}


	# remove_temp_files()
	#
	# Deletes the temporary files made by users uploading data from the server
	remove_temp_files = function(){

		for (file_input_name in html_elements){
			if (!is.null(input[[file_input_name]])){
				file.remove(input[[file_input_name]]$datapath)
			}
		}
	}

	# The main observer, tied specifically to the update button that indicates the visualization should be generated. Runs the data validation and processing necessary to generate the javascript objects used in the visualization
	observeEvent(input$update_button, { # ObserveEvent, runs whenever the update button is clicked

		### Log visualization views (no user information) for usage metrics
		write(as.character(Sys.time()), file=log_filename, append=TRUE)

		session$sendCustomMessage("upload_status", "file_upload")
		
		# Initialize important tables
		otu_table = NULL
		taxonomic_hierarchy_table = NULL
		function_hierarchy_table = NULL
		metadata_table = NULL
		contribution_table = NULL
		function_abundance_table = NULL
		
		# If they're viewing the example, load the default data
		if (input$example_visualization == "TRUE"){

			# Set the default tables
			otu_table = format_otu_table(fread(default_otu_table_filename, header=T, showProgress=F))
			taxonomic_hierarchy_table = default_taxonomic_hierarchy_table
			function_hierarchy_table = default_function_hierarchy_table
			metadata_table = default_metadata_table
			contribution_table = format_default_contribution_table(fread(default_contribution_table_filename, header=T, showProgress=F))
			function_abundance_table = data.table()

		# Otherwise, if they're not viewing the example, then we try to load data
		} else {
			session$sendCustomMessage("shiny_test", "Processing OTU table")
			otu_table = process_otu_table_file()
			if (is.null(otu_table)){
				return()
			}
			session$sendCustomMessage("shiny_test", "Processing taxonomic hierarchy table")
			taxonomic_hierarchy_table = process_taxonomic_hierarchy_table_file()
			if (is.null(taxonomic_hierarchy_table)){
				return()
			}
			session$sendCustomMessage("shiny_test", "Processing function hierarchy table")
			function_hierarchy_table = process_function_hierarchy_table_file()
			if (is.null(function_hierarchy_table)){
				return()
			}
			session$sendCustomMessage("shiny_test", "Processing function abundance table")
			function_abundance_table = process_function_abundance_table_file()
			if (is.null(function_abundance_table)){
				return()
			}
			session$sendCustomMessage("shiny_test", "Processing metadata table")
			metadata_table = process_metadata_table_file()
			if (is.null(metadata_table)){
				return()
			}

			# If any tables could not be processed, we exit
			if (is.null(otu_table) | is.null(taxonomic_hierarchy_table) | is.null(function_hierarchy_table) | is.null(function_abundance_table) | is.null(metadata_table)){
				return()
			}

			# Generate the contribution table
			session$sendCustomMessage("upload_status", "contribution_calculation")
			contribution_table = generate_contribution_table(otu_table)

			# If the contribution table could not be generated, we exit
			if (is.null(contribution_table)){
				return()
			}

			# Validate that all files have consistent labels and samples, and if not then exit
			session$sendCustomMessage("upload_status", "data_validation")
			if (!validate_tables_match(otu_table, contribution_table, function_abundance_table, taxonomic_hierarchy_table, function_hierarchy_table, metadata_table)){
				return()
			}

			# Filter unmatched elements from tables
			otu_table = filter_elements_from_first_not_found_in_second(otu_table, taxonomic_hierarchy_table, first_taxonomic_level(), first_taxonomic_level(), paste(first_taxonomic_level(), "s", sep=""), "OTU table", "taxonomic hierarchy")

			contribution_table = filter_elements_from_first_not_found_in_second(contribution_table, taxonomic_hierarchy_table, first_taxonomic_level(), first_taxonomic_level(), paste(first_taxonomic_level(), "s", sep=""), "contribution table", "taxonomic hierarchy")

			contribution_table = filter_elements_from_first_not_found_in_second(contribution_table, function_hierarchy_table, first_function_level(), first_function_level(), paste(first_function_level(), "s", sep=""), "contribution table", "functional hierarchy")

			if (nrow(function_abundance_table) > 0){
				function_abundance_table = filter_elements_from_first_not_found_in_second(function_abundance_table, function_hierarchy_table, first_function_level(), first_function_level(), paste(first_function_level(), "s", sep=""), "function abundance table", "functional hierarchy")
			}
			
			# Add the comparison samples to the contribution table
			contribution_table = add_comparison_function_abundances_to_contribution_table(contribution_table, function_abundance_table)
			
			# If we could not add the function abundances to the contribution table, we exit
			if (is.null(contribution_table)){
				return()
			}
		}

		# Generate and send a table of sample NSTIs to the browser if possible
		generate_and_send_nsti_table(otu_table)

		# Format the hierarchy tables so that we can summarize the OTU and contribution tables with them
		session$sendCustomMessage("upload_status", "hierarchy_processing")
		# Filter the hierarchy entries
		taxonomic_hierarchy_table = filter_hierarchy_table_entries(taxonomic_hierarchy_table, first_taxonomic_level(), unique(c(otu_table[[first_taxonomic_level()]], contribution_table[[first_taxonomic_level()]])))
		function_hierarchy_table = filter_hierarchy_table_entries(function_hierarchy_table, first_function_level(), unique(contribution_table[[first_function_level()]]))

		# Add in "unknown" to hierarchy entries with no alpha characters
		taxonomic_hierarchy_table = add_unknowns(taxonomic_hierarchy_table, first_taxonomic_level())

		# Make the entries of the hierarchy unique
		taxonomic_hierarchy_table = make_hierarchy_table_level_entries_unique(taxonomic_hierarchy_table, first_taxonomic_level())
		function_hierarchy_table = make_hierarchy_table_level_entries_unique(function_hierarchy_table, first_function_level())

		# Prepare data and send it to the browser
	
		### Prepare the OTU table ###
		session$sendCustomMessage("upload_status", "taxonomic_abundance_formatting")

		# Normalize the OTU abundances per sample
		otu_table = normalize_otu_table(otu_table)
		
		# Summarize the OTU table OTUS to the user-selected level
		otu_table = summarize_table_to_selected_level(otu_table, taxonomic_hierarchy_table, taxonomic_summary_level(), taxonomic_partial_contribution_table())
		
		# Filter out taxa based on their relative abundance
		otu_table = filter_otu_table_by_relative_abundance(otu_table)
		
		# Renormalize the filtered table
		otu_table = normalize_otu_table(otu_table)
		
		# Convert the OTU table to a javascript-friendly format
		javascript_otu_table = convert_otu_table_to_javascript_table(otu_table)

		# Set the value of the tracked OTU table so that we can send it in pieces to the browser
		tracked_tables[["otu_table"]] = javascript_otu_table

		# Tell the browser we're ready to start sending otu table data
		session$sendCustomMessage("taxonomic_abundance_table_ready", length(javascript_otu_table))


		
		### Prepare the contribution table ###
		session$sendCustomMessage("upload_status", "contribution_formatting")

		# Normalize the contributions by sample
		contribution_table = normalize_contribution_table(contribution_table)
		
		# Summarize the contribution table functions to the user-selected level
		contribution_table = summarize_table_to_selected_level(contribution_table, function_hierarchy_table, function_summary_level(), function_partial_contribution_table())
		
		# Summarize the contribution table OTUs to the user-selected level
		contribution_table = summarize_table_to_selected_level(contribution_table, taxonomic_hierarchy_table, taxonomic_summary_level(), taxonomic_partial_contribution_table())
		
		# Filter out functions based on their relative abundance
		contribution_table = filter_contribution_table_by_relative_abundance(contribution_table, otu_table)
		
		# Convert the contribution table to a javascript-friendly format
		javascript_contribution_table = convert_contribution_table_to_javascript_table(contribution_table)
		
		# Set the value of the tracked contribution table so that we can send it in pieces to the browser
		tracked_tables[["contribution_table"]] = javascript_contribution_table

		# Tell the browser how many samples there are
		session$sendCustomMessage("number_of_samples_message", length(javascript_contribution_table))

		# Tell the browser we're read to start sending contribution table data
		session$sendCustomMessage(type="contribution_table_ready", length(javascript_contribution_table))



		### Prepare the hierarchies ###
		session$sendCustomMessage("upload_status", "hierarchy_formatting")

		# Remove columns from the taxonomic hierarchy table taht are below the resolution selected by the user
		taxonomic_hierarchy_table = format_and_truncate_hierarchy_table_to_selected_level(taxonomic_hierarchy_table, taxonomic_summary_level())

		# Send a list of the taxonomic level names
		session$sendCustomMessage(type='taxonomic_hierarchy_labels', colnames(taxonomic_hierarchy_table))

		# Re-filter the table now that we have summarized tables
		taxonomic_hierarchy_table = filter_hierarchy_table_entries(taxonomic_hierarchy_table, taxonomic_summary_level(), unique(contribution_table[[taxonomic_summary_level()]]))

		# Make all entries strings
		taxonomic_hierarchy_table = taxonomic_hierarchy_table[,lapply(.SD, as.character)]

		# Convert the taxonomic hierarchy table to a javascript-friendly format
		javascript_taxonomic_hierarchy = convert_hierarchy_table_to_javascript_hierarchy(taxonomic_hierarchy_table, "taxa", taxonomic_summary_level())

		# Send the formatted taxonomic hierarchy to the browser
		session$sendCustomMessage(type='taxonomic_hierarchy', javascript_taxonomic_hierarchy)

		# Remove columns from the function hierarchy table taht are below the resolution selected by the user
		function_hierarchy_table = format_and_truncate_hierarchy_table_to_selected_level(function_hierarchy_table, function_summary_level())

		# Send a list of the function level names
		session$sendCustomMessage(type='function_hierarchy_labels', colnames(function_hierarchy_table))

		# Re-filter the table now that we have summarized tables
		function_hierarchy_table = filter_hierarchy_table_entries(function_hierarchy_table, function_summary_level(), unique(contribution_table[[function_summary_level()]]))

		# Make all entries strings
		function_hierarchy_table = function_hierarchy_table[,lapply(.SD, as.character)]

		# Convert the function hierarchy table to a javascript-friendly format
		javascript_function_hierarchy = convert_hierarchy_table_to_javascript_hierarchy(function_hierarchy_table, "function", function_summary_level())

		# Send the formatted function hierarchy to the browser
		session$sendCustomMessage(type='function_hierarchy', javascript_function_hierarchy)



		### Prepare the average function abundance table ###
		session$sendCustomMessage("upload_status", "average_function_abundance_formatting")

		# Calculate the average abundances
		average_function_abundance_table = calculate_average_function_abundances(contribution_table, function_hierarchy_table)

		# Send the table to the browser
		session$sendCustomMessage("function_averages",paste(paste(colnames(average_function_abundance_table), collapse="\t"), paste(sapply(1:nrow(average_function_abundance_table), function(row){return(paste(average_function_abundance_table[row,], collapse="\t"))}), collapse="\n"), sep="\n"))


		### Prepare the metadata table ###
		session$sendCustomMessage("upload_status", "metadata_formatting")

		# Filter samples without data from the metadata table
		metadata_table = filter_missing_samples_from_metadata(metadata_table, otu_table, contribution_table)

		# If a metadata factor has been selected, order samples by the indicated metadata factor
		if (!is.null(metadata_factor())){
			metadata_table = order_metadata_table_by_metadata_factor(metadata_table)
		}

		
		javascript_metadata_table = convert_metadata_table_to_javascript_table(metadata_table, function_abundance_table)


		# If no metadata table was provided, send a NULL signal
		if (is.null(javascript_metadata_table)){
			session$sendCustomMessage("metadata_table", "NULL")
		# Otherwise, send the javascript metadata table
		} else {
			session$sendCustomMessage("metadata_table", javascript_metadata_table)
		}


		### Generate and send the DA statistics table 
		generate_and_send_statistics_table(metadata_table, otu_table, contribution_table)


		### Prepare the sample orders ###
		session$sendCustomMessage("upload_status", "done")
		otu_table_sample_order = prepare_and_send_otu_table_sample_order_for_visualization(otu_table, metadata_table, input$sort_samples)
		function_table_sample_order = prepare_and_send_function_table_sample_order_for_visualization(contribution_table, metadata_table, input$sort_samples)

	})
})
