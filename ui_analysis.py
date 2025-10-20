#!/usr/bin/env python3
"""
Comprehensive UI Analysis for Royal Match Screenshots
"""

import json
import requests
from urllib.parse import urlparse
import os

def load_game_data():
    """Load the previously extracted game data"""
    with open('/workspace/royal_match_analysis.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def download_screenshot(url, filename):
    """Download a screenshot for analysis"""
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            with open(f'/workspace/screenshots/{filename}', 'wb') as f:
                f.write(response.content)
            return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
    return False

def analyze_ui_elements_by_category():
    """Analyze UI elements based on the game data categories"""
    
    game_data = load_game_data()
    
    ui_analysis = {
        'game_title': game_data['game_title'],
        'total_screenshots': game_data['total_images'],
        'categories': {}
    }
    
    # Define UI element patterns to look for
    ui_patterns = {
        'navigation': ['menu', 'button', 'tab', 'nav', 'back', 'home', 'settings'],
        'gameplay': ['level', 'stage', 'play', 'start', 'pause', 'resume', 'retry'],
        'monetization': ['shop', 'buy', 'purchase', 'offer', 'bundle', 'deal', 'sale'],
        'social': ['friend', 'share', 'leaderboard', 'rank', 'profile', 'avatar'],
        'progress': ['score', 'star', 'coin', 'gem', 'energy', 'xp', 'level'],
        'notifications': ['news', 'update', 'notification', 'alert', 'popup', 'modal'],
        'settings': ['option', 'setting', 'config', 'preference', 'audio', 'graphics']
    }
    
    for category_name, category_data in game_data['categories'].items():
        print(f"\n🔍 Analyzing {category_name}...")
        
        category_analysis = {
            'description': get_category_description(category_name),
            'ui_elements': [],
            'design_patterns': [],
            'screenshots': []
        }
        
        for i, image in enumerate(category_data['images']):
            screenshot_analysis = analyze_individual_screenshot(image, i+1, category_name)
            category_analysis['screenshots'].append(screenshot_analysis)
            
            # Extract UI elements from description
            description = image['description'].lower()
            detected_elements = []
            
            for element_type, patterns in ui_patterns.items():
                for pattern in patterns:
                    if pattern in description:
                        detected_elements.append(element_type)
            
            category_analysis['ui_elements'].extend(detected_elements)
        
        # Remove duplicates and count
        category_analysis['ui_elements'] = list(set(category_analysis['ui_elements']))
        category_analysis['ui_element_counts'] = {elem: category_analysis['ui_elements'].count(elem) for elem in category_analysis['ui_elements']}
        
        ui_analysis['categories'][category_name] = category_analysis
    
    return ui_analysis

def get_category_description(category_name):
    """Get detailed description for each category"""
    descriptions = {
        'Title and Modals': 'Main menu screens, loading screens, and modal dialogs that serve as entry points to the game',
        'Game States': 'Core gameplay screens including level selection, pre-game lobbies, and active gameplay interfaces',
        'Stats and Resources': 'Player progression screens showing scores, achievements, and resource management',
        'Meta-Game Features': 'Additional features like news, updates, offers, and social elements that enhance the core experience',
        'HUD and Overlays': 'In-game interface elements like timers, buttons, and overlay information displayed during gameplay',
        'Related Titles': 'Screens showing similar or recommended games'
    }
    return descriptions.get(category_name, 'UI screenshots from the game')

def analyze_individual_screenshot(image_data, index, category):
    """Analyze individual screenshot based on its metadata"""
    
    description = image_data['description']
    thumbnail_url = image_data['thumbnail']
    full_image_url = image_data['full_image']
    
    # Extract filename for identification
    filename = os.path.basename(urlparse(thumbnail_url).path)
    
    # Analyze based on description keywords
    analysis = {
        'index': index,
        'filename': filename,
        'description': description,
        'thumbnail_url': thumbnail_url,
        'full_image_url': full_image_url,
        'ui_components': [],
        'design_characteristics': [],
        'interaction_elements': [],
        'visual_style': []
    }
    
    # Analyze UI components based on description
    desc_lower = description.lower()
    
    # UI Components
    if 'title' in desc_lower or 'screen' in desc_lower:
        analysis['ui_components'].append('Title Screen')
    if 'loading' in desc_lower:
        analysis['ui_components'].append('Loading Screen')
    if 'menu' in desc_lower or 'select' in desc_lower:
        analysis['ui_components'].append('Menu System')
    if 'setting' in desc_lower or 'option' in desc_lower:
        analysis['ui_components'].append('Settings Panel')
    if 'level' in desc_lower or 'stage' in desc_lower:
        analysis['ui_components'].append('Level Selection')
    if 'lobby' in desc_lower or 'pre-game' in desc_lower:
        analysis['ui_components'].append('Pre-Game Lobby')
    if 'news' in desc_lower or 'update' in desc_lower:
        analysis['ui_components'].append('News/Updates Panel')
    if 'offer' in desc_lower or 'bundle' in desc_lower:
        analysis['ui_components'].append('Monetization Panel')
    if 'clock' in desc_lower or 'timer' in desc_lower:
        analysis['ui_components'].append('Timer Display')
    if 'button' in desc_lower or 'item' in desc_lower:
        analysis['ui_components'].append('Interactive Buttons')
    if 'maintenance' in desc_lower or 'management' in desc_lower:
        analysis['ui_components'].append('Management Interface')
    
    # Design Characteristics
    if 'royal' in desc_lower or 'match' in desc_lower:
        analysis['design_characteristics'].append('Royal/Medieval Theme')
    if 'mobile' in desc_lower or 'tablet' in desc_lower:
        analysis['design_characteristics'].append('Mobile-Optimized Layout')
    
    # Interaction Elements
    if 'button' in desc_lower:
        analysis['interaction_elements'].append('Clickable Buttons')
    if 'select' in desc_lower:
        analysis['interaction_elements'].append('Selection Interface')
    if 'option' in desc_lower:
        analysis['interaction_elements'].append('Configuration Options')
    
    # Visual Style (inferred from Royal Match theme)
    analysis['visual_style'].extend([
        'Royal/Medieval Aesthetic',
        'Mobile-First Design',
        'Colorful UI Elements',
        'Card-Based Layout'
    ])
    
    return analysis

def generate_detailed_ui_report(ui_analysis):
    """Generate a detailed UI analysis report"""
    
    report = []
    report.append("# Royal Match - Detailed UI Analysis Report")
    report.append("=" * 60)
    report.append("")
    
    report.append(f"**Game**: {ui_analysis['game_title']}")
    report.append(f"**Total Screenshots Analyzed**: {ui_analysis['total_screenshots']}")
    report.append("")
    
    for category_name, category_data in ui_analysis['categories'].items():
        report.append(f"## {category_name}")
        report.append("-" * 40)
        report.append("")
        report.append(f"**Description**: {category_data['description']}")
        report.append("")
        
        # UI Elements Summary
        if category_data['ui_elements']:
            report.append("**Detected UI Elements**:")
            for element, count in category_data['ui_element_counts'].items():
                report.append(f"- {element.title()}: {count} instances")
            report.append("")
        
        # Individual Screenshot Analysis
        report.append("**Screenshot Analysis**:")
        report.append("")
        
        for screenshot in category_data['screenshots']:
            report.append(f"### Screenshot {screenshot['index']}: {screenshot['description']}")
            report.append("")
            
            if screenshot['ui_components']:
                report.append("**UI Components**:")
                for component in screenshot['ui_components']:
                    report.append(f"- {component}")
                report.append("")
            
            if screenshot['design_characteristics']:
                report.append("**Design Characteristics**:")
                for characteristic in screenshot['design_characteristics']:
                    report.append(f"- {characteristic}")
                report.append("")
            
            if screenshot['interaction_elements']:
                report.append("**Interaction Elements**:")
                for element in screenshot['interaction_elements']:
                    report.append(f"- {element}")
                report.append("")
            
            if screenshot['visual_style']:
                report.append("**Visual Style**:")
                for style in screenshot['visual_style']:
                    report.append(f"- {style}")
                report.append("")
            
            report.append(f"**Image URLs**:")
            report.append(f"- Thumbnail: {screenshot['thumbnail_url']}")
            report.append(f"- Full Image: {screenshot['full_image_url']}")
            report.append("")
            report.append("---")
            report.append("")
    
    return "\n".join(report)

def main():
    """Main analysis function"""
    print("🔍 Starting detailed UI analysis of Royal Match screenshots...")
    
    # Analyze UI elements
    ui_analysis = analyze_ui_elements_by_category()
    
    # Generate detailed report
    report = generate_detailed_ui_report(ui_analysis)
    
    # Save report
    with open('/workspace/ROYAL_MATCH_DETAILED_UI_ANALYSIS.md', 'w', encoding='utf-8') as f:
        f.write(report)
    
    # Save structured data
    with open('/workspace/royal_match_ui_analysis.json', 'w', encoding='utf-8') as f:
        json.dump(ui_analysis, f, indent=2, ensure_ascii=False)
    
    print("✅ UI analysis complete!")
    print(f"📄 Detailed report saved to: ROYAL_MATCH_DETAILED_UI_ANALYSIS.md")
    print(f"📊 Structured data saved to: royal_match_ui_analysis.json")
    
    # Print summary
    print("\n" + "="*60)
    print("UI ANALYSIS SUMMARY")
    print("="*60)
    
    for category_name, category_data in ui_analysis['categories'].items():
        print(f"\n📁 {category_name}")
        print(f"   Screenshots: {len(category_data['screenshots'])}")
        print(f"   UI Elements: {', '.join(category_data['ui_elements'])}")
        
        for screenshot in category_data['screenshots']:
            print(f"   📷 {screenshot['description']}")
            if screenshot['ui_components']:
                print(f"      Components: {', '.join(screenshot['ui_components'])}")

if __name__ == "__main__":
    main()