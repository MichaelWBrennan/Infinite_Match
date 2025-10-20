#!/usr/bin/env python3
"""
Script to analyze the crawled game data from gameuidatabase.com
"""

import re
import json
from bs4 import BeautifulSoup
from urllib.parse import urljoin

def extract_game_data(html_file):
    """Extract structured game data from the HTML file"""
    
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    soup = BeautifulSoup(content, 'html.parser')
    
    # Extract basic game information
    game_data = {
        'game_id': '1061',
        'game_title': 'Royal Match',
        'platform': 'Mobile & Tablet',
        'url': 'https://www.gameuidatabase.com/gameData.php?id=1061',
        'categories': {},
        'images': [],
        'videos': [],
        'metadata': {}
    }
    
    # Extract title from meta tags
    title_tag = soup.find('meta', {'property': 'og:title'})
    if title_tag:
        game_data['metadata']['og_title'] = title_tag.get('content', '')
    
    # Extract description
    desc_tag = soup.find('meta', {'name': 'description'})
    if desc_tag:
        game_data['metadata']['description'] = desc_tag.get('content', '')
    
    # Extract game categories and their content
    categories = soup.find_all('h4', class_='headingGameCount gamedata_category')
    
    for category in categories:
        category_name = category.get_text(strip=True)
        category_id = category.get('id', '')
        
        # Find the next row containing images for this category
        next_row = category.find_next('div', class_='row')
        if next_row:
            images = []
            
            # Extract all image data from this category
            for item in next_row.find_all('div', class_='portfolio-item'):
                image_data = extract_image_data(item)
                if image_data:
                    images.append(image_data)
            
            game_data['categories'][category_name] = {
                'id': category_id,
                'images': images,
                'count': len(images)
            }
    
    # Extract all images with data-id="1061"
    all_images = soup.find_all('div', {'data-id': '1061'})
    for item in all_images:
        image_data = extract_image_data(item)
        if image_data:
            game_data['images'].append(image_data)
    
    # Extract video information
    video_scripts = soup.find_all('script')
    for script in video_scripts:
        if script.string and 'video' in script.string.lower():
            # Look for video URLs or references
            video_matches = re.findall(r'https://[^"\s]+\.mp4', script.string)
            for video_url in video_matches:
                game_data['videos'].append({
                    'url': video_url,
                    'type': 'mp4'
                })
    
    # Extract Firebase configuration
    firebase_config = extract_firebase_config(soup)
    if firebase_config:
        game_data['firebase_config'] = firebase_config
    
    # Extract external links
    external_links = extract_external_links(soup)
    if external_links:
        game_data['external_links'] = external_links
    
    return game_data

def extract_image_data(item):
    """Extract image data from a portfolio item"""
    try:
        # Find the image element
        img = item.find('img')
        if not img:
            return None
        
        # Find the link element
        link = item.find('a')
        if not link:
            return None
        
        # Extract data attributes
        data_thumb = link.get('data-thumb', '')
        href = link.get('href', '')
        
        # Extract image source
        src = img.get('src', '')
        
        # Extract card body text
        card_body = item.find('div', class_='card-body gamedata')
        description = ''
        if card_body:
            description = card_body.get_text(strip=True)
        
        return {
            'thumbnail': data_thumb,
            'full_image': href,
            'src': src,
            'description': description,
            'data_id': item.get('data-id', '')
        }
    except Exception as e:
        print(f"Error extracting image data: {e}")
        return None

def extract_firebase_config(soup):
    """Extract Firebase configuration from script tags"""
    scripts = soup.find_all('script')
    for script in scripts:
        if script.string and 'firebaseConfig' in script.string:
            # Extract the Firebase config object
            config_match = re.search(r'const firebaseConfig = ({.*?});', script.string, re.DOTALL)
            if config_match:
                try:
                    config_str = config_match.group(1)
                    # Clean up the config string
                    config_str = re.sub(r'//.*?\n', '', config_str)  # Remove comments
                    config_str = re.sub(r'\s+', ' ', config_str)  # Normalize whitespace
                    return json.loads(config_str)
                except json.JSONDecodeError:
                    continue
    return None

