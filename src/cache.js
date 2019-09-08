const _ = require(`lodash`);

async function safeLoadCache(cacheKey, cache, proxy) {
  const cacheValue = await cache.get(cacheKey);

  if (cacheValue) {
    return cacheValue;
  }

  const value = await proxy();

  cache.set(cacheKey, value);

  return value;
}

async function updateCache(value, cacheKey, cache) {
  async function isDiffrentCache() {
    return !_.isEqual(value, await cache.get(cacheKey));
  }

  const isDiffrentValue = await isDiffrentCache();

  if (isDiffrentValue) {
    cache.set(cacheKey, value);
  }

  return isDiffrentValue;
}

module.exports = { safeLoadCache, updateCache };
