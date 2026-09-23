/**
 * Nearby / Bluetooth helpers for Steal Bundle.
 * Web Bluetooth discovers a peer device; game sync still uses room codes + WebRTC/API.
 */

export const BLE_SERVICE_UUID = "0000sb01-0000-1000-8000-00805f9b34fb";
export const BLE_CHARACTERISTIC_UUID = "0000sb02-0000-1000-8000-00805f9b34fb";

export type BluetoothSupport = {
  available: boolean;
  reason?: string;
};

export function getBluetoothSupport(): BluetoothSupport {
  if (typeof navigator === "undefined") {
    return { available: false, reason: "Not in a browser." };
  }
  const nav = navigator as Navigator & { bluetooth?: { requestDevice: unknown } };
  if (!nav.bluetooth) {
    return {
      available: false,
      reason: "Web Bluetooth needs Chrome/Edge on Android or desktop — use a room code nearby.",
    };
  }
  if (!window.isSecureContext) {
    return { available: false, reason: "Bluetooth requires HTTPS." };
  }
  return { available: true };
}

export type NearbyPeer = {
  deviceId: string;
  name: string;
};

/**
 * Prompt the user to pick a nearby Bluetooth device.
 * We encode the room code in the device name hint when hosting.
 */
export async function pickNearbyBluetoothDevice(): Promise<NearbyPeer | null> {
  const support = getBluetoothSupport();
  if (!support.available) return null;
  const nav = navigator as Navigator & {
    bluetooth: {
      requestDevice: (options: {
        acceptAllDevices?: boolean;
        optionalServices?: string[];
        filters?: Array<{ namePrefix?: string }>;
      }) => Promise<{ id: string; name?: string }>;
    };
  };
  try {
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [BLE_SERVICE_UUID],
    });
    return {
      deviceId: device.id,
      name: device.name || "Nearby player",
    };
  } catch {
    return null;
  }
}

/** Suggest a display name for Bluetooth advertising (host). */
export function bluetoothHostLabel(roomCode: string): string {
  return `SB-${roomCode}`;
}
