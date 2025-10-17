using System.Collections;
using UnityEngine;
using Evergreen.Gameplay;

namespace Evergreen.Gameplay
{
    /// <summary>
    /// Handles input for Match-3 game
    /// Manages tile selection, swapping, and touch/mouse input
    /// </summary>
    public class Match3InputHandler : MonoBehaviour
    {
        [Header("Input Settings")]
        public float doubleClickTime = 0.3f;
        public float dragThreshold = 0.5f;
        public LayerMask tileLayer = 1;
        
        [Header("Visual Feedback")]
        public GameObject selectionIndicator;
        public LineRenderer dragLine;
        public ParticleSystem clickEffect;
        
        [Header("Audio")]
        public AudioClip clickSound;
        public AudioClip swapSound;
        public AudioClip invalidSound;
        
        // Input state
        private Match3Board board;
        private Match3Tile selectedTile;
        private Vector3 dragStartPosition;
        private bool isDragging = false;
        private float lastClickTime = 0f;
        
        // Camera reference
        private Camera gameCamera;
        
        // Events
        public System.Action<Match3Tile> OnTileSelected;
        public System.Action<Match3Tile, Match3Tile> OnTilesSwapped;
        public System.Action OnInputBlocked;
        
        void Start()
        {
            // Get references
            board = FindObjectOfType<Match3Board>();
            gameCamera = Camera.main;
            
            if (board == null)
            {
                Debug.LogError("Match3InputHandler: No Match3Board found!");
                return;
            }
            
            // Setup drag line
            if (dragLine != null)
            {
                dragLine.enabled = false;
                dragLine.positionCount = 2;
                dragLine.startWidth = 0.1f;
                dragLine.endWidth = 0.1f;
            }
            
            // Setup selection indicator
            if (selectionIndicator != null)
            {
                selectionIndicator.SetActive(false);
            }
            
            Debug.Log("🎮 Match-3 Input Handler initialized");
        }
        
        void Update()
        {
            if (board == null) return;
            
            HandleInput();
        }
        
        /// <summary>
        /// Handle all input types
        /// </summary>
        private void HandleInput()
        {
            // Handle mouse/touch input
            if (Input.GetMouseButtonDown(0))
            {
                HandleInputDown(Input.mousePosition);
            }
            else if (Input.GetMouseButton(0))
            {
                HandleInputHold(Input.mousePosition);
            }
            else if (Input.GetMouseButtonUp(0))
            {
                HandleInputUp(Input.mousePosition);
            }
            
            // Handle touch input
            if (Input.touchCount > 0)
            {
                Touch touch = Input.GetTouch(0);
                
                switch (touch.phase)
                {
                    case TouchPhase.Began:
                        HandleInputDown(touch.position);
                        break;
                    case TouchPhase.Moved:
                        HandleInputHold(touch.position);
                        break;
                    case TouchPhase.Ended:
                    case TouchPhase.Canceled:
                        HandleInputUp(touch.position);
                        break;
                }
            }
        }
        
        /// <summary>
        /// Handle input down
        /// </summary>
        private void HandleInputDown(Vector2 screenPosition)
        {
            Match3Tile clickedTile = GetTileAtPosition(screenPosition);
            
            if (clickedTile != null)
            {
                HandleTileClick(clickedTile);
            }
        }
        
        /// <summary>
        /// Handle input hold (dragging)
        /// </summary>
        private void HandleInputHold(Vector2 screenPosition)
        {
            if (selectedTile != null)
            {
                Vector3 worldPosition = gameCamera.ScreenToWorldPoint(screenPosition);
                worldPosition.z = 0;
                
                if (!isDragging)
                {
                    float dragDistance = Vector3.Distance(dragStartPosition, worldPosition);
                    if (dragDistance > dragThreshold)
                    {
                        StartDragging();
                    }
                }
                else
                {
                    UpdateDragLine(worldPosition);
                }
            }
        }
        
        /// <summary>
        /// Handle input up
        /// </summary>
        private void HandleInputUp(Vector2 screenPosition)
        {
            if (isDragging)
            {
                EndDragging(screenPosition);
            }
            else if (selectedTile != null)
            {
                // Check for double click
                float clickTime = Time.time;
                if (clickTime - lastClickTime < doubleClickTime)
                {
                    HandleDoubleClick(selectedTile);
                }
                else
                {
                    lastClickTime = clickTime;
                }
            }
        }
        
