#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_netif.h"
#include "esp_vfs.h"
#include "esp_spiffs.h"

#include "lwip/err.h"
#include "lwip/sys.h"

#include "esp_http_server.h"
#include "sdkconfig.h"

// TODO: Replace with ESP-IDF led_strip library
// #include "led_strip.h"
// led_strip_t *strip;

// --- LED Configuration ---
// Placeholder for LED buffer, to be replaced with led_strip library usage
static uint8_t led_buffer[CONFIG_NUM_LEDS * 3] __attribute__((unused));

// --- Web Server ---
static const char *TAG = "ESP32_SERVER";
static httpd_handle_t server = NULL;

// --- SPIFFS Configuration ---
#define SPIFFS_BASE_PATH "/spiffs"

// MIME type mapping
static const char* get_mime_type(const char* filename) {
    const char* ext = strrchr(filename, '.');
    if (ext == NULL) return "text/plain";

    if (strcmp(ext, ".html") == 0) return "text/html";
    if (strcmp(ext, ".css") == 0) return "text/css";
    if (strcmp(ext, ".js") == 0) return "application/javascript";
    if (strcmp(ext, ".json") == 0) return "application/json";
    if (strcmp(ext, ".png") == 0) return "image/png";
    if (strcmp(ext, ".jpg") == 0 || strcmp(ext, ".jpeg") == 0) return "image/jpeg";
    if (strcmp(ext, ".gif") == 0) return "image/gif";
    if (strcmp(ext, ".svg") == 0) return "image/svg+xml";
    if (strcmp(ext, ".ico") == 0) return "image/x-icon";
    if (strcmp(ext, ".woff") == 0) return "font/woff";
    if (strcmp(ext, ".woff2") == 0) return "font/woff2";
    if (strcmp(ext, ".ttf") == 0) return "font/ttf";

    return "text/plain";
}

// Static file handler
static esp_err_t static_file_handler(httpd_req_t *req)
{
    char filepath[128];
    const char* uri = req->uri;

    ESP_LOGI(TAG, "Static file request: %s", uri);

    // Default to index.html for root path
    if (strcmp(uri, "/") == 0) {
        strcpy(filepath, SPIFFS_BASE_PATH "/index.html");
    } else {
        strcpy(filepath, SPIFFS_BASE_PATH);
        strncat(filepath, uri, sizeof(filepath) - strlen(SPIFFS_BASE_PATH) - 1);
        filepath[sizeof(filepath) - 1] = '\0'; // Ensure null-termination
    }

    ESP_LOGI(TAG, "Serving file: %s", filepath);

    FILE* file = fopen(filepath, "rb");
    if (file == NULL) {
        ESP_LOGE(TAG, "Failed to open file: %s (errno: %d)", filepath, errno);

        // Try to list SPIFFS contents for debugging
        DIR* dir = opendir(SPIFFS_BASE_PATH);
        if (dir != NULL) {
            ESP_LOGI(TAG, "SPIFFS contents:");
            struct dirent* entry;
            while ((entry = readdir(dir)) != NULL) {
                ESP_LOGI(TAG, "  %s", entry->d_name);
            }
            closedir(dir);
        } else {
            ESP_LOGE(TAG, "Failed to open SPIFFS directory");
        }

        httpd_resp_send_404(req);
        return ESP_FAIL;
    }

    // Set content type
    const char* mime_type = get_mime_type(filepath);
    httpd_resp_set_type(req, mime_type);

    // Send file content
    char buffer[1024];
    size_t bytes_read;
    while ((bytes_read = fread(buffer, 1, sizeof(buffer), file)) > 0) {
        if (httpd_resp_send_chunk(req, buffer, bytes_read) != ESP_OK) {
            fclose(file);
            return ESP_FAIL;
        }
    }

    fclose(file);
    httpd_resp_send_chunk(req, NULL, 0); // End response
    ESP_LOGI(TAG, "File served successfully: %s", filepath);
    return ESP_OK;
}

// API endpoint for LED control
static esp_err_t led_api_handler(httpd_req_t *req)
{
    if (req->method == HTTP_POST) {
        // TODO: Handle LED control commands
        // Parse JSON from request body and update LED buffer

        httpd_resp_set_type(req, "application/json");
        httpd_resp_send(req, "{\"status\":\"ok\"}", HTTPD_RESP_USE_STRLEN);
    } else {
        httpd_resp_set_status(req, "405 Method Not Allowed");
        httpd_resp_send(req, NULL, 0);
    }
    return ESP_OK;
}

static void led_update_task(void *pvParameters)
{
    while(1) {
        // TODO: Update LEDs using led_strip library
        vTaskDelay(pdMS_TO_TICKS(16)); // ~60 FPS
    }
}

