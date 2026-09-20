package com.p2peer.FileTransfer.signaling;

import com.p2peer.FileTransfer.models.Peer;
import lombok.extern.slf4j.Slf4j;
import com.p2peer.FileTransfer.models.RoomRegistry;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.io.IOException;

@Component
@Slf4j
public class SignalingHandler extends TextWebSocketHandler {
    private final RoomRegistry registry;
    private final ObjectMapper json = new ObjectMapper();

    public SignalingHandler(RoomRegistry registry) {
        this.registry = registry;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession rawSession) {
        WebSocketSession session =
                new ConcurrentWebSocketSessionDecorator(rawSession, 5_000, 512 * 1024);

        String ip = getAttribute(session, "ip");
        String kind = getAttribute(session, "kind");
        String roomId = registry.getRoomId(ip);

        Peer peer = registry.join(session.getId(), kind, roomId, session);

        ObjectNode welcome = json.createObjectNode();
        welcome.put("type", "welcome");
        welcome.put("id", peer.getId());
        welcome.put("name", peer.getName());
        welcome.put("kind", peer.getKind());

        send(peer, welcome);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        // TODO: implement that
    }

    /* in a hard connection error afterConnectionClosed wont get called properly. This method cleans it up */
    @Override
    public void handleTransportError(WebSocketSession session, Throwable error) {
        log.warn("transport error in {}: {}", session.getId(), error.getMessage());
        afterConnectionClosed(session, CloseStatus.SERVER_ERROR);
    }

    private void send(Peer peer, ObjectNode payload) {
        try {
            if (peer.getSession().isOpen()) {
                peer.getSession().sendMessage(
                        new TextMessage(json.writeValueAsString(payload)));
            }
        } catch (IOException e) {
            log.warn("Senden an {} fehlgeschlagen: {}", peer.getName(), e.getMessage());
        }
    }

    private String getAttribute(WebSocketSession session, String key) {
        Object value = session.getAttributes().get(key);
        return value == null ? "" : String.valueOf(value);
    }
}
