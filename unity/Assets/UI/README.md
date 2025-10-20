# Industry Standard UI System

This directory contains a comprehensive UI system designed to match the visual standards of industry-leading match-3 games like Candy Crush Saga, Gardenscapes, Homescapes, and Royal Match.

## Overview

The Industry Standard UI System provides:

- **Modern Visual Design**: Color schemes, typography, and layouts based on top-grossing mobile games
- **Responsive Design**: Automatic adaptation to different screen sizes and orientations
- **Smooth Animations**: Industry-standard animations and transitions
- **Accessibility Support**: High contrast, large text, and screen reader support
- **Component-Based Architecture**: Reusable UI components for consistent design

## Files Structure

```
UI/
├── IndustryStandardUIConfig.json          # Main UI configuration
├── ModernUIComponents.json                # UI component definitions
├── Match3UIElements.json                  # Updated UI elements
├── ResponsiveUIConfig.json                # Responsive design settings
├── UIAnimations.json                      # Animation configurations
└── README.md                              # This file
```

## Key Features

### 1. Color Palette
Based on successful match-3 games:
- **Candy Pink**: `#FA73A6` - Primary brand color
- **Candy Blue**: `#3399E6` - Secondary actions
- **Candy Green**: `#66CC66` - Success states
- **Candy Yellow**: `#FFE633` - Highlights and stars
- **Candy Orange**: `#FF9933` - Warnings and energy
- **Candy Purple**: `#B34DE6` - Special features

### 2. Typography
- **Primary Font**: Arial (industry standard)
- **Display Font**: Arial Black (for titles)
- **Font Sizes**: 14px to 72px with proper scaling
- **Font Weights**: Light (300) to Black (900)

### 3. Component System
- **Buttons**: Primary, secondary, and icon buttons with hover/click animations
- **Panels**: Info panels, modal panels with rounded corners and shadows
- **Progress Bars**: Animated progress bars with text overlays
- **Boosters**: Interactive booster buttons with count displays
- **Text Elements**: Title, subtitle, body, and score text with proper styling

### 4. Responsive Design
Supports all major screen sizes:
- **Mobile Portrait**: 720x1280 (scale: 0.8x)
- **Mobile Landscape**: 1280x720 (scale: 0.9x)
- **Tablet Portrait**: 768x1024 (scale: 1.0x)
- **Tablet Landscape**: 1024x768 (scale: 1.1x)
- **Desktop**: 1920x1080 (scale: 1.2x)

### 5. Animations
Industry-standard animations:
- **Button Hover**: Scale up with brightness increase
- **Button Click**: Scale down with color change
- **Score Popup**: Bounce with upward movement
- **Combo Text**: Scale and rotate effects
- **Panel Transitions**: Slide and scale animations
- **Star Pop**: Bounce with rotation

## Usage

### 1. Using the UI Manager

```csharp
using Evergreen.UI;

public class GameUIManager : MonoBehaviour
{
    private IndustryStandardUIManager uiManager;
    
    void Start()
    {
        uiManager = FindObjectOfType<IndustryStandardUIManager>();
    }
    
    public void ShowLevelComplete(int score, int stars)
    {
        uiManager.ShowLevelCompletePopup(score, stars);
    }
    
    public void UpdateScore(int newScore)
    {
        uiManager.UpdateScore(newScore);
    }
}
```

### 2. Using the Editor Tool

1. Open **Tools > Industry Standard UI Automation**
2. Configure your desired settings
3. Click **Apply All Industry Standards**
4. The tool will automatically update your UI

### 3. Manual Configuration

You can manually edit the JSON configuration files to customize:
- Colors and themes
- Animation timings
- Responsive breakpoints
- Component styles

## Configuration Examples

### Main Menu Configuration
```json
{
  "main_menu": {
    "background": {
      "type": "gradient",
      "colors": [
        [0.98, 0.45, 0.65, 1.0],
        [0.2, 0.6, 0.9, 1.0]
      ]
    },
    "logo": {
      "text": "Infinite Match",
      "font_size": 72,
      "color": [1.0, 1.0, 1.0, 1.0]
    }
  }
}
```