def extract_external_links(soup):
    """Extract external links from the page"""
    links = []
    
    # Find linkbar links
    linkbar = soup.find('div', id='linkbar')
    if linkbar:
        for link in linkbar.find_all('a'):
            href = link.get('href', '')
            title = link.get('title', '')
            icon = link.find('i')
            icon_class = icon.get('class', []) if icon else []
            
            links.append({
                'url': href,
                'title': title,
                'icon_classes': icon_class
            })
    
    return links

def analyze_categories(game_data):
    """Analyze the game categories and provide insights"""
    print("\n" + "="*60)
    print("GAME CATEGORIES ANALYSIS")
    print("="*60)
    
    for category_name, category_data in game_data['categories'].items():
        print(f"\n📁 {category_name}")
        print(f"   ID: {category_data['id']}")
        print(f"   Images: {category_data['count']}")
        
        # Show first few images as examples
        for i, img in enumerate(category_data['images'][:3]):
            print(f"   📷 Image {i+1}: {img['description'][:50]}...")
            print(f"      Thumbnail: {img['thumbnail']}")
            print(f"      Full Image: {img['full_image']}")

def generate_summary_report(game_data):
    """Generate a comprehensive summary report"""
    
    total_images = len(game_data['images'])
    total_categories = len(game_data['categories'])
    
    print("\n" + "="*60)
    print("ROYAL MATCH - GAME UI DATABASE ANALYSIS")
    print("="*60)
    
    print(f"\n🎮 Game Information:")
    print(f"   Title: {game_data['game_title']}")
    print(f"   ID: {game_data['game_id']}")
    print(f"   Platform: {game_data['platform']}")
    print(f"   URL: {game_data['url']}")
    
    print(f"\n📊 Content Statistics:")
    print(f"   Total Images: {total_images}")
    print(f"   Categories: {total_categories}")
    print(f"   Videos: {len(game_data['videos'])}")
    
    print(f"\n📁 Categories Breakdown:")
    for category_name, category_data in game_data['categories'].items():
        print(f"   • {category_name}: {category_data['count']} images")
    
    if game_data.get('external_links'):
        print(f"\n🔗 External Links:")
        for link in game_data['external_links']:
            print(f"   • {link['title']}: {link['url']}")
    
    if game_data.get('firebase_config'):
        print(f"\n🔥 Firebase Configuration:")
        config = game_data['firebase_config']
        print(f"   Project ID: {config.get('projectId', 'N/A')}")
        print(f"   Auth Domain: {config.get('authDomain', 'N/A')}")
        print(f"   Storage Bucket: {config.get('storageBucket', 'N/A')}")

def save_analysis_results(game_data, output_file):
    """Save the analysis results to a JSON file"""
    
    # Create a clean version for JSON serialization
    clean_data = {
        'game_id': game_data['game_id'],
        'game_title': game_data['game_title'],
        'platform': game_data['platform'],
        'url': game_data['url'],
        'total_images': len(game_data['images']),
        'total_categories': len(game_data['categories']),
        'categories': game_data['categories'],
        'sample_images': game_data['images'][:10],  # First 10 images as sample
        'external_links': game_data.get('external_links', []),
        'metadata': game_data.get('metadata', {}),
        'firebase_config': game_data.get('firebase_config', {})
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(clean_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Analysis results saved to: {output_file}")

if __name__ == "__main__":
    html_file = "/workspace/game_data_decompressed.html"
    output_file = "/workspace/royal_match_analysis.json"
    
    print("🔍 Analyzing Royal Match game data...")
    
    # Extract game data
    game_data = extract_game_data(html_file)
    
    # Generate analysis
    generate_summary_report(game_data)
    analyze_categories(game_data)
    
    # Save results
    save_analysis_results(game_data, output_file)
    
    print("\n✅ Analysis complete!")