        /// <summary>
        /// Handle tile click
        /// </summary>
        private void HandleTileClick(Match3Tile tile)
        {
            if (selectedTile == null)
            {
                // Select first tile
                SelectTile(tile);
            }
            else if (selectedTile == tile)
            {
                // Deselect same tile
                DeselectTile();
            }
            else
            {
                // Try to swap tiles
                if (TrySwapTiles(selectedTile, tile))
                {
                    OnTilesSwapped?.Invoke(selectedTile, tile);
                }
                else
                {
                    // Invalid swap, select new tile
                    DeselectTile();
                    SelectTile(tile);
                }
            }
        }
        
        /// <summary>
        /// Handle double click
        /// </summary>
        private void HandleDoubleClick(Match3Tile tile)
        {
            // Activate special tile if applicable
            if (tile.IsSpecial)
            {
                ActivateSpecialTile(tile);
            }
        }
        
        /// <summary>
        /// Select a tile
        /// </summary>
        private void SelectTile(Match3Tile tile)
        {
            selectedTile = tile;
            selectedTile.Select();
            
            dragStartPosition = tile.transform.position;
            
            // Show selection indicator
            if (selectionIndicator != null)
            {
                selectionIndicator.SetActive(true);
                selectionIndicator.transform.position = tile.transform.position;
            }
            
            // Play click sound
            if (clickSound != null)
            {
                AudioSource.PlayClipAtPoint(clickSound, Camera.main.transform.position);
            }
            
            // Play click effect
            if (clickEffect != null)
            {
                clickEffect.transform.position = tile.transform.position;
                clickEffect.Play();
            }
            
            OnTileSelected?.Invoke(tile);
            
            Debug.Log($"🎯 Selected tile at ({tile.X}, {tile.Y})");
        }
        
        /// <summary>
        /// Deselect current tile
        /// </summary>
        private void DeselectTile()
        {
            if (selectedTile != null)
            {
                selectedTile.Deselect();
                selectedTile = null;
            }
            
            // Hide selection indicator
            if (selectionIndicator != null)
            {
                selectionIndicator.SetActive(false);
            }
            
            // Hide drag line
            if (dragLine != null)
            {
                dragLine.enabled = false;
            }
        }
        
        /// <summary>
        /// Start dragging
        /// </summary>
        private void StartDragging()
        {
            isDragging = true;
            
            // Show drag line
            if (dragLine != null)
            {
                dragLine.enabled = true;
                dragLine.SetPosition(0, selectedTile.transform.position);
            }
        }
        
        /// <summary>
        /// Update drag line
        /// </summary>
        private void UpdateDragLine(Vector3 currentPosition)
        {
            if (dragLine != null)
            {
                dragLine.SetPosition(1, currentPosition);
            }
        }
        
        /// <summary>
        /// End dragging
        /// </summary>
        private void EndDragging(Vector2 screenPosition)
        {
            isDragging = false;
            
            // Hide drag line
            if (dragLine != null)
            {
                dragLine.enabled = false;
            }
            
            // Check if dragged to another tile
            Match3Tile targetTile = GetTileAtPosition(screenPosition);
            
            if (targetTile != null && targetTile != selectedTile)
            {
                if (TrySwapTiles(selectedTile, targetTile))
                {
                    OnTilesSwapped?.Invoke(selectedTile, targetTile);
                }
                else
                {
                    // Invalid swap
                    PlayInvalidSound();
                }
            }
            
            DeselectTile();
        }
        
        /// <summary>
        /// Try to swap two tiles
        /// </summary>
        private bool TrySwapTiles(Match3Tile tile1, Match3Tile tile2)
        {
            if (board == null) return false;
            
            bool success = board.TrySwapTiles(tile1, tile2);
            
            if (success)
            {
                // Play swap sound
                if (swapSound != null)
                {
                    AudioSource.PlayClipAtPoint(swapSound, Camera.main.transform.position);
                }
                
                Debug.Log($"🔄 Swapped tiles at ({tile1.X}, {tile1.Y}) and ({tile2.X}, {tile2.Y})");
            }
            else
            {
                PlayInvalidSound();
            }
            
            return success;
        }
        
