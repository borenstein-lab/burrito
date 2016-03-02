# R server code interacting with the main webpage

library(shiny)
library(data.table)

# Change the maximum file upload size
options(shiny.maxRequestSize=300*1024^2)

# Defining important files
default_tax_hierarchy_table = "www/Data/full_gg_taxa_mapping_parsed.txt"
default_func_hierarchy_table = "www/Data/classes_parsed2.tsv"
default_contribution_table = "www/Data/mice_metagenome_contributions.txt"
picrust_normalization_file = "www/Data/16S_13_5_precalculated.tab.gz"
picrust_ko_file = "www/Data/melted_picrust_ko_table.txt"

# Column of the level we summarize to for the function hierarchy when we calculate partial KO contributions
summary_level_index = 4

# Actual Shiny server code
shinyServer(function(input, output, session) {

    # Variables that the server keeps track of but doesn't need to run functions to calculate
    tracked_data = reactiveValues(previous_sample = -1, contribution_table = NULL) 

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
		output2 = NULL	

		if (is.null(input$input_type)){ # If they haven't chosen an input method, we'll load the default contribution table
			output = fread(default_contribution_table, sep="\t", header=TRUE, stringsAsFactors=FALSE)

			# Remove the unnecessary columns (keep Sample, OTU, KO, and contribution)
			output = output[,c(2,3,1,6), with=FALSE]

		} else if (input$input_type == "genome_annotation"){ # If they've chosen the genome annotation option
	
			otu_abundance_file = input$taxonomic_abundances_1
			otu_abundance_file_path = otu_abundance_file$datapath
			otu_abundance = fread(otu_abundance_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)

			annotation_file = input$genome_annotations
			annotation_file_path = annotation_file$datapath
			annotation = fread(annotation_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)
			colnames(annotation) = c("OTU", "Gene", "CopyNumber")

			# Change zeros in abundance matrix to NAs so we can remove them when melting
			otu_abundance[otu_abundance == 0] = NA

			# Melt the otu abundance table so we can merge with the annotations
			melted_otu_abundance = melt(otu_abundance,id=colnames(otu_abundance)[1], na.rm=TRUE)
			#session$sendCustomMessage("picrust_status", melted_otu_abundance)

			# Merge the melted otu abundances and annotations to a get a column for every Sample, OTU, KO set
			merged_table = merge(melted_otu_abundance, annotation, by.x=c(colnames(melted_otu_abundance)[1]), by.y=c(colnames(annotation)[1]), allow.cartesian=TRUE, sort=FALSE)
			session$sendCustomMessage("picrust_status", merged_table)
			# Make a contribution column by multiplying the OTU abundance by the KO count
			merged_table$contribution = merged_table[,3,with=FALSE] * merged_table[,5,with=FALSE]

			# Reorganize and reformat the table to standardize
			output = merged_table[,c(2,1,4,6),with=FALSE]

		} else if (input$input_type == "16S"){ # If they've chosen the PICRUSt option
			reads_file = input$read_counts
			reads_file_path = reads_file$datapath
			reads = fread(reads_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)

			# Get the PICRUSt normalization table
			normalization = data.table(read.csv(gzfile(picrust_normalization_file), sep="\t", header=TRUE, stringsAsFactors=FALSE))

			# Change zeros in reads matrix to NAs so we can remove them when melting
			reads[reads == 0] = NA

			# Melt the read count table so we can merge with the normalization table and ko table
			melted_reads = melt(reads, id=colnames(reads)[1], na.rm=TRUE)

			# Merge the column of normalization factors
			reads_with_normalization = merge(melted_reads, normalization, by.x=c(colnames(reads)[1]), by.y=c(colnames(normalization)[1]), allow.cartesian=TRUE, sort=FALSE)
			rm(normalization)
			rm(reads)
			rm(melted_reads)

			# Get the PICRUSt ko table
			melted_ko_counts = fread(picrust_ko_file, sep="\t", header=TRUE, stringsAsFactors=FALSE)

			# Merge the column of ko counts
			reads_norms_kos = merge(reads_with_normalization, melted_ko_counts, by.x=c(colnames(reads_with_normalization)[1]), by.y=c(colnames(melted_ko_counts)[1]), allow.cartesian=TRUE, sort=FALSE)
			rm(melted_ko_counts)
			rm(reads_with_normalization)
			
			# Make a contribution column by multiplying the read counts with normalization factors with ko counts
			reads_norms_kos$contribution = reads_norms_kos[,3,with=FALSE] * reads_norms_kos[,6,with=FALSE] / reads_norms_kos[,4,with=FALSE]

			# Reorganize and reformate the table to standardize
			output = reads_norms_kos[,c(2, 1, 5, 7),with=FALSE]
			rm(reads_norms_kos)

		} else if (input$input_type == "contribution"){ # If they've chosen the contribution table option

			contribution_file = input$function_contributions
			contribution_file_path = contribution_file$datapath
			contribution = fread(contribution_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)

			output = contribution[,c(2,3,1,6),with=FALSE]
		}
		colnames(output) = c("Sample", "OTU", "Gene", "CountContributedByOTU")

		if (!is.null(output)){ # If we have successfully generated a contribution table

			func_hierarchy = NULL
			if (is.null(input$function_hierarchy)){ # If they haven't uploaded a function hierarchy, we use the default
			func_hierarchy = fread(default_func_hierarchy_table, header=TRUE, sep="\t", stringsAsFactors=FALSE)

			} else { # Othwerwise, we load theirs
				func_hierarchy_file = input$function_hierarchy
				func_hierarchy_file_path = func_hierarchy_file$datapath
				func_hierarchy = fread(func_hierarchy_file_path, header=TRUE, sep="\t", stringsAsFactors=FALSE)
			}

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

		}

		# Load the function hierarchy table so we can filter it
		if (!is.null(input$func_hierarchy)){ # If they've loaded a function hierarchy, read that in

			func_hierarchy_file = input$function_hierarchy
			func_hierarchy_file_path = func_hierarchy_file$datapath
			func_hierarchy = read.csv(func_hierarchy_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)

			# Remove the KO column and resulting duplicate rows
			func_hierarchy = func_hierarchy[,2:dim(func_hierarchy)[2]]
			output2 = unique(func_hierarchy)

			# Send the resulting function hierarchy as a string, rows separated by newlines, elements separated by tabs
			session$sendCustomMessage(type='function_hierarchy', paste(paste(colnames(output2), collapse="\t"), sapply(1:dim(output2)[1], function(row){return(paste(output2[row], collapse="\t"))}), collapse="\n", sep="\n"))

		} else if (!is.null(input$input_type)) { # If they haven't uploaded a custom hierarchy, use the default but trigger the non-default function hierarchy upload

			func_hierarchy = fread(default_func_hierarchy_table, sep="\t", header=TRUE, stringsAsFactors=FALSE)

			# Remove the column of KOs
			func_hierarchy = func_hierarchy[,2:dim(func_hierarchy)[2],with=F]

			# Remove rows that correspond to SubPathways not in the contribution table data
			func_hierarchy = func_hierarchy[SubPathway %in% unique(output[,SubPathway])]

			# Remove duplicate rows
			output2 = unique(func_hierarchy)

			# Send the resulting function hierarchy as a string, rows separated by newlines, elements separated by tabs
			session$sendCustomMessage(type='function_hierarchy', paste(paste(colnames(output2), collapse="\t"), paste(sapply(1:dim(output2)[1], function(row){return(paste(output2[row,], collapse="\t"))}), collapse="\n"), sep="\n"))

		} else { # If they haven't loaded a function hierarchy, use the default

			func_hierarchy = fread(default_func_hierarchy_table, sep="\t", header=TRUE, stringsAsFactors=FALSE)

			# Remove the column of KOs
			func_hierarchy = func_hierarchy[,2:dim(func_hierarchy)[2],with=F]

			# Remove rows that correspond to SubPathways not in the contribution table data
			func_hierarchy = func_hierarchy[SubPathway %in% unique(output[,SubPathway])]

			# Remove duplicate rows
			output2 = unique(func_hierarchy)

			# Send the resulting function hierarchy as a string, rows separated by newlines, elements separated by tabs
			session$sendCustomMessage(type='default_function_hierarchy', paste(paste(colnames(output2), collapse="\t"), paste(sapply(1:dim(output2)[1], function(row){return(paste(output2[row,], collapse="\t"))}), collapse="\n"), sep="\n"))
		}
		
		#sum over taxa
		count_name = names(output)[!names(output) %in% c("Sample", "OTU", "SubPathway")]
		total_funcs = output[,lapply(.SD, sum), by=list(SubPathway, Sample), .SDcols=count_name] #whatever the count name is
		total_funcs[,V1:=V1/sum(V1),by=Sample] #Switch to relative abundance from read counts
		#combine with func_hierarchy
		total_funcs = merge(total_funcs, output2, by="SubPathway")
		#get average for every level of functions
		func_means = data.table()
		for(j in 1:ncol(output2)){
			total_funcs_sum = total_funcs[,sum(V1), by=c("Sample", names(func_hierarchy)[j])] #sum over this category, will not change SubPathway
			func_means_lev =  total_funcs_sum[, mean(V1), by=eval(names(func_hierarchy)[j])]
			setnames(func_means_lev, c("Function", "Mean"))
			if(ncol(func_means_lev)==2) func_means = rbind(func_means, func_means_lev)
		}
		output3 = func_means
		if (is.null(input$input_type)){ # If they haven't uploaded data
			session$sendCustomMessage(type="default_func_averages",paste(paste(colnames(output3), collapse="\t"), paste(sapply(1:nrow (output3), function(row){return(paste(output3[row,], collapse="\t"))}), collapse="\n"), sep="\n"))
		} else { # If they've uploaded data
			session$sendCustomMessage(type="func_averages",paste(paste(colnames(output3), collapse="\t"), paste(sapply(1:nrow (output3), function(row){return(paste(output3[row,], collapse="\t"))}), collapse="\n"), sep="\n"))
		}

		if(!is.null(input$taxonomic_hierarchy)){ # If they've uploaded a custom taxonomic hierarchy
			taxa_hierarchy_file = input$taxonomic_hierarchy
			taxa_hierarchy_file_path = taxa_hierarchy_file$datapath
			taxa_hierarchy = fread(taxa_hierarchy_file_path, sep = "\t", header=T, stringsAsFactors = F)
			output4 = unique(taxa_hierarchy)
			session$sendCustomMessage(type='tax_hierarchy', paste(paste(colnames(output4), collapse="\t"), paste(sapply(1:dim(output4)[1], function(row){return(paste(output4[row], collapse="\t"))}), collapse="\n"), sep="\n"))
		} else if (!is.null(input$input_type)){ # If they haven't uploaded a custom taxonomic hierarchy, but they are updating the graphics, then load the default and trigger the non-default taxonomic hierachy upload
			taxa_hierarchy = fread(default_tax_hierarchy_table, sep = "\t", header=T, stringsAsFactors = F)
	        # Filter OTUs not in contribution table
	        taxa_hierarchy = taxa_hierarchy[OTU_ID %in% unique(output[,OTU])]
	        output4 = unique(taxa_hierarchy)
	        session$sendCustomMessage(type='tax_hierarchy', paste(paste(colnames(output4), collapse="\t"), paste(sapply(1:dim(output4)[1], function(row){return(paste(output4[row], collapse="\t"))}), collapse="\n"), sep="\n"))
	    } else { # Read in default
	    	taxa_hierarchy = fread(default_tax_hierarchy_table, sep = "\t", header=T, stringsAsFactors = F)
	        # Filter OTUs not in contribution table
	        taxa_hierarchy = taxa_hierarchy[OTU_ID %in% unique(output[,OTU])]
	        output4 = unique(taxa_hierarchy)
	        session$sendCustomMessage(type='default_tax_hierarchy', paste(paste(colnames(output4), collapse="\t"), paste(sapply(1:dim(output4)[1], function(row){return(paste(output4[row], collapse="\t"))}), collapse="\n"), sep="\n"))

	    }

		# Format the contribution table to match the expected javascript array

		# Reshape so there's a column for every SubPathway, rows correspond to unique Sample + OTU pairings
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

		if (is.null(input$input_type)){ # If they haven't uploaded data
			session$sendCustomMessage(type="default_contribution_table_ready", length(output))
		} else { # If they've uploaded data
			session$sendCustomMessage(type="contribution_table_ready", length(output))
		}

		tracked_data$contribution_table = output

	})

	# Listen for requests for sample data from the browser
	observe({
		if (!is.null(input$sample_request)){
			sample = input$sample_request
			if (sample != tracked_data$previous_sample){
				tracked_data$previous_sample = sample
				if (sample >= 0 & sample < length(tracked_data$contribution_table)){
					if (is.null(input$input_type)){ # If they haven't uploaded data
						session$sendCustomMessage(type="default_sample_return", tracked_data$contribution_table[sample + 1])
					} else { # If they've uploaded data
						session$sendCustomMessage(type="sample_return", tracked_data$contribution_table[sample + 1])
					}
				}
			}
		}
	})

})
