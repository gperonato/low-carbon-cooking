function getNum(val) {
	val = +parseFloat(val) || 0
	return val;
}

// Utility function to load JSON data
const loadJSON = async (path) => {
	try {
	  const response = await fetch(path);
	  if (!response.ok) {
		throw new Error(`HTTP error! Status: ${response.status}`);
	  }
	  return await response.json();
	} catch (err) {
	  console.error(`Failed to load JSON from ${path}:`, err);
	  throw err;
	}
  };

// Utility function to load CSV using PapaParse
const loadCSV = async (path) => {
	return new Promise((resolve, reject) => {
	  Papa.parse(path, {
		download: true,
		header: true,
		complete: (results) => resolve(results.data),
		error: (err) => reject(err),
	  });
	});
  };

class Recipe {
	constructor(name) {
		this.name = name;
		this.environment = [];
		this.nutrition = [];
		this.energy_ef = [];
		this.intake = {};
		this.units = [];
		this.servings = 1;
		this.ingredients = {};
		this.cooking_steps = [];
		this.total_content = {};
		this.comparison = {"food":"Hamburger, from fast foods restaurant",
								"quantity":220};
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
		this.weight = 0;
		// Populate content
		for (const [name, value] of Object.entries(this.ingredients)) {
			this.content[name] = {}
			for (const dict of [this.nutrition, this.environment]) {
				var entries = this.add_values(name, dict)
				for (const [key, value] of Object.entries(entries)) {
					this.content[name][key] = {"value": getNum(value) * (this.ingredients[name]["quantity"]/1000),
											   "source": entries["source"]}
				}
			}
		this.weight += this.ingredients[name]["quantity"]
		}
		// Populate total content
		for (const [name, object] of Object.entries(this.content)){
			for (const [key, value] of Object.entries(object)){
				// Add the content if the object doesn't exist already and if it has a unit
				if (! (this.total_content[key]) & this.look_up(key, "Short Name", "Unit", this.units) != ""){
					this.total_content[key] = {"value": 0,
											   "unit": this.look_up(key, "Short Name", "Unit", this.units),
											   "benchmark": {},
											   "recommended": ""	
											   }
					var is_environment = false;
					}
				if (this.total_content[key]) {
					this.total_content[key]["value"] += this.content[name][key]["value"] / this.servings;
					if(this.content[name][key]["source"].includes("AGRIBALYSE")) {is_environment = true}
					this.total_content[key]["is_environment"] = is_environment	
				}
			}
		}
		this.compare()
	}

	cook() {
		for (const step of this.cooking_steps) {
			var energy = step["duration"]/60. * step["power"]
			step["CO2e"] = energy * this.look_up(step["energy_source"], "code", "EF", this.energy_ef) / 1000.
			this.total_content["climate_change"]["value"] += step["CO2e"] / this.servings
			}
		this.compare()
	}

