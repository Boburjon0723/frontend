"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    connect: () => { },
    disconnect: () => { },
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        }
    }, []);

    const connect = useCallback(() => {
        if (socketRef.current?.connected) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        const socketURL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
        console.log(`[SocketContext] Connecting to ${socketURL}...`);

        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        const socketInstance = io(socketURL, {
            transports: ['polling', 'websocket'],
            autoConnect: true,
            auth: { token: token },
            reconnection: true,
            reconnectionDelay: 1000,
            timeout: 20000,
        });

        socketInstance.on('connect', () => {
            console.log('[SocketContext] Connected:', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('[SocketContext] Disconnected:', reason);
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (err) => {
            console.error('[SocketContext] Connection error:', err.message);
            setIsConnected(false);
        });

        socketRef.current = socketInstance;
    }, []);

    useEffect(() => {
        connect();

        const onStorageChange = (e: StorageEvent) => {
            if (e.key === 'token') {
                console.log('[SocketContext] Token changed, reconnecting...');
                connect();
            }
        };

        window.addEventListener('storage', onStorageChange);

        const interval = setInterval(() => {
            if (!socketRef.current?.connected && localStorage.getItem('token')) {
                connect();
            }
        }, 15000);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', onStorageChange);
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [connect]);

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, isConnected, connect, disconnect }}>
            {children}
        </SocketContext.Provider>
    );
};
