export const ExpoKeepAwakeTag = "ExpoKeepAwakeDefaultTag";

export async function isAvailableAsync(): Promise<boolean> {
  return false;
}

export function useKeepAwake(): void {
  // No-op shim for web/dev environments where wake lock is unreliable.
}

export async function activateKeepAwakeAsync(): Promise<void> {
  return;
}

export async function activateKeepAwake(): Promise<void> {
  return;
}

export async function deactivateKeepAwake(): Promise<void> {
  return;
}

export function addListener() {
  return {
    remove() {
      return;
    },
  };
}
