$(document).ready(function() {
		    var wrapper = $(".ingredients");
		    var x = 0;

			$.get('lists/ingredients.txt', function(txtFile){
			  ingredients = txtFile.split("\n");
			  $("#ingredients").autocomplete({
			    source: ingredients
			  });
			  $("#reference").autocomplete({
			    source: ingredients,
			    select: function(event, ui) {
			        formsubmit();
			    }
			  });
			});

			$('#reference-weight').keypress(function (e) {
			  if (e.which == 13) {
			    formsubmit();
			    return false; 
			  }
			});

			$.get('lists/energy.txt', function(txtFile){
			  energy = txtFile.split("\n");
				for(var i=0; i< energy.length;i++)
				{
				  jQuery('<option/>', {
				        value: energy[i],
				        html: energy[i]
				        }).appendTo('#dropdown select'); //appends to select if parent div has id dropdown
				}
			});



		    $(wrapper).on("click", "[name^='add[']", function(e) {
		        e.preventDefault();
		            $("[name^='add[']").last().hide();
		            x++;
		            var ingredient = $(`<div class="row" id="ingredients[${x}]">
		            	<div class="col-sm-7 form-group">
		            	<input id="ingredients" type="text" class="form-control input-sm"  name="ingredient[${x}]"/>
		            	</div>
		            	<div class="col-sm-3 form-group">
		            		<div class="input-group">
								<input type="number" class="form-control input-sm"  name="quantity[${x}]" min="0">
								<div class="input-group-append">
									<span class="input-group-text"> g </span>
								</div>
							</div>
						</div>
		            	<div class="col-sm-1 form-group">
						<button id="delete" class="btn btn-secondary">-</button>
						</div>
								<div class="col-sm-1 form-group">
									<button name="add[${x}]" class="btn btn-secondary">+</button>
								</div>
						</div>`);
		               ingredient.find('#ingredients').autocomplete({
		            source: ingredients
		        }).autocomplete('enable');
		            $(wrapper).append(ingredient);
		  		    var add_button = $(".add");
		    });

		    $(wrapper).on("click", "#delete", function(e) {
			    e.preventDefault();
		    	if (x > 0){
			        $(this).parent().parent('div').remove();
			       	$("[name^='add[']").last().show();
			        x--;
		        }
		        else {
		        	console.log("cannot remove first ingredient")
		        }
		    })
		});

			$(document).ready(function() {
		    var wrapper_cooking = $(".cooking-steps");

		    var c = 0;
		   $(wrapper_cooking).on("click", "[name^='add-cf[']", function(e) {
		        e.preventDefault();
		            $("[name='add-cf["+c+"]']").hide();
		            c++;
		            var cooking = $(`<div class="row" id="cooking[${c}]">
						<div class="col-sm-4 form-group" id="dropdown">
   							<select class="form-control" name="energy[${c}]">
    						</select>
						</div>
						<div class="col-sm-3 form-group">
							<div class="input-group">
								<input type="number" class="form-control input-sm"  name="time[${c}]" min="0">
								<div class="input-group-append">
									<span class="input-group-text"> min </span>
								</div>
							</div>
						</div>
						<div class="col-sm-3 form-group">
							<div class="input-group">
								<input type="number" class="form-control input-sm"  name="power[${c}]" min="0" value="2000">
								<div class="input-group-append">
									<span class="input-group-text"> W </span>
								</div>
							</div>
						</div>				
						<div class="col-sm-1 form-group">
							<button id="delete-cooking" class="btn btn-secondary">-</button>
						</div>
							<div class="col-sm-1 form-group">
									<button name="add-cf[${c}]" class="btn btn-secondary">+</button>
								</div>
					</div>`);


		            $(wrapper_cooking).append(cooking);

		    });

		    $(wrapper_cooking).on("click", "#delete-cooking", function(e) {
			    e.preventDefault();
		    	if (c > 0){
			        $(this).parent().parent('div').remove();
			       	$("[name^='add-cf[']").last().show();
			        c--;
		        }
		        else {
		        	console.log("cannot remove first cooking step")
		        }
		    })


		});