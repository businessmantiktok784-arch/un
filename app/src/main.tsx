const serviceWorkerReloadKey = "unihub:service-worker-cleaned";

const clearStaleServiceWorkers = async () => {
  if (!("serviceWorker" in navigator)) return false;

  const hadController = Boolean(navigator.serviceWorker.controller);

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  return hadController || registrations.length > 0;
};

const bootstrap = async () => {
  const shouldReload = await clearStaleServiceWorkers().catch(() => false);

  if (shouldReload && sessionStorage.getItem(serviceWorkerReloadKey) !== "true") {
    sessionStorage.setItem(serviceWorkerReloadKey, "true");
    window.location.reload();
    return;
  }

  sessionStorage.removeItem(serviceWorkerReloadKey);

  const [{ createRoot }, { default: App }] = await Promise.all([
    import("react-dom/client"),
    import("./App.tsx"),
    import("./index.css"),
  ]);

  createRoot(document.getElementById("root")!).render(<App />);
};

void bootstrap();
