using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DG.Tweening;
using System.Collections;

namespace Evergreen.UI
{
    public class UINotificationUI : MonoBehaviour
    {
        [Header("UI References")]
        public TextMeshProUGUI messageText;
        public Image backgroundImage;
        public Image iconImage;
        public Button closeButton;
        
        [Header("Animation Settings")]
        public float slideInDuration = 0.3f;
        public float slideOutDuration = 0.2f;
        public float autoHideDelay = 3f;
        public Ease slideEase = Ease.OutCubic;
        
        [Header("Visual Settings")]
        public Color infoColor = Color.blue;
        public Color successColor = Color.green;
        public Color warningColor = Color.yellow;
        public Color errorColor = Color.red;
        
        [Header("Icons")]
        public Sprite infoIcon;
        public Sprite successIcon;
        public Sprite warningIcon;
        public Sprite errorIcon;
        
        private UINotification _notification;
        private RectTransform _rectTransform;
        private CanvasGroup _canvasGroup;
        private Coroutine _autoHideCoroutine;
        private bool _isAnimating = false;
        
        void Awake()
        {
            _rectTransform = GetComponent<RectTransform>();
            _canvasGroup = GetComponent<CanvasGroup>();
            
            if (closeButton != null)
            {
                closeButton.onClick.AddListener(OnCloseClicked);
            }
        }
        
        public void Setup(UINotification notification)
        {
            _notification = notification;
            
            // Set message
            if (messageText != null)
            {
                messageText.text = notification.message;
            }
            
            // Set visual style based on type
            SetNotificationStyle(notification.type);
            
            // Start auto-hide if duration > 0
            if (notification.duration > 0)
            {
                _autoHideCoroutine = StartCoroutine(AutoHideCoroutine(notification.duration));
            }
            
            // Animate in
            StartCoroutine(AnimateIn());
        }
        
        private void SetNotificationStyle(NotificationType type)
        {
            Color bgColor = infoColor;
            Sprite icon = infoIcon;
            
            switch (type)
            {
                case NotificationType.Success:
                    bgColor = successColor;
                    icon = successIcon;
                    break;
                case NotificationType.Warning:
                    bgColor = warningColor;
                    icon = warningIcon;
                    break;
                case NotificationType.Error:
                    bgColor = errorColor;
                    icon = errorIcon;
                    break;
            }
            
            if (backgroundImage != null)
            {
                backgroundImage.color = bgColor;
            }
            
            if (iconImage != null && icon != null)
            {
                iconImage.sprite = icon;
                iconImage.gameObject.SetActive(true);
            }
            else if (iconImage != null)
            {
                iconImage.gameObject.SetActive(false);
            }
        }
        
        private IEnumerator AnimateIn()
        {
            _isAnimating = true;
            
            // Set initial state
            _rectTransform.anchoredPosition = new Vector2(_rectTransform.rect.width, 0);
            if (_canvasGroup != null)
            {
                _canvasGroup.alpha = 0f;
            }
            
            // Animate in
            var moveTween = _rectTransform.DOAnchorPosX(0, slideInDuration).SetEase(slideEase);
            var fadeTween = _canvasGroup?.DOFade(1f, slideInDuration).SetEase(slideEase);
            
            yield return new WaitForSeconds(slideInDuration);
            
            _isAnimating = false;
        }
        
        private IEnumerator AutoHideCoroutine(float delay)
        {
            yield return new WaitForSeconds(delay);
            Hide();
        }
        
        public void Hide()
        {
            if (_isAnimating) return;
            
            StartCoroutine(AnimateOut());
        }
        
        private IEnumerator AnimateOut()
        {
            _isAnimating = true;
            
            if (_autoHideCoroutine != null)
            {
                StopCoroutine(_autoHideCoroutine);
                _autoHideCoroutine = null;
            }
            
            // Animate out
            var moveTween = _rectTransform.DOAnchorPosX(_rectTransform.rect.width, slideOutDuration).SetEase(slideEase);
            var fadeTween = _canvasGroup?.DOFade(0f, slideOutDuration).SetEase(slideEase);
            
            yield return new WaitForSeconds(slideOutDuration);
            
            // Destroy this notification
            if (AdvancedUISystem.Instance != null)
            {
                AdvancedUISystem.Instance.OnNotificationHidden?.Invoke(_notification);
            }
            
            Destroy(gameObject);
        }
        
        private void OnCloseClicked()
        {
            Hide();
        }
        
        public void OnPointerEnter()
        {
            // Pause auto-hide on hover
            if (_autoHideCoroutine != null)
            {
                StopCoroutine(_autoHideCoroutine);
                _autoHideCoroutine = null;
            }
        }
        
        public void OnPointerExit()
        {
            // Resume auto-hide
            if (_notification != null && _notification.duration > 0)
            {
                _autoHideCoroutine = StartCoroutine(AutoHideCoroutine(_notification.duration));
            }
        }
    }
}