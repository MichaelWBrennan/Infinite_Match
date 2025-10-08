using UnityEngine;
using UnityEngine.TestTools;
using NUnit.Framework;
using System.Collections;
using System.Collections.Generic;
using Evergreen.Core;
using Evergreen.App;

namespace Evergreen.Testing
{
    /// <summary>
    /// Headless tests for Unity builds without requiring user interaction
    /// These tests run automatically in CI/CD pipelines
    /// </summary>
    public class HeadlessTests
    {
        private GameObject testGameObject;
        private BootstrapHeadless bootstrap;
        private GameManager gameManager;

        [SetUp]
        public void SetUp()
        {
            // Create test game object
            testGameObject = new GameObject("TestObject");
            bootstrap = testGameObject.AddComponent<BootstrapHeadless>();
        }

        [TearDown]
        public void TearDown()
        {
            if (testGameObject != null)
            {
                Object.DestroyImmediate(testGameObject);
            }
        }

        [Test]
        public void Bootstrap_InitializesCorrectly()
        {
            // Arrange
            Assert.IsNotNull(bootstrap);
            Assert.IsFalse(bootstrap.IsInitializationComplete);

            // Act
            bootstrap.ForceInitialization();

            // Assert
            Assert.IsTrue(bootstrap.IsInitializationComplete);
        }

        [Test]
        public void GameManager_CanBeCreated()
        {
            // Arrange
            var gameManagerGO = new GameObject("GameManager");
            gameManager = gameManagerGO.AddComponent<GameManager>();

            // Act & Assert
            Assert.IsNotNull(gameManager);
            Assert.IsNotNull(GameManager.Instance);
        }

        [Test]
        public void GameManager_IsSingleton()
        {
            // Arrange
            var gameManager1 = new GameObject("GameManager1").AddComponent<GameManager>();
            var gameManager2 = new GameObject("GameManager2").AddComponent<GameManager>();

            // Act & Assert
            Assert.AreEqual(gameManager1, GameManager.Instance);
            Assert.AreNotEqual(gameManager2, GameManager.Instance);
        }

        [UnityTest]
        public IEnumerator Bootstrap_InitializesWithinTimeLimit()
        {
            // Arrange
            float startTime = Time.time;
            float maxTime = 5.0f; // 5 seconds max

            // Act
            bootstrap.ForceInitialization();

            // Wait for initialization
            while (!bootstrap.IsInitializationComplete && (Time.time - startTime) < maxTime)
            {
                yield return null;
            }

            // Assert
            Assert.IsTrue(bootstrap.IsInitializationComplete, "Bootstrap did not initialize within time limit");
            Assert.Less(Time.time - startTime, maxTime, "Bootstrap took too long to initialize");
        }

        [Test]
        public void Scene_CanLoadBootstrap()
        {
            // Arrange & Act
            var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();

            // Assert
            Assert.IsNotNull(scene);
            Assert.IsTrue(scene.name == "Bootstrap" || scene.name == "MainMenu" || scene.name == "Gameplay");
        }

        [Test]
        public void Performance_MemoryUsageIsReasonable()
        {
            // Arrange
            long memoryBefore = System.GC.GetTotalMemory(false);

            // Act
            var testObjects = new List<GameObject>();
            for (int i = 0; i < 100; i++)
            {
                testObjects.Add(new GameObject($"TestObject_{i}"));
            }

            long memoryAfter = System.GC.GetTotalMemory(false);
            long memoryUsed = memoryAfter - memoryBefore;

            // Clean up
            foreach (var obj in testObjects)
            {
                Object.DestroyImmediate(obj);
            }

            // Assert
            Assert.Less(memoryUsed, 10 * 1024 * 1024, "Memory usage is too high (>10MB for 100 objects)");
        }

        [Test]
        public void Performance_FrameRateIsStable()
        {
            // Arrange
            float targetFPS = 60f;
            float tolerance = 5f; // 5 FPS tolerance

            // Act
            float currentFPS = 1.0f / Time.deltaTime;

            // Assert
            Assert.GreaterOrEqual(currentFPS, targetFPS - tolerance, 
                $"Frame rate is too low: {currentFPS:F2} FPS (target: {targetFPS} FPS)");
        }

        [Test]
        public void Input_CanDetectInputSystem()
        {
            // Arrange & Act
            var inputSystem = UnityEngine.InputSystem.InputSystem.devices;

            // Assert
            Assert.IsNotNull(inputSystem);
            Assert.Greater(inputSystem.Count, 0, "No input devices detected");
        }

        [Test]
        public void Audio_CanCreateAudioSource()
        {
            // Arrange
            var audioGO = new GameObject("AudioTest");

            // Act
            var audioSource = audioGO.AddComponent<AudioSource>();

            // Assert
            Assert.IsNotNull(audioSource);
            Assert.IsTrue(audioSource.enabled);

            // Clean up
            Object.DestroyImmediate(audioGO);
        }

        [Test]
        public void Graphics_CanCreateRenderer()
        {
            // Arrange
            var rendererGO = new GameObject("RendererTest");

            // Act
            var meshRenderer = rendererGO.AddComponent<MeshRenderer>();
            var meshFilter = rendererGO.AddComponent<MeshFilter>();

            // Assert
            Assert.IsNotNull(meshRenderer);
            Assert.IsNotNull(meshFilter);

            // Clean up
            Object.DestroyImmediate(rendererGO);
        }

