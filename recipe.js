
function loadJSON(path, success, error)
{
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
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

function getNum(val) {
   val = +parseFloat(val) || 0
   return val;
}

loadJSON('table Ciqual 2020_ENG_2020 07 07.json',
         function(ciqual) { 

loadJSON('ecolab-alimentation/data/out/Agribalyse.json',
         function(agribalyse) { 


class Recipe {
  constructor(name) {
    this.name = name;
    this.ciqual = ciqual;
    this.agribalyse = agribalyse;
    this.ingredients = {};
  }

  addIngredient(name,quantity){
    this.ingredients[name] = {"quantity": quantity};
  }

  removeIngredient(name){
  	delete this.ingredients[name]
  }

  addIngredients(ingredients){
    for (let ingredient of ingredients){
            this.addIngredient(ingredient[0],ingredient[1])
     }
   }
  
  cook(self){
        this.weight = 0
        this.CO2e = 0
        this.kcal = 0
        this.content = {}
        for (const [name, value] of Object.entries(this.ingredients)) {
            this.content[name] = {}
            var entries = this.add_values(name)
            for (const [key, value] of Object.entries(entries)){
                this.content[name][key] =  value
            }
            this.content[name]["CO2e"] = this.content[name]["ef"] * (this.ingredients[name]["quantity"]/1000)

            this.content[name]["kcal"] =  getNum(this.content[name]["Energy, Regulation EU No 1169/2011 (kcal/100g)"]) * (this.ingredients[name]["quantity"]/100)
            this.weight += this.ingredients[name]["quantity"]
            this.CO2e += this.content[name]["CO2e"]
            this.kcal += this.content[name]["kcal"]
    	}
		this.CO2e = parseFloat(this.CO2e.toFixed(2))

    }
    add_values(name){
        var entries = {name};
        for (let entry of this.agribalyse) {
            if (entry["LCI_name"] == name){
                entries["code"] = entry["ciqual_code"]
                entries["ef"] = entry["impact_environnemental"]["Changement climatique"]["synthese"]
                for (const [key, value] of Object.entries(this.ciqual[entries["code"]])){
                    entries[key] = value;
                }
            }

        }
        	return entries;;
    }  
    
}

let myRecipe = new Recipe("Pasta");



// myRecipe.addIngredient("Dried pasta, wholemeal, raw", 100)
// myRecipe.addIngredient("Olive oil, extra virgin", 2)
// myRecipe.addIngredient("Anchovy, in salt (semi-preserved)", 15)
// myRecipe.addIngredient("Romanesco cauliflower or romanesco broccoli, raw", 200)

myRecipe.addIngredients([["Dried pasta, wholemeal, raw", 400],
                          ["Olive oil, extra virgin", 2],
                          ["Anchovy, in salt (semi-preserved)", 50],
                          ["Romanesco cauliflower or romanesco broccoli, raw", 1000]])

myRecipe.removeIngredient("Olive oil, extra virgin")
myRecipe.cook();

console.log(myRecipe.name)
console.log(myRecipe.ingredients)
console.log(myRecipe.content)
console.log(myRecipe.weight)
console.log(myRecipe.CO2e)
console.log(myRecipe.kcal)

         },
         function(xhr) { console.error(xhr); }
);

         },
         function(xhr) { console.error(xhr); }
);


