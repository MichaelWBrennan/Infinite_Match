using System;
using System.Collections.Generic;
using UnityEngine;

namespace Evergreen.Core
{
    /// <summary>
    /// Generic object pool for efficient object reuse with enhanced monitoring
    /// </summary>
    public class ObjectPool<T> where T : class, new()
    {
        private readonly Queue<T> _pool = new Queue<T>();
        private readonly Func<T> _createFunc;
        private readonly Action<T> _onGet;
        private readonly Action<T> _onReturn;
        private readonly int _maxSize;
        private int _currentSize = 0;
        private int _totalCreated = 0;
        private int _totalReturned = 0;
        private long _totalMemoryAllocated = 0;
        private readonly string _poolName;

        public ObjectPool(Func<T> createFunc = null, Action<T> onGet = null, Action<T> onReturn = null, int maxSize = 100, string poolName = null)
        {
            _createFunc = createFunc ?? (() => new T());
            _onGet = onGet;
            _onReturn = onReturn;
            _maxSize = maxSize;
            _poolName = poolName ?? typeof(T).Name;
        }

        public T Get()
        {
            T obj;
            if (_pool.Count > 0)
            {
                obj = _pool.Dequeue();
                _totalReturned++;
            }
            else if (_currentSize < _maxSize)
            {
                obj = _createFunc();
                _currentSize++;
                _totalCreated++;
                _totalMemoryAllocated += EstimateMemorySize(obj);
            }
            else
            {
                obj = _createFunc();
                _totalCreated++;
                _totalMemoryAllocated += EstimateMemorySize(obj);
            }

            _onGet?.Invoke(obj);
            return obj;
        }

        public void Return(T obj)
        {
            if (obj == null) return;

            _onReturn?.Invoke(obj);

            if (_pool.Count < _maxSize)
            {
                _pool.Enqueue(obj);
            }
        }

        public void Clear()
        {
            _pool.Clear();
            _currentSize = 0;
        }

        public int Count => _pool.Count;
        public int CurrentSize => _currentSize;
        public int TotalCreated => _totalCreated;
        public int TotalReturned => _totalReturned;
        public long TotalMemoryAllocated => _totalMemoryAllocated;
        public string PoolName => _poolName;
        
        public float UtilizationRate => _currentSize > 0 ? (float)(_currentSize - _pool.Count) / _currentSize : 0f;
        public float HitRate => _totalCreated > 0 ? (float)_totalReturned / _totalCreated : 0f;

        private long EstimateMemorySize(T obj)
        {
            // Basic memory estimation based on type
            if (obj is System.Collections.ICollection collection)
            {
                return collection.Count * 8; // Rough estimate
            }
            
            if (obj is string str)
            {
                return str.Length * 2; // Unicode characters
            }
            
            // Default estimation
            return System.Runtime.InteropServices.Marshal.SizeOf(typeof(T));
        }

        public Dictionary<string, object> GetStatistics()
        {
            return new Dictionary<string, object>
            {
                {"pool_name", _poolName},
                {"pooled_count", Count},
                {"active_count", _currentSize - Count},
                {"total_created", _totalCreated},
                {"total_returned", _totalReturned},
                {"total_memory_allocated", _totalMemoryAllocated},
                {"utilization_rate", UtilizationRate},
                {"hit_rate", HitRate},
                {"max_size", _maxSize}
            };
        }
    }

    /// <summary>
    /// Unity-specific object pool for GameObjects
    /// </summary>
    public class GameObjectPool
    {
        private readonly Queue<GameObject> _pool = new Queue<GameObject>();
        private readonly GameObject _prefab;
        private readonly Transform _parent;
        private readonly int _maxSize;
        private int _currentSize = 0;

        public GameObjectPool(GameObject prefab, Transform parent = null, int maxSize = 100)
        {
            _prefab = prefab;
            _parent = parent;
            _maxSize = maxSize;
        }

        public GameObject Get()
        {
            GameObject obj;
            if (_pool.Count > 0)
            {
                obj = _pool.Dequeue();
                obj.SetActive(true);
            }
            else if (_currentSize < _maxSize)
            {
                obj = UnityEngine.Object.Instantiate(_prefab, _parent);
                _currentSize++;
            }
            else
            {
                obj = UnityEngine.Object.Instantiate(_prefab, _parent);
            }

            return obj;
        }

        public void Return(GameObject obj)
        {
            if (obj == null) return;

            obj.SetActive(false);
            obj.transform.SetParent(_parent);

            if (_pool.Count < _maxSize)
            {
                _pool.Enqueue(obj);
            }
            else
            {
                UnityEngine.Object.Destroy(obj);
                _currentSize--;
            }
        }

        public void Clear()
        {
            while (_pool.Count > 0)
            {
                var obj = _pool.Dequeue();
                if (obj != null)
                {
                    UnityEngine.Object.Destroy(obj);
                }
            }
            _pool.Clear();
            _currentSize = 0;
        }

        public int Count => _pool.Count;
        public int CurrentSize => _currentSize;
    }
}