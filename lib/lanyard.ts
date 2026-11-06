import type { LanyardData } from '@/types/lanyard';

type LanyardPacket =
  | { op: 1; d: { heartbeat_interval: number } }
  | { op: 0; t: 'INIT_STATE' | 'PRESENCE_UPDATE'; d: LanyardData };

export function subscribeToLanyard(
  discordId: string,
  onPresence: (presence: LanyardData) => void,
  onDisconnect: () => void,
) {
  let retry: ReturnType<typeof setTimeout>;
  let disconnect: () => void;

  function connect() {
    const socket = new WebSocket('wss://api.lanyard.rest/socket');
    const handshake = setTimeout(() => socket.close(), 10_000);
    let heartbeat: ReturnType<typeof setInterval> | undefined;

    function clearTimers() {
      clearTimeout(handshake);
      clearInterval(heartbeat);
    }

    socket.onmessage = ({ data }) => {
      if (typeof data !== 'string') return;
      let packet: LanyardPacket | null;
      try {
        packet = JSON.parse(data);
      } catch {
        return;
      }

      if (packet?.op === 1 && heartbeat === undefined) {
        const interval = packet.d?.heartbeat_interval;
        if (!Number.isFinite(interval) || interval <= 0) return;
        socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: discordId } }));
        heartbeat = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ op: 3 }));
        }, interval);
      } else if (
        packet?.op === 0 &&
        (packet.t === 'INIT_STATE' || packet.t === 'PRESENCE_UPDATE') &&
        packet.d?.discord_user?.id === discordId
      ) {
        clearTimeout(handshake);
        onPresence(packet.d);
      }
    };

    socket.onerror = () => socket.close();
    socket.onclose = ({ code }) => {
      clearTimers();
      onDisconnect();
      if (code < 4000) retry = setTimeout(connect, 5000);
    };

    disconnect = () => {
      clearTimers();
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    };
  }

  connect();
  return () => {
    clearTimeout(retry);
    disconnect();
  };
}

export function getDiscordAvatarUrl(userId: string, avatarHash: string, size: number = 128): string {
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${avatarHash.startsWith('a_') ? 'gif' : 'png'}?size=${size}`;
}

export function getAvatarDecorationUrl(asset: string): string {
  return `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png`;
}

export function getDiscordBannerUrl(userId: string, bannerHash: string, size: number = 600): string {
  return `https://cdn.discordapp.com/banners/${userId}/${bannerHash}.${bannerHash.startsWith('a_') ? 'gif' : 'png'}?size=${size}`;
}

export function getStatusColor(status: 'online' | 'idle' | 'dnd' | 'offline'): string {
  const colors = {
    online: '#23a559',
    idle: '#f0b232',
    dnd: '#f23f43',
    offline: '#80848e',
  };
  return colors[status];
}

export function getStatusLabel(status: 'online' | 'idle' | 'dnd' | 'offline'): string {
  const labels = {
    online: 'Online',
    idle: 'Idle',
    dnd: 'Do Not Disturb',
    offline: 'Offline',
  };
  return labels[status];
}
