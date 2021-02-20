function getNum(val) {
	val = +parseFloat(val) || 0
	return val;
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


					class Recipe {
						constructor(name) {
							this.name = name;
							this.data = data;
							this.energy_ef = energy_ef;
							this.ingredients = {};
							this.cooking_steps = [];
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
							this.weight = 0
							this.CO2e = 0
							this.kcal = 0
							this.content = {}
							for (const [name, value] of Object.entries(this.ingredients)) {
								this.content[name] = {}
								var entries = this.add_values(name)
								for (const [key, value] of Object.entries(entries)) {
									this.content[name][key] = value
								}
								this.content[name]["CO2e"] = this.content[name]["Changement climatique (kg CO2 eq/kg de produit)"] * (this.ingredients[name]["quantity"] / 1000)
								this.content[name]["kcal"] = getNum(this.content[name]["Energy, Regulation EU No 1169/2011 (kcal/100g)"]) * (this.ingredients[name]["quantity"] / 100)
								this.weight += this.ingredients[name]["quantity"]
								this.CO2e += this.content[name]["CO2e"]
								this.kcal += this.content[name]["kcal"]
							}
						}

						cook() {
							for (const step of this.cooking_steps) {
								var energy = step["duration"]/60. * step["power"] / 1000.
								step["CO2e"] = energy * this.find_EF(step["energy_source"])
								this.CO2e += step["CO2e"] 
								}
						}

						add_values(name) {
							var entries = {
								name
							};
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

					}

					// let myRecipe = new Recipe("Pasta");
					// myRecipe.addIngredient("Dried pasta, wholemeal, raw", 400)
					// myRecipe.addIngredient("Olive oil, extra virgin", 2)
					// myRecipe.addIngredient("Anchovy, in salt (semi-preserved)", 50)
					// myRecipe.addIngredient("Romanesco cauliflower or romanesco broccoli, raw", 1000)

					// // // myRecipe.addIngredients([
					// // // 	["Dried pasta, wholemeal, raw", 400],
					// // // 	["Olive oil, extra virgin", 2],
					// // // 	["Anchovy, in salt (semi-preserved)", 50],
					// // // 	["Romanesco cauliflower or romanesco broccoli, raw", 1000]
					// // // ])

					// // // myRecipe.removeIngredient("Olive oil, extra virgin")
					// myRecipe.mise_en_place()

					// console.log(myRecipe.name)
					// console.log(myRecipe.ingredients)
					// console.log(myRecipe.content)
					// console.log(myRecipe.weight)
					// console.log(myRecipe.CO2e)
					// console.log(myRecipe.kcal)

					// myRecipe.addCookingStep("Electricity (cooking) - France continentale", 15, 2500)
					// console.log(myRecipe.cooking_steps)
					// myRecipe.cook()
					// console.log(myRecipe.CO2e)

					let webRecipe = new Recipe("webRecipe")
					var ingredients = $('[name^="ingredient"]');
					var quantities = $('[name^="quantit"]');
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
					// console.log(sources);
					var i;
					for (i = 0; i < sources.length; i++) {
						if (sources[i].value != "") {
							webRecipe.addCookingStep(sources[i].value, times[i].value, powers[i].value)
						}	
					}
					webRecipe.cook()


					$("#results").css("visibility","visible");
					// console.log(webRecipe.CO2e);
					// console.log(webRecipe.content);
					var km = (webRecipe.CO2e/0.193).toFixed(2);
					var bigmacs = (webRecipe.kcal/550).toFixed(2);
					var CO2e = webRecipe.CO2e.toFixed(2);
					$("#CO2e").html(`${CO2e} kgCO2e`);
					$("#km").html(`${km} km by car`);
					$("#kcal").html(`${webRecipe.kcal} kcal`);
					$("#bigmacs").html(`${bigmacs} BigMacs`);


					// let div = document.createElement('div');
					// div.className = "alert";
					// div.innerHTML = JSON.stringify(webRecipe.ingredients);

					// document.body.append(div);


    }
});

    }
});

}
function formsubmit() {
	run();
}





