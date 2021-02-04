#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Feb  3 21:56:51 2021

@author: giuseppeperonato
"""

import json
import pandas as pd
with open("ecolab-alimentation/data/out/Agribalyse.json", "r") as f:
    agribalyse = json.loads(f.read())
    df = pd.DataFrame(agribalyse)
    
    
# .impact_environnemental["Changement climatique"]["synthese"]
    
# df.loc[df.LCI_name.str.contains("pasta"),"LCI_name"]


class Recipe():
    def __init__(self):
        self.ingredients = {}
        with open("ecolab-alimentation/data/out/Agribalyse.json", "r") as f:
            self.agribalyse = json.loads(f.read())
        with open("table Ciqual 2020_ENG_2020 07 07.json", "r") as f:
            self.ciqual = json.loads(f.read())
        
    def addIngredient(self,name,quantity):
        self.ingredients[name] = {"quantity": quantity}
        
    def addIngredients(self,ingredients):
        for ingredient in ingredients:
            self.addIngredient(ingredient[0],ingredient[1])

    def cook(self):
        self.weight = 0
        self.CO2e = 0
        self.kcal = 0
        for name in self.ingredients.keys():
            code, ef, kcal100g = self.query(name,"Changement climatique")
            self.ingredients[name]["CO2e"] =  ef * (self.ingredients[name]["quantity"]/1000)
            self.ingredients[name]["kcal"] =  int(kcal100g * (self.ingredients[name]["quantity"]/100))
            self.ingredients[name]["code"] = code
            self.weight += self.ingredients[name]["quantity"]
            self.CO2e += self.ingredients[name]["CO2e"]
            self.kcal += self.ingredients[name]["kcal"]
        self.CO2e = round(self.CO2e,2)
    
    def query(self,name,parameter):
        for entry in self.agribalyse:
            if entry["LCI_name"] == name:
                code = entry["ciqual_code"]
                ef = entry["impact_environnemental"][parameter]["synthese"]
                try:
                    kcal100g = int(self.ciqual[code]["Energy, Regulation EU No 1169/2011 (kcal/100g)"])
                except:
                    kcal100g = 0
                return code, ef, kcal100g


my_recipe = Recipe()
# my_recipe.addIngredient("Dried pasta, wholemeal, raw", 100)
# my_recipe.addIngredient("Olive oil, extra virgin", 2)
# my_recipe.addIngredient("Anchovy, in salt (semi-preserved)", 15)
# my_recipe.addIngredient("Romanesco cauliflower or romanesco broccoli, raw", 200)
my_recipe.addIngredients([("Dried pasta, wholemeal, raw", 400),
                          ("Olive oil, extra virgin", 2),
                          ("Anchovy, in salt (semi-preserved)", 50),
                          ("Romanesco cauliflower or romanesco broccoli, raw", 1000)])
my_recipe.cook()
print(my_recipe.ingredients)
print("Weight",my_recipe.weight,"g")
print("Footprint",my_recipe.CO2e,"kg CO2e")
print("Calories",my_recipe.kcal,"kcal")

my_recipe2 = Recipe()
my_recipe2.addIngredients([("Dried egg pasta, raw", 400),
                          ("Olive oil, extra virgin", 2),
                          ("Beef, minced steak, 20% fat, cooked", 300),
                          ("Carrot, raw", 50),
                          ("Celery stalk, raw", 50),
                          ("Onion, raw", 50),
                          ("Tomato coulis, canned (tomato puree semi-reduced 11%)", 300)])
my_recipe2.cook()
print(my_recipe2.ingredients)
print("Weight",my_recipe2.weight,"g")
print("Footprint",my_recipe2.CO2e,"kg CO2e")
print("Calories",my_recipe2.kcal,"kcal")

