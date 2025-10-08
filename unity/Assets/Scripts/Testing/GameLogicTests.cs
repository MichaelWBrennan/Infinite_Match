using System.Collections.Generic;
using UnityEngine;
using Evergreen.Match3;
using Evergreen.Core;

namespace Evergreen.Testing
{
    /// <summary>
    /// Unit tests for core game logic
    /// </summary>
    public class GameLogicTests : MonoBehaviour
    {
        [Header("Test Settings")]
        public bool runTestsOnStart = false;
        public bool enableDetailedLogging = true;

        void Start()
        {
            if (runTestsOnStart)
            {
                RunAllTests();
            }
        }

        [ContextMenu("Run All Tests")]
        public void RunAllTests()
        {
            Logger.Info("Starting game logic tests", "Testing");
            
            var testResults = new List<TestResult>();
            
            // Board tests
            testResults.AddRange(RunBoardTests());
            
            // Game state tests
            testResults.AddRange(RunGameStateTests());
            
            // Performance tests
            testResults.AddRange(RunPerformanceTests());
            
            // Log results
            LogTestResults(testResults);
        }

        private List<TestResult> RunBoardTests()
        {
            var results = new List<TestResult>();
            
            Logger.Info("Running Board tests", "Testing");
            
            // Test 1: Board creation
            results.Add(TestBoardCreation());
            
            // Test 2: Match detection
            results.Add(TestMatchDetection());
            
            // Test 3: Special piece creation
            results.Add(TestSpecialPieceCreation());
            
            // Test 4: Board resolution
            results.Add(TestBoardResolution());
            
            return results;
        }

        private TestResult TestBoardCreation()
        {
            try
            {
                var board = new Board(new Vector2Int(8, 8), 5, 12345);
                
                Assert.IsNotNull(board, "Board should not be null");
                Assert.AreEqual(new Vector2Int(8, 8), board.Size, "Board size should match");
                Assert.AreEqual(5, board.NumColors, "Number of colors should match");
                
                // Check that board is filled with pieces
                bool hasPieces = false;
                for (int x = 0; x < board.Size.x; x++)
                {
                    for (int y = 0; y < board.Size.y; y++)
                    {
                        if (board.Grid[x, y].HasValue)
                        {
                            hasPieces = true;
                            break;
                        }
                    }
                    if (hasPieces) break;
                }
                
                Assert.IsTrue(hasPieces, "Board should have pieces");
                
                return new TestResult("Board Creation", true, "Board created successfully");
            }
            catch (System.Exception e)
            {
                return new TestResult("Board Creation", false, $"Failed: {e.Message}");
            }
        }

        private TestResult TestMatchDetection()
        {
            try
            {
                var board = new Board(new Vector2Int(8, 8), 5, 12345);
                
                // Create a simple match scenario
                board.Grid[0, 0] = Board.MakeNormal(0);
                board.Grid[1, 0] = Board.MakeNormal(0);
                board.Grid[2, 0] = Board.MakeNormal(0);
                
                var matches = board.FindMatches();
                Assert.IsTrue(matches.Count > 0, "Should detect horizontal match");
                
                return new TestResult("Match Detection", true, $"Found {matches.Count} matches");
            }
            catch (System.Exception e)
            {
                return new TestResult("Match Detection", false, $"Failed: {e.Message}");
            }
        }

        private TestResult TestSpecialPieceCreation()
        {
            try
            {
                var board = new Board(new Vector2Int(8, 8), 5, 12345);
                
                // Test rocket creation
                var rocketH = Board.MakeRocketH(0);
                var rocketV = Board.MakeRocketV(1);
                var bomb = Board.MakeBomb(2);
                var colorBomb = Board.MakeColorBomb();
                
                Assert.AreEqual(PieceKind.RocketH, rocketH.Kind, "Should create horizontal rocket");
                Assert.AreEqual(PieceKind.RocketV, rocketV.Kind, "Should create vertical rocket");
                Assert.AreEqual(PieceKind.Bomb, bomb.Kind, "Should create bomb");
                Assert.AreEqual(PieceKind.ColorBomb, colorBomb.Kind, "Should create color bomb");
                
                return new TestResult("Special Piece Creation", true, "All special pieces created correctly");
            }
            catch (System.Exception e)
            {
                return new TestResult("Special Piece Creation", false, $"Failed: {e.Message}");
            }
        }

