# Mobile WebGL Support for Unity Games

This document explains how to enable WebGL builds for mobile devices in your Unity Match 3 game.

## Overview

WebGL builds can now run on mobile devices with proper optimization and touch support. The implementation includes:

- **Mobile Device Detection**: Automatically detects mobile devices and applies appropriate optimizations
- **Touch Input Support**: Full touch gesture recognition and input handling
- **Performance Monitoring**: Real-time performance monitoring with adaptive quality adjustment
- **Memory Management**: Mobile-specific memory optimization and cleanup
- **Battery Optimization**: Power-saving features for mobile devices

## Features

### 1. Mobile Device Detection
- Automatically detects iOS, Android, and other mobile devices
- Applies device-specific optimizations
- Provides device information to Unity

### 2. Touch Input System
- Touch start, move, and end events
- Gesture recognition (tap, swipe directions)
- Multi-touch support
- Touch-optimized UI interactions

### 3. Performance Monitoring
- Real-time FPS monitoring
- Memory usage tracking
- Adaptive quality adjustment
- Battery level monitoring
- Performance state management

### 4. Mobile Optimizations
- Reduced memory usage
- Optimized texture quality
- Frame rate adaptation
- Touch-friendly UI scaling
- Mobile viewport configuration

## Implementation

### Unity Scripts

#### MobileWebGLSupport.cs
Main mobile WebGL support system that handles:
- Device detection
- Touch input processing
- Mobile-specific optimizations
- Performance monitoring

#### MobileWebGLPerformanceMonitor.cs
Advanced performance monitoring system that:
- Monitors FPS, memory, and frame times
- Adapts quality based on performance
- Manages battery optimization
- Reports metrics to JavaScript

### JavaScript Support

#### mobile-webgl-support.js
JavaScript library that provides:
- Mobile device detection
- Touch event handling
- Performance monitoring
- Mobile viewport configuration
- Gesture recognition

### HTML Templates

Updated HTML templates include:
- Mobile viewport meta tags
- Touch event optimizations
- Mobile WebGL support scripts
- Responsive design for mobile devices
- Mobile-specific UI elements

## Usage

### Building for Mobile WebGL

1. **Build Mobile WebGL Version**:
   ```bash
   ./build-webgl-mobile.sh mobile Builds/WebGL/mobile false
   ```

2. **Build Platform-Specific Mobile Version**:
   ```bash
   ./build-webgl-mobile.sh poki Builds/WebGL/poki false
   ```

### Testing Mobile WebGL

1. **Test Features**:
   ```bash
   ./test-mobile-webgl.sh Builds/WebGL/mobile features
   ```

2. **Start Local Server**:
   ```bash
   ./test-mobile-webgl.sh Builds/WebGL/mobile local
   ```

3. **Test on Mobile Device**:
   - Open `http://[your-ip]:8000` on your mobile device
   - Test touch controls and performance
   - Check browser console for any errors

### Configuration

#### Unity WebGL Build Settings

Update `unity-webgl-build-config.json`:
```json
{
  "webgl_settings": {
    "mobile_webgl_support": true,
    "mobile_optimization": true,
    "touch_input_support": true,
    "mobile_memory_limit": 128,
    "mobile_target_framerate": 30
  }
}
```

#### Platform Configurations

Add mobile platform configuration:
```json
{
  "platform_configurations": {
    "mobile": {
      "build_path": "/workspace/Builds/WebGL/mobile/Build",
      "template_file": "mobile-webgl-template.html",
      "config_file": "mobile.json",
      "defines": ["MOBILE_WEBGL", "UNITY_WEBGL", "WEBGL_BUILD", "MOBILE_OPTIMIZATION", "TOUCH_INPUT_SUPPORT"]
    }
  }
}
```

## Mobile-Specific Features

### Touch Input

The system supports various touch gestures:

- **Tap**: Single finger tap
- **Swipe**: Directional swipes (up, down, left, right)
- **Multi-touch**: Multiple finger support
- **Pinch**: Zoom gestures (if needed)

### Performance Adaptation

The system automatically adjusts quality based on:

- **FPS Performance**: Reduces quality if FPS drops below threshold
- **Memory Usage**: Triggers cleanup if memory usage is high
- **Battery Level**: Enables power saving mode on low battery
- **Device Capabilities**: Adapts to device performance level

