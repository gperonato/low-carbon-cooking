#!/usr/bin/env python3
#%%
import pandas as pd
import numpy as np
import hashlib
import os

dir_path = os.path.dirname(os.path.realpath(__file__))

# read dictionary for fields translations
transl = pd.read_csv(os.path.join(dir_path,"dictionary.csv"))

#%%
# read CALNUT 2020
# Anses. 2020. Table de composition nutritionnelle Ciqual pour le calcul des apport nutritionnels CALNUT
# https://ciqual.anses.fr/#
calnut = pd.read_excel("https://ciqual.anses.fr/cms/sites/default/files/inline-files/CALNUT2020_2020_07_07.xlsx", sheet_name=1)
assert hashlib.sha256(pd.util.hash_pandas_object(calnut, index=True).values).hexdigest() == "ff650bcde34be32e3cf4a03126ff58a1c96d0402131834629121471e8355cad8"

calnut_pivot = calnut.pivot_table(index=['ALIM_CODE'], columns='CONST_LABEL',
                                  values="MB" # use median values
                                  )
calnut_pivot = calnut_pivot*10 # 100 g to 1 kg
calnut_pivot = calnut_pivot.rename(transl.set_index("Keyword")["Short Name"].to_dict(),axis=1)
calnut_pivot.index.name = "ciqual_code"
calnut_pivot["source"] = "CALNUT2020_2020_07_07"

#%%
# get CIQUAL 2020
# Anses. 2020. Table de composition nutritionnelle des aliments Ciqual"
# https://www.data.gouv.fr/en/datasets/table-de-composition-nutritionnelle-des-aliments-ciqual/
ciqual = pd.read_excel("https://www.data.gouv.fr/fr/datasets/r/f844ae25-6cbf-4027-930c-6a62459b8d42")
assert hashlib.sha256(pd.util.hash_pandas_object(ciqual, index=True).values).hexdigest() == "5629291ddcfb284ac2c542cf1042ec4e1bde70f5d5f94368dde77978eea7b2f1"
ciqual = ciqual.rename(transl.set_index("Keyword")["Short Name"].to_dict(),axis=1)
ciqual = ciqual.set_index("alim_code")
ciqual.index.name = "ciqual_code"

# Fix duplicated 9621
assert ciqual.index.duplicated().sum() == 1
row = ciqual.loc[9621].iloc[0].copy()
row.energy_eu_kj = ciqual.loc[9621].iloc[1].energy_eu_kj
ciqual = ciqual.drop(9621)
ciqual = pd.concat([ciqual,pd.DataFrame(row).transpose()],axis=0)
ciqual.index.name = "ciqual_code"
assert ciqual.index.duplicated().sum() == 0

# Select only the columns that exist also in CALNUT
columns = list(calnut_pivot.columns)
columns.extend(["proteins_eu","energy_eu", "energy_eu_kj"])
ciqual = ciqual.loc[:,[x for x in ciqual.columns if x in columns]]
# Fix decimal
ciqual = ciqual.replace({",":"."},regex=True)
# Transformations
# - --> 0
ciqual_edited = ciqual
ciqual_edited = ciqual.replace({"-":np.nan})
# Traces --> 0
ciqual_edited = ciqual_edited.replace({"traces":0})
# Lower than value --> value
ciqual_edited = ciqual_edited.replace({"< ":""},regex=True) 

# Calculate Energy when missing
# Accept some missing fields, i.e. polyols, organic_acis and fiber
ciqual_numeric = ciqual_edited.apply(pd.to_numeric, errors="coerce")
ciqual_numeric["energy_eu_calc"] = \
    ciqual_numeric.lipids * 9 \
    + ciqual_numeric.alcohol * 7 \
    + ciqual_numeric.proteins_eu * 4 \
    + (ciqual_numeric.carbohydrates - ciqual_numeric.polyols.fillna(0)) * 4 \
    + ciqual_numeric.organic_acids.fillna(0) * 3 \
    + ciqual_numeric.polyols.fillna(0) * 2.4 \
    + ciqual_numeric.fiber.fillna(0) * 2

