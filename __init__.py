


class MobileClient:
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {},
            "optional": {}
        }

    RETURN_TYPES = ()
    RETURN_NAMES = ()
    OUTPUT_NODE = False
    FUNCTION = None
    ALWAYS_EXECUTE = False

NODE_CLASS_MAPPINGS = {
    "MobileClient": MobileClient
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "MobileClient": "MobileClient (Dummy Node)"
}

WEB_DIRECTORY = "./web"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]