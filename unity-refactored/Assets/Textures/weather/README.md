# Weather Assets for Living World System

## Required Assets (Download from Unity Asset Store):

### 1. Rain Effects
- **Asset Name**: "Simple Rain Effect" (Free)
- **Store ID**: Search "Free Rain Effect"
- **Features**: Rain particles, splash effects, sound
- **Usage**: Replace `RainEffect.prefab` with downloaded asset

### 2. Snow Effects
- **Asset Name**: "Snow Particle System" (Free)
- **Store ID**: Search "Free Snow Effect"
- **Features**: Falling snow, wind effects
- **Usage**: Replace `SnowEffect.prefab` with downloaded asset

### 3. Sun & Lighting
- **Asset Name**: "Dynamic Sun Flare" (Free)
- **Store ID**: Search "Free Sun Flare"
- **Features**: Sun rays, god rays, atmospheric scattering
- **Usage**: Replace `SunEffect.prefab` with downloaded asset

### 4. Storm Effects
- **Asset Name**: "Weather Pack" (Free)
- **Store ID**: Search "Free Weather Pack"
- **Features**: Thunder, lightning, storm clouds
- **Usage**: Replace `StormEffect.prefab` with downloaded asset

## Audio Assets (Download from Freesound.org):

### 1. Rain Sounds
- **File**: `rain_light.wav`, `rain_heavy.wav`, `rain_thunder.wav`
- **Source**: Freesound.org (Free account required)
- **Usage**: Weather audio system

### 2. Wind Sounds
- **File**: `wind_light.wav`, `wind_strong.wav`, `wind_storm.wav`
- **Source**: Freesound.org
- **Usage**: Atmospheric audio

## Integration Instructions:

1. Download assets from Unity Asset Store
2. Import into Unity project
3. Replace placeholder prefabs in `/unity/Assets/Prefabs/Weather/`
4. Update `WeatherAssetManager.cs` with new asset references
5. Test weather effects in Living World system

## Placeholder Assets Created:
- `RainEffect.prefab` - Placeholder rain effect
- `SnowEffect.prefab` - Placeholder snow effect
- `SunEffect.prefab` - Placeholder sun effect
- `StormEffect.prefab` - Placeholder storm effect