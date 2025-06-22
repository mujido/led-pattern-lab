cmake_minimum_required(VERSION 3.16)

# Set partition table BEFORE including ESP-IDF
set(PARTITION_TABLE "partitions.csv")

include($ENV{IDF_PATH}/tools/cmake/project.cmake)

# Check if Node.js and npm are available
find_program(NODE_EXECUTABLE node)
find_program(NPM_EXECUTABLE npm)

if(NOT NODE_EXECUTABLE)
    message(WARNING "Node.js not found. Web build will be skipped.")
    set(WEB_BUILD_ENABLED FALSE)
elseif(NOT NPM_EXECUTABLE)
    message(WARNING "npm not found. Web build will be skipped.")
    set(WEB_BUILD_ENABLED FALSE)
else()
    set(WEB_BUILD_ENABLED TRUE)
    message(STATUS "Node.js found: ${NODE_EXECUTABLE}")
    message(STATUS "npm found: ${NPM_EXECUTABLE}")
endif()

# Custom targets for web build integration
if(WEB_BUILD_ENABLED)
    # Check if web directory exists
    if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/web/package.json")
        # Clean web files target
        add_custom_target(web-clean
            COMMAND ${CMAKE_COMMAND} -E remove_directory ${CMAKE_CURRENT_SOURCE_DIR}/web/dist
            COMMAND ${CMAKE_COMMAND} -E remove_directory ${CMAKE_CURRENT_SOURCE_DIR}/web/node_modules
            COMMAND ${CMAKE_COMMAND} -E echo "Web files cleaned successfully!"
            WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
            COMMENT "Cleaning web build files"
        )

        # Build web application target
        add_custom_target(web-build ALL
            COMMAND ${CMAKE_COMMAND} -E echo "Building web application..."
            COMMAND ${CMAKE_COMMAND} -E chdir ${CMAKE_CURRENT_SOURCE_DIR}/web ${NPM_EXECUTABLE} install
            COMMAND ${CMAKE_COMMAND} -E chdir ${CMAKE_CURRENT_SOURCE_DIR}/web ${NPM_EXECUTABLE} run build
            COMMAND ${CMAKE_COMMAND} -E echo "Web build completed successfully!"
            WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
            COMMENT "Building web application"
        )
    else()
        message(WARNING "web/package.json not found. Web build will be skipped.")
    endif()
else()
    message(STATUS "Web build disabled - using existing web files if available")
endif()

project(led-pattern-lab-firmware)