        /// <summary>
        /// Activate special tile
        /// </summary>
        private void ActivateSpecialTile(Match3Tile tile)
        {
            Debug.Log($"✨ Activated special tile at ({tile.X}, {tile.Y})");
            
            // Handle different special tile types
            switch (tile.specialType)
            {
                case Match3Tile.TileSpecialType.Bomb:
                    ActivateBombTile(tile);
                    break;
                case Match3Tile.TileSpecialType.Lightning:
                    ActivateLightningTile(tile);
                    break;
                case Match3Tile.TileSpecialType.Rainbow:
                    ActivateRainbowTile(tile);
                    break;
                case Match3Tile.TileSpecialType.Star:
                    ActivateStarTile(tile);
                    break;
            }
        }
        
        /// <summary>
        /// Activate bomb tile
        /// </summary>
        private void ActivateBombTile(Match3Tile tile)
        {
            // Destroy surrounding tiles
            for (int x = tile.X - 1; x <= tile.X + 1; x++)
            {
                for (int y = tile.Y - 1; y <= tile.Y + 1; y++)
                {
                    Match3Tile targetTile = board.GetTile(x, y);
                    if (targetTile != null)
                    {
                        targetTile.Destroy();
                    }
                }
            }
        }
        
        /// <summary>
        /// Activate lightning tile
        /// </summary>
        private void ActivateLightningTile(Match3Tile tile)
        {
            // Destroy entire row
            for (int x = 0; x < board.boardWidth; x++)
            {
                Match3Tile targetTile = board.GetTile(x, tile.Y);
                if (targetTile != null)
                {
                    targetTile.Destroy();
                }
            }
        }
        
        /// <summary>
        /// Activate rainbow tile
        /// </summary>
        private void ActivateRainbowTile(Match3Tile tile)
        {
            // Destroy all tiles of the same type
            for (int x = 0; x < board.boardWidth; x++)
            {
                for (int y = 0; y < board.boardHeight; y++)
                {
                    Match3Tile targetTile = board.GetTile(x, y);
                    if (targetTile != null && targetTile.TileType == tile.TileType)
                    {
                        targetTile.Destroy();
                    }
                }
            }
        }
        
        /// <summary>
        /// Activate star tile
        /// </summary>
        private void ActivateStarTile(Match3Tile tile)
        {
            // Destroy tiles in cross pattern
            // Horizontal
            for (int x = 0; x < board.boardWidth; x++)
            {
                Match3Tile targetTile = board.GetTile(x, tile.Y);
                if (targetTile != null)
                {
                    targetTile.Destroy();
                }
            }
            
            // Vertical
            for (int y = 0; y < board.boardHeight; y++)
            {
                Match3Tile targetTile = board.GetTile(tile.X, y);
                if (targetTile != null)
                {
                    targetTile.Destroy();
                }
            }
        }
        
        /// <summary>
        /// Get tile at screen position
        /// </summary>
        private Match3Tile GetTileAtPosition(Vector2 screenPosition)
        {
            Vector3 worldPosition = gameCamera.ScreenToWorldPoint(screenPosition);
            worldPosition.z = 0;
            
            // Raycast to find tile
            RaycastHit2D hit = Physics2D.Raycast(worldPosition, Vector2.zero, 0f, tileLayer);
            
            if (hit.collider != null)
            {
                return hit.collider.GetComponent<Match3Tile>();
            }
            
            return null;
        }
        
        /// <summary>
        /// Play invalid sound
        /// </summary>
        private void PlayInvalidSound()
        {
            if (invalidSound != null)
            {
                AudioSource.PlayClipAtPoint(invalidSound, Camera.main.transform.position);
            }
        }
        
        /// <summary>
        /// Block input
        /// </summary>
        public void BlockInput()
        {
            DeselectTile();
            OnInputBlocked?.Invoke();
        }
        
        /// <summary>
        /// Unblock input
        /// </summary>
        public void UnblockInput()
        {
            // Input is unblocked by default
        }
        
        /// <summary>
        /// Get selected tile
        /// </summary>
        public Match3Tile GetSelectedTile()
        {
            return selectedTile;
        }
        
        /// <summary>
        /// Check if input is blocked
        /// </summary>
        public bool IsInputBlocked()
        {
            return board != null && board.isProcessing;
        }
    }
}