### Mobile UI Optimizations

- **Responsive Design**: Adapts to different screen sizes
- **Touch-Friendly**: Larger touch targets and spacing
- **Viewport Configuration**: Proper mobile viewport settings
- **Orientation Support**: Handles device rotation

## Browser Compatibility

### Supported Mobile Browsers

- **iOS Safari**: iOS 14.0+
- **Chrome Mobile**: Android 8.0+
- **Firefox Mobile**: Android 8.0+
- **Samsung Internet**: Android 8.0+
- **Edge Mobile**: Android 8.0+

### WebGL Requirements

- **WebGL 2.0**: Required for optimal performance
- **WebGL 1.0**: Fallback support with reduced features
- **WebAssembly**: Required for Unity WebGL builds
- **Touch Events**: Required for touch input

## Performance Guidelines

### Memory Management

- **Target Memory**: 128MB for mobile devices
- **Texture Optimization**: Reduced texture quality on mobile
- **Asset Streaming**: Load assets as needed
- **Garbage Collection**: Regular cleanup to prevent memory leaks

### Frame Rate Optimization

- **Target FPS**: 30 FPS for mobile devices
- **Adaptive Quality**: Automatically adjusts based on performance
- **Battery Saving**: Reduces to 20 FPS on low battery
- **Thermal Management**: Prevents device overheating

### Touch Optimization

- **Touch Sensitivity**: Configurable touch sensitivity
- **Gesture Thresholds**: Adjustable gesture recognition
- **Multi-touch**: Support for multiple simultaneous touches
- **Touch Feedback**: Visual feedback for touch interactions

## Troubleshooting

### Common Issues

1. **WebGL Not Supported**:
   - Check browser WebGL support
   - Update browser to latest version
   - Enable hardware acceleration

2. **Poor Performance**:
   - Check device capabilities
   - Reduce quality settings
   - Monitor memory usage
   - Check for background apps

3. **Touch Not Working**:
   - Check touch event support
   - Verify gesture thresholds
   - Test on different devices
   - Check browser touch settings

4. **Memory Issues**:
   - Monitor memory usage
   - Trigger garbage collection
   - Reduce texture quality
   - Unload unused assets

### Debug Information

Enable debug logging to troubleshoot issues:

```javascript
// In mobile-webgl-support.js
console.log('Mobile WebGL Debug Info:', {
    isMobile: MobileWebGLSupport.isMobileDevice,
    deviceInfo: MobileWebGLSupport.getDeviceInfo(),
    performance: MobileWebGLSupport.getPerformanceMetrics()
});
```

## Best Practices

### Development

1. **Test Early and Often**: Test on actual mobile devices during development
2. **Monitor Performance**: Use performance monitoring tools
3. **Optimize Assets**: Compress textures and audio for mobile
4. **Handle Errors**: Implement proper error handling for mobile-specific issues

### Deployment

1. **CDN Usage**: Use CDN for faster asset loading
2. **Compression**: Enable gzip/brotli compression
3. **Caching**: Implement proper caching strategies
4. **Monitoring**: Monitor performance and errors in production

### User Experience

1. **Loading Screens**: Show progress during WebGL loading
2. **Fallback Options**: Provide fallback for unsupported devices
3. **Touch Feedback**: Provide visual feedback for touch interactions
4. **Performance Warnings**: Warn users about performance issues

## Future Enhancements

### Planned Features

- **WebXR Support**: Virtual and augmented reality support
- **Progressive Web App**: PWA capabilities for mobile
- **Offline Support**: Offline gameplay capabilities
- **Cloud Save**: Cross-device save synchronization
- **Social Features**: Mobile-specific social integrations

### Performance Improvements

- **WebAssembly SIMD**: SIMD instructions for better performance
- **Web Workers**: Background processing for better responsiveness
- **WebGL 2.0 Features**: Advanced WebGL features for better graphics
- **Memory Pools**: Object pooling for better memory management

## Conclusion

Mobile WebGL support enables your Unity games to run on mobile devices with proper optimization and touch support. The implementation provides automatic device detection, performance monitoring, and adaptive quality adjustment to ensure the best possible experience on mobile devices.

For questions or issues, please refer to the troubleshooting section or check the test reports generated by the testing scripts.