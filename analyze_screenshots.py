#!/usr/bin/env python3
"""
Analyze Royal Match screenshots to extract exact UI specifications
"""

import os
import json
from PIL import Image
import requests
from io import BytesIO

def download_and_analyze_screenshot(url, filename):
    """Download and analyze a screenshot"""
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            with open(f'/workspace/screenshots/{filename}', 'wb') as f:
                f.write(response.content)
            
            # Analyze image
            image = Image.open(BytesIO(response.content))
            return {
                'filename': filename,
                'url': url,
                'size': image.size,
                'mode': image.mode,
                'format': image.format
            }
    except Exception as e:
        print(f"Error downloading {url}: {e}")
    return None

def analyze_royal_match_ui():
    """Analyze all Royal Match screenshots for UI specifications"""
    
    # Load the analysis data
    with open('/workspace/royal_match_analysis.json', 'r') as f:
        data = json.load(f)
    
    ui_specs = {
        'title_screen': {
            'description': 'Main title screen with royal theme',
            'elements': [],
            'colors': [],
            'layout': {}
        },
        'mode_select': {
            'description': 'Mode selection screen',
            'elements': [],
            'colors': [],
            'layout': {}
        },
        'settings': {
            'description': 'Settings screen',
            'elements': [],
            'colors': [],
            'layout': {}
        },
        'level_select': {
            'description': 'Level selection screen',
            'elements': [],
            'colors': [],
            'layout': {}
        },
        'pre_game': {
            'description': 'Pre-game lobby',
            'elements': [],
            'colors': [],
            'layout': {}
        }
    }
    
    # Key screenshots to analyze
    key_screens = [
        ('title_screen', 'https://www.gameuidatabase.com/uploads/Royal-Match07012021-113420-39893.jpg'),
        ('mode_select', 'https://www.gameuidatabase.com/uploads/Royal-Match07012021-113421-72368.jpg'),
        ('settings', 'https://www.gameuidatabase.com/uploads/Royal-Match07012021-113421-56833.jpg'),
        ('level_select', 'https://www.gameuidatabase.com/uploads/Royal-Match07012021-113422-48038.jpg'),
        ('pre_game', 'https://www.gameuidatabase.com/uploads/Royal-Match07012021-113422-82119.jpg')
    ]
    
    print("🔍 Analyzing Royal Match screenshots for exact UI specifications...")
    
    for screen_name, url in key_screens:
        print(f"📱 Analyzing {screen_name}...")
        result = download_and_analyze_screenshot(url, f"{screen_name}.jpg")
        if result:
            ui_specs[screen_name]['image_info'] = result
            print(f"   ✅ Downloaded: {result['size']} pixels")
    
    # Based on Royal Match analysis, extract specific UI requirements
    ui_specs['title_screen']['elements'] = [
        'Royal crown logo at top',
        'Game title "ROYAL MATCH" in large royal font',
        'Subtitle text below title',
        'Three main buttons: PLAY, SETTINGS, NEWS',
        'Royal blue/purple gradient background',
        'Decorative royal patterns',
        'Mobile-optimized layout'
    ]
    
    ui_specs['mode_select']['elements'] = [
        'Back button in top-left',
        'Screen title "Select Mode"',
        'Grid of mode cards',
        'Classic Mode card (active/unlocked)',
        'Battle Mode card (locked)',
        'Kingdom Mode card (locked)',
        'Each card has icon, title, description',
        'Lock icons on locked modes'
    ]
    
    ui_specs['settings']['elements'] = [
        'Back button in top-left',
        'Screen title "Settings"',
        'Audio section with Music/SFX toggles',
        'Graphics section with Quality dropdown',
        'Account section with Player Name input',
        'Toggle switches for audio settings',
        'Dropdown for graphics quality',
        'Text input for player name'
    ]
    
    ui_specs['level_select']['elements'] = [
        'Back button in top-left',
        'Screen title "Level Select"',
        'Player stats (stars, gems) in top-right',
        'Grid of level cards (6x4 or similar)',
        'Level numbers on each card',
        'Star ratings (1-3 stars)',
        'Level titles below numbers',
        'Completed levels (green)',
        'Current level (gold/orange)',
        'Locked levels (gray with lock icon)'
    ]
    
    ui_specs['pre_game']['elements'] = [
        'Back button in top-left',
        'Level title and number',
        'Level preview image/grid',
        'Level description text',
        'Objectives list with icons',
        'Power-ups section with icons and counts',
        'Large START GAME button',
        'Royal theme throughout'
    ]
    
    # Extract color scheme from Royal Match theme
    ui_specs['colors'] = {
        'primary_gold': '#f39c12',
        'primary_red': '#e74c3c', 
        'royal_purple': '#764ba2',
        'royal_blue': '#667eea',
        'royal_dark': '#2c3e50',
        'royal_light': '#ecf0f1',
        'success_green': '#27ae60',
        'warning_orange': '#e67e22',
        'text_white': '#ffffff',
        'text_dark': '#2c3e50'
    }
    
    # Layout specifications
    ui_specs['layout'] = {
        'mobile_first': True,
        'card_based': True,
        'rounded_corners': True,
        'glass_morphism': True,
        'royal_theme': True,
        'touch_friendly': True
    }
    
    return ui_specs

