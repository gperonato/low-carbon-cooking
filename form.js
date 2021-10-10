const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const iningredients = urlParams.getAll('i');
const inquantities = urlParams.getAll('q');
const inenergysources = urlParams.getAll('e');
const incookingtime = urlParams.getAll('t');
const inpower = urlParams.getAll('p')
const ingrsnippet = `<div class="row" id="ingredients">
	            	<div class="col-sm-7 form-group">
	            	<input id="ingredient" type="text" class="form-control input-sm"  name="i" value=""/>
	            	</div>
	            	<div class="col-sm-3 form-group">
	            		<div class="input-group">
							<input type="number" class="form-control input-sm"  name="q" min="0" value="">
							<div class="input-group-append">
								<span class="input-group-text"> g </span>
							</div>
						</div>
					</div>
	            	<div class="col-sm-1 form-group">
					<button id="delete" class="btn btn-secondary">-</button>
					</div>
							<div class="col-sm-1 form-group">
								<button name="add-ing" class="btn btn-secondary">+</button>
							</div>
					</div>`

const cooksnippet = `<div class="row" id="cooking">
				<div class="col-sm-4 form-group" id="energydropdown">
						<select class="form-control" name="e" id="energyselect">
						</select>
				</div>
				<div class="col-sm-3 form-group">
					<div class="input-group">
						<input type="number" class="form-control input-sm"  name="t" min="0" value="">
						<div class="input-group-append">
							<span class="input-group-text"> min </span>
						</div>
					</div>
				</div>
				<div class="col-sm-3 form-group">
					<div class="input-group">
						<input type="number" class="form-control input-sm"  name="p" min="0" value="">
						<div class="input-group-append">
							<span class="input-group-text"> W </span>
						</div>
					</div>
				</div>				
				<div class="col-sm-1 form-group">
					<button id="delete-cooking" class="btn btn-secondary">-</button>
				</div>
					<div class="col-sm-1 form-group">
							<button name="add-cf" class="btn btn-secondary">+</button>
						</div>
			</div>`



$.get('lists/energy.txt', function(txtFile) {
	energy = txtFile.split("\n");

	$.get('lists/ingredients.txt', function(txtFile) {
		ingredients = txtFile.split("\n");

		$(document).ready(function() {
			var wrapper = $(".ingredients");
			var wrapper_cooking = $(".cooking-steps");
			var x = 1;
			var c = 1;


			// Submit when changing weight of reference ingredient
			$('#reference-weight').keypress(function(e) {
				if (e.which == 13) {
					formsubmit();
					return false;
				}
			});

			// Add empty field if no parameters are no provided
			if (iningredients.length == 0) {
				iningredients.push("")
			}

			if (inenergysources.length == 0) {
				inenergysources.push("")
			}

			// Add fields from parameters
			for (var x = 0; x < iningredients.length; x++) {
				// Hide + button from previous line
				$("[name='add-ing']").last().hide();
				// Add new line
				$(wrapper).append($(ingrsnippet));
				// Load values from parameters
				$("[name='i']").last().val(iningredients[x]);
				$("[name='q']").last().val(inquantities[x]);

				// Autocomplete
				$(wrapper).find("[name='i']").last().autocomplete({
					source: ingredients
				}).autocomplete('enable');

			}

			for (var c = 0; c < inenergysources.length; c++) {
				// Hide + button from previous line
				$("[name='add-cf'").last().hide();
				// Add new line
				$(wrapper_cooking).append($(cooksnippet));
				// Load values for dropdown
				for (var i = 0; i < energy.length; i++) {
					$('#energydropdown select').last().append($(document.createElement('option')).prop({
						value: energy[i],
						text: energy[i]
					}))
				};
				// Load values from parameters
				$("[name='e']").last().val(inenergysources[c]);
				$("[name='t']").last().val(incookingtime[c]);
				$("[name='p']").last().val(inpower[c]);
			}

			// Add fields from UI
			$(wrapper).on("click", "[name='add-ing']", function(e) {
				e.preventDefault();
				// Hide + button from previous line
				$("[name='add-ing']").last().hide();
				// Add new line
				$(wrapper).append($(ingrsnippet));
				// Autocomplete
				$(wrapper).find("[name='i']").last().autocomplete({
					source: ingredients
				}).autocomplete('enable');
				x++;
			});

			$(wrapper_cooking).on("click", "[name='add-cf']", function(e) {
				e.preventDefault();
				$("[name='add-cf']").last().hide();
				$(wrapper_cooking).append($(cooksnippet));
				// Add dropdown menu
				for (var i = 0; i < energy.length; i++) {
					$('#energydropdown select').last().append($(document.createElement('option')).prop({
						value: energy[i],
						text: energy[i]
					}))
				};
				c++;
			});

			// Remove fields from UI
			$(wrapper).on("click", "#delete", function(e) {
				e.preventDefault();
				if (x > 1) {
					// Remove line
					$(this).parent().parent('div').remove();
					$("[name^='add-ing']").last().show();
					x--;
				} else {
					console.log("cannot remove first ingredient")
				}
			});

			$(wrapper_cooking).on("click", "#delete-cooking", function(e) {
				e.preventDefault();
				if (c > 1) {
					// Remove line
					$(this).parent().parent('div').remove();
					$("[name^='add-cf']").last().show();
					c--;
				} else {
					console.log("cannot remove first cooking step")
				}
			});

			formsubmit();
		});
	});
});