	add_values(name, dict) {
		var entries = {};
		for (let entry of dict) {
			if (entry["lci_name"] == name) {
				for (const [key, value] of Object.entries(entry)) {
					entries[key] = value;
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

	look_up(variable, variable_name, key, dict) {
		for (let entry of dict) {
			if (entry[variable_name] == variable) {
					return entry[key];
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
		var reference = Object.assign({}, this.add_values(food, this.nutrition), this.add_values(food, this.environment)); 
		var recommended = 0;
		var comparison = "";
		// Reference food
		for (const [key, value] of Object.entries(reference)){
			if (this.total_content.hasOwnProperty(key)) {
				comparison = this.total_content[key]["value"] / (getNum(value)*quantity/1000)
				this.total_content[key]["benchmark"] = {"name":food,
														"weight (g)": quantity,
														"value": comparison}
			}
		}
		// Recommended intake
		for (const [key, value] of Object.entries(this.total_content)){
			if (value["value"] > 0 && this.intake.hasOwnProperty(key)) {
				recommended = this.total_content[key]["value"]/this.intake[key]["value"]; // ratio
				this.total_content[key]["recommended"] = recommended;
			}
		}
	}
}

const run = async () => {
	try {
		const [environment, nutrition, energy_ef, units, intake] = await Promise.all([
		  loadCSV("../data/food/environment.csv"),
		  loadCSV("../data/food/nutrition.csv"),
		  loadCSV("../data/energy/data.csv"),
		  loadCSV("../data/food/units.csv"),
		  loadJSON("../data/food/intake/data.json"),
		]);

		// Web recipe
		const webRecipe = new Recipe("webRecipe");
		webRecipe.environment = environment;
		webRecipe.nutrition = nutrition;
		webRecipe.energy_ef = energy_ef;
		webRecipe.intake = intake;
		webRecipe.units = units;


		webRecipe.servings = servings;
		var ingredients = $('[name="i"]');
		var quantities = $('[name="q"]');

		var reference = {};
		reference["food"] = translate_value($('#reference').val(),language,"EN");
		reference["quantity"] = $('#reference-weight').val();
		console.log("Setting reference food:", reference["food"]);
		webRecipe.set_reference(reference["food"],reference["quantity"]);

		for (i = 0; i < ingredients.length; i++) {
			ingredient = translate_value(ingredients[i].value,language,"EN");
			console.log("Adding ingredient:", ingredient)			
			webRecipe.addIngredient(ingredient, quantities[i].value)
		}
		webRecipe.mise_en_place()

		var sources = $('[name="e"]');
		var times = $('[name="t"]');
		var powers = $('[name="p"]');


		for (i = 0; i < sources.length; i++) {
			if (sources[i].value != "") {
				source = translate_value(sources[i].value,language,"Code");
				console.log("Adding source:", source)
				webRecipe.addCookingStep(source, times[i].value, powers[i].value)
			}	
		}
		webRecipe.cook()
		$("#results").css('display','inline');

		var html = '';
		for (const [key, value] of Object.entries(webRecipe.total_content)){
			if (webRecipe.total_content[key]["is_environment"] == true & key == "climate_change") {
	            html += '<tr><td>' + translate_value(key,"Code",language) + '</td>' +
	                    '<td class="text-center">' + Math.round(((value["value"]) + Number.EPSILON)*100)/100 + ' ' + value["unit"] + '</td>' +
						// Equivalent km - Passenger car with average motorization, 2018 | Base Carbone® ADEME v23.4 (27970
	                    '<td class="text-center">' + Math.round(((value["value"])/0.231 + Number.EPSILON)*100)/100 +  ' km ' + '</td>'  +
	                     '<td class="text-center">' + Math.round(value["benchmark"]["value"]*100)  + '%</td>' +
	                    '</tr>';
		     }
		}
		$('#table-footprint').html(html);

		$("#results").css("visibility","visible");
		var html = '';
		for (const [key, value] of Object.entries(webRecipe.total_content)){
			if (webRecipe.total_content[key]["is_environment"] == false && webRecipe.total_content[key]["recommended"] != "") {
	            html += '<tr><td>' + translate_value(key,"Code", language)  + '</td>' +
	                    '<td class="text-center">' + Math.round((value["value"] + Number.EPSILON)*100)/100 + ' ' + value["unit"] + '</td>' +
	                    '<td class="text-center">' + Math.round(value["recommended"]*100)  + '%</td>' +
	                    '<td class="text-center">' + Math.round(value["benchmark"]["value"]*100)  + '%</td>' +
	                    '</tr>';
		     }
		  }
		$('#table-nutritional').html(html);

	} catch (err) {
		console.error("Error running recipe calculation:", err);
	  }
	};

function translate_value(value, source_language, target_language) {
			for (t = 0; t < dictionary.length; t++) {
				if (dictionary[t][source_language] == value) {
						return dictionary[t][target_language]
							}
				}
			return value		
}


function formsubmit() {
	if ($('[name="q"]').val().length > 0 && $('[name="i"]').val().length > 0) {
		run();
		var recipe_arr = $("#recipeform").serializeArray();

		// Serialize form values
		// var serialized = 'l='+language+"&";
		var serialized = '';
		for (i = 0; i < recipe_arr.length; i++) {
			if (recipe_arr[i]["name"] == "i" || recipe_arr[i]["name"] == "e"){
				recipe_arr[i]["value"] = translate_value(recipe_arr[i]["value"],language,"Code");
				}
			serialized += recipe_arr[i]["name"] + "=" + recipe_arr[i]["value"] + "&"
			}
		if (servings > 1) {
			serialized += "servings=" + servings + "&"
		}
		// Update URL
		history.pushState(null, "", '?' + serialized); 
	}

}





