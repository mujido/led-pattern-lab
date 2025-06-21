set(SOURCES "main.cpp")

set(REQUIRES
    nvs_flash
    esp_wifi
    esp_event
    esp_common
    esp_netif
    esp_http_server
)

idf_component_register(
    SRCS ${SOURCES}
    INCLUDE_DIRS .
    REQUIRES ${REQUIRES}
)
