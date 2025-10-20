#!/usr/bin/env python3
"""
Script to crawl and analyze game data from gameuidatabase.com
"""

import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
from bs4 import BeautifulSoup

def setup_driver():
    """Setup Chrome driver with options to bypass Cloudflare"""
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    # Execute script to remove webdriver property
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    return driver

def crawl_game_data(url):
    """Crawl the game data page"""
    driver = setup_driver()
    
    try:
        print(f"Navigating to: {url}")
        driver.get(url)
        
        # Wait for the page to load and bypass Cloudflare challenge
        print("Waiting for page to load...")
        time.sleep(10)  # Give time for Cloudflare challenge
        
        # Check if we're still on the challenge page
        page_source = driver.page_source
        if "Just a moment" in page_source or "Enable JavaScript" in page_source:
            print("Still on Cloudflare challenge page, waiting longer...")
            time.sleep(15)
            page_source = driver.page_source
        
        # Try to find any JSON data or game information
        print("Page loaded, analyzing content...")
        print(f"Page title: {driver.title}")
        print(f"Current URL: {driver.current_url}")
        
        # Look for JSON data in script tags
        soup = BeautifulSoup(page_source, 'html.parser')
        script_tags = soup.find_all('script')
        
        game_data = None
        for script in script_tags:
            if script.string and ('gameData' in script.string or 'game' in script.string.lower()):
                print("Found potential game data in script tag:")
                print(script.string[:500] + "..." if len(script.string) > 500 else script.string)
                try:
                    # Try to extract JSON data
                    if '{' in script.string and '}' in script.string:
                        start = script.string.find('{')
                        end = script.string.rfind('}') + 1
                        json_str = script.string[start:end]
                        game_data = json.loads(json_str)
                        break
                except json.JSONDecodeError:
                    continue
        
        # If no JSON found, try to extract any structured data
        if not game_data:
            print("No JSON data found, extracting page content...")
            # Look for any data attributes or structured content
            data_elements = soup.find_all(attrs={"data-game-id": True})
            if data_elements:
                print("Found elements with game data attributes")
                for elem in data_elements:
                    print(f"Element: {elem.name}, Attributes: {elem.attrs}")
        
        # Save the full page source for analysis
        with open('/workspace/game_data_page.html', 'w', encoding='utf-8') as f:
            f.write(page_source)
        
        print(f"Page source saved to game_data_page.html")
        print(f"Page source length: {len(page_source)} characters")
        
        return {
            'title': driver.title,
            'url': driver.current_url,
            'page_source_length': len(page_source),
            'game_data': game_data,
            'has_cloudflare_challenge': 'Just a moment' in page_source
        }
        
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return None
    finally:
        driver.quit()

def analyze_game_data(data):
    """Analyze the crawled game data"""
    if not data:
        print("No data to analyze")
        return
    
    print("\n" + "="*50)
    print("GAME DATA ANALYSIS")
    print("="*50)
    
    print(f"Page Title: {data['title']}")
    print(f"Final URL: {data['url']}")
    print(f"Page Source Length: {data['page_source_length']} characters")
    print(f"Cloudflare Challenge Present: {data['has_cloudflare_challenge']}")
    
    if data['game_data']:
        print("\nExtracted Game Data:")
        print(json.dumps(data['game_data'], indent=2))
    else:
        print("\nNo structured game data found in JSON format")
        print("Check the saved HTML file for manual analysis")

if __name__ == "__main__":
    url = "https://www.gameuidatabase.com/gameData.php?id=1061"
    
    print("Starting game data crawl...")
    data = crawl_game_data(url)
    analyze_game_data(data)