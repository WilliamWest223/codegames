// apps/web/src/lib/swClient.ts
// Service worker client helper for cache clearing and communication.

export async function clearUserCaches(): Promise<void> {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return;
  }

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      if (event.data === 'CACHES_CLEARED') {
        resolve();
      }
    };

    navigator.serviceWorker.controller?.postMessage('CLEAR_USER_CACHES', [channel.port2]);

    // Safety timeout
    setTimeout(resolve, 2000);
  });
}