### Button Configuration
```json
{
  "primary_button": {
    "background_color": [0.98, 0.45, 0.65, 1.0],
    "text_color": [1.0, 1.0, 1.0, 1.0],
    "font_size": 28,
    "border_radius": 35,
    "shadow": {
      "offset": [0, 4],
      "blur": 8,
      "color": [0, 0, 0, 0.15]
    }
  }
}
```

### Animation Configuration
```json
{
  "button_hover": {
    "duration": 0.2,
    "ease_type": "EaseOut",
    "scale_to": [1.05, 1.05, 1.0],
    "color_brightness": 1.2
  }
}
```

## Best Practices

### 1. Color Usage
- Use **Candy Pink** for primary actions and important elements
- Use **Candy Blue** for secondary actions and information
- Use **Candy Green** for success states and positive feedback
- Use **Candy Yellow** for highlights and star ratings
- Use **Candy Orange** for warnings and energy systems

### 2. Typography
- Use **Arial Black** for main titles (72px)
- Use **Arial Bold** for subtitles (48px)
- Use **Arial Medium** for buttons (28px)
- Use **Arial Regular** for body text (24px)
- Use **Arial Light** for small text (18px)

### 3. Spacing
- Use **8px** for small spacing
- Use **16px** for medium spacing
- Use **24px** for large spacing
- Use **32px** for section spacing
- Use **48px** for major spacing

### 4. Border Radius
- Use **8px** for small elements
- Use **12px** for medium elements
- Use **16px** for large elements
- Use **24px** for panels
- Use **50px** for circular elements

### 5. Shadows
- Use **Light Shadow** for subtle depth
- Use **Medium Shadow** for panels and buttons
- Use **Heavy Shadow** for modals and popups

## Accessibility Features

### 1. High Contrast Mode
- Increases color contrast by 1.5x
- Improves text readability
- Better visibility for color-blind users

### 2. Large Text Mode
- Scales text by 1.5x
- Maintains layout proportions
- Improves readability for visually impaired users

### 3. Color Blind Support
- Adjusts colors for protanopia, deuteranopia, and tritanopia
- Uses patterns and shapes as additional visual cues
- Maintains usability for all users

### 4. Screen Reader Support
- Proper ARIA labels
- Semantic markup
- Keyboard navigation support

## Performance Optimization

### 1. UI Batching
- Groups UI elements for efficient rendering
- Reduces draw calls
- Improves frame rate

### 2. Texture Atlas
- Combines UI textures into atlases
- Reduces memory usage
- Improves loading times

### 3. Animation Pooling
- Reuses animation objects
- Prevents garbage collection
- Maintains smooth performance

### 4. Dynamic UI Culling
- Hides off-screen UI elements
- Reduces rendering overhead
- Improves performance on low-end devices

## Troubleshooting

### Common Issues

1. **UI not updating after configuration changes**
   - Restart the Unity editor
   - Check if the JSON files are valid
   - Verify file paths are correct

2. **Animations not working**
   - Ensure DOTween is imported
   - Check animation configuration
   - Verify component references

3. **Responsive design not working**
   - Check screen size detection
   - Verify breakpoint configuration
   - Test on different devices

4. **Colors not applying correctly**
   - Check color format (RGBA values 0-1)
   - Verify component references
   - Ensure materials are assigned

### Debug Mode

Enable debug mode to see detailed logging:
```csharp
Debug.Log("UI Manager initialized - Debug mode enabled");
```

## Contributing

When adding new UI components:

1. Follow the existing naming conventions
2. Use the established color palette
3. Include proper documentation
4. Test on all supported screen sizes
5. Ensure accessibility compliance

## References

This UI system is based on analysis of:
- **Candy Crush Saga** (King Digital Entertainment)
- **Gardenscapes** (Playrix)
- **Homescapes** (Playrix)
- **Royal Match** (Dream Games)
- **Toon Blast** (Peak Games)

## Support

For questions or issues:
1. Check this documentation
2. Review the configuration files
3. Test with the editor tool
4. Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Compatible With**: Unity 2022.3 LTS+