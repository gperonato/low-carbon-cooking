#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Feb 7 15:20 2021

@author: giuseppeperonato
"""

import dataflows
import datapackage

from dataflows import (
    Flow,
    dump_to_path,
    load,
    set_type,
    printer,
    find_replace,
    select_fields,
    join,
    duplicate,
    update_resource,
    update_schema,
)


Flow(
    load("Table Ciqual 2020_ENG_2020 07 07.xls"),
    load("Agribalyse_Synthese.csv"),
    update_schema("Table Ciqual 2020_ENG_2020 07 07", missingValues=["-", "None", ""]),
    duplicate(source="Agribalyse_Synthese", target_name="join", target_path="join.csv"),
    join(
        "Table Ciqual 2020_ENG_2020 07 07",  # Source resource
        ["alim_code"],
        "join",  # Target resource
        ["Code CIQUAL"],
        source_delete=False,
        fields={
            "Energy, Regulation EU No 1169/2011 (kcal/100g)": {
                "name": "Energy, Regulation EU No 1169/2011 (kcal/100g)",
            }
        },
    ),
    select_fields(
        [
            "Code CIQUAL",
            "LCI Name",
            "Changement climatique (kg CO2 eq/kg de produit)",
            "Energy, Regulation EU No 1169/2011 (kcal/100g)",
        ],
        resources=["join"],
    ),
    find_replace(
        [
            {
                "name": "Energy, Regulation EU No 1169/2011 (kcal/100g)",
                "patterns": [
                    {"find": "[-]", "replace": -99},
                    {"find": "\\bNone\\b", "replace": -99},
                ],
            }
        ],
        resources=["join"],
    ),
    set_type(
        "Energy, Regulation EU No 1169/2011 (kcal/100g)",
        type="number",
        decimalChar=",",
        regex=False,
        resources=["join"],
    ),
    update_schema("join", missingValues=[-99, ""]),
    dump_to_path("data"),
).process()
