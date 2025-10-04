using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace Evergreen.Effects
{
    public class MatchEffects : MonoBehaviour
    {
        [Header("Particle Systems")]
        public ParticleSystem matchParticles;
        public ParticleSystem specialMatchParticles;
        public ParticleSystem cascadeParticles;
        public ParticleSystem coinParticles;
        public ParticleSystem gemParticles;
        
        [Header("Audio")]
        public AudioSource audioSource;
        public AudioClip matchSound;
        public AudioClip specialMatchSound;
        public AudioClip cascadeSound;
        public AudioClip coinSound;
        public AudioClip gemSound;
        public AudioClip levelCompleteSound;
        
        [Header("Visual Feedback")]
        public GameObject matchHighlightPrefab;
        public GameObject specialHighlightPrefab;
        public float highlightDuration = 0.5f;
        
        private Camera mainCamera;
        private List<GameObject> activeHighlights = new List<GameObject>();
        
        void Start()
        {
            mainCamera = Camera.main;
            if (audioSource == null)
                audioSource = GetComponent<AudioSource>();
        }
        
        public void PlayMatchEffect(Vector3 worldPosition, int matchSize, bool isSpecial = false)
        {
            // Visual effects
            if (isSpecial)
            {
                PlaySpecialMatchEffect(worldPosition);
            }
            else
            {
                PlayNormalMatchEffect(worldPosition, matchSize);
            }
            
            // Audio effects
            PlayMatchAudio(isSpecial);
            
            // Screen shake
            StartCoroutine(ScreenShake(0.1f, 0.05f));
        }
        
        private void PlayNormalMatchEffect(Vector3 worldPosition, int matchSize)
        {
            if (matchParticles != null)
            {
                var emission = matchParticles.emission;
                emission.SetBursts(new ParticleSystem.Burst[]
                {
                    new ParticleSystem.Burst(0.0f, (short)(matchSize * 10))
                });
                
                matchParticles.transform.position = worldPosition;
                matchParticles.Play();
            }
            
            // Create highlight
            CreateHighlight(worldPosition, false);
        }
        
        private void PlaySpecialMatchEffect(Vector3 worldPosition)
        {
            if (specialMatchParticles != null)
            {
                specialMatchParticles.transform.position = worldPosition;
                specialMatchParticles.Play();
            }
            
            // Create special highlight
            CreateHighlight(worldPosition, true);
        }
        
        public void PlayCascadeEffect(Vector3 worldPosition)
        {
            if (cascadeParticles != null)
            {
                cascadeParticles.transform.position = worldPosition;
                cascadeParticles.Play();
            }
            
            PlayAudio(cascadeSound);
        }
        
        public void PlayCoinEffect(Vector3 worldPosition, int amount)
        {
            if (coinParticles != null)
            {
                var emission = coinParticles.emission;
                emission.SetBursts(new ParticleSystem.Burst[]
                {
                    new ParticleSystem.Burst(0.0f, (short)Mathf.Min(amount / 10, 50))
                });
                
                coinParticles.transform.position = worldPosition;
                coinParticles.Play();
            }
            
            PlayAudio(coinSound);
        }
        
        public void PlayGemEffect(Vector3 worldPosition, int amount)
        {
            if (gemParticles != null)
            {
                var emission = gemParticles.emission;
                emission.SetBursts(new ParticleSystem.Burst[]
                {
                    new ParticleSystem.Burst(0.0f, (short)Mathf.Min(amount, 20))
                });
                
                gemParticles.transform.position = worldPosition;
                gemParticles.Play();
            }
            
            PlayAudio(gemSound);
        }
        
        public void PlayLevelCompleteEffect()
        {
            // Play level complete particles
            if (specialMatchParticles != null)
            {
                specialMatchParticles.transform.position = Vector3.zero;
                specialMatchParticles.Play();
            }
            
            // Play level complete audio
            PlayAudio(levelCompleteSound);
            
            // Screen shake
            StartCoroutine(ScreenShake(0.3f, 0.1f));
        }
        
        private void CreateHighlight(Vector3 worldPosition, bool isSpecial)
        {
            var prefab = isSpecial ? specialHighlightPrefab : matchHighlightPrefab;
            if (prefab != null)
            {
                var highlight = Instantiate(prefab, worldPosition, Quaternion.identity);
                activeHighlights.Add(highlight);
                
                // Destroy after duration
                StartCoroutine(DestroyAfterDelay(highlight, highlightDuration));
            }
        }
        
        private IEnumerator DestroyAfterDelay(GameObject obj, float delay)
        {
            yield return new WaitForSeconds(delay);
            if (obj != null)
            {
                activeHighlights.Remove(obj);
                Destroy(obj);
            }
        }
        
        private void PlayMatchAudio(bool isSpecial)
        {
            var clip = isSpecial ? specialMatchSound : matchSound;
            PlayAudio(clip);
        }
        
        private void PlayAudio(AudioClip clip)
        {
            if (audioSource != null && clip != null)
            {
                audioSource.PlayOneShot(clip);
            }
        }
        
        private IEnumerator ScreenShake(float duration, float magnitude)
        {
            var originalPos = mainCamera.transform.localPosition;
            var elapsed = 0f;
            
            while (elapsed < duration)
            {
                var x = Random.Range(-1f, 1f) * magnitude;
                var y = Random.Range(-1f, 1f) * magnitude;
                
                mainCamera.transform.localPosition = new Vector3(x, y, originalPos.z);
                
                elapsed += Time.deltaTime;
                yield return null;
            }
            
            mainCamera.transform.localPosition = originalPos;
        }
        
        public void ClearAllEffects()
        {
            // Stop all particle systems
            if (matchParticles != null) matchParticles.Stop();
            if (specialMatchParticles != null) specialMatchParticles.Stop();
            if (cascadeParticles != null) cascadeParticles.Stop();
            if (coinParticles != null) coinParticles.Stop();
            if (gemParticles != null) gemParticles.Stop();
            
            // Clear all highlights
            foreach (var highlight in activeHighlights)
            {
                if (highlight != null)
                    Destroy(highlight);
            }
            activeHighlights.Clear();
        }
    }
}