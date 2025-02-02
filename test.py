import http.server
import socketserver
import threading
import time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By

# Configuration
PORT = 8001

# Start HTTP server in a separate thread
def start_server():
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving at http://localhost:{PORT}/")
        httpd.serve_forever()

# Run server in a separate thread
server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()

# Give server time to start
time.sleep(1)

# Set up Selenium WebDriver
service = Service(ChromeDriverManager().install())
options = webdriver.ChromeOptions()
options.add_argument("--headless")  # Run in headless mode (no GUI)
driver = webdriver.Chrome(service=service, options=options)

# Unittests
filename = "test.html"
url = f"http://localhost:{PORT}/{filename}"
driver.get(url)

failures = []
for entry in driver.get_log('browser'):
    if entry is not None:
        failures.append(entry)

assert(len(failures) == 0)

# Regression tests
# Food
filename = "index.html"
url = f"http://localhost:{PORT}/{filename}?i=20917&q=1000&t=&p=0&"
driver.get(url)

soup=BeautifulSoup(driver.page_source, features="html.parser")

table_footprint = soup.find('tbody', id='table-footprint')
climate = [td for td in table_footprint.find_all('td') if 'kg CO2 eq' in td.text]

table_nutrition = soup.find('tbody', id='table-nutritional')
calories = [td for td in table_nutrition.find_all('td') if 'kcal' in td.text]

assert len(climate) == 1
assert climate[0].text == "2.37 kg CO2 eq"

assert len(calories) == 1
assert calories[0].text == "1510 kcal"


# Energy
filename = "index.html"
url = f"http://localhost:{PORT}/{filename}?i=20917&q=0&e=NGEU&t=60&p=1000&"
driver.get(url)

soup=BeautifulSoup(driver.page_source, features="html.parser")

table_footprint = soup.find('tbody', id='table-footprint')
climate = [td for td in table_footprint.find_all('td') if 'kg CO2 eq' in td.text]
assert len(climate) == 1
assert climate[0].text == "0.24 kg CO2 eq"


# Close browser
driver.quit()


    