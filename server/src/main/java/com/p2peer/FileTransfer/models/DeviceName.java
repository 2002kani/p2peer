package com.p2peer.FileTransfer.models;

// TODO: translate it to englisch
public class DeviceName {
    private static final String[] ADJECTIVES = {
            "Blauer", "Roter", "Grüner", "Stiller", "Schneller",
            "Weißer", "Kleiner", "Wilder", "Goldener", "Kühler",
            "Silberner", "Heller", "Dunkler", "Flinker", "Ruhiger",
            "Warmer", "Klarer", "Sanfter", "Mutiger", "Weiter"
    };

    private static final String[] NOUNS = {
            "Benz", "Bmw", "Porsche", "Volkswagen", "Jaguar",
            "Pagani", "Mustang", "lamborghini", "Alfa Romeo", "Ferrari",
            "Ford", "Opel", "Audi", "Citroen", "Tesla",
            "Bentley", "Renault", "Fiat", "Bugatti", "Seat"
    };

    private DeviceName() {
    }

    public static String createNameForId(String id) {
        // Shifts bit to a positive hash only to prevent exception
        int hash = id.hashCode() & 0x7fffffff;

        String adjective = ADJECTIVES[hash % ADJECTIVES.length];
        String noun = NOUNS[(hash / ADJECTIVES.length) % NOUNS.length];

        return adjective + " " + noun;
    }
}
