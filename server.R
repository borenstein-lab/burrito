# R server code interacting with the main webpage

library(shiny)
library(data.table)

# Defining important files
default_tax_hierarchy_table = "www/Data/97_otu_taxonomy_split_with_header.txt"
default_func_hierarchy_table = "www/Data/classes_parsed2.tsv"
default_contribution_table = "www/Data/mice_metagenome_contributions.txt"
default_otu_table = "www/Data/otu_table_even_2.txt"
picrust_normalization_file = "www/Data/16S_13_5_precalculated.tab.gz"
picrust_ko_file = "www/Data/melted_picrust_ko_table.txt"
constants_file = "www/Javascript/constants.js"

# Defining constants shared between javascript and R code
constants_table = fread(constants_file, header=F)
unlinked_taxon_name = unlist(constants_table[unlist(constants_table[,2,with=F]) == "unlinked_taxon_name",4,with=F])
options(shiny.maxRequestSize = as.numeric(unlist(constants_table[unlist(constants_table[,2,with=F]) == "max_upload_size",4,with=F])))
options(stringsAsFactors = F)

# Column of the level we summarize to for the function hierarchy when we calculate partial KO contributions
summary_level_index = 4

# Actual Shiny server code
shinyServer(function(input, output, session) {

    # Variables that the server keeps track of but doesn't need to run functions to calculate
    tracked_data = reactiveValues(previous_contribution_sample = -1, previous_otu_sample = -1, otu_table = NULL, contribution_table = NULL) 

    # Functional to calculate the normalization factors for partial KO contributions
    ko_normalization_table = reactive({ # Reactive, when called only recalculates output if variables it depends on change

    	func_hierarchy = NULL
		if (is.null(input$function_hierarchy)){ # If they haven't uploaded a function hierarchy, then we load the default
			func_hierarchy = fread(default_func_hierarchy_table, sep="\t", header=TRUE, stringsAsFactors=FALSE)
		} else { # If they've loaded a function hierarchy, we load theirs
			func_hierarchy_file = input$function_hierarchy
			func_hierarchy_file_path = func_hierarchy_file$datapath
			func_hierarchy = fread(func_hierarchy_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)
		}

		# Sum the occurrences of each KO
		output = func_hierarchy[,.N,by="KO"]
		return(output)
	})

	observeEvent(input$update_button, { # ObserveEvent, runs whenever the update button is clicked
		tracked_data$contribution_table = NULL
		output = NULL
		tax_summary_level = input$taxLODselector
		otu_table = NULL

		session$sendCustomMessage("upload_status", "Starting input processing")

		################################# Loading/calculating contribution table #################################
		if (is.null(input$input_type)){ # If they haven't chosen an input method, we'll load the default contribution table

			session$sendCustomMessage("upload_status", "Loading default data")

			otu_table = fread(default_otu_table, sep="\t", header=TRUE, stringsAsFactors=FALSE)
			output = fread(default_contribution_table, sep="\t", header=TRUE, stringsAsFactors=FALSE)

			# Remove the unnecessary columns (keep Sample, OTU, KO, and contribution)
			output = output[,c(2,3,1,6), with=FALSE]

		} else if (input$input_type == "genome_annotation"){ # If they've chosen the genome annotation option

			otu_table_file = input$taxonomic_abundances_1
			annotation_file = input$genome_annotations
			if (is.null(otu_table_file) | is.null(annotation_file)){
				session$sendCustomMessage("retry_upload", "retry")
			} else {

				session$sendCustomMessage("upload_status", "Reading OTU table")

				otu_table_file_path = otu_table_file$datapath
				otu_table = fread(otu_table_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)

				session$sendCustomMessage("upload_status", "Reading annotation table")

				annotation_file_path = annotation_file$datapath
				annotation = fread(annotation_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)
				colnames(annotation) = c("OTU", "Gene", "CopyNumber")

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

		} else if (input$input_type == "16S"){ # If they've chosen the PICRUSt option

			otu_table_file = input$read_counts
			if (is.null(otu_table_file)){
				session$sendCustomMessage("retry_upload", "retry")
			} else {

				session$sendCustomMessage("upload_status", "Reading OTU table")

				otu_table_file_path = otu_table_file$datapath
				otu_table = fread(otu_table_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)

				# Get the PICRUSt normalization table
				normalization = data.table(read.csv(gzfile(picrust_normalization_file), sep="\t", header=TRUE, stringsAsFactors=FALSE))

				# Change zeros in reads matrix to NAs so we can remove them when melting
				otu_table[otu_table == 0] = NA

				session$sendCustomMessage("upload_status", "Normalizing OTU abundances")

				# Melt the read count table so we can merge with the normalization table and ko table
				melted_otu_table = melt(otu_table, id=colnames(otu_table)[1], na.rm=TRUE)

				# Merge the column of normalization factors
				otu_table_with_normalization = merge(melted_otu_table, normalization, by.x=c(colnames(otu_table)[1]), by.y=c(colnames(normalization)[1]), allow.cartesian=TRUE, sort=FALSE)
				rm(normalization)
				rm(melted_otu_table)

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

		} else if (input$input_type == "contribution"){ # If they've chosen the contribution table option

			otu_table_file = input$taxonomic_abundances_2
			contribution_file = input$function_contributions
			if (is.null(otu_table_file) | is.null(contribution_file)){
				session$sendCustomMessage("retry_upload", "retry")
			} else {

				session$sendCustomMessage("upload_status", "Reading OTU table")

				otu_table_file_path = otu_table_file$datapath
				otu_table = fread(otu_table_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)

				session$sendCustomMessage("upload_status", "Reading contribution table")

				contribution_file_path = contribution_file$datapath
				contribution = fread(contribution_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)

				output = contribution[,c(2,3,1,6),with=FALSE]
			}
		}

		if (!is.null(output)){ # If we have successfully generated a contribution table and there were no errors

			colnames(output) = c("Sample", "OTU", "Gene", "CountContributedByOTU")

			# If we have a table of function abundances for comparison, add that to the contribution table, tagging sample names as comparisons
			if (!is.null(input$function_abundances)){

				session$sendCustomMessage("upload_status", "Reading comparison KO table")

				comparison_table_file = input$function_abundances
				comparison_table_file_path = comparison_table_file$datapath
				comparison_table = fread(comparison_table_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)

				# Add comparison tag to sample names
				colnames(comparison_table) = c(colnames(comparison_table)[1], paste(colnames(comparison_table)[2:ncol(comparison_table)], "_comparison", sep=""))

				# Melt the comparison table, add a column with a dummy OTU, and rearrange to match the contribution table
				melted_comparison_table = melt(comparison_table, id=colnames(comparison_table)[1], na.rm=TRUE)
				melted_comparison_table$OTU = rep(unlinked_taxon_name, nrow(melted_comparison_table))
				melted_comparison_table = melted_comparison_table[,c(2,4,1,3),with=FALSE]
				colnames(melted_comparison_table) = c("Sample", "OTU", "Gene", "CountContributedByOTU")

				output = rbind(output, melted_comparison_table)
			}

			################################# Assigning partial KO Contributions to subpathways #################################

			func_hierarchy = NULL
			if (is.null(input$function_hierarchy)){ # If they haven't uploaded a function hierarchy, we use the default

				session$sendCustomMessage("upload_status", "Loading default function hierarchy")

				func_hierarchy = fread(default_func_hierarchy_table, header=TRUE, sep="\t", stringsAsFactors=FALSE)

			} else { # Othwerwise, we load theirs

				session$sendCustomMessage("upload_status", "Reading function hierarchy")

				func_hierarchy_file = input$function_hierarchy
				func_hierarchy_file_path = func_hierarchy_file$datapath
				func_hierarchy = fread(func_hierarchy_file_path, header=TRUE, sep="\t", stringsAsFactors=FALSE)

			}

			session$sendCustomMessage("upload_status", "Summarizing function abundances to level above KO")

			# Get a table matching KOs to the SubPathways they belong to
			level_match_table = data.table(func_hierarchy[,c(1,summary_level_index), with=FALSE])

			# For each row in the contribution table, copy the row for every SubPathway the KO for the row belongs to and label the rows accordingly
			expanded_table = merge(output, level_match_table, by.x=c(colnames(output)[3]), by.y=c(colnames(level_match_table)[1]), all.y=FALSE, allow.cartesian=TRUE)

			# Append a column including the normalization factor for each row based on the KO
			expanded_table = merge(expanded_table, ko_normalization_table(), by.x=c(colnames(expanded_table)[1]), by.y=c(colnames(ko_normalization_table())[1]), all.y=FALSE, allow.cartesian=TRUE)

			# Create a column for the normalized contributions of each row
			expanded_table$normalized_contributions = expanded_table[,4,with=FALSE] / expanded_table[,6,with=FALSE]

			# Sum normalized contributions for rows that match in Sample, KO, and SubPathway
			output = expanded_table[,sum(normalized_contributions), by=eval(colnames(expanded_table)[c(2,3,5)])]

			# Convert subpathway counts to relative abundances
			output[,relative_contributions := V1/sum(V1), by=Sample]

			otu_ko_links = unique(expanded_table[,list(OTU, Gene)])
			#session$sendCustomMessage(type="shiny_test", paste0(c(paste0(names(otu_ko_links), collapse="\t"), apply(otu_ko_links, 1, function(x){ return(paste0(x, collapse = "\t"))})), collapse = "\n"))
			
			################################# Formatting and returning the function hierarchy #################################

			session$sendCustomMessage("upload_status", "Formatting the function hierarchy")

			# Remove the column of KOs
			func_hierarchy = func_hierarchy[,2:dim(func_hierarchy)[2],with=F]

			# Remove rows that correspond to SubPathways not in the contribution table data
			func_hierarchy = func_hierarchy[func_hierarchy[,3,with=F][[1]] %in% unique(output[,SubPathway])]

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
	        	return(list("key" = paste(l[colnames(func_hierarchy)[3]]), "level"=0, "values" = list(l)))
	        })

	        # Iteratively generate the next layer up in the tree, grouping the previous level of nodes by their parent
	        output_func_hierarchy = NULL
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

			session$sendCustomMessage(type='function_hierarchy', output_func_hierarchy)
			
			################################# Formatting and returning the function averages #################################

			session$sendCustomMessage("upload_status", "Calculating average function abundances")

			otu_matched_samples = grep(".*_comparison$", output$Sample, invert=TRUE)
			#sum over taxa
			count_name = names(output)[!names(output) %in% c("Sample", "OTU", "SubPathway")]
			total_funcs = output[otu_matched_samples,lapply(.SD, sum), by=list(SubPathway, Sample), .SDcols=count_name] #whatever the count name is
			total_funcs[,SubPathway:=paste("SubPathway",SubPathway,sep="_")]
			total_funcs[,V1:=V1/sum(V1),by=Sample] #Switch to relative abundance from read counts
			#combine with func_hierarchy
			total_funcs = merge(total_funcs, unique_func_hierarchy, by="SubPathway")
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

			taxa_hierarchy = NULL
			if(!is.null(input$taxonomic_hierarchy)){ # If they've uploaded a custom taxonomic hierarchy
				taxa_hierarchy_file = input$taxonomic_hierarchy
				taxa_hierarchy_file_path = taxa_hierarchy_file$datapath
				taxa_hierarchy = fread(taxa_hierarchy_file_path, sep = "\t", header=T, stringsAsFactors = F)

			} else { # Read in default
		    	taxa_hierarchy = fread(default_tax_hierarchy_table, sep = "\t", header=T, stringsAsFactors = F)
			}
		    
	        # Filter OTUs not in contribution table
	        taxa_hierarchy = taxa_hierarchy[taxa_hierarchy[,1,with=F][[1]] %in% unique(output[,OTU])]
	        taxa_hierarchy = unique(taxa_hierarchy)
	        taxa_hierarchy = taxa_hierarchy[,lapply(.SD,as.character)]

	        taxa_hierarchy[,(colnames(taxa_hierarchy)[2:dim(taxa_hierarchy)[2]]):=lapply(.SD, function(col){
	        	return(gsub("^$", "unknown", gsub("^.__", "", gsub(";$", "", col))))
	        }), .SDcols=2:dim(taxa_hierarchy)[2]]
			taxa_hierarchy[,(colnames(taxa_hierarchy)[2:dim(taxa_hierarchy)[2]]):=lapply(2:dim(taxa_hierarchy)[2], function(col){
				sapply(1:dim(taxa_hierarchy)[1], function(row){
					return(paste(taxa_hierarchy[row,2:col,with=F], collapse="_"))
				})
			})]
	        output[,OTU:=as.character(OTU)]
	        # Summarize contribution table to the correct taxonomic level
	        level_match_taxa_hierarchy = taxa_hierarchy[,c(1,which(colnames(taxa_hierarchy) == tax_summary_level)),with=F]
	        colnames(level_match_taxa_hierarchy) = c(colnames(level_match_taxa_hierarchy)[1], "new_summary_level")

	        expanded_table = merge(output, level_match_taxa_hierarchy, by.x = c(colnames(output)[2]), by.y=c(colnames(level_match_taxa_hierarchy)[1]), all.x = T, all.y=F, allow.cartesian=T)
	        expanded_table[,new_summary_level:=sapply(unlist(expanded_table[,ncol(expanded_table),with=F]), function(entry){if (is.na(entry)){return(unlinked_taxon_name)}else{return(entry)}})]
	        output = expanded_table[,sum(relative_contributions), by=eval(colnames(expanded_table)[c(2,6,3)])]
	        colnames(output) = c("Sample", "OTU", "SubPathway", "relative_contributions")

	        ################################# Summarizing the OTU table to the desired taxonomic level #################################

	        session$sendCustomMessage("upload_status", "Summarizing OTU table to desired taxonomic level")

	        otu_table[is.na(otu_table)] = 0
	        colnames(otu_table)[1] = "OTU"
	        otu_table[,OTU:=as.character(OTU)]
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

	        summarized_taxa_hierarchy = taxa_hierarchy[,c(2:dim(taxa_hierarchy)[2], 1),with=F]
	        cutoff = which(colnames(summarized_taxa_hierarchy) == tax_summary_level)
	        summarized_taxa_hierarchy = summarized_taxa_hierarchy[,1:cutoff,with=F]
	        summarized_taxa_hierarchy = unique(summarized_taxa_hierarchy)

	        # Create the base set of objects which are structured differently from the internal nodes. The leaves contain all information for each parent node of the leaf
	        base_objects = lapply(1:dim(summarized_taxa_hierarchy)[1], function(row){
	        	l = list("Ndescendents" = 0, "type" = "taxa")
	        	for (depth in 1:dim(summarized_taxa_hierarchy)[2]){
	        		l[colnames(summarized_taxa_hierarchy)[depth]] = summarized_taxa_hierarchy[row,depth,with=F]
	        	}
	        	return(list("key" = paste(l[colnames(summarized_taxa_hierarchy)[dim(summarized_taxa_hierarchy)[2]]]), "level"=0, "values" = list(l)))
	        })

	        # Iteratively generate the next layer up in the tree, grouping the previous level of nodes by their parent
	        output_taxa_hierarchy = NULL
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

			session$sendCustomMessage(type='tax_hierarchy', output_taxa_hierarchy)

		    ################################# Formatting and returning the contribution table #################################

		    session$sendCustomMessage("upload_status", "Formatting the contribution table")

			# Format the contribution table to match the expected javascript array
			# Reshape so there's a column for every SubPathway, rows correspond to unique Sample + OTU pairings
			output[,SubPathway:=paste("SubPathway",SubPathway,sep="_")]
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

			tracked_data$contribution_table = output

			session$sendCustomMessage("number_of_samples_message", length(output))

			session$sendCustomMessage(type="contribution_table_ready", length(output))
		}

	}) # Makes the function run on initial page load without a button click

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

	# Listen for requests for sample data from the browser
	observe({
		if (!is.null(input$taxonomic_hierarchy)){
			taxa_hierarchy_file = input$taxonomic_hierarchy
			taxa_hierarchy_file_path = taxa_hierarchy_file$datapath
			taxa_hierarchy = fread(taxa_hierarchy_file_path, sep = "\t", header=T, stringsAsFactors = F)
			session$sendCustomMessage("tax_hierarchy_labels", colnames(taxa_hierarchy))
		} else {
			taxa_hierarchy = fread(default_tax_hierarchy_table, sep = "\t", header=T, stringsAsFactors = F)
			session$sendCustomMessage("tax_hierarchy_labels", colnames(taxa_hierarchy))
		}
	})

})