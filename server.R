# R server code interacting with the main webpage

library(shiny)
library(data.table)

# Defining important files
default_tax_hierarchy_table = "www/Data/97_otu_taxonomy_split_with_header.txt"
default_func_hierarchy_table = "www/Data/classes_parsed2.tsv"
default_sample_map_table = "www/Data/mice_samplemap.txt"
default_contribution_table = "www/Data/mice_metagenome_contributions_K01516_removed.txt"
default_otu_table = "www/Data/otu_table_even_2.txt"
picrust_normalization_file = "www/Data/16S_13_5_precalculated.tab.gz"
picrust_ko_file = "www/Data/melted_filtered_picrust_ko_table.txt"
constants_file = "www/Javascript/constants.js"

# Defining constants shared between javascript and R code
constants_table = fread(constants_file, header=F)
unlinked_taxon_name = unlist(constants_table[unlist(constants_table[,2,with=F]) == "unlinked_taxon_name",4,with=F])
average_contrib_sample_name = unlist(constants_table[unlist(constants_table[,2,with=F]) == "average_contrib_sample_name",4,with=F])
options(shiny.maxRequestSize = as.numeric(unlist(constants_table[unlist(constants_table[,2,with=F]) == "max_upload_size",4,with=F])))
options(stringsAsFactors = F)

# Defining constants used by the server
comparison_tag = "_comparison"
default_tax_summary_level = "Genus"
default_func_summary_level = "SubPathway"
default_samp_grouping = "Group"

