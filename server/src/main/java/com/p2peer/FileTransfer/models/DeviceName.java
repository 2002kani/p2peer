package com.p2peer.FileTransfer.models;

// TODO: make it english
/**
 * Erzeugt aus einer Session-ID einen stabilen, lesbaren Namen.
 *
 * "Chrome auf Windows" ist unbrauchbar, sobald zwei davon in der Liste
 * stehen. Ein Fantasiename ist eindeutig und leicht vorzulesen.
 *
 * 20 x 20 = 400 Kombinationen. Das Geburtstagsparadoxon schlaegt frueh
 * zu: bei 10 Geraeten im Raum liegt die Chance auf eine Dopplung schon
 * bei rund 11 Prozent. Deshalb haengt RoomRegistry bei Kollisionen im
 * selben Raum eine Ziffer an.
 */
public class DeviceName {
    private static final String[] ADJECTIVES = {
            "Blauer", "Roter", "Gruener", "Stiller", "Schneller",
            "Weiser", "Kleiner", "Wilder", "Goldener", "Kuehler",
            "Silberner", "Heller", "Dunkler", "Flinker", "Ruhiger",
            "Warmer", "Klarer", "Sanfter", "Mutiger", "Weiter"
    };

    private static final String[] NOUNS = {
            "Tiger", "Falke", "Otter", "Dachs", "Kranich",
            "Luchs", "Marder", "Reiher", "Wolf", "Igel",
            "Panda", "Fuchs", "Rabe", "Biber", "Hirsch",
            "Uhu", "Seehund", "Steinbock", "Waschbaer", "Schwan"
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
