import Peer, { DataConnection } from 'peerjs';

export interface P2PSessionData {
  id: string;
  strip: string;
  rawShots: string[];
  gif?: string;
  video?: string;
  createdAt: number;
}

/**
 * Standardize clean peer ID from session ID
 */
export function getPeerId(sessionId: string): string {
  // peerjs ID must be alphanumeric and hyphens
  const cleanId = sessionId.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
  return `adimasbooth-${cleanId}`;
}

/**
 * Host Peer: Runs on the booth/computer side to send photo data directly to mobile phones
 */
export class BoothHost {
  private peer: Peer | null = null;
  private activeConnections: Set<DataConnection> = new Set();
  private getData: () => P2PSessionData | null;
  private isDestroyed = false;

  constructor(sessionId: string, getData: () => P2PSessionData | null) {
    this.getData = getData;
    this.init(sessionId);
  }

  private init(sessionId: string) {
    const peerId = getPeerId(sessionId);
    try {
      this.peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', (id) => {
        console.log('[P2P Booth Host] Ready with Peer ID:', id);
      });

      this.peer.on('connection', (conn) => {
        console.log('[P2P Booth Host] Phone connected:', conn.peer);
        this.activeConnections.add(conn);

        conn.on('open', () => {
          // Immediately send latest photo session data
          const data = this.getData();
          if (data && data.strip) {
            conn.send({ type: 'SESSION_DATA', payload: data });
          }
        });

        conn.on('data', (msg: any) => {
          if (msg?.type === 'REQUEST_DATA') {
            const data = this.getData();
            if (data && data.strip) {
              conn.send({ type: 'SESSION_DATA', payload: data });
            }
          }
        });

        conn.on('close', () => {
          this.activeConnections.delete(conn);
        });

        conn.on('error', (err) => {
          console.warn('[P2P Booth Host] Connection error:', err);
          this.activeConnections.delete(conn);
        });
      });

      this.peer.on('error', (err: any) => {
        console.warn('[P2P Booth Host] Peer error:', err?.type, err);
        // If peer ID is taken, this peer might already be active from previous render
      });
    } catch (e) {
      console.warn('[P2P Booth Host] Initialization error:', e);
    }
  }

  /**
   * Broadcast updated data (e.g. when GIF or Video finishes rendering)
   */
  public broadcastUpdate(data: P2PSessionData) {
    if (this.isDestroyed || this.activeConnections.size === 0) return;
    for (const conn of this.activeConnections) {
      if (conn.open) {
        try {
          conn.send({ type: 'SESSION_DATA', payload: data });
        } catch (e) {
          console.warn('[P2P Booth Host] Send update failed:', e);
        }
      }
    }
  }

  public destroy() {
    this.isDestroyed = true;
    for (const conn of this.activeConnections) {
      try {
        conn.close();
      } catch {}
    }
    this.activeConnections.clear();
    try {
      this.peer?.destroy();
    } catch {}
    this.peer = null;
  }
}

/**
 * Client Peer: Runs on the mobile/receiver side to fetch photo data directly from booth computer
 */
export class MobileClient {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private isDestroyed = false;

  constructor(
    sessionId: string,
    onData: (data: P2PSessionData) => void,
    onStatus?: (status: string) => void
  ) {
    const targetPeerId = getPeerId(sessionId);
    this.init(targetPeerId, onData, onStatus);
  }

  private init(
    targetPeerId: string,
    onData: (data: P2PSessionData) => void,
    onStatus?: (status: string) => void
  ) {
    try {
      onStatus?.('Menghubungkan langsung ke layar booth (P2P)...');
      this.peer = new Peer({
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', () => {
        if (this.isDestroyed || !this.peer) return;
        onStatus?.('Terkoneksi ke jaringan transfer...');
        
        const conn = this.peer.connect(targetPeerId, {
          reliable: true
        });

        this.conn = conn;

        conn.on('open', () => {
          onStatus?.('Menerima foto resolusi penuh dari booth...');
          conn.send({ type: 'REQUEST_DATA' });
        });

        conn.on('data', (msg: any) => {
          if (msg?.type === 'SESSION_DATA' && msg.payload) {
            onData(msg.payload);
          }
        });

        conn.on('error', (err) => {
          console.warn('[P2P Mobile Client] Connection error:', err);
        });
      });

      this.peer.on('error', (err: any) => {
        console.warn('[P2P Mobile Client] Peer error:', err?.type, err);
      });
    } catch (e) {
      console.warn('[P2P Mobile Client] Initialization error:', e);
    }
  }

  public destroy() {
    this.isDestroyed = true;
    try {
      this.conn?.close();
    } catch {}
    try {
      this.peer?.destroy();
    } catch {}
    this.conn = null;
    this.peer = null;
  }
}
