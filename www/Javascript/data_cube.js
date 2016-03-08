(function(){
  
  var data_cube_wrapper = {};

  data_cube_wrapper.make_cube = function(){
    /////////////////////////////////////////////////////////////////////// data_cube fields /////////////////////////////////////////////////////////////////////////////////////////////

    var data_cube = {};
    data_cube.samples = [];
    data_cube.taxa_tree = {};
    data_cube.func_tree = {};
    data_cube.taxa_lookup = {};
    data_cube.taxa_lookup_full = {};
    data_cube.func_lookup = {};
    data_cube.displayed_taxa = [];
    data_cube.displayed_funcs = [];
    data_cube.original_contribution_cube = {};
    data_cube.displayed_contribution_cube = {};
    data_cube.meansOverSamples = {};
    data_cube.funcMeans = {};

    /////////////////////////////////////////////////////////////////////// is_leaf /////////////////////////////////////////////////////////////////////////////////////////////

    // Checks whether a node in a tree is a leaf node
    data_cube.is_leaf = function(node){
      if (node.hasOwnProperty('values')){
        for (var i = 0; i < node.values.length; i++){
          if (node.values[i].hasOwnProperty('values')){
            return false;
          }
        }
        return true;
      } else {
        return false;
      }
    }

    //check whether a node is the only child of its parent
    // data_cube.only_child = function(node, lookup){
    // }

    data_cube.get_leaves = function(parent, lookup){
      var leaves = [];

      // Use a BFS to find the leaves
      var curr_nodes = [];
      curr_nodes.push(lookup[parent]);
      for (; curr_nodes.length > 0;){
        curr_node = curr_nodes.shift();
        if (this.is_leaf(curr_node)){
          leaves.push(curr_node.key);
        } else {
          for (var i = 0; i < curr_node.values.length; i++){
            curr_nodes.push(curr_node.values[i]);
          }
        }
      }

      return leaves;
    }

    data_cube.get_descendents = function(parent, lookup){
      var descendents = []

      var curr_nodes = [];
      curr_nodes.push(lookup[parent]);
      for (; curr_nodes.length > 0;){
        curr_node = curr_nodes.shift();
        if(curr_node.key != parent){
          descendents.push(curr_node.key);
        }
        if (this.is_leaf(curr_node) == false){
          for (var i = 0; i < curr_node.values.length; i++){
            curr_nodes.push(curr_node.values[i]);
          }
        }
      }
      return descendents;
    }

    /////////////////////////////////////////////////////////////////////// calculate_new_contribution /////////////////////////////////////////////////////////////////////////////////////////////

    // Returns the contribution of the given taxon to the given function relative to the total functional abundance in the given sample
    // Uses the original_contribution_cube
    data_cube.calculate_new_contribution = function(sample, taxon, func){

      // Get the leaf nodes under the give taxon and func
      var leaf_taxa = this.get_leaves(taxon, this.taxa_lookup);
      var leaf_funcs = this.get_leaves(func, this.func_lookup);

      // Now sum all the contributions across those leaf otus and leaf kos for the given sample
      var total = 0;
      for (var i = 0; i < leaf_taxa.length; i++){
        var leaf_taxon = leaf_taxa[i];
        if (this.original_contribution_cube[sample].hasOwnProperty(leaf_taxon)){
          for (var j=0; j < leaf_funcs.length; j++){
            var leaf_func = leaf_funcs[j];
            if (this.original_contribution_cube[sample][leaf_taxon].hasOwnProperty(leaf_func)){
              total += this.original_contribution_cube[sample][leaf_taxon][leaf_func];
            }
          }
        }
      }

      return total;
    }

    /////////////////////////////////////////////////////////////////////// expand_func_displayed_contribution_cube /////////////////////////////////////////////////////////////////////////////////////////////

    // Expand the chosen function in the displayed_contribution_cube to replace the original function entry with its children function entries
    data_cube.expand_func_displayed_contribution_cube = function(func){
      var curr_func = this.func_lookup[func];

      // Only try to expand if the function has children
      if (!this.is_leaf(curr_func)){

        // Go through each entry in the cube corresponding to the function
        for (var sample in this.displayed_contribution_cube){
          for (var taxon in this.displayed_contribution_cube[sample]){

            // Remove the entry in the cube corresponding to the function
            delete this.displayed_contribution_cube[sample][taxon][func];

            //  Find the immediate children of the function and add their entries to the cube
            for (var i = 0; i < curr_func.values.length; i++){
              this.displayed_contribution_cube[sample][taxon][curr_func.values[i].key] = this.calculate_new_contribution(sample, taxon, curr_func.values[i].key);
            }
          }
        }
      }
    }

    /////////////////////////////////////////////////////////////////////// collapse_func_displayed_contribution_cube /////////////////////////////////////////////////////////////////////////////////////////////

    // Collapse the chosen function in the displayed_contribution_cube to replace the entries of the currently displayed descendents of the function with the new function entry
    data_cube.collapse_func_displayed_contribution_cube = function(func){
      var curr_func = this.func_lookup[func];

      // Only try to collapse if the function has children
      if (!this.is_leaf(curr_func)){

        // Find all of the function's descendents that are currently displayed using a BFS
        var func_children = [];
        var func_present_children = [];
        for (var i = 0; i < curr_func.values.length; i++){
          func_children.push(curr_func.values[i])
          for (; func_children.length > 0;){
            var curr_child = func_children.shift();

            // If the descendent function we are looking at has children, check whether this descendent function is currently displayed, or if we need to check its children
            if (!this.is_leaf(curr_child)){
              var name = curr_child.key;

              //  If this descendent function is currently displayed, record that and move on
              if (this.displayed_funcs.indexOf(name) != -1){
                func_present_children.push(name);

              // Otherwise, add its children to check later
              } else {
                for (var j = 0; j < curr_child.values.length; j++){
                  func_children.push(curr_child.values[j]);
                }
              }

            // Otherwise, since we know it has no children, it must be currently displayed
            } else {
              func_present_children.push(curr_child.key);
            }
          }
        }

        // For each descendent function that is currently displayed, remove its entry from the displayed_contribution_cube
        for (var sample in this.displayed_contribution_cube){
          for (var taxon in this.displayed_contribution_cube[sample]){

            // Sum the contributions of the displayed descendents to speed up adding the new function's entry to the cube
            var total = 0;
            for (var i = 0; i < func_present_children.length; i++){
              total += this.displayed_contribution_cube[sample][taxon][func_present_children[i]]
              delete this.displayed_contribution_cube[sample][taxon][func_present_children[i]];
            }

            this.displayed_contribution_cube[sample][taxon][func] = total;
          }
        }
      }
    }

    /////////////////////////////////////////////////////////////////////// expand_taxon_displayed_contribution_cube /////////////////////////////////////////////////////////////////////////////////////////////

    // Expand the chosen taxon in the displayed_contribution_cube to replace the original taxon entry with its children taxon entries
    data_cube.expand_taxon_displayed_contribution_cube = function(taxon){
      var curr_taxon = this.taxa_lookup[taxon];

      // Only try to expand if the taxon has children
      if (!this.is_leaf(curr_taxon)){

        // Go through each entry in the cube corresponding to the taxon
        for (var sample in this.displayed_contribution_cube){

          // Remove the entry in the cube corresponding to the taxon
          delete this.displayed_contribution_cube[sample][taxon];

          // Find the immediate children of the taxon and add their entries to the cube
          for (var i = 0; i < curr_taxon.values.length; i++){
            this.displayed_contribution_cube[sample][curr_taxon.values[i].key] = {}

            // For each function currently displayed, add an entry for that function
            for (var j = 0; j < this.displayed_funcs.length; j++){
              this.displayed_contribution_cube[sample][curr_taxon.values[i].key][this.displayed_funcs[j]] = this.calculate_new_contribution(sample, curr_taxon.values[i].key, this.displayed_funcs[j]);
            }
          }
        }
      }
    }

    /////////////////////////////////////////////////////////////////////// collapse_taxon_displayed_contribution_cube /////////////////////////////////////////////////////////////////////////////////////////////

    // Collapse the chosen taxon in the displayed_contribution_cube to replace the entries of the currently displayed descendents of the taxon with the new taxon entry

    data_cube.collapse_taxon_displayed_contribution_cube = function(taxon){
      var curr_taxon = this.taxa_lookup[taxon];

      // Only try to collapse if the taxon has children
      if (!this.is_leaf(curr_taxon)){

        // Find all of the taxon's descendents that are currently displayed using a BFS
        var taxon_children = [];
        var taxon_present_children = [];
        for (var i = 0; i < curr_taxon.values.length; i++){
          taxon_children.push(curr_taxon.values[i]);
          for (; taxon_children.length > 0;){
            var curr_child = taxon_children.shift();
            // If the descendent taxon we are looking at has children, check whether this descendent taxon is currently displayed, or if we need to check its children
            if (!this.is_leaf(curr_child)){
              var name = curr_child.key;

             //  If this descendent taxon is currently displayed, record that and move on                  
              if (this.displayed_taxa.indexOf(name) != -1){
                taxon_present_children.push(name);

              // Otherwise, add its children to check later                    
              } else {
                for (var j = 0; j < curr_child.values.length; j++){
                  taxon_children.push(curr_child.values[j]);
                }
              }

            // Otherwise, since we know it has no children, it must be currently displayed                  
            } else {
              taxon_present_children.push(curr_child.key);
            }
          }
        }

        // For each descendent taxon that is currently displayed, remove its entry from the displayed_contribution_cube
        for (var sample in this.displayed_contribution_cube){
          var contributions = {};
          for (var i = 0; i < taxon_present_children.length; i++){
            var child_taxon_name = taxon_present_children[i];

            // Only need to account for contributions and remove child taxa if they are present in this sample
            if (this.displayed_contribution_cube[sample].hasOwnProperty(child_taxon_name)){

              // Sum the contributions of the displayed descendents to speed up adding the new taxon's entry to the cube
              for (func in this.displayed_contribution_cube[sample][child_taxon_name]){
                var contribution = this.displayed_contribution_cube[sample][child_taxon_name][func];
                if (contributions.hasOwnProperty(func)){
                  contributions[func] += contribution;
                } else {
                  contributions[func] = contribution;
                }
              }
              delete this.displayed_contribution_cube[sample][child_taxon_name];
            }
          }

          // Add in the new taxon, along with its function contributions
          this.displayed_contribution_cube[sample][taxon] = {};
          for (var j = 0; j < this.displayed_funcs.length; j++){
            var func = this.displayed_funcs[j];
            if (contributions.hasOwnProperty(func)){
              this.displayed_contribution_cube[sample][taxon][func] = contributions[func];
            }
          }
        }
      }
    }

    /////////////////////////////////////////////////////////////////////// expand_func_displayed_funcs /////////////////////////////////////////////////////////////////////////////////////////////

    // Expand the chosen function in the displayed_funcs to replace the original function entry with its children function entries        
    data_cube.expand_func_displayed_funcs = function(func){
      var curr_func = this.func_lookup[func];

      // Only try to expand if the function has children
      if (!this.is_leaf(curr_func)){
        var child_funcs = [];

        // Get each child of the func to be expanded
        for (var i = 0; i < curr_func.values.length; i++){
          child_funcs.push(curr_func.values[i].key)
        }

        // Sort the array of children alphabetically
        child_funcs.sort();

        // Insert each child function into the array of displayed functions
        var curr_func_index = this.displayed_funcs.indexOf(curr_func.key);
        for (var i = 0; i < child_funcs.length; i++){
          this.displayed_funcs.splice(curr_func_index + i, 0, child_funcs[i]);
        }       

        // Remove the function being expanded
        this.displayed_funcs.splice(this.displayed_funcs.indexOf(curr_func.key), 1);
      }
    }

    /////////////////////////////////////////////////////////////////////// collapse_func_displayed_funcs /////////////////////////////////////////////////////////////////////////////////////////////

    // Collapse the chosen function in the displayed_funcs to replace the descendent functions with the new function
    data_cube.collapse_func_displayed_funcs = function(func){
      var curr_func = this.func_lookup[func];

      // Only try to collapse if the function has children
      if (!this.is_leaf(curr_func)){

        // Use a BFS to find descendents
        var func_children = [];
        var displayed_children = [];
        for (var i = 0; i < curr_func.values.length; i++){
          func_children.push(curr_func.values[i])
          for (; func_children.length > 0;){
            var curr_child = func_children.shift();
            var name = curr_child.key;

            // If the descendent has its own children, check whether it is displayed 
            if (!this.is_leaf(curr_child)){

              // If the descendent is displayed, remember
              if (this.displayed_funcs.indexOf(name) != -1){
                displayed_children.push(name);

              // Otherwise remember its children to check later
              } else {
                for (var j = 0; j < curr_child.values.length; j++){
                  func_children.push(curr_child.values[j]);
                }
              }

            // Otherwise, it must be displayed
            } else {
              displayed_children.push(name);
            }
          }
        }
        var earliest_spot = this.displayed_funcs.length;
        for (var i = 0; i < displayed_children.length; i++){
          var curr_spot = this.displayed_funcs.indexOf(displayed_children[i]);
          if (curr_spot < earliest_spot){
            earliest_spot = curr_spot;
          }
        }
        this.displayed_funcs.splice(earliest_spot, 0, curr_func.key);
        for (var i = 0; i < displayed_children.length; i++){
          this.displayed_funcs.splice(this.displayed_funcs.indexOf(displayed_children[i]), 1);
        }
      }
    }

    /////////////////////////////////////////////////////////////////////// expand_taxon_displayed_taxa /////////////////////////////////////////////////////////////////////////////////////////////

    // Expand the chosen taxon in the displayed_taxa to replace the original taxon entry with its children taxa entries                
    data_cube.expand_taxon_displayed_taxa = function(taxon){
      var curr_taxon = this.taxa_lookup[taxon];

      // Only try to expand the taxon if it has children
      if (!this.is_leaf(curr_taxon)){
        var child_taxa = [];

        // Get each child of the taxon to be expanded
        for (var i = 0; i < curr_taxon.values.length; i++){
          child_taxa.push(curr_taxon.values[i].key)
        }

        // Sort the array of children alphabetically
        child_taxa.sort();

        // Insert each child taxon into the array of displayed taxa
        var curr_taxon_index = this.displayed_taxa.indexOf(curr_taxon.key);
        for (var i = 0; i < child_taxa.length; i++){
          this.displayed_taxa.splice(curr_taxon_index + i, 0, child_taxa[i]);
        }

        // Remove the function being expanded
        this.displayed_taxa.splice(this.displayed_taxa.indexOf(curr_taxon.key), 1);
      }
    }

    /////////////////////////////////////////////////////////////////////// collapse_taxon_displayed_taxa /////////////////////////////////////////////////////////////////////////////////////////////

    // Collapse the chosen taxon in the displayed_taxa to replace the descendent taxa with the new taxon
    data_cube.collapse_taxon_displayed_taxa = function(taxon){
      var curr_taxon = this.taxa_lookup[taxon];

      // Only try to collapse if the taxon has children
      if (!this.is_leaf(curr_taxon)){

        // Use a BFS to find descendents
        var taxon_children = [];
        var displayed_children = [];
        for (var i = 0; i < curr_taxon.values.length; i++){
          taxon_children.push(curr_taxon.values[i])
          for (; taxon_children.length > 0;){
            var curr_child = taxon_children.shift();
            var name = curr_child.key;

            // If the descendent has its own children, check whether it is displayed
            if (!this.is_leaf(curr_child)){

              // If the descendent is displayed, remember
              if (this.displayed_taxa.indexOf(name) != -1){
                displayed_children.push(name);

              // Otherwise, remember its children to check later
              } else {
                for (var j = 0; j < curr_child.values.length; j++){
                  taxon_children.push(curr_child.values[j]);
                }
              }

            // Otherwise, it must be displayed, so remove it
            } else {
              displayed_children.push(name)
            }
          }
        }
        var earliest_spot = this.displayed_taxa.length;
        for (var i = 0; i < displayed_children.length; i++){
          var curr_spot = this.displayed_taxa.indexOf(displayed_children[i]);
          if (curr_spot < earliest_spot){
            earliest_spot = curr_spot;
          }
        }
        this.displayed_taxa.splice(earliest_spot, 0, curr_taxon.key);
        for (var i = 0; i < displayed_children.length; i++){
          this.displayed_taxa.splice(this.displayed_taxa.indexOf(displayed_children[i]), 1);
        }
      }
    }

    /////////////////////////////////////////////////////////////////////// expand_func /////////////////////////////////////////////////////////////////////////////////////////////

    // Wrapper to expand both the displayed funcs and the displayed contribution cube
    data_cube.expand_func = function(func){
      this.expand_func_displayed_contribution_cube(func);
      this.expand_func_displayed_funcs(func);
    }

    /////////////////////////////////////////////////////////////////////// collapse_func /////////////////////////////////////////////////////////////////////////////////////////////

    // Wrapper to collapse both the displayed funcs and the displayed contribution cube
    data_cube.collapse_func = function(func){
      this.collapse_func_displayed_contribution_cube(func);
      this.collapse_func_displayed_funcs(func);
    }

    /////////////////////////////////////////////////////////////////////// expand_taxon /////////////////////////////////////////////////////////////////////////////////////////////

    // Wrapper to expand both the displayed taxa and the displayed contribution cube
    data_cube.expand_taxon = function(taxon){
      this.expand_taxon_displayed_contribution_cube(taxon);
      this.expand_taxon_displayed_taxa(taxon);
    }

    /////////////////////////////////////////////////////////////////////// collapse_taxon /////////////////////////////////////////////////////////////////////////////////////////////

    // Wrapper to collapse both the displayed taxa and the displayed contribution cube
    data_cube.collapse_taxon = function(taxon){
      this.collapse_taxon_displayed_contribution_cube(taxon);
      this.collapse_taxon_displayed_taxa(taxon);
    }

    /////////////////////////////////////////////////////////////////////// initialize_cube /////////////////////////////////////////////////////////////////////////////////////////////

    data_cube.initialize_cube = function(contribution_table, taxa_tree_data, func_tree_data, func_averages){

      /////////////////////////////////////////////////////////////////////// samples /////////////////////////////////////////////////////////////////////////////////////////////

      // Create array of sample names from contributions file
      this.samples = d3.keys(contribution_table)
      // for (sample in contribution_table){
      //   if (this.samples.indexOf(sample) == -1){
      //     this.samples.push(sample);
      //   }
      // }

      /////////////////////////////////////////////////////////////////////// taxa_tree /////////////////////////////////////////////////////////////////////////////////////////////

      taxa_tree_full = jQuery.extend(true, [], taxa_tree_data);
      this.taxa_tree = jQuery.extend(true, [], taxa_tree_data);

      /////////////////////////////////////////////////////////////////////// func_tree /////////////////////////////////////////////////////////////////////////////////////////////
      ///list of all kos in data (need to do similar for taxa)

      this.func_tree = jQuery.extend(true, [], func_tree_data)

      /////////////////////////////////////////////////////////////////////// taxa_lookup /////////////////////////////////////////////////////////////////////////////////////////////
      // Create a lookup table to get the node in the taxa tree from the name
      // Accessed by taxa_lookup[TAXON_NAME], returns the object in the tree with key=TAXON_NAME, values=children objects, unless it is a leaf, in which case OTU_ID=TAXON_NAME
      curr_taxa = [];

      // Use a BFS to add all taxa
      for (var i = 0; i < this.taxa_tree.length; i++){
        curr_taxa.push(this.taxa_tree[i]);
      }
      for (; curr_taxa.length > 0;){
        curr_taxon = curr_taxa.shift();
        this.taxa_lookup[curr_taxon.key] = curr_taxon;
        level = 0
        //assign how far up from children this is
        if (!this.is_leaf(curr_taxon)){
          for (var i = 0; i < curr_taxon.values.length; i++){
            curr_taxa.push(curr_taxon.values[i]);
          }
          curr_taxon_level_count = curr_taxon
          while(!this.is_leaf(curr_taxon_level_count)){
            level += 1
            curr_taxon_level_count = curr_taxon_level_count.values[0]
          }
        }
        this.taxa_lookup[curr_taxon.key].level = level 
      }

      this.taxa_lookup_full = {};
      curr_taxa = [];

      // Use a BFS to add all taxa
      for (var i = 0; i < taxa_tree_full.length; i++){
        curr_taxa.push(taxa_tree_full[i]);
      }
      for (; curr_taxa.length > 0;){
        curr_taxon = curr_taxa.shift();
        this.taxa_lookup_full[curr_taxon.key] = curr_taxon;
        if (!this.is_leaf(curr_taxon)){
          for (var i = 0; i < curr_taxon.values.length; i++){
            curr_taxa.push(curr_taxon.values[i]);
          }
        }
      }


      /////////////////////////////////////////////////////////////////////// func_lookup /////////////////////////////////////////////////////////////////////////////////////////////

      // Create lookup table to get the node in the func tree from the name
      // Accessed by func_lookup[FUNC_NAME], returns the object in the tree with key=FUNC_NAME, values=children objects, unless it is a leaf, in which case KO=FUNC_NAME
      curr_funcs = [];

      // Use a BFS to add all taxa
      for (var i = 0; i < this.func_tree.length; i++){
        curr_funcs.push(this.func_tree[i]);
      }
      for (; curr_funcs.length > 0;){
        curr_func = curr_funcs.shift();
        this.func_lookup[curr_func.key] = curr_func;
        level = 0
        if (!this.is_leaf(curr_func)){
          for (var i = 0; i < curr_func.values.length; i++){
            curr_funcs.push(curr_func.values[i]);
          }
          curr_func_level_count = curr_func
          while(!this.is_leaf(curr_func_level_count)){
            level += 1
            curr_func_level_count = curr_func_level_count.values[0]
          }
        }
        this.func_lookup[curr_func.key].level = level 
      }

      this.original_contribution_cube = contribution_table

      /////////////////////////////////////////////////////////////////////// displayed_contribution_cube /////////////////////////////////////////////////////////////////////////////////////////////

      // Create a cube of the currently displayed contribution data
      for (var i = 0; i < this.samples.length; i++){
        var sample = this.samples[i];
        this.displayed_contribution_cube[sample] = {};
        for (var j = 0; j < this.taxa_tree.length; j++){
          var taxon = this.taxa_tree[j].key;
          this.displayed_contribution_cube[sample][taxon] = {};
          for (var k = 0; k < this.func_tree.length; k++){
            var func = this.func_tree[k].key;
            this.displayed_contribution_cube[sample][taxon][func] = this.calculate_new_contribution(sample, taxon, func);
          }
        }
      }

      /////////////////////////////////////////////////////////////////////// displayed_taxa /////////////////////////////////////////////////////////////////////////////////////////////

      // Create array of currently displayed taxa, start with highest level
      for (var i = 0; i < this.taxa_tree.length; i++){
        this.displayed_taxa.push(this.taxa_tree[i].key);
      }

      /////////////////////////////////////////////////////////////////////// displayed_funcs /////////////////////////////////////////////////////////////////////////////////////////////        

      // Create array of currently displayed functions, start with the highest level
      for (var i = 0; i < this.func_tree.length; i++){
        this.displayed_funcs.push(this.func_tree[i].key);
      }
      
      for(var j = 0; j < func_averages.length; j++){
        func = func_averages[j].Function
        this.funcMeans[func] = func_averages[j].Mean
      }

    }

    /////////////////////////////////////////////////////////////////////// reduce_to_genus //////////////////////////////////////////////////////////////
    //Reduce OTU abundance data to genus-level abundances (to go with genus-level contribution cube)
    //Also make relative abundances
    data_cube.reduce_to_genus = function(otu_abundance_data){
      new_otu_abundance_data = []
      
      taxa_display_leaves = []
      for(j=0; j < (this.taxa_tree).length; j++){
        taxa_display_leaves = taxa_display_leaves.concat(this.get_leaves(this.taxa_tree[j].key, this.taxa_lookup)); //taxa_tree_leaves//keep working here 
      }     

      sample_totals = []
      otus = d3.keys(otu_abundance_data[0]).filter(function(d){ return d !== "Sample"})
      for(j=0; j < otu_abundance_data.length; j++){
        sample_totals[j] = 0
        for(k=0; k < otus.length; k++){
          sample_totals[j] += otu_abundance_data[j][otus[k]]
        }
      }

      for(j=0; j < otu_abundance_data.length; j++){        
        new_otu_abundance_data[j] = {}
        new_otu_abundance_data[j]["Sample"] = otu_abundance_data[j]["Sample"]
        for(k=0; k < taxa_display_leaves.length; k++){
          new_otu_abundance_data[j][taxa_display_leaves[k]] = 0
          sub_otus = this.get_leaves(taxa_display_leaves[k], this.taxa_lookup_full)
          for(i=0; i < sub_otus.length; i++){
            if(otu_abundance_data[j].hasOwnProperty(sub_otus[i])){
              new_otu_abundance_data[j][taxa_display_leaves[k]] += otu_abundance_data[j][sub_otus[i]]
            }
          }
          new_otu_abundance_data[j][taxa_display_leaves[k]] /= sample_totals[j]
        }
      }
      return new_otu_abundance_data;
    }

    /////////////////////////////////////////////////////////////////////// get_contribution /////////////////////////////////////////////////////////////////////////////////////////////

    // Returns the contribution of a taxon to a function in a sample
    data_cube.get_contribution = function(sample, taxon, func){
      return this.displayed_contribution_cube[sample][taxon][func];
      //return no_cube_calculate_new_contribution(sample, taxon, func);
    }


    return data_cube;

    }

  this.data_cube_wrapper = data_cube_wrapper;
})();