# Check that the calculated energy is consistent with the original one (when existing)
mask = ~np.isnan(ciqual_numeric['energy_eu']) & ~np.isnan(ciqual_numeric['energy_eu_calc'])
ciqual_numeric["rel_diff"] = np.abs(ciqual_numeric['energy_eu'] - ciqual_numeric['energy_eu_calc']) / np.maximum(ciqual_numeric['energy_eu'], ciqual_numeric['energy_eu_calc'])
# Max 25% difference
assert (ciqual_numeric["rel_diff"][mask] > 0.25).sum() == 0
# Max average 1% difference
assert (ciqual_numeric["rel_diff"][mask].mean() > 0.01).sum() == 0

is_energy_missing = ((ciqual.energy_eu == "-") | (ciqual.energy_eu.isna()))
ciqual_edited.loc[is_energy_missing, "energy_eu_kj"] = (ciqual_numeric.loc[is_energy_missing, "energy_eu_calc"] * 4.184).round(1)
ciqual_edited.loc[is_energy_missing, "energy_eu"] = ciqual_numeric.loc[is_energy_missing, "energy_eu_calc"].round(1)

# Check whether there was any edit
is_original = (ciqual == ciqual_edited) | (ciqual.isna() & ciqual_edited.isna())

ciqual_edited = ciqual_edited.apply(pd.to_numeric)
ciqual_edited = ciqual_edited*10 # 100 g to 1 kg

# Set the source based on whether there was any edit
ciqual_edited["source"] = "CIQUAL2020_2020_07_07"
ciqual_edited.loc[~is_original.all(axis=1),"source"] = "CIQUAL2020_2020_07_07_edited"

# Set for which rows the energy was recalculated 
ciqual_edited["is_energy_recalculated"] = False
ciqual_edited.loc[(is_energy_missing) &
                  (~ciqual_edited['energy_eu'].isna()), 'is_energy_recalculated'] = True

#%%
# Create the nutritional datatabase combining CIQUAL and CALNUT
# CIQUAL is used for those entries that are not present in CALNUT
ciqual_only = ciqual_edited.loc[[x for x in ciqual_edited.index if x not in calnut_pivot.index]]
ciqual_only.drop(["energy_eu","energy_eu_kj","proteins_eu"],axis=1,inplace=True)
nutr = pd.concat([ciqual_only,
                 calnut_pivot])

# Add also Energy and Proteins accordingt to UE Regulation N° 1169/2011
# which are only in CIQUAL
nutr = ciqual_edited.loc[:,["energy_eu","proteins_eu"]].merge(nutr,left_index=True,right_index=True)
nutr = nutr.reset_index()
#%%
# get Agribalyse 3.2
# https://doc.agribalyse.fr/documentation-en/agribalyse-data/data-access
agribalyse = pd.read_csv("https://data.ademe.fr/data-fair/api/v1/datasets/agribalyse-31-synthese/lines?size=10000&page=1&format=csv")
assert hashlib.sha256(pd.util.hash_pandas_object(agribalyse, index=True).values).hexdigest() == "267b65ae1694194e71fddde575d0bc721807c33c811b30add02c0b7eb96cffd9"
# rename columns to English short keys
agribalyse = agribalyse.rename(transl.set_index("Keyword")["Short Name"].to_dict(),axis=1)

#%%
# Create the final database
food = pd.merge(agribalyse,
                nutr,
                on="ciqual_code",
                how="inner")

assert len(np.unique(food.agb_code)) == 2446
assert len(np.unique(food.ciqual_code)) == 2420

nutr_filtered = food[["agb_code", "lci_name"] + list(nutr.columns)]
agribalyse_filtered = food.loc[:,agribalyse.columns]
agribalyse_filtered["source"] = "AGRIBALYSE3.2"


#%%
# Save files
nutr_filtered.to_csv(os.path.join(dir_path,"nutrition.csv"),index=False)
agribalyse_filtered.to_csv(os.path.join(dir_path,"environment.csv"),index=False)