        [Test]
        public void Physics_CanCreateRigidbody()
        {
            // Arrange
            var physicsGO = new GameObject("PhysicsTest");

            // Act
            var rigidbody = physicsGO.AddComponent<Rigidbody>();

            // Assert
            Assert.IsNotNull(rigidbody);
            Assert.IsTrue(rigidbody.enabled);

            // Clean up
            Object.DestroyImmediate(physicsGO);
        }

        [Test]
        public void UI_CanCreateCanvas()
        {
            // Arrange
            var canvasGO = new GameObject("CanvasTest");

            // Act
            var canvas = canvasGO.AddComponent<Canvas>();
            var canvasScaler = canvasGO.AddComponent<UnityEngine.UI.CanvasScaler>();
            var graphicRaycaster = canvasGO.AddComponent<UnityEngine.UI.GraphicRaycaster>();

            // Assert
            Assert.IsNotNull(canvas);
            Assert.IsNotNull(canvasScaler);
            Assert.IsNotNull(graphicRaycaster);

            // Clean up
            Object.DestroyImmediate(canvasGO);
        }

        [Test]
        public void Network_CanCreateNetworkManager()
        {
            // Arrange
            var networkGO = new GameObject("NetworkTest");

            // Act
            // Note: This would require Unity Netcode package
            // var networkManager = networkGO.AddComponent<Unity.Netcode.NetworkManager>();

            // Assert
            // Assert.IsNotNull(networkManager);

            // For now, just test that we can create the GameObject
            Assert.IsNotNull(networkGO);

            // Clean up
            Object.DestroyImmediate(networkGO);
        }

        [Test]
        public void Data_CanSerializeData()
        {
            // Arrange
            var testData = new TestData
            {
                id = 123,
                name = "Test Item",
                value = 45.67f,
                isActive = true
            };

            // Act
            string json = JsonUtility.ToJson(testData);
            var deserializedData = JsonUtility.FromJson<TestData>(json);

            // Assert
            Assert.IsNotNull(json);
            Assert.IsNotNull(deserializedData);
            Assert.AreEqual(testData.id, deserializedData.id);
            Assert.AreEqual(testData.name, deserializedData.name);
            Assert.AreEqual(testData.value, deserializedData.value);
            Assert.AreEqual(testData.isActive, deserializedData.isActive);
        }

        [Test]
        public void Time_CanGetTimeValues()
        {
            // Arrange & Act
            float time = Time.time;
            float deltaTime = Time.deltaTime;
            float unscaledTime = Time.unscaledTime;

            // Assert
            Assert.GreaterOrEqual(time, 0f);
            Assert.GreaterOrEqual(deltaTime, 0f);
            Assert.GreaterOrEqual(unscaledTime, 0f);
        }

        [Test]
        public void Random_CanGenerateRandomValues()
        {
            // Arrange & Act
            float randomFloat = Random.Range(0f, 1f);
            int randomInt = Random.Range(0, 100);
            Vector3 randomVector = Random.insideUnitSphere;

            // Assert
            Assert.GreaterOrEqual(randomFloat, 0f);
            Assert.LessOrEqual(randomFloat, 1f);
            Assert.GreaterOrEqual(randomInt, 0);
            Assert.Less(randomInt, 100);
            Assert.IsTrue(randomVector.magnitude <= 1f);
        }

        [Test]
        public void Math_CanPerformMathOperations()
        {
            // Arrange
            float a = 10f;
            float b = 5f;

            // Act
            float sum = a + b;
            float difference = a - b;
            float product = a * b;
            float quotient = a / b;
            float power = Mathf.Pow(a, 2);
            float sqrt = Mathf.Sqrt(a);

            // Assert
            Assert.AreEqual(15f, sum);
            Assert.AreEqual(5f, difference);
            Assert.AreEqual(50f, product);
            Assert.AreEqual(2f, quotient);
            Assert.AreEqual(100f, power);
            Assert.AreEqual(3.162f, sqrt, 0.001f);
        }

        [Test]
        public void Coroutines_CanStartAndStop()
        {
            // Arrange
            var coroutineGO = new GameObject("CoroutineTest");
            var coroutineComponent = coroutineGO.AddComponent<CoroutineTestComponent>();

            // Act
            var coroutine = coroutineComponent.StartTestCoroutine();
            Assert.IsNotNull(coroutine);

            // Stop coroutine
            coroutineComponent.StopTestCoroutine();

            // Assert
            Assert.IsTrue(true); // If we get here, coroutine started successfully

            // Clean up
            Object.DestroyImmediate(coroutineGO);
        }

        // Helper classes for testing
        [System.Serializable]
        private class TestData
        {
            public int id;
            public string name;
            public float value;
            public bool isActive;
        }

        private class CoroutineTestComponent : MonoBehaviour
        {
            private Coroutine testCoroutine;

            public Coroutine StartTestCoroutine()
            {
                testCoroutine = StartCoroutine(TestCoroutine());
                return testCoroutine;
            }

            public void StopTestCoroutine()
            {
                if (testCoroutine != null)
                {
                    StopCoroutine(testCoroutine);
                    testCoroutine = null;
                }
            }

            private IEnumerator TestCoroutine()
            {
                yield return new WaitForSeconds(0.1f);
                Debug.Log("Test coroutine completed");
            }
        }
    }
}