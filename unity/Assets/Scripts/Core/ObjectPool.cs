using System;
using System.Collections.Generic;
using UnityEngine;

namespace Evergreen.Core
{
    /// <summary>
    /// Generic object pool for efficient object reuse
    /// </summary>
    public class ObjectPool<T> where T : class, new()
    {
        private readonly Queue<T> _pool = new Queue<T>();
        private readonly Func<T> _createFunc;
        private readonly Action<T> _onGet;
        private readonly Action<T> _onReturn;
        private readonly int _maxSize;
        private int _currentSize = 0;

        public ObjectPool(Func<T> createFunc = null, Action<T> onGet = null, Action<T> onReturn = null, int maxSize = 100)
        {
            _createFunc = createFunc ?? (() => new T());
            _onGet = onGet;
            _onReturn = onReturn;
            _maxSize = maxSize;
        }

        public T Get()
        {
            T obj;
            if (_pool.Count > 0)
            {
                obj = _pool.Dequeue();
            }
            else if (_currentSize < _maxSize)
            {
                obj = _createFunc();
                _currentSize++;
            }
            else
            {
                obj = _createFunc();
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