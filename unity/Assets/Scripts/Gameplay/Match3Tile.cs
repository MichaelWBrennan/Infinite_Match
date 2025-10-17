using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using Evergreen.Gameplay;

namespace Evergreen.Gameplay
{
    /// <summary>
    /// Individual Match-3 Tile
    /// Handles tile behavior, animation, and special effects
    /// </summary>
    public class Match3Tile : MonoBehaviour
    {
        [Header("Tile Configuration")]
        public int tileType;
        public bool isSpecial = false;
        public TileSpecialType specialType = TileSpecialType.Normal;
        
        [Header("Visual Components")]
        public SpriteRenderer spriteRenderer;
        public Image uiImage;
        public Animator animator;
        public ParticleSystem particles;
        
        [Header("Animation Settings")]
        public float moveSpeed = 5f;
        public float scaleSpeed = 3f;
        public float highlightIntensity = 1.5f;
        
        [Header("Audio")]
        public AudioClip selectSound;
        public AudioClip destroySound;
        
        // Tile state
        private int x, y;
        private Match3Board board;
        private bool isSelected = false;
        private bool isMoving = false;
        private bool isHighlighted = false;
        private bool needsVisualUpdate = true;
        
        // Animation
        private Vector3 targetPosition;
        private Vector3 targetScale = Vector3.one;
        private Coroutine moveCoroutine;
        private Coroutine scaleCoroutine;
        
        // Events
        public System.Action<Match3Tile> OnTileClicked;
        public System.Action<Match3Tile> OnTileDestroyed;
        
        public enum TileSpecialType
        {
            Normal,
            Bomb,
            Lightning,
            Rainbow,
            Star
        }
        
        void Awake()
        {
            // Get components
            if (spriteRenderer == null)
                spriteRenderer = GetComponent<SpriteRenderer>();
            
            if (uiImage == null)
                uiImage = GetComponent<Image>();
            
            if (animator == null)
                animator = GetComponent<Animator>();
            
            if (particles == null)
                particles = GetComponent<ParticleSystem>();
        }
        
        void Start()
        {
            // Set initial scale
            transform.localScale = Vector3.zero;
            StartCoroutine(ScaleIn());
        }
        
        void Update()
        {
            // Only update visuals when needed to reduce Update() overhead
            if (needsVisualUpdate)
            {
                UpdateVisuals();
                needsVisualUpdate = false;
            }
        }
        
        /// <summary>
        /// Initialize the tile
        /// </summary>
        public void Initialize(int x, int y, int tileType, Match3Board board)
        {
            this.x = x;
            this.y = y;
            this.tileType = tileType;
            this.board = board;
            
            // Set visual properties
            UpdateVisuals();
            
            // Add click handler
            if (GetComponent<Collider2D>() == null)
            {
                BoxCollider2D collider = gameObject.AddComponent<BoxCollider2D>();
                collider.isTrigger = true;
            }
        }
        
        /// <summary>
        /// Set tile position on board
        /// </summary>
        public void SetPosition(int x, int y)
        {
            this.x = x;
            this.y = y;
        }
        
        /// <summary>
        /// Change tile type
        /// </summary>
        public void ChangeType(int newType)
        {
            tileType = newType;
            needsVisualUpdate = true;
        }
        
        /// <summary>
        /// Move tile to position
        /// </summary>
        public void MoveTo(Vector3 position)
        {
            targetPosition = position;
            
            if (moveCoroutine != null)
            {
                StopCoroutine(moveCoroutine);
            }
            
            moveCoroutine = StartCoroutine(MoveToPosition());
        }
        
        /// <summary>
        /// Highlight the tile
        /// </summary>
        public void Highlight()
        {
            isHighlighted = true;
            needsVisualUpdate = true;
            
            if (animator != null)
            {
                animator.SetTrigger("Highlight");
            }
            
            // Play highlight effect
            if (particles != null)
            {
                particles.Play();
            }
        }
        
        /// <summary>
        /// Select the tile
        /// </summary>
        public void Select()
        {
            isSelected = true;
            needsVisualUpdate = true;
            
            if (animator != null)
            {
                animator.SetTrigger("Select");
            }
            
            // Play select sound
            if (selectSound != null)
            {
                AudioSource.PlayClipAtPoint(selectSound, Camera.main.transform.position);
            }
        }
        
        /// <summary>
        /// Deselect the tile
        /// </summary>
        public void Deselect()
        {
            isSelected = false;
            needsVisualUpdate = true;
            
            if (animator != null)
            {
                animator.SetTrigger("Deselect");
            }
        }
        
        /// <summary>
        /// Destroy the tile with animation
        /// </summary>
        public void Destroy()
        {
            if (destroySound != null)
            {
                AudioSource.PlayClipAtPoint(destroySound, Camera.main.transform.position);
            }
            
            StartCoroutine(DestroyAnimation());
        }
        
        /// <summary>
        /// Make tile special
        /// </summary>
        public void MakeSpecial(TileSpecialType specialType)
        {
            this.specialType = specialType;
            this.isSpecial = true;
            needsVisualUpdate = true;
            
            // Update visual based on special type
            switch (specialType)
            {
                case TileSpecialType.Bomb:
                    // Add bomb visual
                    break;
                case TileSpecialType.Lightning:
                    // Add lightning visual
                    break;
                case TileSpecialType.Rainbow:
                    // Add rainbow visual
                    break;
                case TileSpecialType.Star:
                    // Add star visual
                    break;
            }
        }
        
        /// <summary>
        /// Get tile type
        /// </summary>
        public int TileType
        {
            get { return tileType; }
        }
        
        /// <summary>
        /// Get X position
        /// </summary>
        public int X
        {
            get { return x; }
        }
        
