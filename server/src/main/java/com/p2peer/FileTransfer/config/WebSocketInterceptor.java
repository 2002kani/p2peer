package com.p2peer.FileTransfer.config;

import com.p2peer.FileTransfer.models.DeviceKind;
import org.jspecify.annotations.Nullable;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
public class WebSocketInterceptor implements HandshakeInterceptor {
    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) throws Exception {
        attributes.put("ip", resolveIp(request));
        attributes.put("kind", DeviceKind.fromUserAgent(request.getHeaders().getFirst("User-Agent")));
        System.out.println("Attributes: " + attributes);
        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            @Nullable Exception exception) {
    }

    private String resolveIp(ServerHttpRequest request){
        System.out.println("User agent: " + request.getHeaders().getFirst("User-Agent"));

        String forwardedIp = request.getHeaders().getFirst("X-Forwarded-For");

        // If a reverse proxy is used - use the attribute given inside the header as public IP
        if (forwardedIp != null && !forwardedIp.isBlank()) {
            return forwardedIp.split(",")[0].trim();
        }

        if(request.getRemoteAddress() != null){
            return request.getRemoteAddress().getAddress().getHostAddress();
        }

        return "unknown";
    }
}
