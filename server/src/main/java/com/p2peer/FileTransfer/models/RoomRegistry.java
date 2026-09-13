package com.p2peer.FileTransfer.models;

import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RoomRegistry {
    // Room containing of IP Adress as key, SessionIds of peers as Value
    private final Map<String, Set<String>> rooms = new ConcurrentHashMap<>();

    // Peer contains the SessionId as key & name as value
    private final Map<String, Peer> peers = new ConcurrentHashMap<>();
}
