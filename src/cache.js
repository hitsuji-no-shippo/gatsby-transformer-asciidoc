async function safeLoadCache(cacheKey, cache, proxy) {
  const cacheValue = await cache.get(cacheKey);

  if (cacheValue) {
    return cacheValue;
  }

  const value = await proxy();

  cache.set(cacheKey, value);

  return value;
}

module.exports = { safeLoadCache };