        private TestResult TestBoardResolution()
        {
            try
            {
                var board = new Board(new Vector2Int(8, 8), 5, 12345);
                
                var result = board.ResolveBoard();
                
                Assert.IsNotNull(result, "Resolve result should not be null");
                Assert.IsTrue(result.ContainsKey("cleared"), "Result should contain cleared count");
                Assert.IsTrue(result.ContainsKey("cascades"), "Result should contain cascade count");
                
                return new TestResult("Board Resolution", true, "Board resolved successfully");
            }
            catch (System.Exception e)
            {
                return new TestResult("Board Resolution", false, $"Failed: {e.Message}");
            }
        }

        private List<TestResult> RunGameStateTests()
        {
            var results = new List<TestResult>();
            
            Logger.Info("Running GameState tests", "Testing");
            
            // Test 1: GameState initialization
            results.Add(TestGameStateInitialization());
            
            // Test 2: Currency operations
            results.Add(TestCurrencyOperations());
            
            // Test 3: Energy system
            results.Add(TestEnergysystemSafe());
            
            return results;
        }

        private TestResult TestGameStateInitialization()
        {
            try
            {
                GameState.Load();
                
                Assert.IsTrue(GameState.Coins >= 0, "Coins should be non-negative");
                Assert.IsTrue(GameState.Gems >= 0, "Gems should be non-negative");
                Assert.IsTrue(GameState.EnergyCurrent >= 0, "Energy should be non-negative");
                Assert.IsTrue(GameState.CurrentLevel >= 1, "Current level should be at least 1");
                
                return new TestResult("GameState Initialization", true, "GameState initialized correctly");
            }
            catch (System.Exception e)
            {
                return new TestResult("GameState Initialization", false, $"Failed: {e.Message}");
            }
        }

        private TestResult TestCurrencyOperations()
        {
            try
            {
                var initialCoins = GameState.Coins;
                var initialGems = GameState.Gems;
                
                // Test adding coins
                GameState.AddCoins(100);
                Assert.AreEqual(initialCoins + 100, GameState.Coins, "Should add coins correctly");
                
                // Test spending coins
                bool spent = GameState.SpendCoins(50);
                Assert.IsTrue(spent, "Should be able to spend coins");
                Assert.AreEqual(initialCoins + 50, GameState.Coins, "Should subtract coins correctly");
                
                // Test spending more than available
                bool spentTooMuch = GameState.SpendCoins(1000);
                Assert.IsFalse(spentTooMuch, "Should not be able to spend more than available");
                
                // Test gems
                GameState.AddGems(50);
                Assert.AreEqual(initialGems + 50, GameState.Gems, "Should add gems correctly");
                
                return new TestResult("Currency Operations", true, "Currency operations work correctly");
            }
            catch (System.Exception e)
            {
                return new TestResult("Currency Operations", false, $"Failed: {e.Message}");
            }
        }

        private TestResult TestEnergysystemSafe()
        {
            try
            {
                var initialEnergy = GameState.EnergyCurrent;
                
                // Test consuming energy
                bool consumed = GameState.ConsumeEnergy(1);
                Assert.IsTrue(consumed, "Should be able to consume energy");
                Assert.AreEqual(initialEnergy - 1, GameState.EnergyCurrent, "Should reduce energy correctly");
                
                // Test refilling energy
                GameState.RefillEnergy();
                Assert.AreEqual(GameState.EnergyMax, GameState.EnergyCurrent, "Should refill energy to max");
                
                return new TestResult("Energy System", true, "Energy system works correctly");
            }
            catch (System.Exception e)
            {
                return new TestResult("Energy System", false, $"Failed: {e.Message}");
            }
        }

