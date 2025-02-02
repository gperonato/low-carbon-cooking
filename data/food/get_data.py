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
# Select only the columns that exist also in CALNUT
ciqual = ciqual.loc[:,[x for x in ciqual.columns if x in calnut_pivot.columns]]
# Fix decimal
ciqual = ciqual.replace({",":"."},regex=True)
# Transformations
# - --> 0
ciqual_edited = ciqual.replace({"-":0})
# Traces --> 0
ciqual_edited = ciqual_edited.replace({"traces":0})
# Lower than value --> value
ciqual_edited = ciqual_edited.replace({"< ":""},regex=True) 

# Check whether there was any edit
is_original = (ciqual == ciqual_edited) | (ciqual.isna() & ciqual_edited.isna())

ciqual_edited = ciqual_edited.apply(pd.to_numeric)
ciqual_edited = ciqual_edited*10 # 100 g to 1 kg

# Set the source based on whether there was any edit
ciqual_edited["source"] = "CIQUAL2020_2020_07_07"
ciqual_edited.loc[~is_original.all(axis=1),"source"] = "CIQUAL2020_2020_07_07_edited"

#%%
# Create the nutritional datatabase combining CIQUAL and CALNUT
# CIQUAL is used for those entries that are not present in CALNUT
nutr = pd.concat([ciqual_edited.loc[[x for x in ciqual_edited.index if x not in calnut_pivot.index]],
                 calnut_pivot])
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

#%%
transl4 = pd.merge(translation[["Code"]],transl3,on="Code", how="left",sort=False)

transl_clean = transl4.loc[transl4.Code.isin([x for x in transl4.Code if x in list(transl3.Code)])]

transl_clean2 = pd.join(transl_clean,
                        transl4.loc[transl4.Code.isin([x for x in transl4.Code if x in list(transl3.Code)]),
                                    axis=0)


# %%
