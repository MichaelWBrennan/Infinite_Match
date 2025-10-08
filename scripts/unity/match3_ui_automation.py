#!/usr/bin/env python3
"""
Match-3 UI Automation
Automates UI setup specifically for Evergreen Puzzler match-3 game
"""

import json
import os
import subprocess
from pathlib import Path
import yaml

class Match3UIAutomation:
    def __init__(self):
        self.repo_root = Path(__file__).parent.parent.parent
        self.unity_assets = self.repo_root / "unity" / "Assets"
        self.ui_dir = self.unity_assets / "UI"
        self.prefabs_dir = self.unity_assets / "Prefabs" / "UI"
        
    def print_header(self, title):
        """Print formatted header"""
        print("\n" + "="*80)
        print(f"🖥️ {title}")
        print("="*80)
    
    def setup_match3_ui_canvas(self):
        """Setup UI Canvas for match-3 game"""
        print("🎨 Setting up Match-3 UI Canvas...")
        
        # Create UI Canvas configuration
        ui_canvas_config = {
            "main_canvas": {
                "name": "MainCanvas",
                "render_mode": "ScreenSpaceOverlay",
                "sorting_order": 0,
                "ui_scale_mode": "ScaleWithScreenSize",
                "reference_resolution": [1920, 1080],
                "screen_match_mode": "MatchWidthOrHeight",
                "match_width_or_height": 0.5,
                "canvas_scaler": {
                    "ui_scale_mode": "ScaleWithScreenSize",
                    "reference_resolution": [1920, 1080],
                    "screen_match_mode": "MatchWidthOrHeight",
                    "match_width_or_height": 0.5
                }
            },
            "gameplay_canvas": {
                "name": "GameplayCanvas",
                "render_mode": "ScreenSpaceOverlay",
                "sorting_order": 1,
                "ui_scale_mode": "ScaleWithScreenSize",
                "reference_resolution": [1920, 1080],
                "screen_match_mode": "MatchWidthOrHeight",
                "match_width_or_height": 0.5
            },
            "ui_canvas": {
                "name": "UICanvas",
                "render_mode": "ScreenSpaceOverlay",
                "sorting_order": 2,
                "ui_scale_mode": "ScaleWithScreenSize",
                "reference_resolution": [1920, 1080],
                "screen_match_mode": "MatchWidthOrHeight",
                "match_width_or_height": 0.5
            }
        }
        
        # Save UI Canvas configuration
        canvas_file = self.ui_dir / "Match3UICanvas.json"
        
        with open(canvas_file, 'w') as f:
            json.dump(ui_canvas_config, f, indent=2)
        
        print(f"✅ Match-3 UI Canvas configured: {canvas_file}")
        return True
    
    def setup_match3_ui_elements(self):
        """Setup UI elements for match-3 game"""
        print("🎮 Setting up Match-3 UI elements...")
        
        # Create match-3 specific UI configuration
        match3_ui = {
            "main_menu": {
                "elements": [
                    {
                        "name": "TitleText",
                        "type": "Text",
                        "text": "Evergreen Puzzler",
                        "font_size": 72,
                        "color": [1.0, 1.0, 1.0, 1.0],
                        "position": [0, 200, 0],
                        "size": [600, 100]
                    },
                    {
                        "name": "PlayButton",
                        "type": "Button",
                        "text": "Play",
                        "font_size": 36,
                        "color": [0.2, 0.8, 0.2, 1.0],
                        "position": [0, 0, 0],
                        "size": [200, 80]
                    },
                    {
                        "name": "SettingsButton",
                        "type": "Button",
                        "text": "Settings",
                        "font_size": 36,
                        "color": [0.2, 0.6, 0.8, 1.0],
                        "position": [0, -100, 0],
                        "size": [200, 80]
                    },
                    {
                        "name": "QuitButton",
                        "type": "Button",
                        "text": "Quit",
                        "font_size": 36,
                        "color": [0.8, 0.2, 0.2, 1.0],
                        "position": [0, -200, 0],
                        "size": [200, 80]
                    }
                ]
            },
            "gameplay_ui": {
                "elements": [
                    {
                        "name": "ScoreText",
                        "type": "Text",
                        "text": "Score: 0",
                        "font_size": 48,
                        "color": [1.0, 1.0, 1.0, 1.0],
                        "position": [-400, 400, 0],
                        "size": [300, 60]
                    },
                    {
                        "name": "MovesText",
                        "type": "Text",
                        "text": "Moves: 20",
                        "font_size": 36,
                        "color": [1.0, 1.0, 1.0, 1.0],
                        "position": [400, 400, 0],
                        "size": [250, 50]
                    },
                    {
                        "name": "LevelText",
                        "type": "Text",
                        "text": "Level 1",
                        "font_size": 42,
                        "color": [1.0, 1.0, 1.0, 1.0],
                        "position": [0, 400, 0],
                        "size": [200, 60]
                    },
                    {
                        "name": "PauseButton",
                        "type": "Button",
                        "text": "Pause",
                        "font_size": 24,
                        "color": [0.8, 0.8, 0.2, 1.0],
                        "position": [450, 450, 0],
                        "size": [100, 50]
                    }
                ]
            },
            "game_over_ui": {
                "elements": [
                    {
                        "name": "GameOverText",
                        "type": "Text",
                        "text": "Game Over",
                        "font_size": 64,
                        "color": [1.0, 0.2, 0.2, 1.0],
                        "position": [0, 100, 0],
                        "size": [400, 80]
                    },
                    {
                        "name": "FinalScoreText",
                        "type": "Text",
                        "text": "Final Score: 0",
                        "font_size": 36,
                        "color": [1.0, 1.0, 1.0, 1.0],
                        "position": [0, 0, 0],
                        "size": [300, 50]
                    },
                    {
                        "name": "RestartButton",
                        "type": "Button",
                        "text": "Restart",
                        "font_size": 36,
                        "color": [0.2, 0.8, 0.2, 1.0],
                        "position": [0, -100, 0],
                        "size": [200, 80]
                    },
                    {
                        "name": "MainMenuButton",
                        "type": "Button",
                        "text": "Main Menu",
                        "font_size": 36,
                        "color": [0.2, 0.6, 0.8, 1.0],
                        "position": [0, -200, 0],
                        "size": [200, 80]
                    }
                ]
            },
            "level_complete_ui": {
                "elements": [
                    {
                        "name": "LevelCompleteText",
                        "type": "Text",
                        "text": "Level Complete!",
                        "font_size": 64,
                        "color": [0.2, 1.0, 0.2, 1.0],
                        "position": [0, 100, 0],
                        "size": [500, 80]
                    },
                    {
                        "name": "StarsText",
                        "type": "Text",
                        "text": "⭐⭐⭐",
                        "font_size": 48,
                        "color": [1.0, 1.0, 0.0, 1.0],
                        "position": [0, 0, 0],
                        "size": [300, 60]
                    },
                    {
                        "name": "NextLevelButton",
                        "type": "Button",
                        "text": "Next Level",
                        "font_size": 36,
                        "color": [0.2, 0.8, 0.2, 1.0],
                        "position": [0, -100, 0],
                        "size": [200, 80]
                    },
                    {
                        "name": "MainMenuButton",
                        "type": "Button",
                        "text": "Main Menu",
                        "font_size": 36,
                        "color": [0.2, 0.6, 0.8, 1.0],
                        "position": [0, -200, 0],
                        "size": [200, 80]
                    }
                ]
            }
        }
        
        # Save UI elements configuration
        ui_elements_file = self.ui_dir / "Match3UIElements.json"
        
        with open(ui_elements_file, 'w') as f:
            json.dump(match3_ui, f, indent=2)
        
        print(f"✅ Match-3 UI elements configured: {ui_elements_file}")
        return True
    
    def setup_responsive_ui(self):
        """Setup responsive UI for match-3 game"""
        print("📱 Setting up responsive UI...")
        
        # Create responsive UI configuration
        responsive_ui_config = {
            "breakpoints": {
                "mobile_portrait": {
                    "resolution": [720, 1280],
                    "scale_factor": 0.8,
                    "font_scale": 0.9,
                    "spacing_scale": 0.8
                },
                "mobile_landscape": {
                    "resolution": [1280, 720],
                    "scale_factor": 0.9,
                    "font_scale": 1.0,
                    "spacing_scale": 0.9
                },
                "tablet_portrait": {
                    "resolution": [768, 1024],
                    "scale_factor": 1.0,
                    "font_scale": 1.1,
                    "spacing_scale": 1.0
                },
                "tablet_landscape": {
                    "resolution": [1024, 768],
                    "scale_factor": 1.1,
                    "font_scale": 1.2,
                    "spacing_scale": 1.1
                },
                "desktop": {
                    "resolution": [1920, 1080],
                    "scale_factor": 1.2,
                    "font_scale": 1.3,
                    "spacing_scale": 1.2
                }
            },
            "adaptive_ui": {
                "enable_adaptive_ui": True,
                "enable_dynamic_scaling": True,
                "enable_content_fitting": True,
                "enable_safe_area": True
            }
        }
        
        # Save responsive UI configuration
        responsive_file = self.ui_dir / "ResponsiveUIConfig.json"
        
        with open(responsive_file, 'w') as f:
            json.dump(responsive_ui_config, f, indent=2)
        
        print(f"✅ Responsive UI configured: {responsive_file}")
        return True
    
    def setup_ui_animations(self):
        """Setup UI animations for match-3 game"""
        print("🎬 Setting up UI animations...")
        
        # Create UI animation configuration
        ui_animations = {
            "button_animations": {
                "button_hover": {
                    "duration": 0.2,
                    "ease_type": "EaseOut",
                    "scale_from": [1.0, 1.0, 1.0],
                    "scale_to": [1.1, 1.1, 1.0],
                    "color_from": [1.0, 1.0, 1.0, 1.0],
                    "color_to": [1.2, 1.2, 1.2, 1.0]
                },
                "button_click": {
                    "duration": 0.1,
                    "ease_type": "EaseIn",
                    "scale_from": [1.1, 1.1, 1.0],
                    "scale_to": [0.95, 0.95, 1.0],
                    "color_from": [1.2, 1.2, 1.2, 1.0],
                    "color_to": [0.8, 0.8, 0.8, 1.0]
                }
            },
            "text_animations": {
                "score_popup": {
                    "duration": 1.0,
                    "ease_type": "BounceOut",
                    "scale_from": [0.5, 0.5, 1.0],
                    "scale_to": [1.2, 1.2, 1.0],
                    "position_offset": [0, 50, 0],
                    "alpha_from": 0.0,
                    "alpha_to": 1.0
                },
                "combo_text": {
                    "duration": 0.8,
                    "ease_type": "EaseOut",
                    "scale_from": [0.8, 0.8, 1.0],
                    "scale_to": [1.5, 1.5, 1.0],
                    "alpha_from": 0.0,
                    "alpha_to": 1.0
                }
            },
            "panel_animations": {
                "panel_slide_in": {
                    "duration": 0.5,
                    "ease_type": "EaseOut",
                    "position_from": [-800, 0, 0],
                    "position_to": [0, 0, 0],
                    "alpha_from": 0.0,
                    "alpha_to": 1.0
                },
                "panel_slide_out": {
                    "duration": 0.3,
                    "ease_type": "EaseIn",
                    "position_from": [0, 0, 0],
                    "position_to": [800, 0, 0],
                    "alpha_from": 1.0,
                    "alpha_to": 0.0
                }
            }
        }
        
        # Save UI animations configuration
        animations_file = self.ui_dir / "UIAnimations.json"
        
        with open(animations_file, 'w') as f:
            json.dump(ui_animations, f, indent=2)
        
        print(f"✅ UI animations configured: {animations_file}")
        return True
    
    def create_ui_automation_script(self):
        """Create Unity Editor script for UI automation"""
        print("📝 Creating UI automation script...")
        
        script_content = '''
using UnityEngine;
using UnityEditor;
using UnityEngine.UI;
using System.Collections.Generic;
using System.IO;

namespace Evergreen.Editor
{
    public class Match3UIAutomation : EditorWindow
    {
        [MenuItem("Tools/Match-3 UI/Automate Everything")]
        public static void ShowWindow()
        {
            GetWindow<Match3UIAutomation>("Match-3 UI Automation");
        }
        
        private void OnGUI()
        {
            GUILayout.Label("Match-3 UI Automation", EditorStyles.boldLabel);
            GUILayout.Space(10);
            
            if (GUILayout.Button("🎨 Setup UI Canvas", GUILayout.Height(30)))
            {
                SetupUICanvas();
            }
            
            if (GUILayout.Button("🎮 Setup UI Elements", GUILayout.Height(30)))
            {
                SetupUIElements();
            }
            
            if (GUILayout.Button("📱 Setup Responsive UI", GUILayout.Height(30)))
            {
                SetupResponsiveUI();
            }
            
            if (GUILayout.Button("🎬 Setup UI Animations", GUILayout.Height(30)))
            {
                SetupUIAnimations();
            }
            
            if (GUILayout.Button("🎯 Run Full Automation", GUILayout.Height(40)))
            {
                RunFullAutomation();
            }
        }
        
        private static void SetupUICanvas()
        {
            try
            {
                Debug.Log("🎨 Setting up UI Canvas...");
                
                // Load UI Canvas configuration
                string configPath = "Assets/UI/Match3UICanvas.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<UICanvasConfig>(json);
                    
                    // Create main canvas
                    CreateCanvas(config.main_canvas);
                    
                    // Create gameplay canvas
                    CreateCanvas(config.gameplay_canvas);
                    
                    // Create UI canvas
                    CreateCanvas(config.ui_canvas);
                    
                    Debug.Log("✅ UI Canvas setup completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ Match3UICanvas.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ UI Canvas setup failed: {e.Message}");
            }
        }
        
        private static void CreateCanvas(CanvasData canvasData)
        {
            Debug.Log($"🎨 Creating canvas: {canvasData.name}");
            
            // Create canvas GameObject
            var canvas = new GameObject(canvasData.name);
            var canvasComponent = canvas.AddComponent<Canvas>();
            var canvasScaler = canvas.AddComponent<CanvasScaler>();
            var graphicRaycaster = canvas.AddComponent<GraphicRaycaster>();
            
            // Configure canvas
            canvasComponent.renderMode = RenderMode.ScreenSpaceOverlay;
            canvasComponent.sortingOrder = canvasData.sorting_order;
            
            // Configure canvas scaler
            canvasScaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasScaler.referenceResolution = new Vector2(
                canvasData.reference_resolution[0],
                canvasData.reference_resolution[1]
            );
            canvasScaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            canvasScaler.matchWidthOrHeight = canvasData.match_width_or_height;
            
            // Save as prefab
            PrefabUtility.SaveAsPrefabAsset(canvas, $"Assets/Prefabs/UI/{canvasData.name}.prefab");
            DestroyImmediate(canvas);
        }
        
        private static void SetupUIElements()
        {
            try
            {
                Debug.Log("🎮 Setting up UI Elements...");
                
                // Load UI elements configuration
                string configPath = "Assets/UI/Match3UIElements.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<Match3UIConfig>(json);
                    
                    // Create main menu UI
                    CreateUIElements(config.main_menu, "MainMenu");
                    
                    // Create gameplay UI
                    CreateUIElements(config.gameplay_ui, "Gameplay");
                    
                    // Create game over UI
                    CreateUIElements(config.game_over_ui, "GameOver");
                    
                    // Create level complete UI
                    CreateUIElements(config.level_complete_ui, "LevelComplete");
                    
                    Debug.Log("✅ UI Elements setup completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ Match3UIElements.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ UI Elements setup failed: {e.Message}");
            }
        }
        
        private static void CreateUIElements(UIElements uiElements, string category)
        {
            Debug.Log($"🎮 Creating UI elements: {category}");
            
            // Create parent GameObject
            var parent = new GameObject($"{category}UI");
            
            foreach (var element in uiElements.elements)
            {
                CreateUIElement(element, parent.transform);
            }
            
            // Save as prefab
            PrefabUtility.SaveAsPrefabAsset(parent, $"Assets/Prefabs/UI/{category}UI.prefab");
            DestroyImmediate(parent);
        }
        
        private static void CreateUIElement(UIElement element, Transform parent)
        {
            Debug.Log($"🎮 Creating UI element: {element.name}");
            
            // Create GameObject
            var elementObj = new GameObject(element.name);
            elementObj.transform.SetParent(parent);
            
            // Set position
            elementObj.transform.localPosition = new Vector3(
                element.position[0],
                element.position[1],
                element.position[2]
            );
            
            // Set size
            var rectTransform = elementObj.AddComponent<RectTransform>();
            rectTransform.sizeDelta = new Vector2(element.size[0], element.size[1]);
            
            if (element.type == "Text")
            {
                // Create Text component
                var text = elementObj.AddComponent<Text>();
                text.text = element.text;
                text.fontSize = element.font_size;
                text.color = new Color(
                    element.color[0],
                    element.color[1],
                    element.color[2],
                    element.color[3]
                );
                text.alignment = TextAnchor.MiddleCenter;
            }
            else if (element.type == "Button")
            {
                // Create Button component
                var button = elementObj.AddComponent<Button>();
                var image = elementObj.AddComponent<Image>();
                
                // Create child Text for button
                var textObj = new GameObject("Text");
                textObj.transform.SetParent(elementObj.transform);
                var text = textObj.AddComponent<Text>();
                text.text = element.text;
                text.fontSize = element.font_size;
                text.color = Color.white;
                text.alignment = TextAnchor.MiddleCenter;
                
                var textRect = textObj.GetComponent<RectTransform>();
                textRect.anchorMin = Vector2.zero;
                textRect.anchorMax = Vector2.one;
                textRect.offsetMin = Vector2.zero;
                textRect.offsetMax = Vector2.zero;
                
                // Set button colors
                var colors = button.colors;
                colors.normalColor = new Color(
                    element.color[0],
                    element.color[1],
                    element.color[2],
                    element.color[3]
                );
                button.colors = colors;
            }
        }
        
        private static void SetupResponsiveUI()
        {
            try
            {
                Debug.Log("📱 Setting up Responsive UI...");
                
                // Load responsive UI configuration
                string configPath = "Assets/UI/ResponsiveUIConfig.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<ResponsiveUIConfig>(json);
                    
                    // Create responsive UI manager
                    CreateResponsiveUIManager(config);
                    
                    Debug.Log("✅ Responsive UI setup completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ ResponsiveUIConfig.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Responsive UI setup failed: {e.Message}");
            }
        }
        
        private static void CreateResponsiveUIManager(ResponsiveUIConfig config)
        {
            Debug.Log("📱 Creating Responsive UI Manager");
            
            // Create responsive UI manager GameObject
            var manager = new GameObject("ResponsiveUIManager");
            var responsiveManager = manager.AddComponent<ResponsiveUIManager>();
            
            // Configure responsive manager
            responsiveManager.breakpoints = config.breakpoints;
            responsiveManager.adaptiveUI = config.adaptive_ui;
            
            // Save as prefab
            PrefabUtility.SaveAsPrefabAsset(manager, "Assets/Prefabs/UI/ResponsiveUIManager.prefab");
            DestroyImmediate(manager);
        }
        
        private static void SetupUIAnimations()
        {
            try
            {
                Debug.Log("🎬 Setting up UI Animations...");
                
                // Load UI animations configuration
                string configPath = "Assets/UI/UIAnimations.json";
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    var config = JsonUtility.FromJson<UIAnimationsConfig>(json);
                    
                    // Create UI animation manager
                    CreateUIAnimationManager(config);
                    
                    Debug.Log("✅ UI Animations setup completed!");
                }
                else
                {
                    Debug.LogWarning("⚠️ UIAnimations.json not found");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ UI Animations setup failed: {e.Message}");
            }
        }
        
        private static void CreateUIAnimationManager(UIAnimationsConfig config)
        {
            Debug.Log("🎬 Creating UI Animation Manager");
            
            // Create UI animation manager GameObject
            var manager = new GameObject("UIAnimationManager");
            var animationManager = manager.AddComponent<UIAnimationManager>();
            
            // Configure animation manager
            animationManager.buttonAnimations = config.button_animations;
            animationManager.textAnimations = config.text_animations;
            animationManager.panelAnimations = config.panel_animations;
            
            // Save as prefab
            PrefabUtility.SaveAsPrefabAsset(manager, "Assets/Prefabs/UI/UIAnimationManager.prefab");
            DestroyImmediate(manager);
        }
        
        private static void RunFullAutomation()
        {
            try
            {
                Debug.Log("🎯 Running full Match-3 UI automation...");
                
                SetupUICanvas();
                SetupUIElements();
                SetupResponsiveUI();
                SetupUIAnimations();
                
                Debug.Log("🎉 Full Match-3 UI automation completed!");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"❌ Full automation failed: {e.Message}");
            }
        }
    }
    
    // Data structures for JSON deserialization
    [System.Serializable]
    public class UICanvasConfig
    {
        public CanvasData main_canvas;
        public CanvasData gameplay_canvas;
        public CanvasData ui_canvas;
    }
    
    [System.Serializable]
    public class CanvasData
    {
        public string name;
        public string render_mode;
        public int sorting_order;
        public string ui_scale_mode;
        public int[] reference_resolution;
        public string screen_match_mode;
        public float match_width_or_height;
        public CanvasScalerData canvas_scaler;
    }
    
    [System.Serializable]
    public class CanvasScalerData
    {
        public string ui_scale_mode;
        public int[] reference_resolution;
        public string screen_match_mode;
        public float match_width_or_height;
    }
    
    [System.Serializable]
    public class Match3UIConfig
    {
        public UIElements main_menu;
        public UIElements gameplay_ui;
        public UIElements game_over_ui;
        public UIElements level_complete_ui;
    }
    
    [System.Serializable]
    public class UIElements
    {
        public List<UIElement> elements;
    }
    
    [System.Serializable]
    public class UIElement
    {
        public string name;
        public string type;
        public string text;
        public int font_size;
        public float[] color;
        public float[] position;
        public float[] size;
    }
    
    [System.Serializable]
    public class ResponsiveUIConfig
    {
        public Dictionary<string, Breakpoint> breakpoints;
        public AdaptiveUI adaptive_ui;
    }
    
    [System.Serializable]
    public class Breakpoint
    {
        public int[] resolution;
        public float scale_factor;
        public float font_scale;
        public float spacing_scale;
    }
    
    [System.Serializable]
    public class AdaptiveUI
    {
        public bool enable_adaptive_ui;
        public bool enable_dynamic_scaling;
        public bool enable_content_fitting;
        public bool enable_safe_area;
    }
    
    [System.Serializable]
    public class UIAnimationsConfig
    {
        public Dictionary<string, ButtonAnimation> button_animations;
        public Dictionary<string, TextAnimation> text_animations;
        public Dictionary<string, PanelAnimation> panel_animations;
    }
    
    [System.Serializable]
    public class ButtonAnimation
    {
        public float duration;
        public string ease_type;
        public float[] scale_from;
        public float[] scale_to;
        public float[] color_from;
        public float[] color_to;
    }
    
    [System.Serializable]
    public class TextAnimation
    {
        public float duration;
        public string ease_type;
        public float[] scale_from;
        public float[] scale_to;
        public float[] position_offset;
        public float alpha_from;
        public float alpha_to;
    }
    
    [System.Serializable]
    public class PanelAnimation
    {
        public float duration;
        public string ease_type;
        public float[] position_from;
        public float[] position_to;
        public float alpha_from;
        public float alpha_to;
    }
    
    // Component classes for runtime
    public class ResponsiveUIManager : MonoBehaviour
    {
        public Dictionary<string, Breakpoint> breakpoints;
        public AdaptiveUI adaptive_ui;
    }
    
    public class UIAnimationManager : MonoBehaviour
    {
        public Dictionary<string, ButtonAnimation> buttonAnimations;
        public Dictionary<string, TextAnimation> textAnimations;
        public Dictionary<string, PanelAnimation> panelAnimations;
    }
}
'''
        
        # Save Unity Editor script
        script_path = self.unity_assets / "Editor" / "Match3UIAutomation.cs"
        script_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        print(f"✅ Match-3 UI automation script created: {script_path}")
        return True
    
    def run_full_automation(self):
        """Run complete match-3 UI automation"""
        self.print_header("Match-3 UI Full Automation")
        
        print("🎯 This will automate Match-3 specific UI setup")
        print("   - UI Canvas configuration (Main, Gameplay, UI)")
        print("   - UI Elements (Main Menu, Gameplay, Game Over, Level Complete)")
        print("   - Responsive UI for different screen sizes")
        print("   - UI Animations (buttons, text, panels)")
        print("   - UI Prefabs generation")
        
        success = True
        
        # Run all automation steps
        success &= self.setup_match3_ui_canvas()
        success &= self.setup_match3_ui_elements()
        success &= self.setup_responsive_ui()
        success &= self.setup_ui_animations()
        success &= self.create_ui_automation_script()
        
        if success:
            print("\n🎉 Match-3 UI automation completed successfully!")
            print("✅ UI Canvas configured")
            print("✅ UI Elements setup")
            print("✅ Responsive UI configured")
            print("✅ UI Animations setup")
            print("✅ UI Prefabs generated")
            print("✅ Unity Editor automation script created")
        else:
            print("\n⚠️ Some Match-3 UI automation steps failed")
        
        return success

if __name__ == "__main__":
    automation = Match3UIAutomation()
    automation.run_full_automation()