function getNum(val) {
	val = +parseFloat(val) || 0
	return val;
}

function loadJSON(path, success, error) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			if (xhr.status === 200) {
				if (success)
					success(JSON.parse(xhr.responseText));
			} else {
				if (error)
					error(xhr);
			}
		}
	};
	xhr.open("GET", path, true);
	xhr.send();
}

function run() {
			Papa.parse("data/food/data.csv", {
				download: true,
				header:true,
			    complete: function(results) {
			        data = results.data;

			Papa.parse("data/energy/data.csv", {
				download: true,
				header:true,
			    complete: function(results) {
			        energy_ef = results.data;

			loadJSON('data/food/intake/data.json',
				function(intake) {


			class Recipe {
				constructor(name) {
					this.name = name;
					this.data = data;
					this.energy_ef = energy_ef;
					this.intake = intake;
					this.ingredients = {};
					this.cooking_steps = [];
					this.total_content = {}
					this.comparison = {"food":"Hamburger, from fast foods restaurant",
											"quantity":220};
					for (var key of Object.keys(data[0]).slice(1)) {
    					this.total_content[key.split(" (")[0]] = {"value":0,
    															  "unit":key.split(" (")[1].split("/")[0]}
    				}
				}

				addIngredient(name, quantity) {
					this.ingredients[name] = {
						"quantity": parseInt(quantity)
					};
				}

				addCookingStep(energy_source,duration,power) {
					this.cooking_steps.push({"duration": duration,
                            "energy_source": energy_source,
                            "power": power
					});
				}

				removeIngredient(name) {
					delete this.ingredients[name]
				}

				addIngredients(ingredients) {
					for (let ingredient of ingredients) {
						this.addIngredient(ingredient[0], ingredient[1])
					}
				}

				mise_en_place() {
					this.content = {}
					this.weight = 0
					for (const [name, value] of Object.entries(this.ingredients)) {
						this.content[name] = {}
						var entries = this.add_values(name)
						for (const [key, value] of Object.entries(entries)) {
							if (key == "Carbon footprint (kgCO2e/kg)"){
								this.content[name][key] = value * (this.ingredients[name]["quantity"] / 1000.)
							}
							else {
								this.content[name][key] = getNum(value) * (this.ingredients[name]["quantity"]/100.)
							}
							if (key != "LCI Name" & key != "name"){
								this.total_content[key.split(" (")[0]]["value"] += this.content[name][key] 
							}
						}
						this.weight += this.ingredients[name]["quantity"]
					}
					this.compare()
				}

				cook() {
					for (const step of this.cooking_steps) {
						var energy = step["duration"]/60. * step["power"] / 1000.
						step["CO2e"] = energy * this.find_EF(step["energy_source"])
						this.total_content["Carbon footprint"]["value"] += step["CO2e"] 
						}
					this.compare()
				}

				add_values(name) {
					var entries = {};
					for (let entry of this.data) {
						if (entry["LCI Name"] == name) {
							for (const [key, value] of Object.entries(entry)) {
								entries[key] = parseFloat(value);
							}
						}

					}
					return entries;
				}

				listIngredients() {
					for (const [name, value] of Object.entries(this.ingredients)) {
						return name;
					}
				}

			    find_EF(energy) {
			        for (let entry of this.energy_ef) {
			            if (entry["Name_Location"] == energy) {
								return parseFloat(entry["EF"]);
							}
			        }
			    }
			    set_reference(food, quantity){
			    	this.comparison["food"] = food;
			    	this.comparison["quantity"] = quantity;
			    }
			    compare(){
			    	var food = this.comparison["food"];
			    	var quantity = this.comparison["quantity"];
			    	var reference = this.add_values(food);
			    	delete reference["LCI Name"]
			    	for (const [key, value] of Object.entries(reference)){
			    		var name = key.split(" (")[0];
			    		var comparison = "";
			    		var recommended = "";
			    		if (value > 0) {
			    			if (key == "Carbon footprint (kgCO2e/kg)"){
			    				comparison = ((this.total_content[name]["value"] / (value*(quantity/1000)))*100).toFixed(0).toString()+"%"
			    			}
			    			else{
			    				comparison = ((this.total_content[name]["value"] / (value*(quantity/100)))*100).toFixed(0).toString()+"%"
			    				recommended = ((this.total_content[name]["value"]/this.intake[name]["value"])*100).toFixed(0).toString() +"%"
			    			}
			    		}
			    		this.total_content[name]["benchmark"] = {"name":food,
			    												"weight (g)": quantity,
			    												"value": comparison}
			    		this.total_content[name]["recommended"] = recommended
			    	}
			    }
			}

		// Web recipe
		let webRecipe = new Recipe("webRecipe")
		var ingredients = $('[name^="ingredient"]');
		var quantities = $('[name^="quantit"]');

		var reference = {};
		reference["food"] = $('#reference').val();
		reference["quantity"] = $('#reference-weight').val();
		webRecipe.set_reference(reference["food"],reference["quantity"]);
		// console.log(ingredients);
		var i;
		for (i = 0; i < ingredients.length; i++) {
			// console.log(ingredients[i].value, quantities[i].value)
			webRecipe.addIngredient(ingredients[i].value, quantities[i].value)
		}
		webRecipe.mise_en_place()

		var sources = $('[name^="energ"]');
		var times = $('[name^="time"]');
		var powers = $('[name^="power"]');



		var i;
		for (i = 0; i < sources.length; i++) {
			if (sources[i].value != "") {
				webRecipe.addCookingStep(sources[i].value, times[i].value, powers[i].value)
			}	
		}
		webRecipe.cook()
		$("#results").css('display','inline');

		var html = '';
		for (const [key, value] of Object.entries(webRecipe.total_content).slice(0,1)){
		            html += '<tr><td>' + key + '</td>' +
		                    '<td class="text-center">' + value["value"].toFixed(2) + ' ' + value["unit"] + '</td>' +
		                    '<td class="text-center">' + value["recommended"] + '</td>' +
		                    '<td class="text-center">' + value["benchmark"]["value"] + '</td>' +
		                    '</tr>';
		     }
		$('#table-footprint').html(html);

		$("#results").css("visibility","visible");
		var html = '';
		console.log(webRecipe.total_content)
		for (const [key, value] of Object.entries(webRecipe.total_content).slice(1)){

		            html += '<tr><td>' + key + '</td>' +
		                    '<td class="text-center">' + value["value"].toFixed(2) + ' ' + value["unit"] + '</td>' +
		                    '<td class="text-center">' + value["recommended"] + '</td>' +
		                    '<td class="text-center">' + value["benchmark"]["value"] + '</td>' +
		                    '</tr>';
		     }
		$('#table-nutritional').html(html);

		});

		}
	});

	}
});

}
function formsubmit() {
	if ($('[name="quantity[0]"]').val() > 0) {
		run();
	}

}





