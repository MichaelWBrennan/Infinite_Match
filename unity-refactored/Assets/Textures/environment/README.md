# Environment Assets for Living World System

## Required Assets (Download from Unity Asset Store):

### 1. Skybox Materials
- **Asset Name**: "Free Skybox Pack" (Free)
- **Store ID**: Search "Free Skybox"
- **Features**: Day, night, dawn, dusk skyboxes
- **Usage**: Replace skybox materials in `SkyboxManager.cs`

### 2. Nature Assets
- **Asset Name**: "Simple Nature Pack" (Free)
- **Store ID**: Search "Free Nature Pack"
- **Features**: Trees, grass, rocks, flowers
- **Usage**: Environment decoration and atmosphere

### 3. Building Assets
- **Asset Name**: "Medieval Village Pack" (Free)
- **Store ID**: Search "Free Medieval Pack"
- **Features**: Houses, shops, buildings
- **Usage**: Village environment setup

### 4. Lighting Assets
- **Asset Name**: "Dynamic Lighting System" (Free)
- **Store ID**: Search "Free Lighting Pack"
- **Features**: Day/night lighting, atmospheric effects
- **Usage**: Lighting system integration

## Terrain Assets:

### 1. Ground Textures
- **Files**: `grass_texture.png`, `dirt_texture.png`, `stone_texture.png`
- **Source**: Free texture websites or Unity Asset Store
- **Usage**: Terrain material system

### 2. Decoration Objects
- **Files**: `fence.prefab`, `bench.prefab`, `fountain.prefab`
- **Source**: Unity Asset Store or create simple primitives
- **Usage**: Environment decoration

## Integration Instructions:

1. Download environment assets from Unity Asset Store
2. Import into Unity project
3. Replace placeholder prefabs in `/unity/Assets/Prefabs/Environment/`
4. Update `EnvironmentAssetManager.cs` with new asset references
5. Configure lighting in `LightingManager.cs`
6. Test environment changes in Living World system

## Placeholder Assets Created:
- `Tree.prefab` - Placeholder tree model
- `House.prefab` - Placeholder house model
- `Bench.prefab` - Placeholder bench model
- `Fountain.prefab` - Placeholder fountain model
- `Skybox_Day.mat` - Placeholder day skybox
- `Skybox_Night.mat` - Placeholder night skybox