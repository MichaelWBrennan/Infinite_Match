
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