static httpd_handle_t start_webserver(void)
{
    httpd_handle_t server_handle = NULL;
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.max_open_sockets = 7;
    config.lru_purge_enable = true;

    ESP_LOGI(TAG, "Starting server on port: '%d'", config.server_port);
    if (httpd_start(&server_handle, &config) == ESP_OK)
    {
        // Register API handler first (more specific)
        httpd_uri_t api_uri = {
            .uri = "/api/leds",
            .method = HTTP_POST,
            .handler = led_api_handler,
            .user_ctx = NULL
        };
        httpd_register_uri_handler(server_handle, &api_uri);

        // Register static file handler for root path
        httpd_uri_t root_uri = {
            .uri = "/",
            .method = HTTP_GET,
            .handler = static_file_handler,
            .user_ctx = NULL
        };
        httpd_register_uri_handler(server_handle, &root_uri);

        // Register specific handlers for CSS and JS files
        httpd_uri_t css_uri = {
            .uri = "/index-C4jAUzOy.css",
            .method = HTTP_GET,
            .handler = static_file_handler,
            .user_ctx = NULL
        };
        httpd_register_uri_handler(server_handle, &css_uri);

        httpd_uri_t js_uri = {
            .uri = "/index-a97HNhOD.js",
            .method = HTTP_GET,
            .handler = static_file_handler,
            .user_ctx = NULL
        };
        httpd_register_uri_handler(server_handle, &js_uri);

        // Register static file handler for all other paths using wildcard
        httpd_uri_t static_uri = {
            .uri = "/*",
            .method = HTTP_GET,
            .handler = static_file_handler,
            .user_ctx = NULL
        };
        httpd_register_uri_handler(server_handle, &static_uri);

        ESP_LOGI(TAG, "Server started with static file serving");
        return server_handle;
    }

    ESP_LOGI(TAG, "Error starting server!");
    return NULL;
}

// --- SPIFFS Initialization ---
static esp_err_t init_spiffs(void)
{
    ESP_LOGI(TAG, "Initializing SPIFFS");

    esp_vfs_spiffs_conf_t conf = {
        .base_path = SPIFFS_BASE_PATH,
        .partition_label = NULL,
        .max_files = 5,
        .format_if_mount_failed = true
    };

    esp_err_t ret = esp_vfs_spiffs_register(&conf);
    if (ret != ESP_OK) {
        if (ret == ESP_FAIL) {
            ESP_LOGE(TAG, "Failed to mount or format filesystem");
        } else if (ret == ESP_ERR_NOT_FOUND) {
            ESP_LOGE(TAG, "Failed to find SPIFFS partition");
        } else {
            ESP_LOGE(TAG, "Failed to initialize SPIFFS (%s)", esp_err_to_name(ret));
        }
        return ret;
    }

    size_t total = 0, used = 0;
    ret = esp_spiffs_info(NULL, &total, &used);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to get SPIFFS partition information (%s)", esp_err_to_name(ret));
    } else {
        ESP_LOGI(TAG, "Partition size: total: %zu, used: %zu", total, used);
    }

    // List SPIFFS contents for debugging
    ESP_LOGI(TAG, "Listing SPIFFS contents:");
    DIR* dir = opendir(SPIFFS_BASE_PATH);
    if (dir != NULL) {
        struct dirent* entry;
        int file_count = 0;
        while ((entry = readdir(dir)) != NULL) {
            ESP_LOGI(TAG, "  %s", entry->d_name);
            file_count++;
        }
        closedir(dir);
        ESP_LOGI(TAG, "Total files in SPIFFS: %d", file_count);
    } else {
        ESP_LOGE(TAG, "Failed to open SPIFFS directory for listing");
    }

    return ESP_OK;
}

// --- WiFi Connection ---
static void wifi_event_handler(void *arg, esp_event_base_t event_base,
                               int32_t event_id, void *event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START)
    {
        esp_wifi_connect();
    }
    else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED)
    {
        esp_wifi_connect();
        ESP_LOGI(TAG, "retry to connect to the AP");
    }
    else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP)
    {
        ip_event_got_ip_t *event = (ip_event_got_ip_t *)event_data;
        ESP_LOGI(TAG, "got ip:" IPSTR, IP2STR(&event->ip_info.ip));
        ESP_LOGI(TAG, "Web interface available at: http://" IPSTR, IP2STR(&event->ip_info.ip));
        if (server == NULL)
        {
            server = start_webserver();
        }
    }
}

void wifi_init_sta(void)
{
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    esp_event_handler_instance_t instance_any_id;
    esp_event_handler_instance_t instance_got_ip;
    ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT,
                                                        ESP_EVENT_ANY_ID,
                                                        &wifi_event_handler,
                                                        NULL,
                                                        &instance_any_id));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT,
                                                        IP_EVENT_STA_GOT_IP,
                                                        &wifi_event_handler,
                                                        NULL,
                                                        &instance_got_ip));

    wifi_config_t wifi_config = {};
    strcpy((char*)wifi_config.sta.ssid, CONFIG_WIFI_SSID);
    strcpy((char*)wifi_config.sta.password, CONFIG_WIFI_PASSWORD);
    wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    ESP_LOGI(TAG, "wifi_init_sta finished.");
}

extern "C" void app_main(void)
{
    //Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
      ESP_ERROR_CHECK(nvs_flash_erase());
      ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // Initialize SPIFFS
    ESP_ERROR_CHECK(init_spiffs());

    ESP_LOGI(TAG, "Initializing WiFi");
    wifi_init_sta();

    // TODO: Initialize led_strip library here
    // Example: led_strip_install(); led_strip_new_rmt_device(...)

    xTaskCreate(led_update_task, "led_update_task", 4096, NULL, 5, NULL);
}
