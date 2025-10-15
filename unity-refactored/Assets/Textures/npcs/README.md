# NPC Assets for Living World System

## Required Assets (Download from Mixamo.com):

### 1. Character Models
- **Source**: Mixamo.com (Free Adobe account required)
- **Models Needed**:
  - `VillageElder.fbx` - Elderly character with walking animation
  - `YoungAdventurer.fbx` - Young character with excited animations
  - `Merchant.fbx` - Shopkeeper character with trading gestures
  - `Child.fbx` - Child character with playful animations
  - `Guard.fbx` - Guard character with alert animations

### 2. Character Animations
- **Source**: Mixamo.com
- **Animations Needed**:
  - Idle animations (happy, sad, worried, excited)
  - Walking animations (slow, normal, fast)
  - Talking animations (gesturing, nodding)
  - Celebration animations (clapping, jumping)
  - Working animations (crafting, trading)

### 3. Character Portraits
- **Source**: Create or download from free sources
- **Files**: `elder_portrait.png`, `adventurer_portrait.png`, etc.
- **Usage**: Dialogue UI system

## Audio Assets (Download from Freesound.org):

### 1. Voice Clips
- **Files**: `npc_voice_elder.wav`, `npc_voice_adventurer.wav`, etc.
- **Source**: Freesound.org or create with TTS
- **Usage**: NPC dialogue system

### 2. Ambient Sounds
- **Files**: `village_ambient.wav`, `market_sounds.wav`
- **Source**: Freesound.org
- **Usage**: Background atmosphere

## Integration Instructions:

1. Download character models from Mixamo
2. Import into Unity project
3. Replace placeholder prefabs in `/unity/Assets/Prefabs/NPCs/`
4. Update `NPCAssetManager.cs` with new asset references
5. Configure animations in `NPCController.cs`
6. Test NPC interactions in Living World system

## Placeholder Assets Created:
- `VillageElder.prefab` - Placeholder elder character
- `YoungAdventurer.prefab` - Placeholder adventurer character
- `Merchant.prefab` - Placeholder merchant character
- `Child.prefab` - Placeholder child character
- `Guard.prefab` - Placeholder guard character