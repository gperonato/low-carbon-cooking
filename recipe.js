// Recipe calculator

// Utility function to coerce values to float
function getNum(val) {
	val = +parseFloat(val) || NaN
	return val;
}

// Utility function to load JSON data
export const loadJSON = async (path) => {
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
export const loadCSV = async (path) => {
	return new Promise((resolve, reject) => {
	  Papa.parse(path, {
		download: true,
		header: true,
		complete: (results) => resolve(results.data),
		error: (err) => reject(err),
	  });
	});
  };

export class Recipe {
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
					let absolute_value = 0;
					// Handle 0s
					if (value == "") {
						absolute_value = NaN;
					} else if (getNum(value) > 0) {
						absolute_value = getNum(value) * (this.ingredients[name]["quantity"]/1000);
					}
					this.content[name][key] = {
						"value": absolute_value,
						"source": entries["source"]
					}
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
		for (const [key, value] of Object.entries(this.intake)){
			if (this.total_content[key]["value"] > 0) {
				recommended = this.total_content[key]["value"]/this.intake[key]["value"]; // ratio
				this.total_content[key]["recommended"] = recommended;
				this.total_content[key]["recommended_source"] = this.intake[key]["source"]["title"];			
			}
		}
	}
}