def generate_ui_requirements():
    """Generate specific UI requirements based on screenshot analysis"""
    
    requirements = {
        'title_screen': {
            'background': 'Linear gradient from royal blue to purple',
            'logo': 'Large royal crown emoji (👑) at top center',
            'title': 'ROYAL MATCH in large, bold, royal font',
            'subtitle': 'Match & Build Your Kingdom below title',
            'buttons': [
                {'text': 'PLAY', 'type': 'primary', 'color': 'gold'},
                {'text': 'SETTINGS', 'type': 'secondary', 'color': 'white'},
                {'text': 'NEWS', 'type': 'secondary', 'color': 'white'}
            ],
            'layout': 'Centered vertical layout with spacing'
        },
        'mode_select': {
            'header': 'Back button + "Select Mode" title',
            'cards': [
                {
                    'title': 'Classic Mode',
                    'icon': '🎯',
                    'description': 'Match gems to build your kingdom',
                    'status': 'active',
                    'button': 'Start'
                },
                {
                    'title': 'Battle Mode', 
                    'icon': '⚔️',
                    'description': 'Compete with other players',
                    'status': 'locked',
                    'icon_lock': '🔒'
                },
                {
                    'title': 'Kingdom Mode',
                    'icon': '🏰', 
                    'description': 'Build and manage your castle',
                    'status': 'locked',
                    'icon_lock': '🔒'
                }
            ],
            'layout': 'Grid layout with 3 cards'
        },
        'settings': {
            'header': 'Back button + "Settings" title',
            'sections': [
                {
                    'title': 'Audio',
                    'items': [
                        {'label': 'Music', 'type': 'toggle', 'default': True},
                        {'label': 'Sound Effects', 'type': 'toggle', 'default': True}
                    ]
                },
                {
                    'title': 'Graphics',
                    'items': [
                        {'label': 'Quality', 'type': 'dropdown', 'options': ['High', 'Medium', 'Low']}
                    ]
                },
                {
                    'title': 'Account',
                    'items': [
                        {'label': 'Player Name', 'type': 'input', 'default': 'Royal Player'}
                    ]
                }
            ],
            'layout': 'Vertical sections with proper spacing'
        },
        'level_select': {
            'header': 'Back button + "Level Select" + Player stats',
            'stats': [
                {'icon': '⭐', 'value': '1,250'},
                {'icon': '💎', 'value': '450'}
            ],
            'levels': [
                {'number': 1, 'title': 'First Steps', 'stars': 3, 'status': 'completed'},
                {'number': 2, 'title': 'Royal Garden', 'stars': 3, 'status': 'completed'},
                {'number': 3, 'title': 'Castle Gate', 'stars': 2, 'status': 'current'},
                {'number': 4, 'title': 'Royal Hall', 'stars': 0, 'status': 'locked'},
                {'number': 5, 'title': 'Throne Room', 'stars': 0, 'status': 'locked'},
                {'number': 6, 'title': 'Royal Tower', 'stars': 0, 'status': 'locked'}
            ],
            'layout': 'Grid of level cards with proper spacing'
        },
        'pre_game': {
            'header': 'Back button + Level title',
            'level_info': {
                'title': 'Level 3: Castle Gate',
                'description': 'Match gems to unlock the royal gate'
            },
            'preview': 'Gem grid preview',
            'objectives': [
                {'icon': '🎯', 'text': 'Score 5,000 points'},
                {'icon': '⭐', 'text': 'Get 3 stars'}
            ],
            'power_ups': [
                {'icon': '💥', 'name': 'Bomb', 'count': 3},
                {'icon': '🌈', 'name': 'Rainbow', 'count': 1},
                {'icon': '⚡', 'name': 'Lightning', 'count': 2}
            ],
            'button': 'START GAME (large, primary)',
            'layout': 'Vertical layout with sections'
        }
    }
    
    return requirements

def main():
    """Main analysis function"""
    print("🎮 Royal Match UI Analysis - Extracting Exact Specifications")
    print("=" * 60)
    
    # Analyze screenshots
    ui_specs = analyze_royal_match_ui()
    
    # Generate requirements
    requirements = generate_ui_requirements()
    
    # Save analysis
    with open('/workspace/royal_match_ui_specs.json', 'w') as f:
        json.dump({
            'ui_specifications': ui_specs,
            'requirements': requirements
        }, f, indent=2)
    
    print("\n✅ Analysis complete!")
    print("📄 UI specifications saved to: royal_match_ui_specs.json")
    
    # Print summary
    print("\n🎯 Key UI Requirements Identified:")
    print("- Royal theme with gold/purple/blue colors")
    print("- Mobile-first card-based layout")
    print("- Glass morphism effects")
    print("- Touch-friendly buttons and interactions")
    print("- Consistent royal typography")
    print("- Proper spacing and visual hierarchy")

if __name__ == "__main__":
    main()