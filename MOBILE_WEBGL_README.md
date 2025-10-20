# Unity WebGL Mobile Setup

This setup provides a mobile-optimized Unity WebGL experience with tap-to-start functionality and mobile-specific optimizations.

## Files Created

- `mobile.html` - Mobile-optimized HTML template with tap-to-start functionality
- `test-mobile-webgl.sh` - Test script for mobile WebGL functionality
- `MOBILE_WEBGL_README.md` - This documentation file

## Features

### Mobile Optimizations
- **Tap-to-Start**: Users must tap the screen to start the game (required for mobile WebGL)
- **Touch Event Handling**: Proper touch event management for mobile devices
- **Orientation Support**: Handles device rotation and screen resizing
- **Mobile Viewport**: Proper viewport configuration for mobile browsers
- **Performance Monitoring**: Loading progress and error handling
- **Responsive Design**: Adapts to different screen sizes

### Visual Design
- **Gradient Background**: Modern gradient background for the tap prompt
- **Animated Tap Indicator**: Pulsing animation to guide user interaction
- **Loading Screen**: Professional loading screen with progress bar
- **Error Handling**: User-friendly error messages with retry functionality

## Usage

### 1. Basic Setup
The mobile HTML file is already configured to work with the existing Unity WebGL build in the `Build/` directory.

### 2. Testing Locally
```bash
# Test mobile features
./test-mobile-webgl.sh Build features

# Start local server for testing
./test-mobile-webgl.sh Build local
```

### 3. Mobile Testing
1. Start the local server: `./test-mobile-webgl.sh Build local`
2. Find your computer's IP address
3. Open `http://[your-ip]:8000/mobile.html` on your mobile device
4. Tap the screen to start the game

### 4. File Structure
```
Build/
├── mobile.html          # Mobile-optimized HTML file
├── index.html           # Original desktop HTML file
├── WebGL.loader.js      # Unity WebGL loader
├── WebGL.data           # Unity game data
├── WebGL.framework.js   # Unity framework
├── WebGL.wasm           # Unity WebAssembly binary
└── WebGL.mem            # Unity memory file
```

## Mobile-Specific Features

### Touch Events
- Prevents default touch behaviors that could interfere with the game
- Handles touch start, move, and end events
- Supports multi-touch gestures

### Orientation Handling
- Automatically resizes the Unity canvas on orientation change
- Notifies Unity about screen size changes
- Maintains proper aspect ratio

### Performance Optimizations
- Uses device pixel ratio for crisp graphics
- Implements proper memory management
- Handles page visibility changes (pause/resume)

### Error Handling
- Shows user-friendly error messages
- Provides retry functionality
- Graceful fallback for unsupported features

## Browser Compatibility

### Supported Mobile Browsers
- iOS Safari 14.0+
- Chrome Mobile (Android 8.0+)
- Firefox Mobile (Android 8.0+)
- Samsung Internet (Android 8.0+)
- Edge Mobile (Android 8.0+)

### Requirements
- WebGL 2.0 support (WebGL 1.0 fallback available)
- WebAssembly support
- Touch event support
- Modern JavaScript support

## Customization

### Styling
The mobile HTML file includes comprehensive CSS for:
- Responsive design
- Touch-friendly interface
- Loading animations
- Error states
- Mobile-specific optimizations

### Unity Integration
The JavaScript code includes:
- Unity instance management
- Mobile-specific configuration
- Touch event handling
- Performance monitoring
- Error handling

## Troubleshooting

### Common Issues

1. **Game doesn't start on mobile**
   - Ensure the user taps the screen (required for mobile WebGL)
   - Check that all Unity build files are present
   - Verify WebGL support in the mobile browser

2. **Poor performance on mobile**
   - The system automatically adjusts quality based on device capabilities
   - Check browser console for performance warnings
   - Ensure device has sufficient memory

3. **Touch controls not working**
   - Verify touch event support in the browser
   - Check that touch events are not being blocked
   - Test on different mobile devices

4. **Orientation issues**
   - The system handles orientation changes automatically
   - Check that the viewport meta tag is present
   - Verify Unity canvas resizing

### Debug Information
Enable browser developer tools to see:
- Loading progress
- Touch event handling
- Performance metrics
- Error messages

## Best Practices

### Development
1. Test on actual mobile devices during development
2. Use browser developer tools mobile emulation
3. Test different screen sizes and orientations
4. Monitor performance on various devices

### Deployment
1. Use HTTPS for production (required for some mobile features)
2. Implement proper caching strategies
3. Use CDN for faster asset loading
4. Monitor performance and errors

### User Experience
1. Provide clear instructions for mobile users
2. Show loading progress
3. Handle errors gracefully
4. Optimize for touch interactions

## Future Enhancements

- Progressive Web App (PWA) support
- Offline gameplay capabilities
- Advanced touch gesture recognition
- Mobile-specific UI optimizations
- Performance analytics integration

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify all Unity build files are present
3. Test on different mobile devices and browsers
4. Review the troubleshooting section above