# Actual Shiny server code
shinyServer(function(input, output, session) {

    # Variables that the server keeps track of but doesn't need to run functions to calculate
    tracked_data = reactiveValues(previous_contribution_sample = -1, previous_otu_sample = -1, otu_table = NULL, contribution_table = NULL, tax_summary_level = "Genus", func_summary_level = "SubPathway", old_tax_abund_1_datapath = NULL, old_tax_abund_2_datapath = NULL, old_read_counts_datapath = NULL, old_annotation_datapath = NULL, old_contributions_datapath = NULL, old_function_abundances_datapath = NULL, old_func_hierarchy_datapath = NULL, old_tax_hierarchy_datapath = NULL, old_samp_map_datapath = NULL)

    # Functional to calculate the normalization factors for partial KO contributions
    ko_normalization_table = reactive({ # Reactive, when called only recalculates output if variables it depends on change

    	func_hierarchy = NULL
		if (input$input_type == "run_picrust" & !is.null(input$function_hierarchy_R)){ # If they've uploaded a custom hierarchy, use theirs
			func_hierarchy_file = input$function_hierarchy_R
			func_hierarchy_file_path = func_hierarchy_file$datapath
			func_hierarchy = fread(func_hierarchy_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)	
		} else if (input$input_type == "contributions" & !is.null(input$function_hierarchy_C)){
			func_hierarchy_file = input$function_hierarchy_C
			func_hierarchy_file_path = func_hierarchy_file$datapath
			func_hierarchy = fread(func_hierarchy_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)
		} else if (input$input_type == "annotations" & !is.null(input$function_hierarchy_G)){
			func_hierarchy_file = input$function_hierarchy_G
			func_hierarchy_file_path = func_hierarchy_file$datapath
			func_hierarchy = fread(func_hierarchy_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)
		} else {
			func_hierarchy = fread(default_func_hierarchy_table, sep="\t", header=TRUE, stringsAsFactors=FALSE)
		}

		# Sum the occurrences of each KO
		output = func_hierarchy[,.N,by="KO"]
		return(output)
	})

	observeEvent(input$update_button, { # ObserveEvent, runs whenever the update button is clicked
		abort = FALSE
		retry_upload = FALSE
		tracked_data$contribution_table = NULL
		output = NULL
		tax_summary_level = tracked_data$tax_summary_level
		func_summary_level = tracked_data$func_summary_level
		samp_grouping = NULL
		if (input$input_type == "run_picrust" & !is.null(input$taxLODselector_R)){
			tax_summary_level = input$taxLODselector_R
		} else if (input$input_type == "contributions" & !is.null(input$taxLODselector_C)){
			tax_summary_level = input$taxLODselector_C
		} else if (input$input_type == "annotations" & !is.null(input$taxLODselector_G)){
			tax_summary_level = input$taxLODselector_G
		} else if (input$input_type == "example"){
			tax_summary_level = "Genus"
		}
		if (input$input_type == "run_picrust" & !is.null(input$funcLODselector_R)){
			func_summary_level = input$funcLODselector_R
		} else if (input$input_type == "contributions" & !is.null(input$funcLODselector_C)){
			func_summary_level = input$funcLODselector_C
		} else if (input$input_type == "annotations" & !is.null(input$funcLODselector_G)){
			func_summary_level = input$funcLODselector_G
		} else if (input$input_type == "example"){
			func_summary_level = "SubPathway"
		}
		if (input$input_type == "run_picrust" & !is.null(input$sampgroupselector_R)){
			samp_grouping = input$sampgroupselector_R
		} else if (input$input_type == "contributions" & !is.null(input$sampgroupselector_C)){
			samp_grouping = input$sampgroupselector_C
		} else if (input$input_type == "annotations" & !is.null(input$sampgroupselector_G)){
			samp_grouping = input$sampgroupselector_G
		} else if (input$input_type == "example"){
			samp_grouping = "Group"
		}
		
		otu_table = NULL

		session$sendCustomMessage("upload_status", "Starting input processing")

		################################# Loading/calculating contribution table #################################
		if (is.null(input$input_type)){ # If they somehow trigger the visualization without an input type, do nothing and send a warning

			session$sendCustomMessage("abort", "Visualization trigger without input type.")
			abort = TRUE

		} else if(input$input_type == "example"){ # If they've chosen to view the example

			session$sendCustomMessage("upload_status", "Loading default data")

			otu_table = fread(default_otu_table, sep="\t", header=TRUE, stringsAsFactors=FALSE)
			output = fread(default_contribution_table, sep="\t", header=TRUE, stringsAsFactors=FALSE)

			# Remove the unnecessary columns (keep Sample, OTU, KO, and contribution)
			output = output[,c(2,3,1,6), with=FALSE]

		} else if (input$input_type == "annotations"){ # If they've chosen the genome annotation option

			otu_table_file = input$taxonomic_abundances_1
			annotation_file = input$genome_annotations
			if (is.null(otu_table_file) | is.null(annotation_file)){
				session$sendCustomMessage("retry_upload", "retry")
			} else {

				otu_table_file_path = otu_table_file$datapath
				annotation_file_path = annotation_file$datapath
				if (!is.null(tracked_data$old_tax_abund_1_datapath)){
					if (tracked_data$old_tax_abund_1_datapath == otu_table_file_path){
						retry_upload = TRUE
					}
				}
				if (!is.null(tracked_data$old_annotation_datapath)){
					if (tracked_data$old_annotation_datapath == annotation_file_path){
						retry_upload = TRUE
					}
				}

				if (retry_upload){
					session$sendCustomMessage("retry_upload", "retry")
				} else {
					session$sendCustomMessage("upload_status", "Reading OTU table")
					tracked_data$old_tax_abund_1_datapath = otu_table_file_path
					otu_table = fread(otu_table_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)

					session$sendCustomMessage("upload_status", "Reading annotation table")
					tracked_data$old_annotation_datapath = annotation_file_path
					annotation = fread(annotation_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)
					colnames(annotation) = c("OTU", "Gene", "CopyNumber")

					# File checking
					session$sendCustomMessage("upload_status", "Verifying OTUs match between tables")
					otu_table_otus = unlist(otu_table[,1,with=F])
					extra_otu_table_otus = !(otu_table_otus %in% annotation$OTU)
					if (any(extra_otu_table_otus)){
						session$sendCustomMessage("abort", paste("The following OTUs are in the OTU table without annotations: ", paste(unique(otu_table_otus[extra_otu_table_otus]), collapse = " "), sep=""))
						abort = TRUE
					}

					session$sendCustomMessage("upload_status", "Checking for duplicate table rows")
					otu_table_duplicates = duplicated(otu_table_otus)
					if (any(otu_table_duplicates)){
						session$sendCustomMessage("abort", paste("The folloing OTUs have multiple rows in the OTU table: ", paste(unique(otu_table_otus[otu_table_duplicates]), collapse = " "), sep=""))
						abort = TRUE
					}

					annotation_duplicates = duplicated(annotation[,which(colnames(annotation) %in% c("OTU", "Gene")),with=F])
					if (any(annotation_duplicates)){
						session$sendCustomMessage("abort", paste("The following OTU-Gene pairs have multiple rows in the annotation table: ", paste(unique(paste(annotation[annotation_duplicates, which(colnames(annotation) == "OTU"),with=F], annotation[annotation_duplicates, which(colnames(annotation) == "Gene"),with=F], sep="-")), collapse = " "), sep=""))
						abort = TRUE
					}

					session$sendCustomMessage("upload_status", "Checking for duplicate samples")
					sample_duplicates = duplicated(colnames(otu_table)[2:ncol(otu_table)])
					if (any(sample_duplicates)){
						session$sendCustomMessage("abort", paste("The following samples have multiple columns in the OTU table: ", paste(unique(colnames(otu_table)[sample_duplicates]), collapse = " "), sep=""))
						abort = TRUE
					}

					if (!abort){
						# Change zeros in abundance matrix to NAs so we can remove them when melting
						otu_table[otu_table == 0] = NA

						session$sendCustomMessage("upload_status", "Calculating function contributions from annotations")

						# Melt the otu abundance table so we can merge with the annotations
						melted_otu_table = melt(otu_table,id=colnames(otu_table)[1], na.rm=TRUE)

						# Merge the melted otu abundances and annotations to a get a column for every Sample, OTU, KO set
						merged_table = merge(melted_otu_table, annotation, by.x=c(colnames(melted_otu_table)[1]), by.y=c(colnames(annotation)[1]), allow.cartesian=TRUE, sort=FALSE)

						# Make a contribution column by multiplying the OTU abundance by the KO count
						merged_table$contribution = merged_table[,3,with=FALSE] * merged_table[,5,with=FALSE]

						# Reorganize and reformat the table to standardize
						output = merged_table[,c(2,1,4,6),with=FALSE]
					}
				}
			}

		} else if (input$input_type == "run_picrust"){ # If they've chosen the PICRUSt option

			otu_table_file = input$read_counts
			if (is.null(otu_table_file)){
				session$sendCustomMessage("retry_upload", "retry")
			} else {

				otu_table_file_path = otu_table_file$datapath
				if (!is.null(tracked_data$old_read_counts_datapath)){
					if (tracked_data$old_read_counts_datapath == otu_table_file_path){
						retry_upload = TRUE
					}
				}

				if (retry_upload){
					session$sendCustomMessage("retry_upload", "retry")
				} else {
					session$sendCustomMessage("upload_status", "Reading OTU table")
					tracked_data$old_read_counts_datapath = otu_table_file_path
					otu_table = fread(otu_table_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)

					# Get the PICRUSt normalization table
					normalization = data.table(read.csv(gzfile(picrust_normalization_file), sep="\t", header=TRUE, stringsAsFactors=FALSE))

					# File checking
					session$sendCustomMessage("upload_status", "Verifying OTUs are known to PICRUSt") # Maybe be less stringent here, just ignore OTUs without PICRUSt annotations?
					otu_table_otus = unlist(otu_table[,1,with=F])
					normalization_otus = unlist(normalization[,1,with=F])
					extra_otu_table_otus = !(otu_table_otus %in% normalization_otus)
					if (any(extra_otu_table_otus)){
						session$sendCustomMessage("abort", paste("The following OTUs in the OTU table are unrecognized by our version of PICRUSt: ", paste(unique(otu_table_otus[extra_otu_table_otus]), collapse = " "), sep=""))
						abort = TRUE
					}

					session$sendCustomMessage("upload_status", "Checking for duplicate table rows")
					otu_table_duplicates = duplicated(otu_table_otus)
					if (any(otu_table_duplicates)){
						session$sendCustomMessage("abort", paste("The folloing OTUs have multiple rows in the OTU table: ", paste(unique(otu_table_otus[otu_table_duplicates]), collapse = " "), sep=""))
						abort = TRUE
					}

					session$sendCustomMessage("upload_status", "Checking for duplicate samples")
					sample_duplicates = duplicated(colnames(otu_table)[2:ncol(otu_table)])
					if (any(sample_duplicates)){
						session$sendCustomMessage("abort", paste("The following samples have multiple columns in the OTU table: ", paste(unique(colnames(otu_table)[sample_duplicates]), collapse = " "), sep=""))
						abort = TRUE
					}

					if (!abort){

						# Change zeros in reads matrix to NAs so we can remove them when melting
						otu_table[otu_table == 0] = NA

						session$sendCustomMessage("upload_status", "Normalizing OTU abundances")

						# Melt the read count table so we can merge with the normalization table and ko table
						melted_otu_table = melt(otu_table, id=colnames(otu_table)[1], na.rm=TRUE)

						# Merge the column of normalization factors
						otu_table_with_normalization = merge(melted_otu_table, normalization, by.x=c(colnames(otu_table)[1]), by.y=c(colnames(normalization)[1]), allow.cartesian=TRUE, sort=FALSE)
						rm(normalization)
						rm(melted_otu_table)
						
						session$sendCustomMessage("upload_status", "Preparing to run PICRUSt")

						# Get the PICRUSt ko table
						melted_ko_counts = fread(picrust_ko_file, sep="\t", header=TRUE, stringsAsFactors=FALSE)

						session$sendCustomMessage("upload_status", "Calculating function contributions")

						# Merge the column of ko counts
						reads_norms_kos = merge(otu_table_with_normalization, melted_ko_counts, by.x=c(colnames(otu_table_with_normalization)[1]), by.y=c(colnames(melted_ko_counts)[1]), allow.cartesian=TRUE, sort=FALSE)
						rm(melted_ko_counts)
						rm(otu_table_with_normalization)
						
						# Make a contribution column by multiplying the read counts with normalization factors with ko counts
						reads_norms_kos$contribution = reads_norms_kos[,3,with=FALSE] * reads_norms_kos[,6,with=FALSE] / reads_norms_kos[,4,with=FALSE]

						# Reorganize and reformate the table to standardize
						output = reads_norms_kos[,c(2, 1, 5, 7),with=FALSE]
						rm(reads_norms_kos)
					}
				}
			}

		} else if (input$input_type == "contributions"){ # If they've chosen the contribution table option

			otu_table_file = input$taxonomic_abundances_2
			contribution_file = input$function_contributions
			if (is.null(otu_table_file) | is.null(contribution_file)){
				session$sendCustomMessage("retry_upload", "retry")
			} else {

				otu_table_file_path = otu_table_file$datapath
				contribution_file_path = contribution_file$datapath
				if (!is.null(tracked_data$old_tax_abund_2_datapath)){
					if (tracked_data$old_tax_abund_2_datapath == otu_table_file_path){
						retry_upload = TRUE
					}
				}
				if (!is.null(tracked_data$old_contributions_datapath)){
					if (tracked_data$old_contributions_datapath == contribution_file_path){
						retry_upload = TRUE
					}
				}

				if (retry_upload){
					session$sendCustomMessage("retry_upload", "retry")
				} else {
					session$sendCustomMessage("upload_status", "Reading OTU table")
					tracked_data$old_tax_abund_2_datapath = otu_table_file_path
					otu_table = fread(otu_table_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)

					session$sendCustomMessage("upload_status", "Reading contribution table")
					tracked_data$old_contributions_datapath = contribution_file_path
					contribution = fread(contribution_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)

					# File checking
					session$sendCustomMessage("upload_status", "Verifying OTUs match between the OTU table and the contributions")
					otu_table_otus = unlist(otu_table[,1,with=F])
					contribution_otus = unlist(contribution[,3,with=F])
					extra_otu_table_otus = !(otu_table_otus %in% contribution_otus) # Maybe less stringent here, assume OTUs without listed contributions are just uncharacterized and we don't know what their contributions are?
					if (any(extra_otu_table_otus)){
						session$sendCustomMessage("abort", paste("The following OTUs in the OTU table do not have contributions in the contribution table: ", paste(unique(otu_table_otus[extra_otu_table_otus]), collapse = " "), sep=""))
						abort = TRUE
					}

					extra_contribution_otus = !(contribution_otus %in% otu_table_otus)
					if (any(extra_contribution_otus)){
						session$sendCustomMessage("abort", paste("The following OTUs have contributions but do not appear in the OTU table: ", paste(unique(contribution_otus[extra_contribution_otus]), collapse = " "), sep=""))
						abort = TRUE
					}

					session$sendCustomMessage("upload_status", "Verifying samples match between the OTU table and the contributions")
					otu_table_samples = colnames(otu_table)[2:ncol(otu_table)]
					contribution_samples = unlist(contribution[,2,with=F])
					extra_otu_table_samples = !(otu_table_samples %in% contribution_samples)
					if (any(extra_otu_table_samples)){
						session$sendCustomMessage("abort", paste("The following samples in the OTU table have no listed contributions: ", paste(unique(otu_table_samples[extra_otu_table_samples]), collapse = " "), sep=""))
						abort = TRUE
					}

					extra_contribution_samples = any(!(contribution_samples %in% otu_table_samples))
					if (extra_contribution_samples){
						session$sendCustomMessage("abort", paste("The following samples with contributions do not appear in the OTU table: ", paste(unique(contribution_samples[extra_contribution_samples]), collapse = " "), sep=""))
						abort = TRUE
					}

					session$sendCustomMessage("upload_status", "Checking for duplicate table rows")
					otu_table_duplicates = duplicated(otu_table_otus)
					if (any(otu_table_duplicates)){
						session$sendCustomMessage("abort", paste("The folloing OTUs have multiple rows in the OTU table: ", paste(unique(otu_table_otus[otu_table_duplicates]), collapse = " "), sep=""))
						abort = TRUE
					}

					session$sendCustomMessage("upload_status", "Checking for duplicate samples")
					sample_duplicates = duplicated(colnames(otu_table)[2:ncol(otu_table)])
					if (any(sample_duplicates)){
						session$sendCustomMessage("abort", paste("The following samples have multiple columns in the OTU table: ", paste(unique(colnames(otu_table)[sample_duplicates]), collapse = " "), sep=""))
						abort = TRUE
					}

					session$sendCustomMessage("upload_status", "Checking for duplicate contributions")
					contribution_duplicates = duplicated(contribution[,1:3,with=F])
					if (any(contribution_duplicates)){
						session$sendCustomMessage("abort", paste("The following contributions (sample-OTU-function) have multiple rows in the contribution table: ", paste(unique(paste(contribution[contribution_duplicates,2,with=F], contribution[contribution_duplicates,3,with=F], contribution[contribution_duplicates,1,with=F], sep="-")), collapse = " "), sep=""))
						abort = TRUE
					}

					if (!abort){
						output = contribution[,c(2,3,1,6),with=FALSE]
					}
				}
			}
		}

		if (!is.null(output) & !abort){ # If we have successfully generated a contribution table and there were no errors

			colnames(output) = c("Sample", "OTU", "Gene", "CountContributedByOTU")

			# If we have a table of function abundances for comparison, add that to the contribution table, tagging sample names as comparisons
			comparison_table_file = NULL
			if (input$input_type == "run_picrust" & !is.null(input$function_abundances_R)){
				comparison_table_file = input$function_abundances_R
			} else if (input$input_type == "contributions" & !is.null(input$function_abundances_C)){
				comparison_table_file = input$function_abundances_C
			} else if (input$input_type == "contributions" & !is.null(input$function_abundances_G)){
				comparison_table_file = input$function_abundances_G
			}

			if (!is.null(comparison_table_file)){
				comparison_table_file_path = comparison_table_file$datapath
				if (!is.null(tracked_data$old_function_abundances_datapath)){
					if (tracked_data$old_function_abundances_datapath == comparison_table_file_path){
						retry_upload = TRUE
					}
				}

				if (retry_upload){
					session$sendCustomMessage("retry_upload", "retry")
				} else {
					session$sendCustomMessage("upload_status", "Reading comparison KO table")
					tracked_data$old_function_abundances_datapath = comparison_table_file_path
					comparison_table = fread(comparison_table_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)

					# Add comparison tag to sample names
					colnames(comparison_table) = c(colnames(comparison_table)[1], paste(colnames(comparison_table)[2:ncol(comparison_table)], comparison_tag, sep=""))

					# Melt the comparison table, add a column with a dummy OTU, and rearrange to match the contribution table
					melted_comparison_table = melt(comparison_table, id=colnames(comparison_table)[1], na.rm=TRUE)
					melted_comparison_table$OTU = rep(unlinked_taxon_name, nrow(melted_comparison_table))
					melted_comparison_table = melted_comparison_table[,c(2,4,1,3),with=FALSE]
					colnames(melted_comparison_table) = c("Sample", "OTU", "Gene", "CountContributedByOTU")

					output = rbind(output, melted_comparison_table)
				}
			}

			################################# Assigning partial KO Contributions to subpathways #################################

			func_hierarchy = NULL
			custom_func_hierarchy_present = FALSE
			if (input$input_type == "run_picrust" & !is.null(input$function_hierarchy_R)){
				func_hierarchy_file = input$function_hierarchy_R
				custom_func_hierarchy_present = TRUE
			} else if (input$input_type == "contributions" & !is.null(input$function_hierarchy_C)){
				func_hierarchy_file = input$function_hierarchy_C
				custom_func_hierarchy_present = TRUE
			} else if (input$input_type == "annotations" & !is.null(input$function_hierarchy_G)){
				func_hierarchy_file = input$function_hierarchy_G
				custom_func_hierarchy_present = TRUE
			}
			
			if (custom_func_hierarchy_present){
				func_hierarchy_file_path = func_hierarchy_file$datapath
				if (!is.null(tracked_data$old_func_hierarchy_datapath)){
					if (tracked_data$old_func_hierarchy_datapath == func_hierarchy_file_path){
						retry_upload = TRUE
					}
				}

				if (retry_upload){
					session$sendCustomMessage("retry_upload", "retry")
				} else {
					session$sendCustomMessage("upload_status", "Loading function hierarchy")
					tracked_data$old_func_hierarchy_datapath = func_hierarchy_file_path
					func_hierarchy = fread(func_hierarchy_file_path, header=TRUE, sep="\t", stringsAsFactors=FALSE)
				}
			}

			if (is.null(func_hierarchy) | input$input_type == "example"){ # If there was no custom function hiearchy or they are looking at the example, read in the default
				func_hierarchy = fread(default_func_hierarchy_table, header=TRUE, sep="\t", stringsAsFactors=FALSE)
			}

			if (!retry_upload){

				# File checking
				session$sendCustomMessage("upload_status", "Verifying functions present in the abundance tables are in the provided function hierarchy")
				output_functions = unlist(output[,3,with=F])
				func_hierarchy_functions = unlist(func_hierarchy[,1,with=F])
				extra_output_functions = !(output_functions %in% func_hierarchy_functions)
				if (any(extra_output_functions)){
					session$sendCustomMessage("abort", paste("The following functions in the contributions are not present in the function hierarchy: ", paste(unique(output_functions[extra_output_functions]), collapse=" "), sep=""))
					abort = TRUE
				}

				session$sendCustomMessage("upload_status", "Checking for duplicate hierarchy levels")
				hierarchy_levels = colnames(func_hierarchy)
				duplicate_levels = duplicated(hierarchy_levels)
				if (any(duplicate_levels)){
					session$sendCustomMessage("abort", paste("The following names are used for multiple levels in the function hierarchy: ", paste(unique(hierarchy_levels[duplicate_levels]), collapse = " "), sep=""))
					abort = TRUE
				}
			}

			taxa_hierarchy = NULL
			custom_taxa_hierarchy_present = FALSE
			if (input$input_type == "run_picrust" & !is.null(input$taxonomic_hierarchy_R)){
				taxa_hierarchy_file = input$taxonomic_hierarchy_R
				custom_taxa_hierarchy_present = TRUE
			} else if (input$input_type == "contributions" & !is.null(input$taxonomic_hierarchy_C)){
				taxa_hierarchy_file = input$taxonomic_hierarchy_C
				custom_taxa_hierarchy_present = TRUE
			} else if (input$input_type == "annotations" & !is.null(input$taxonomic_hierarchy_G)){
				taxa_hierarchy_file = input$taxonomic_hierarchy_G
				custom_taxa_hierarchy_present = TRUE
			}
			
			if (custom_taxa_hierarchy_present){
				taxa_hierarchy_file_path = taxa_hierarchy_file$datapath
				if (!is.null(tracked_data$old_tax_hierarchy_datapath)){
					if (tracked_data$old_tax_hierarchy_datapath == taxa_hierarchy_file_path){
						retry_upload = TRUE
					}
				}

				if (retry_upload){
					session$sendCustomMessage("retry_upload", "retry")
				} else {
					session$sendCustomMessage("upload_status", "Loading taxonomic hierarchy")
					tracked_data$old_tax_hierarchy_datapath = taxa_hierarchy_file_path
					taxa_hierarchy = fread(taxa_hierarchy_file_path, sep = "\t", header=T, stringsAsFactors = F)
				}
			}

			if (is.null(taxa_hierarchy) | input$input_type == "example"){ # If there was no custom taxonomic hiearchy or they are looking at the example, read in the default
				taxa_hierarchy = fread(default_tax_hierarchy_table, sep = "\t", header=T, stringsAsFactors = F)
			}
			
			if (!retry_upload){
				# File checking
				session$sendCustomMessage("upload_status", "Verifying OTUs present in the abundance tables are in the provided taxonomic hierarchy")
				output_otus = unlist(output[,2,with=F])
				tax_hierarchy_otus = unlist(taxa_hierarchy[,1,with=F])
				extra_output_otus = !(output_otus %in% tax_hierarchy_otus)
				if (any(extra_output_otus)){
					session$sendCustomMessage("abort", paste("The following OTUs in the contributions are not present in the taxonomic hierarchy: ", paste(unique(output_otus[extra_output_otus]), collapse = " "), sep=""))
					abort = TRUE
				}

				otu_table_otus = unlist(otu_table[,1,with=F])
				tax_hierarchy_otus = unlist(taxa_hierarchy[,1,with=F])
				extra_otu_table_otus = !(otu_table_otus %in% tax_hierarchy_otus)
				if (any(extra_otu_table_otus)){
					session$sendCustomMessage("abort", paste("The following OTUs in the OTU table are not present in the taxonomic hierarchy: ", paste(unique(otu_table_otus[extra_otu_table_otus]), collapse = " "), sep=""))
					abort = TRUE
				}

				session$sendCustomMessage("upload_status", "Checking for duplicate hierarchy levels")
				hierarchy_levels = colnames(taxa_hierarchy)
				duplicate_levels = duplicated(hierarchy_levels)
				if (any(duplicate_levels)){
					session$sendCustomMessage("abort", paste("The following names are used for multiple levels in the taxonomic hierarchy: ", paste(unique(hierarchy_levels[duplicate_levels]), collapse = " "), sep=""))
					abort = TRUE
				}
			}

			################################# Reading sample group mapping table for sample sorting later #################################

			sample_map = NULL

			custom_sample_map_present = FALSE
			if (input$input_type == "run_picrust" & !is.null(input$sample_map_R)){
				sample_map_file = input$sample_map_R
				custom_sample_map_present = TRUE
			} else if (input$input_type == "contributions" & !is.null(input$sample_map_C)){
				sample_map_file = input$sample_map_C
				custom_sample_map_present = TRUE
			} else if (input$input_type == "annotations" & !is.null(input$sample_map_G)){
				sample_map_file = input$sample_map_G
				custom_sample_map_present = TRUE
			}

			if (custom_sample_map_present){
				sample_map_file_path = sample_map_file$datapath
				if (!is.null(tracked_data$old_samp_map_datapath)){
					if (tracked_data$old_samp_map_datapath == sample_map_file_path){
						retry_upload = TRUE
					}
				}

				if (retry_upload){
					session$sendCustomMessage("retry_upload", "retry")
				} else {
					session$sendCustomMessage("upload_status", "Reading sample metadta")
					tracked_data$old_samp_map_datapath = sample_map_file_path
					sample_map = fread(sample_map_file_path, sep="\t", header=T, stringsAsFactors = F)
				}
			}

			if (input$input_type == "example") { # If they're looking at the example, we load the default sample map
				sample_map = fread(default_sample_map_table, sep="\t", header=T, stringsAsFactors = F)
			}

			if (!retry_upload & custom_sample_map_present){
				# File checking
				session$sendCustomMessage("upload_status", "Verifying samples in the abundance tables are present in the sample metadata")
				output_samples = unlist(output[,1,with=F])
				metadata_samples = unlist(sample_map[,1,with=F])
				extra_output_samples = !(output_samples %in% metadata_samples)
				if (any(extra_output_samples)){
					session$sendCustomMessage("abort", paste("The following samples do not have metadata: ", paste(unique(output_samples[extra_output_samples]), collapse = " "), sep=""))
					abort = TRUE
				}

				session$sendCustomMessage("upload_status", "Checking for duplicate metadata factors")
				metadata_factors = colnames(sample_map)
				duplicate_factors = duplicated(metadata_factors)
				if (any(duplicate_factors)){
					session$sendCustomMessage("abort", paste("The following names are used for multiple metadata factors: ", paste(unique(metadata_factors[duplicate_factors]), collapse = " "), sep=""))
					abort = TRUE
				}

			}

			if (!abort & !retry_upload){

				session$sendCustomMessage("upload_status", "Summarizing function abundances to selected level")

				if (ncol(func_hierarchy) > 1 & which(colnames(func_hierarchy) == func_summary_level) != 1){

					# Get a table matching KOs to the selected summary levels they belong to
					level_match_table = data.table(func_hierarchy[,c(1,which(colnames(func_hierarchy) == func_summary_level)), with=FALSE])

					# For each row in the contribution table, copy the row for every selected summary level the KO for the row belongs to and label the rows accordingly
					expanded_table = merge(output, level_match_table, by.x=c(colnames(output)[3]), by.y=c(colnames(level_match_table)[1]), all.y=FALSE, allow.cartesian=TRUE)

					# Append a column including the normalization factor for each row based on the KO
					expanded_table = merge(expanded_table, ko_normalization_table(), by.x=c(colnames(expanded_table)[1]), by.y=c(colnames(ko_normalization_table())[1]), all.y=FALSE, allow.cartesian=TRUE)

					# Create a column for the normalized contributions of each row
					expanded_table$normalized_contributions = expanded_table[,4,with=FALSE] / expanded_table[,6,with=FALSE]

					# Sum normalized contributions for rows that match in Sample, KO, and selected summary level
					output = expanded_table[,sum(normalized_contributions), by=eval(colnames(expanded_table)[c(2,3,5)])]

				} else {
					colnames(output)[which(colnames(output) == "Gene")] = func_summary_level
					colnames(output)[which(colnames(output) == "CountContributedByOTU")] = "V1"
				}

				# Convert counts to relative abundances
				output[,relative_contributions := V1/sum(V1), by=Sample]

				################################# Formatting and returning the function hierarchy #################################

				session$sendCustomMessage("upload_status", "Formatting the function hierarchy")

				if (ncol(func_hierarchy) > 1 & which(colnames(func_hierarchy) == func_summary_level) != 1){
					func_hierarchy = func_hierarchy[,2:(which(colnames(func_hierarchy) == func_summary_level)),with=F]
				} else if (ncol(func_hierarchy) > 1){
					func_hierarchy = func_hierarchy[,c(2:ncol(func_hierarchy), 1),with=F]
				}

				# Remove rows that correspond to selected summary levels not in the contribution table data
				func_hierarchy = func_hierarchy[unlist(func_hierarchy[,colnames(func_hierarchy) == func_summary_level,with=F]) %in% unique(unlist(output[,colnames(output) == func_summary_level, with=F]))]

				# Remove duplicate rows
				func_hierarchy = unique(func_hierarchy)
				id_levels = names(func_hierarchy)
				for(j in 1:length(id_levels)){
					func_hierarchy[[id_levels[j]]] = paste(id_levels[j],as.character(func_hierarchy[[id_levels[j]]]), sep = "_")
				}
				unique_func_hierarchy = func_hierarchy

				# Creating the javascript version of the function hierarchy
		        func_hierarchy = func_hierarchy[,lapply(.SD,as.character)]

		        # Create the base set of objects which are structured differently from the internal nodes. The leaves contain all information for each parent node of the leaf
		        base_objects = lapply(1:dim(func_hierarchy)[1], function(row){
		        	l = list("Ndescendents" = 0, "type" = "function")
		        	for (depth in 1:dim(func_hierarchy)[2]){
		        		l[colnames(func_hierarchy)[depth]] = func_hierarchy[row,depth,with=F]
		        	}
		        	return(list("key" = paste(l[func_summary_level]), "level"=0, "values" = list(l)))
		        })

		        base_objects = base_objects[order(unlist(lapply(base_objects, function(obj){return(obj["key"])})))]
		        # Iteratively generate the next layer up in the tree, grouping the previous level of nodes by their parent
		        output_func_hierarchy = base_objects
		        if (dim(func_hierarchy)[2] > 1){
			        for (depth in (dim(func_hierarchy)[2] - 1):1){

			        	# Get the label for the depth of the tree we're creating a layer for
			        	depth_name = colnames(func_hierarchy)[depth][[1]]

			        	# Get the labels for the nodes in the previous layer
			        	vals = sapply(base_objects, function(obj){return(obj[["key"]])})

			        	# Get the mapping between parent nodes in the new layer and children nodes in the previous layer
			        	next_levels = sapply(vals, function(curr_level){
			        		prev_depth = depth + 1
			        		setkeyv(func_hierarchy, colnames(func_hierarchy)[prev_depth])
			        		return(unique(func_hierarchy[curr_level,depth,with=F][[1]]))
			        	})

			        	# Create a new node for each parent node of the previous layer
			        	output_func_hierarchy = lapply(levels(factor(next_levels)), function(level){
			        		return(list("key" = level, "level" = dim(func_hierarchy)[2] - depth, "values" = base_objects[which(next_levels == level)]))
			        	})

			        	# Set the base objects list to the current state of the tree so we can group the current top layer in the next iteration
			        	base_objects = output_func_hierarchy
			        }
			    }

				session$sendCustomMessage(type='function_hierarchy', output_func_hierarchy)
				
				################################# Formatting and returning the function averages #################################

				session$sendCustomMessage("upload_status", "Calculating average function abundances")
				otu_matched_samples = grep(paste(".*", comparison_tag, "$", sep=""), output$Sample, invert=TRUE)
				#Make sure to exclude average contributions
				otu_matched_samples = otu_matched_samples[otu_matched_samples != average_contrib_sample_name] 
				#sum over taxa
				count_name = names(output)[!names(output) %in% c("Sample", "OTU", func_summary_level)]
				total_funcs = output[otu_matched_samples,lapply(.SD, sum), by=c(func_summary_level, "Sample"), .SDcols=count_name] #whatever the count name is
				total_funcs[,(func_summary_level):=paste(func_summary_level,unlist(total_funcs[,colnames(total_funcs) == func_summary_level,with=F]),sep="_")]
				total_funcs[,V1:=V1/sum(V1),by=Sample] #Switch to relative abundance from read counts
				#combine with func_hierarchy
				total_funcs = merge(total_funcs, unique_func_hierarchy, by=func_summary_level)
				#get average for every level of functions
				func_means = data.table()
				for(j in 1:ncol(unique_func_hierarchy)){
					total_funcs_sum = total_funcs[,sum(V1), by=c("Sample", names(unique_func_hierarchy)[j])] #sum over this category, will not change SubPathway
					func_means_lev =  total_funcs_sum[, mean(V1), by=eval(names(unique_func_hierarchy)[j])]
					setnames(func_means_lev, c("Function", "Mean"))
					if(ncol(func_means_lev)==2) func_means = rbind(func_means, func_means_lev)
				}
				output3 = func_means

				session$sendCustomMessage(type="func_averages",paste(paste(colnames(output3), collapse="\t"), paste(sapply(1:nrow (output3), function(row){return(paste(output3[row,], collapse="\t"))}), collapse="\n"), sep="\n"))

				################################# Summarizing the contribution table to the desired taxonomic level #################################
				# Read in the taxonomic hierachy and format it

				session$sendCustomMessage("upload_status", "Summarizing contribution table to desired taxonomic level")
			    
		        # Filter OTUs not in contribution table
		        taxa_hierarchy = taxa_hierarchy[taxa_hierarchy[,1,with=F][[1]] %in% unique(output[,OTU])]
		        taxa_hierarchy = unique(taxa_hierarchy)
		        taxa_hierarchy = taxa_hierarchy[,lapply(.SD,as.character)]

		        if (ncol(taxa_hierarchy) > 1){
			        taxa_hierarchy[,(colnames(taxa_hierarchy)[2:dim(taxa_hierarchy)[2]]):=lapply(.SD, function(col){
			        	return(gsub("^$", "unknown", gsub("^.__", "", gsub(";$", "", col))))
			        }), .SDcols=2:dim(taxa_hierarchy)[2]]
					taxa_hierarchy[,(colnames(taxa_hierarchy)[2:dim(taxa_hierarchy)[2]]):=lapply(2:dim(taxa_hierarchy)[2], function(col){
						sapply(1:dim(taxa_hierarchy)[1], function(row){
							return(paste(taxa_hierarchy[row,2:col,with=F], collapse="_"))
						})
					})]
				}

		        output[,OTU:=as.character(OTU)]
		        level_match_taxa_hierarchy = NULL
		        if (which(colnames(taxa_hierarchy) == tax_summary_level) != 1){
			        # Summarize contribution table to the correct taxonomic level
			        level_match_taxa_hierarchy = taxa_hierarchy[,c(1,which(colnames(taxa_hierarchy) == tax_summary_level)),with=F]
			        colnames(level_match_taxa_hierarchy) = c(colnames(level_match_taxa_hierarchy)[1], "new_summary_level")

			        expanded_table = merge(output, level_match_taxa_hierarchy, by.x = c(colnames(output)[2]), by.y=c(colnames(level_match_taxa_hierarchy)[1]), all.x = T, all.y=F, allow.cartesian=T)
			        expanded_table[,new_summary_level:=sapply(unlist(expanded_table[,ncol(expanded_table),with=F]), function(entry){if (is.na(entry)){return(unlinked_taxon_name)}else{return(entry)}})]
			        output = expanded_table[,sum(relative_contributions), by=eval(colnames(expanded_table)[c(which(colnames(expanded_table) == "Sample"),which(colnames(expanded_table) == "new_summary_level"),which(colnames(expanded_table) == func_summary_level))])]
			    }
			    else {
			    	output = output[,sum(relative_contributions), by=eval(colnames(output)[c(which(colnames(output) == "Sample"),which(colnames(output) == "OTU"),which(colnames(output) == func_summary_level))])]
			    }
		        colnames(output) = c("Sample", "OTU", "SubPathway", "relative_contributions")

		        ################################# Summarizing the OTU table to the desired taxonomic level #################################

		        session$sendCustomMessage("upload_status", "Summarizing OTU table to desired taxonomic level")
		        otu_table[is.na(otu_table)] = 0
		        colnames(otu_table)[1] = "OTU"
		        otu_table[,OTU:=as.character(OTU)]
		        otu_table_objects = NULL

		        if (which(colnames(taxa_hierarchy) == tax_summary_level) != 1){
			        expanded_table = merge(otu_table, level_match_taxa_hierarchy, by.x = c(colnames(otu_table)[1]), by.y = c(colnames(level_match_taxa_hierarchy)[1]), all.y=F, allow.cartesian=T)
			        summarized_otu_table = expanded_table[,lapply(.SD[,2:dim(.SD)[2],with=F], sum), by=new_summary_level]

			        summarized_otu_table_col_names = colnames(summarized_otu_table)
			        summarized_otu_table[,(colnames(summarized_otu_table)[2:dim(summarized_otu_table)[2]]):=lapply(.SD, function(col){
			        	return(col/sum(col))
			        }), .SDcols=2:dim(summarized_otu_table)[2]]
			        colnames(summarized_otu_table) = summarized_otu_table_col_names
			        setkeyv(summarized_otu_table, colnames(summarized_otu_table)[1])
			        otu_table_objects = lapply(2:dim(summarized_otu_table)[2], function(col){
			        	l = setNames(split(unname(unlist(summarized_otu_table[,col,with=F])), seq(nrow(summarized_otu_table[,col,with=F]))), paste(tax_summary_level, unlist(summarized_otu_table[,1,with=F]), sep="_"))
			        	l["Sample"] = colnames(summarized_otu_table)[col]
			        	return(l)
			        })
				} else {
					otu_table[,(colnames(otu_table)[2:dim(otu_table)[2]]):=lapply(.SD, function(col){
			        	return(col/sum(col))
			        }), .SDcols=2:dim(otu_table)[2]]
					otu_table_objects = lapply(2:dim(otu_table)[2], function(col){
			        	l = setNames(split(unname(unlist(otu_table[,col,with=F])), seq(nrow(otu_table[,col,with=F]))), paste(tax_summary_level, unlist(otu_table[,1,with=F]), sep="_"))
			        	l["Sample"] = colnames(otu_table)[col]
			        	return(l)
			        })
				}

		        ################################# Organizing OTU table samples if grouping is chosen #################################

		        if(!is.null(samp_grouping)){ # If they've chosen a metadata factor to group by
		        	samples = sapply(otu_table_objects, function(obj){return(obj["Sample"])})
		        	setkeyv(sample_map, c(samp_grouping, colnames(sample_map)[1]))
		        	sample_order = sapply(unlist(sample_map[,1,with=F]), function(sample_name){
		        		return(which(unlist(samples) == sample_name))
		        	})
		        	otu_table_objects = otu_table_objects[sample_order]
		        }
		        tracked_data$otu_table = otu_table_objects

		        # Tell the browser we're ready to start sending otu table data
				session$sendCustomMessage(type="otu_table_ready", length(otu_table_objects))

		        id_levels = names(taxa_hierarchy)

				for(j in 1:length(id_levels)){
					taxa_hierarchy[[id_levels[j]]] = paste(id_levels[j],as.character(taxa_hierarchy[[id_levels[j]]]), sep = "_")
				}

		        output[,OTU:=sapply(unlist(output[,OTU]), function(otu){if (as.character(otu) != unlinked_taxon_name){return(paste(tax_summary_level,as.character(otu), sep = "_"))}else{return(unlinked_taxon_name)}})]

		        ################################# Formatting and returning the taxonomic hierarchy #################################

		        session$sendCustomMessage("upload_status", "Formatting the taxonomic hierarchy")

		        summarized_taxa_hierarchy = NULL
		        if (ncol(taxa_hierarchy) > 1 & which(colnames(taxa_hierarchy) == tax_summary_level) != 1){
			        summarized_taxa_hierarchy = taxa_hierarchy[,c(2:dim(taxa_hierarchy)[2], 1),with=F]
			        cutoff = which(colnames(summarized_taxa_hierarchy) == tax_summary_level)
		    	    summarized_taxa_hierarchy = summarized_taxa_hierarchy[,1:cutoff,with=F]
		        	summarized_taxa_hierarchy = unique(summarized_taxa_hierarchy)
		        } else if (ncol(taxa_hierarchy) > 1){
		        	summarized_taxa_hierarchy = taxa_hierarchy[,c(2:ncol(taxa_hierarchy), 1),with=F]
		        } else {
		        	summarized_taxa_hierarchy = taxa_hierarchy
		        }

		        # Create the base set of objects which are structured differently from the internal nodes. The leaves contain all information for each parent node of the leaf
		        base_objects = lapply(1:dim(summarized_taxa_hierarchy)[1], function(row){
		        	l = list("Ndescendents" = 0, "type" = "taxa")
		        	for (depth in 1:dim(summarized_taxa_hierarchy)[2]){
		        		l[colnames(summarized_taxa_hierarchy)[depth]] = summarized_taxa_hierarchy[row,depth,with=F]
		        	}
		        	return(list("key" = paste(l[colnames(summarized_taxa_hierarchy)[dim(summarized_taxa_hierarchy)[2]]]), "level"=0, "values" = list(l)))
		        })

		        # Iteratively generate the next layer up in the tree, grouping the previous level of nodes by their parent
		        output_taxa_hierarchy = base_objects
		        if (ncol(summarized_taxa_hierarchy) > 1){
			        for (depth in (dim(summarized_taxa_hierarchy)[2] - 1):1){

			        	# Get the label for the depth of the tree we're creating a layer for
			        	depth_name = colnames(summarized_taxa_hierarchy)[depth][[1]]

			        	# Get the labels for the nodes in the previous layer
			        	vals = sapply(base_objects, function(obj){return(obj[["key"]])})

			        	# Get the mapping between parent nodes in the new layer and children nodes in the previous layer
			        	next_levels = sapply(vals, function(curr_level){
		        			prev_depth = depth + 1
			        		setkeyv(summarized_taxa_hierarchy, colnames(summarized_taxa_hierarchy)[prev_depth])
			        		return(unique(summarized_taxa_hierarchy[curr_level,depth,with=F][[1]]))
			        	})

			        	# Create a new node for each parent node of the previous layer
			        	output_taxa_hierarchy = lapply(levels(factor(next_levels)), function(level){
			        		return(list("key" = level, "level" = dim(summarized_taxa_hierarchy)[2] - depth + 1, "values" = base_objects[which(next_levels == level)]))
			        	})

			        	# Set the base objects list to the current state of the tree so we can group the current top layer in the next iteration
			        	base_objects = output_taxa_hierarchy
			        }
			    }

				session$sendCustomMessage(type='tax_hierarchy', output_taxa_hierarchy)

			    ################################# Formatting and returning the contribution table #################################

			    session$sendCustomMessage("upload_status", "Formatting the contribution table")

				# Format the contribution table to match the expected javascript array
				# Reshape so there's a column for every SubPathway, rows correspond to unique Sample + OTU pairings

				output[,SubPathway:=paste(func_summary_level,SubPathway,sep="_")]
				
				##add a sample called average_contrib_sample_name to the contribution table, include 0s for missing OTU/Pathway combos
				foo = melt(dcast(output, Sample + OTU ~ SubPathway, value.var = "relative_contributions", fun.aggregate=sum), id.vars = c("Sample", "OTU"), variable.name = "SubPathway", value.name = "value")
				num_samps = output[,length(unique(Sample))]			
				averages = foo[,sum(value)/num_samps, by=list(OTU, SubPathway)]

				averages[,Sample:=average_contrib_sample_name]
				setnames(averages, "V1", "relative_contributions")
				output = rbind(output, averages[,list(Sample, OTU, SubPathway, relative_contributions)])
				
				output = dcast(output, Sample + OTU ~ SubPathway, value.var="relative_contributions")
				# Create a single column for SubPathways that contains a list of the SubPathways for that row's Sample and OTU, remove empty elements from those lists
				output = data.table(Sample = output$Sample, OTU = output$OTU, SubPathways = apply(output[,3:dim(output)[2], with=FALSE], 1, function(row){return(as.list(row[!is.na(row)]))}))

				# Reshape so there's a column for every OTU, rows correspond to Samples
				output = dcast(output, Sample ~ OTU, value.var=colnames(output)[3])

				# Create a single column for OTUs that contains a list of OTUs in the corresponding row's Sample, and each element in that list is a list of the SubPathway contributions that OTU makes in that Sample
				output = data.table(Sample = output$Sample, OTUs = apply(output[,2:dim(output)[2], with=FALSE], 1, function(row){return(as.list(row[sapply(row, function(el){!is.null(el[[1]])})]))}))

				# Reshape so there's a column for every Sample
				output = dcast(output, . ~ Sample, value.var="OTUs")
				output = output[,2:dim(output)[2],with=FALSE]

				# Format so that the top level Sample lists are nested properly
				output = lapply(output, function(el){return(el[[1]])})
				
				otu_sample_order = c()
				func_sample_order = c()
				samples = names(output)
				if(!is.null(samp_grouping)){ # If they've chosen a metadata factor to group by
		        	setkeyv(sample_map, c(samp_grouping, colnames(sample_map)[1]))
		        }
	        	otu_sample_order = unlist(sapply(unlist(sample_map[,1,with=F]), function(sample_name){
	        		if (sample_name != average_contrib_sample_name){
		        		return(which(unlist(samples) == sample_name))
		        	}
	        	}))
	        	func_sample_order = unlist(sapply(unlist(sample_map[,1,with=F]), function(sample_name){
	        		if (sample_name != average_contrib_sample_name){
	        			if (!is.null(input$function_abundances)){
	        				return(c(which(unlist(samples) == sample_name), which(unlist(samples) == paste(sample_name, comparison_tag, sep=""))))
	       				} else {
	       					return(which(unlist(samples) == sample_name))
		        		}
		        	}
	        	}))
	        	otu_sample_order = c(otu_sample_order, which(!(samples %in% unlist(sample_map[,1,with=F])) & samples != average_contrib_sample_name & !grepl(comparison_tag, samples)))
	        	func_sample_order = c(func_sample_order, unlist(sapply(samples[which(!(samples %in% unlist(sample_map[,1,with=F])) & !grepl(comparison_tag, samples))], function(sample_name){
	        		if (sample_name != average_contrib_sample_name){
	        			if (!is.null(input$function_abundances)){
	        				return(c(which(unlist(samples) == sample_name), which(unlist(samples) == paste(sample_name, comparison_tag, sep=""))))
	        			} else {
	        				return(which(unlist(samples) == sample_name))
	        			}
	        		}
	        	})))
		        session$sendCustomMessage("otu_sample_order", names(output)[otu_sample_order])
		        session$sendCustomMessage("func_sample_order", names(output)[func_sample_order])

				tracked_data$contribution_table = output

				session$sendCustomMessage("number_of_samples_message", length(output))
				

				session$sendCustomMessage(type="contribution_table_ready", length(output))
			}
		}

	})

	# Listen for requests for contribution sample data from the browser
	observe({
		if (!is.null(input$contribution_sample_request)){
			contribution_sample = input$contribution_sample_request
			if (contribution_sample != tracked_data$previous_contribution_sample){
				tracked_data$previous_contribution_sample = contribution_sample
				if (contribution_sample >= 0 & contribution_sample < length(tracked_data$contribution_table)){
					session$sendCustomMessage(type="contribution_sample_return", tracked_data$contribution_table[contribution_sample + 1])
				}
			}
		}
	})

	# Listen for requests for otu sample data from the browser
	observe({
		if (!is.null(input$otu_sample_request)){
			otu_sample = input$otu_sample_request
			if (otu_sample != tracked_data$previous_otu_sample){
				tracked_data$previous_otu_sample = otu_sample
				if (otu_sample >= 0 & otu_sample < length(tracked_data$otu_table)){
					session$sendCustomMessage(type="otu_sample_return", tracked_data$otu_table[otu_sample + 1])
				}
			}
		}
	})

	# Return optional table labels when they are loaded
	observe({
		if (!is.null(input$taxonomic_hierarchy_R)){
			taxa_hierarchy_file = input$taxonomic_hierarchy_R
			taxa_hierarchy_file_path = taxa_hierarchy_file$datapath
			taxa_hierarchy = fread(taxa_hierarchy_file_path, sep = "\t", header=T, stringsAsFactors = F)
			if (ncol(taxa_hierarchy) > 1){
				session$sendCustomMessage("tax_hierarchy_labels", colnames(taxa_hierarchy)[c(2:ncol(taxa_hierarchy), 1)])
			} else {
				session$sendCustomMessage("tax_hierarchy_labels", list(colnames(taxa_hierarchy)))
			}
			if ("Genus" %in% colnames(taxa_hierarchy)){
				tracked_data$tax_summary_level = "Genus"
			} else {
				tracked_data$tax_summary_level = colnames(taxa_hierarchy)[ncol(taxa_hierarchy)]
			}
		} else {
			taxa_hierarchy = fread(default_tax_hierarchy_table, sep = "\t", header=T, stringsAsFactors = F)
			session$sendCustomMessage("tax_hierarchy_labels", colnames(taxa_hierarchy)[c(2:ncol(taxa_hierarchy), 1)])
		}
	})

	observe({
		if (!is.null(input$taxonomic_hierarchy_C)){
			taxa_hierarchy_file = input$taxonomic_hierarchy_C
			taxa_hierarchy_file_path = taxa_hierarchy_file$datapath
			taxa_hierarchy = fread(taxa_hierarchy_file_path, sep = "\t", header=T, stringsAsFactors = F)
			if (ncol(taxa_hierarchy) > 1){
				session$sendCustomMessage("tax_hierarchy_labels", colnames(taxa_hierarchy)[c(2:ncol(taxa_hierarchy), 1)])
			} else {
				session$sendCustomMessage("tax_hierarchy_labels", list(colnames(taxa_hierarchy)))
			}
			if ("Genus" %in% colnames(taxa_hierarchy)){
				tracked_data$tax_summary_level = "Genus"
			} else {
				tracked_data$tax_summary_level = colnames(taxa_hierarchy)[ncol(taxa_hierarchy)]
			}
		} else {
			taxa_hierarchy = fread(default_tax_hierarchy_table, sep = "\t", header=T, stringsAsFactors = F)
			session$sendCustomMessage("tax_hierarchy_labels", colnames(taxa_hierarchy)[c(2:ncol(taxa_hierarchy), 1)])
		}
	})

	observe({
		if (!is.null(input$taxonomic_hierarchy_G)){
			taxa_hierarchy_file = input$taxonomic_hierarchy_G
			taxa_hierarchy_file_path = taxa_hierarchy_file$datapath
			taxa_hierarchy = fread(taxa_hierarchy_file_path, sep = "\t", header=T, stringsAsFactors = F)
			if (ncol(taxa_hierarchy) > 1){
				session$sendCustomMessage("tax_hierarchy_labels", colnames(taxa_hierarchy)[c(2:ncol(taxa_hierarchy), 1)])
			} else {
				session$sendCustomMessage("tax_hierarchy_labels", list(colnames(taxa_hierarchy)))
			}
			if ("Genus" %in% colnames(taxa_hierarchy)){
				tracked_data$tax_summary_level = "Genus"
			} else {
				tracked_data$tax_summary_level = colnames(taxa_hierarchy)[ncol(taxa_hierarchy)]
			}
		} else {
			taxa_hierarchy = fread(default_tax_hierarchy_table, sep = "\t", header=T, stringsAsFactors = F)
			session$sendCustomMessage("tax_hierarchy_labels", colnames(taxa_hierarchy)[c(2:ncol(taxa_hierarchy), 1)])
		}
	})

	observe({
		if (!is.null(input$function_hierarchy_R)){
			func_hierarchy_file = input$function_hierarchy_R
			func_hierarchy_file_path = func_hierarchy_file$datapath
			func_hierarchy = fread(func_hierarchy_file_path, sep = "\t", header=T, stringsAsFactors = F)
			if (ncol(func_hierarchy) > 1){
				session$sendCustomMessage("func_hierarchy_labels", colnames(func_hierarchy)[c(2:ncol(func_hierarchy), 1)])
			} else {
				session$sendCustomMessage("func_hierarchy_labels", list(colnames(func_hierarchy)))
			}
			if ("SubPathway" %in% colnames(func_hierarchy)){
				tracked_data$func_summary_level = "SubPathway"
			} else {
				tracked_data$func_summary_level = colnames(func_hierarchy)[ncol(func_hierarchy)]
			}
		} else {
			func_hierarchy = fread(default_func_hierarchy_table, sep = "\t", header=T, stringsAsFactors = F)
			session$sendCustomMessage("func_hierarchy_labels", colnames(func_hierarchy)[2:ncol(func_hierarchy)])
		}
	})

	observe({
		if (!is.null(input$function_hierarchy_C)){
			func_hierarchy_file = input$function_hierarchy_C
			func_hierarchy_file_path = func_hierarchy_file$datapath
			func_hierarchy = fread(func_hierarchy_file_path, sep = "\t", header=T, stringsAsFactors = F)
			if (ncol(func_hierarchy) > 1){
				session$sendCustomMessage("func_hierarchy_labels", colnames(func_hierarchy)[c(2:ncol(func_hierarchy), 1)])
			} else {
				session$sendCustomMessage("func_hierarchy_labels", list(colnames(func_hierarchy)))
			}
			if ("SubPathway" %in% colnames(func_hierarchy)){
				tracked_data$func_summary_level = "SubPathway"
			} else {
				tracked_data$func_summary_level = colnames(func_hierarchy)[ncol(func_hierarchy)]
			}
		} else {
			func_hierarchy = fread(default_func_hierarchy_table, sep = "\t", header=T, stringsAsFactors = F)
			session$sendCustomMessage("func_hierarchy_labels", colnames(func_hierarchy)[2:ncol(func_hierarchy)])
		}
	})

	observe({
		if (!is.null(input$function_hierarchy_G)){
			func_hierarchy_file = input$function_hierarchy_G
			func_hierarchy_file_path = func_hierarchy_file$datapath
			func_hierarchy = fread(func_hierarchy_file_path, sep = "\t", header=T, stringsAsFactors = F)
			if (ncol(func_hierarchy) > 1){
				session$sendCustomMessage("func_hierarchy_labels", colnames(func_hierarchy)[c(2:ncol(func_hierarchy), 1)])
			} else {
				session$sendCustomMessage("func_hierarchy_labels", list(colnames(func_hierarchy)))
			}
			if ("SubPathway" %in% colnames(func_hierarchy)){
				tracked_data$func_summary_level = "SubPathway"
			} else {
				tracked_data$func_summary_level = colnames(func_hierarchy)[ncol(func_hierarchy)]
			}
		} else {
			func_hierarchy = fread(default_func_hierarchy_table, sep = "\t", header=T, stringsAsFactors = F)
			session$sendCustomMessage("func_hierarchy_labels", colnames(func_hierarchy)[2:ncol(func_hierarchy)])
		}
	})

	observe({
		if (!is.null(input$sample_map_R)){
			sample_map_file = input$sample_map_R
			sample_map_file_path = sample_map_file$datapath
			sample_map = fread(sample_map_file_path, sep = "\t", header=T, stringsAsFactors = F)
			session$sendCustomMessage("sample_map_labels", colnames(sample_map)[2:ncol(sample_map)])
		}
	})

	observe({
		if (!is.null(input$sample_map_C)){
			sample_map_file = input$sample_map_C
			sample_map_file_path = sample_map_file$datapath
			sample_map = fread(sample_map_file_path, sep = "\t", header=T, stringsAsFactors = F)
			session$sendCustomMessage("sample_map_labels", colnames(sample_map)[2:ncol(sample_map)])
		}
	})

	observe({
		if (!is.null(input$sample_map_G)){
			sample_map_file = input$sample_map_G
			sample_map_file_path = sample_map_file$datapath
			sample_map = fread(sample_map_file_path, sep = "\t", header=T, stringsAsFactors = F)
			session$sendCustomMessage("sample_map_labels", colnames(sample_map)[2:ncol(sample_map)])
		}
	})
})
