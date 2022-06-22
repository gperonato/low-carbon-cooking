# Low carbon cooking

This repository contains a calculator based on datatabases released by French government agencies as open data (Licence Ouverte):	
 - the <a href="https://doc.agribalyse.fr/documentation-en/">AGRIBALYSE®</a> database (v. 3.0.1 2020) provided by the French Environment Protection Agency (ADEME) containing the environmental analysis of food products; </li>
 - the <a href="https://ciqual.anses.fr/">CIQUAL</a> food composition database (v. 2020) provided by the French Agency for Food, Environmental and Occupational health safety (ANSES).</li>

Additional data regarding the carbon content of energy sources are issued from the European Environment Agency <a href="https://www.eea.europa.eu/ds_resolveuid/0320026e904e43729189fe8720b5e35d">CO2 Intensity of Electricity generation</a> (2017), the latest values from <a href="https://www.data.gouv.fr/fr/datasets/base-carbone-r-1/">ADEME's Base carbone®</a> (v 19.0 4/12/2020), and the <a href="https://www.bafu.admin.ch/bafu/en/home/topics/climate/questions-answers.html">Swiss Federal Office for the Environment</a> (2014).

Note that the Italian translation of the CIQUAL database is provided without warranty of any kind, in particular in terms of accuracy or reliability: please check the original version in French (or the official English translation) in case of doubts.

# Data pipeline

The data are downloaded and transformed from the original sources using a dataflows pipeline. The pipeline can be reproduced by running `data/getData.py`.

# API

The calculator is based on the `Recipe` class, which is available both in Python (`recipe.py`) and Javascript (`receipe.js`)


## Web app
See a running web app on www.mycookprint.com
