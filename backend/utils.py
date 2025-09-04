# utils.py

from shapely.geometry import Point

def create_circle_polygon(latitude, longitude, radius_km):
    """
    Creates a circular polygon (approximation) around a given point.
    """
    # Your function logic goes here.
    # This is a placeholder; you need to implement the actual logic.
    return Point(longitude, latitude).buffer(radius_km / 111.32) # Simple approximation