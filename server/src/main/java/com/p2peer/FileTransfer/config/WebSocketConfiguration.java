package com.p2peer.FileTransfer.config;

import com.p2peer.FileTransfer.signaling.SignalingHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocket
public class WebSocketConfiguration implements WebSocketConfigurer {
    private final SignalingHandler handler;
    private final WebSocketInterceptor interceptor;

    public WebSocketConfiguration(SignalingHandler handler,  WebSocketInterceptor interceptor) {
        this.handler = handler;
        this.interceptor = interceptor;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws")
                .addInterceptors(interceptor)
                .setAllowedOriginPatterns("*");
    }
}
