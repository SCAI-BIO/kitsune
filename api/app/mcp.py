from fastapi import FastAPI
from fastapi_mcp import FastApiMCP


def setup_mcp(app: FastAPI) -> FastApiMCP:
    """Configures and mounts the Model Context Protocol server."""
    mcp = FastApiMCP(
        app,
        include_operations=[
            "get_total_number_of_concepts",
            "get_all_concepts",
            "get_concept",
            "get_closest_mappings_for_text",
            "get_closest_mappings_for_dictionary",
            "get_current_version",
            "health_check",
            "get_total_number_of_mappings",
            "get_all_mappings",
            "get_mapping",
            "get_all_terminologies",
            "get_terminology",
            "get_all_vectorizers",
            "serve_visualization",
        ],
    )
    mcp.mount_http()
    return mcp
