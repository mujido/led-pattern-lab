set(SOURCES "main.cpp")

set(REQUIRES
    nvs_flash
    esp_wifi
    esp_event
    esp_common
    esp_netif
    esp_http_server
    spiffs
    vfs
)

idf_component_register(
    SRCS ${SOURCES}
    INCLUDE_DIRS .
    REQUIRES ${REQUIRES}
)

# Add dependency on web build if it exists
if(TARGET web-build)
    add_dependencies(${COMPONENT_LIB} web-build)
endif()

# Create web files directory in build directory
add_custom_target(web-files ALL
    COMMAND ${CMAKE_COMMAND} -E make_directory ${CMAKE_CURRENT_BINARY_DIR}/web
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/../web/dist ${CMAKE_CURRENT_BINARY_DIR}/web
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    COMMENT "Copying web files to build directory"
)

# Create SPIFFS image using ESP-IDF's built-in function
spiffs_create_partition_image(spiffs ${CMAKE_CURRENT_BINARY_DIR}/web FLASH_IN_PROJECT DEPENDS web-files)
