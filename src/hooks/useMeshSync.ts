import { useState, useEffect, useRef } from 'react';
import { Peer, DataConnection } from 'peerjs';

export function useMeshSync(onDataReceived: (data: any) => void) {
  const [peerId, setPeerId] = useState<string>('');
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'ready' | 'error'>('disconnected');
  const [connections, setConnections] = useState<DataConnection[]>([]);
  const peerInstance = useRef<Peer | null>(null);

  const initPeer = () => {
    if (peerInstance.current || typeof window === 'undefined') return;
    setStatus('connecting');
    const peer = new Peer();

    peer.on('open', (id) => {
      setPeerId(id);
      setStatus('ready');
    });

    peer.on('connection', (conn) => {
      conn.on('data', (data) => {
         onDataReceived(data);
      });
      conn.on('open', () => {
        setConnections((prev) => {
          if (prev.find(c => c.peer === conn.peer)) return prev;
          return [...prev, conn];
        });
      });
      conn.on('close', () => {
        setConnections((prev) => prev.filter(c => c.peer !== conn.peer));
      });
    });

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
      // Wait and try reconnecting if it's a network error
      setStatus('error');
    });

    peerInstance.current = peer;
  };

  const connectToPeer = (targetId: string) => {
    if (!peerInstance.current) return;
    const conn = peerInstance.current.connect(targetId);
    
    conn.on('open', () => {
       setConnections((prev) => {
         if (prev.find(c => c.peer === conn.peer)) return prev;
         return [...prev, conn];
       });
    });
    
    conn.on('data', (data) => {
       onDataReceived(data);
    });
    
    conn.on('close', () => {
       setConnections((prev) => prev.filter(c => c.peer !== conn.peer));
    });
  };

  const sendToAll = (data: any) => {
    connections.forEach(conn => {
      conn.send(data);
    });
  };

  useEffect(() => {
    return () => {
      if (peerInstance.current) {
         peerInstance.current.destroy();
         peerInstance.current = null;
      }
    };
  }, []);

  return {
    initPeer,
    peerId,
    status,
    connections,
    connectToPeer,
    sendToAll
  };
}