        private List<TestResult> RunPerformanceTests()
        {
            var results = new List<TestResult>();
            
            Logger.Info("Running Performance tests", "Testing");
            
            // Test 1: Board creation performance
            results.Add(TestBoardCreationPerformance());
            
            // Test 2: Match detection performance
            results.Add(TestMatchDetectionPerformance());
            
            return results;
        }

        private TestResult TestBoardCreationPerformance()
        {
            try
            {
                using (Profiler.Start("Board Creation Performance", "Testing"))
                {
                    for (int i = 0; i < 100; i++)
                    {
                        var board = new Board(new Vector2Int(8, 8), 5, i);
                        Assert.IsNotNull(board, "Board should be created");
                    }
                }
                
                return new TestResult("Board Creation Performance", true, "Board creation performance acceptable");
            }
            catch (System.Exception e)
            {
                return new TestResult("Board Creation Performance", false, $"Failed: {e.Message}");
            }
        }

        private TestResult TestMatchDetectionPerformance()
        {
            try
            {
                var board = new Board(new Vector2Int(8, 8), 5, 12345);
                
                using (Profiler.Start("Match Detection Performance", "Testing"))
                {
                    for (int i = 0; i < 1000; i++)
                    {
                        var matches = board.FindMatches();
                        Assert.IsNotNull(matches, "Matches should be found");
                    }
                }
                
                return new TestResult("Match Detection Performance", true, "Match detection performance acceptable");
            }
            catch (System.Exception e)
            {
                return new TestResult("Match Detection Performance", false, $"Failed: {e.Message}");
            }
        }

        private void LogTestResults(List<TestResult> results)
        {
            int passed = 0;
            int failed = 0;
            
            foreach (var result in results)
            {
                if (result.Passed)
                {
                    passed++;
                    Logger.Info($"✓ {result.TestName}: {result.Message}", "Testing");
                }
                else
                {
                    failed++;
                    Logger.Error($"✗ {result.TestName}: {result.Message}", "Testing");
                }
            }
            
            Logger.Info($"Test Results: {passed} passed, {failed} failed", "Testing");
            
            if (failed == 0)
            {
                Logger.Info("All tests passed! 🎉", "Testing");
            }
            else
            {
                Logger.Warning($"{failed} tests failed. Please check the logs.", "Testing");
            }
        }
    }

    /// <summary>
    /// Test result data structure
    /// </summary>
    public class TestResult
    {
        public string TestName { get; }
        public bool Passed { get; }
        public string Message { get; }

        public TestResult(string testName, bool passed, string message)
        {
            TestName = testName;
            Passed = passed;
            Message = message;
        }
    }

    /// <summary>
    /// Simple assertion utility for testing
    /// </summary>
    public static class Assert
    {
        public static void IsTrue(bool condition, string message = "")
        {
            if (!condition)
            {
                throw new System.Exception($"Assertion failed: {message}");
            }
        }

        public static void IsFalse(bool condition, string message = "")
        {
            if (condition)
            {
                throw new System.Exception($"Assertion failed: {message}");
            }
        }

        public static void IsNotNull(object obj, string message = "")
        {
            if (obj == null)
            {
                throw new System.Exception($"Assertion failed: {message}");
            }
        }

        public static void IsNull(object obj, string message = "")
        {
            if (obj != null)
            {
                throw new System.Exception($"Assertion failed: {message}");
            }
        }

        public static void AreEqual<T>(T expected, T actual, string message = "")
        {
            if (!EqualityComparer<T>.Default.Equals(expected, actual))
            {
                throw new System.Exception($"Assertion failed: Expected {expected}, got {actual}. {message}");
            }
        }

        public static void AreNotEqual<T>(T expected, T actual, string message = "")
        {
            if (EqualityComparer<T>.Default.Equals(expected, actual))
            {
                throw new System.Exception($"Assertion failed: Expected not {expected}, got {actual}. {message}");
            }
        }
    }
}