        /// <summary>
        /// Get Y position
        /// </summary>
        public int Y
        {
            get { return y; }
        }
        
        /// <summary>
        /// Check if tile is special
        /// </summary>
        public bool IsSpecial
        {
            get { return isSpecial; }
        }
        
        /// <summary>
        /// Check if tile is selected
        /// </summary>
        public bool IsSelected
        {
            get { return isSelected; }
        }
        
        /// <summary>
        /// Check if tile is moving
        /// </summary>
        public bool IsMoving
        {
            get { return isMoving; }
        }
        
        /// <summary>
        /// Update visual appearance
        /// </summary>
        private void UpdateVisuals()
        {
            // Update color based on type
            Color tileColor = GetTileColor(tileType);
            
            if (spriteRenderer != null)
            {
                spriteRenderer.color = tileColor;
            }
            
            if (uiImage != null)
            {
                uiImage.color = tileColor;
            }
            
            // Apply special effects
            if (isSpecial)
            {
                ApplySpecialEffects();
            }
            
            // Apply selection effects
            if (isSelected)
            {
                ApplySelectionEffects();
            }
            
            // Apply highlight effects
            if (isHighlighted)
            {
                ApplyHighlightEffects();
            }
        }
        
        /// <summary>
        /// Get color for tile type
        /// </summary>
        private Color GetTileColor(int type)
        {
            Color[] colors = {
                Color.red, Color.blue, Color.green, 
                Color.yellow, Color.magenta, Color.cyan
            };
            
            return colors[type % colors.Length];
        }
        
        /// <summary>
        /// Apply special effects
        /// </summary>
        private void ApplySpecialEffects()
        {
            // Add glow effect
            if (spriteRenderer != null)
            {
                spriteRenderer.material.SetFloat("_Glow", 1f);
            }
            
            // Add particles
            if (particles != null)
            {
                particles.Play();
            }
        }
        
        /// <summary>
        /// Apply selection effects
        /// </summary>
        private void ApplySelectionEffects()
        {
            // Scale up slightly
            targetScale = Vector3.one * 1.1f;
            
            // Add outline
            if (spriteRenderer != null)
            {
                spriteRenderer.material.SetFloat("_Outline", 1f);
            }
        }
        
        /// <summary>
        /// Apply highlight effects
        /// </summary>
        private void ApplyHighlightEffects()
        {
            // Brighten color
            Color highlightColor = GetTileColor(tileType) * highlightIntensity;
            
            if (spriteRenderer != null)
            {
                spriteRenderer.color = highlightColor;
            }
            
            if (uiImage != null)
            {
                uiImage.color = highlightColor;
            }
        }
        
        /// <summary>
        /// Move to position coroutine
        /// </summary>
        private IEnumerator MoveToPosition()
        {
            isMoving = true;
            Vector3 startPosition = transform.position;
            float distance = Vector3.Distance(startPosition, targetPosition);
            float duration = distance / moveSpeed;
            float elapsed = 0f;
            
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                t = Mathf.SmoothStep(0f, 1f, t);
                
                transform.position = Vector3.Lerp(startPosition, targetPosition, t);
                yield return null;
            }
            
            transform.position = targetPosition;
            isMoving = false;
        }
        
        /// <summary>
        /// Scale in animation
        /// </summary>
        private IEnumerator ScaleIn()
        {
            Vector3 startScale = Vector3.zero;
            Vector3 endScale = Vector3.one;
            float elapsed = 0f;
            
            while (elapsed < 1f)
            {
                elapsed += Time.deltaTime * scaleSpeed;
                float t = Mathf.SmoothStep(0f, 1f, elapsed);
                
                transform.localScale = Vector3.Lerp(startScale, endScale, t);
                yield return null;
            }
            
            transform.localScale = endScale;
        }
        
        /// <summary>
        /// Destroy animation
        /// </summary>
        private IEnumerator DestroyAnimation()
        {
            // Play destroy animation
            if (animator != null)
            {
                animator.SetTrigger("Destroy");
            }
            
            // Scale down
            Vector3 startScale = transform.localScale;
            Vector3 endScale = Vector3.zero;
            float elapsed = 0f;
            
            while (elapsed < 0.5f)
            {
                elapsed += Time.deltaTime * scaleSpeed;
                float t = Mathf.SmoothStep(0f, 1f, elapsed);
                
                transform.localScale = Vector3.Lerp(startScale, endScale, t);
                yield return null;
            }
            
            // Notify destruction
            OnTileDestroyed?.Invoke(this);
            
            // Destroy GameObject
            Destroy(gameObject);
        }
        
        /// <summary>
        /// Handle mouse click
        /// </summary>
        void OnMouseDown()
        {
            if (board != null && !isMoving)
            {
                OnTileClicked?.Invoke(this);
            }
        }
        
        /// <summary>
        /// Handle mouse enter
        /// </summary>
        void OnMouseEnter()
        {
            if (board != null && !isMoving)
            {
                // Add hover effect
                if (animator != null)
                {
                    animator.SetTrigger("Hover");
                }
            }
        }
        
        /// <summary>
        /// Handle mouse exit
        /// </summary>
        void OnMouseExit()
        {
            if (board != null && !isMoving)
            {
                // Remove hover effect
                if (animator != null)
                {
                    animator.SetTrigger("HoverExit");
                }
            }
        }
        
        /// <summary>
        /// Reset tile state
        /// </summary>
        public void Reset()
        {
            isSelected = false;
            isHighlighted = false;
            isSpecial = false;
            specialType = TileSpecialType.Normal;
            needsVisualUpdate = true;
            
            targetScale = Vector3.one;
            transform.localScale = Vector3.one;
        }
    }
}