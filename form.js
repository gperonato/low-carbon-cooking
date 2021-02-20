$(document).ready(function() {
		    var wrapper = $(".ingredients");
		    var x = 0;

			$.get('ingredients.txt', function(txtFile){
			  ingredients = txtFile.split("\n");
			  $("#ingredients").autocomplete({
			    source: ingredients
			  });
			});

		    $(wrapper).on("click", "[name^='add[']", function(e) {
		        e.preventDefault();
		            $("[name^='add[']").last().hide();
		            x++;
		            var ingredient = $(`<div class="row" id="ingredients[${x}]">
		            	<div class="col-sm-7 form-group">
		            	<input id="ingredients" type="text" class="form-control input-sm" placeholder="Ingredient" name="ingredient[${x}]"/>
		            	</div>
		            	<div class="col-sm-3 form-group">
		            		<div class="input-group">
								<input type="number" class="form-control input-sm" placeholder="Weight" name="quantity[${x}]" min="0">
								<div class="input-group-append">
									<span class="input-group-text"> g </span>
								</div>
							</div>
						</div>
		            	<div class="col-sm-1 form-group">
						<button id="delete" class="btn btn-primary">-</button>
						</div>
								<div class="col-sm-1 form-group">
									<button name="add[${x}]" class="btn btn-primary">+</button>
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
						<div class="col-sm-4 form-group">
   							<select class="form-control" name="energy[${c}]">
      							<option></option>
      							<option>Electricity</option>
      							<option>Gas</option>
    						</select>
						</div>
						<div class="col-sm-3 form-group">
							<div class="input-group">
								<input type="number" class="form-control input-sm" placeholder="Time" name="time[${c}]" min="0">
								<div class="input-group-append">
									<span class="input-group-text"> min </span>
								</div>
							</div>
						</div>
						<div class="col-sm-3 form-group">
							<div class="input-group">
								<input type="number" class="form-control input-sm" placeholder="Power" name="power[${c}]" min="0" value="2500">
								<div class="input-group-append">
									<span class="input-group-text"> W </span>
								</div>
							</div>
						</div>				
						<div class="col-sm-1 form-group">
							<button id="delete-cooking" class="btn btn-primary">-</button>
						</div>
							<div class="col-sm-1 form-group">
									<button name="add-cf[${c}]" class="btn btn-primary">+</button>
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