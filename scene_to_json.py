#!/usr/bin/env python3
"""
Convert scene.obj file to triangles.json format with WebGL coordinate system.

This script is similar to obj_to_json.py but handles object-specific texture assignments:
- Torus.005 -> mountain_texture.png (or mountain_texture.jpg if specified)
- Cube -> enemy_tank.png
- Cube.001 -> texture_test.png

Output JSON structure:
[
  {
    "material": { ... },
    "vertices": [...],
    "normals": [...],
    "triangles": [...]
  }
]

Transforms from Blender's Z-up to WebGL's Y-up coordinate system.
"""

import json
import os
from collections import defaultdict
import math


def blender_to_webgl(vertex):
    """
    Convert vertex/normal from Blender (Z-up) to WebGL (Y-up) coordinates
    Transformation: X_webgl = X_blender, Y_webgl = Z_blender, Z_webgl = -Y_blender
    """
    return [vertex[0], vertex[2], -vertex[1]]


def parse_mtl_file(mtl_filename):
    """
    Parse MTL (material) file and extract material properties
    
    Returns:
        Dictionary mapping material names to material properties
    """
    materials = {}
    current_material = None
    
    if not os.path.exists(mtl_filename):
        print(f"Warning: Material file {mtl_filename} not found")
        return materials
    
    print(f"Reading material file: {mtl_filename}")
    
    with open(mtl_filename, 'r') as f:
        for line in f:
            line = line.strip()
            
            if not line or line.startswith('#'):
                continue
            
            parts = line.split()
            if not parts:
                continue
            
            command = parts[0]
            
            if command == 'newmtl':
                # New material definition
                current_material = parts[1]
                materials[current_material] = {
                    'ambient': [0.2, 0.2, 0.2],
                    'diffuse': [0.8, 0.8, 0.8],
                    'specular': [0.0, 0.0, 0.0],
                    'n': 1,
                    'alpha': 1.0,
                    'texture': None
                }
            
            elif current_material:
                if command == 'Ka':  # Ambient color
                    materials[current_material]['ambient'] = [float(parts[1]), float(parts[2]), float(parts[3])]
                
                elif command == 'Kd':  # Diffuse color
                    materials[current_material]['diffuse'] = [float(parts[1]), float(parts[2]), float(parts[3])]
                
                elif command == 'Ks':  # Specular color
                    materials[current_material]['specular'] = [float(parts[1]), float(parts[2]), float(parts[3])]
                
                elif command == 'Ns':  # Specular exponent
                    materials[current_material]['n'] = float(parts[1])
                
                elif command in ['map_Kd', 'map_Ka', 'map_d']:  # Texture map
                    materials[current_material]['texture'] = ' '.join(parts[1:])

                elif command == 'd':  # Transparency (alpha)
                    materials[current_material]['alpha'] = float(parts[1])

                elif command == 'Tr':  # Alternate transparency definition (1 - alpha)
                    materials[current_material]['alpha'] = 1.0 - float(parts[1])
    
    return materials


def get_object_texture(object_name):
    """
    Get the texture file for a specific object name.
    
    Returns:
        Texture filename or None
    """
    texture_map = {
        #  mapping from object name to texture file name
        # 'Cube': 'enemy_tank.png',
    }
    return texture_map.get(object_name)


def read_obj_file(filename):
    """
    Read OBJ file and return vertices, normals, UVs, and faces with object tracking
    
    Returns:
        Dictionary containing:
        - vertices: list of [x, y, z] positions
        - normals: list of [x, y, z] normals
        - uvs: list of [u, v] texture coordinates
        - faces: list of face definitions with material and object info
    """
    vertices = []  # List of vertex positions
    normals = []   # List of vertex normals
    uvs = []       # List of texture coordinates
    faces = []     # List of faces
    
    current_material = None
    current_object = None
    materials = {}
    
    print(f"Reading OBJ file: {filename}")
    
    with open(filename, 'r') as f:
        for line in f:
            line = line.strip()
            
            if not line or line.startswith('#'):
                continue
            
            parts = line.split()
            if not parts:
                continue
            
            command = parts[0]
            
            # Object name
            if command == 'o':
                current_object = parts[1] if len(parts) > 1 else None
                print(f"Found object: {current_object}")
            
            # Reference to material library
            elif command == 'mtllib':
                mtl_filename = ' '.join(parts[1:])
                # Try to find MTL file in same directory as OBJ
                mtl_path = os.path.join(os.path.dirname(filename), mtl_filename)
                materials = parse_mtl_file(mtl_path)
            
            # Use material
            elif command == 'usemtl':
                current_material = parts[1]
            
            # Vertex position
            elif command == 'v':
                x, y, z = float(parts[1]), float(parts[2]), float(parts[3])
                vertices.append([x, y, z])
            
            # Vertex normal
            elif command == 'vn':
                nx, ny, nz = float(parts[1]), float(parts[2]), float(parts[3])
                normals.append([nx, ny, nz])
            
            # Texture coordinate
            elif command == 'vt':
                u, v = float(parts[1]), float(parts[2])
                uvs.append([u, v])
            
            # Face definition
            elif command == 'f':
                face = {
                    'vertices': [],
                    'normals': [],
                    'uvs': [],
                    'material': current_material,
                    'object': current_object
                }
                
                # Parse face vertices (can be v, v/vt, v/vt/vn, or v//vn)
                for vertex_str in parts[1:]:
                    indices = vertex_str.split('/')
                    
                    # Vertex index (required, 1-indexed in OBJ)
                    v_idx = int(indices[0]) - 1
                    face['vertices'].append(v_idx)
                    
                    # Texture coordinate index (optional)
                    if len(indices) > 1 and indices[1]:
                        vt_idx = int(indices[1]) - 1
                        face['uvs'].append(vt_idx)
                    else:
                        face['uvs'].append(None)
                    
                    # Normal index (optional)
                    if len(indices) > 2 and indices[2]:
                        vn_idx = int(indices[2]) - 1
                        face['normals'].append(vn_idx)
                    else:
                        face['normals'].append(None)
                
                faces.append(face)
    
    print(f"Loaded: {len(vertices)} vertices, {len(normals)} normals, {len(uvs)} UVs, {len(faces)} faces")
    
    return {
        'vertices': vertices,
        'normals': normals,
        'uvs': uvs,
        'faces': faces,
        'materials': materials
    }


def triangulate_face(face):
    """
    Triangulate a face (convert quads and n-gons to triangles)
    Uses simple fan triangulation
    
    Returns:
        List of triangulated faces
    """
    if len(face['vertices']) == 3:
        return [face]
    
    triangles = []
    for i in range(1, len(face['vertices']) - 1):
        tri = {
            'vertices': [face['vertices'][0], face['vertices'][i], face['vertices'][i + 1]],
            'normals': [face['normals'][0], face['normals'][i], face['normals'][i + 1]],
            'uvs': [face['uvs'][0], face['uvs'][i], face['uvs'][i + 1]],
            'material': face['material'],
            'object': face['object']
        }
        triangles.append(tri)
    
    return triangles


def normalize(vector):
    length = math.sqrt(vector[0] ** 2 + vector[1] ** 2 + vector[2] ** 2)
    if length == 0:
        return [0.0, 0.0, 0.0]
    return [component / length for component in vector]


def compute_face_normal(p0, p1, p2):
    """Compute normalized face normal for triangle defined by p0, p1, p2."""
    ux, uy, uz = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
    vx, vy, vz = p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]
    nx = uy * vz - uz * vy
    ny = uz * vx - ux * vz
    nz = ux * vy - uy * vx
    return normalize([nx, ny, nz])


def convert_obj_to_json(obj_filename, json_filename, default_material=None):
    """
    Convert OBJ file to triangles.json format with WebGL coordinates.
    
    Output matches the structure produced by `stl_to_json.py` while keeping
    per-material groupings from the OBJ, with object-specific texture overrides.
    
    Args:
        obj_filename: Input OBJ file path
        json_filename: Output JSON file path
        default_material: Optional default material properties dict
    """
    # Default material if none provided
    if default_material is None:
        default_material = {
            "ambient": [0.2, 0.2, 0.2],
            "diffuse": [0.8, 0.8, 0.8],
            "specular": [0.3, 0.3, 0.3],
            "n": 11,
            "alpha": 1.0,
            "texture": None
        }
    
    # Read OBJ file
    obj_data = read_obj_file(obj_filename)
    
    obj_vertices = obj_data['vertices']
    obj_normals = obj_data['normals']
    obj_faces = obj_data['faces']
    obj_uvs = obj_data['uvs']
    obj_materials = obj_data['materials']
    
    # Convert to WebGL coordinate system
    print("Converting from Blender (Z-up) to WebGL (Y-up) coordinate system...")
    webgl_vertices = [blender_to_webgl(v) for v in obj_vertices]
    webgl_normals = [normalize(blender_to_webgl(n)) for n in obj_normals]
    scene_min = [float("inf")] * 3
    scene_max = [float("-inf")] * 3
    scene_normal_sum = [0.0, 0.0, 0.0]
    scene_normal_count = 0
    
    # Group faces by material and object (for texture assignment)
    # Key: (material_name, object_name) to handle object-specific textures
    faces_by_material_object = defaultdict(list)
    
    # Triangulate all faces and group by material and object
    for face in obj_faces:
        triangles = triangulate_face(face)
        material_name = face['material'] or 'default'
        object_name = face['object'] or 'unknown'
        key = (material_name, object_name)
        faces_by_material_object[key].extend(triangles)
    
    print(f"Found {len(faces_by_material_object)} material/object groups")
    
    # Build output structure - one object per material/object combination
    output = []
    
    for (material_name, object_name), faces in faces_by_material_object.items():
        print(f"\nProcessing material: {material_name}, object: {object_name}")
        
        # Get material properties
        if material_name in obj_materials:
            material = obj_materials[material_name].copy()
        else:
            material = default_material.copy()
        
        # Override texture based on object name
        object_texture = get_object_texture(object_name)
        if object_texture:
            material['texture'] = object_texture
            print(f"  Assigned texture: {object_texture} (based on object name)")
        elif material.get('texture'):
            print(f"  Using material texture: {material.get('texture')}")
        else:
            print(f"  No texture assigned")
        
        # Build unique vertex list for this material/object
        vertex_map = {}  # Maps (position, normal, uv) tuples to new index
        vertices = []
        normals = []
        uvs = []
        triangles = []
        set_min = [float("inf")] * 3
        set_max = [float("-inf")] * 3
        set_normal_sum = [0.0, 0.0, 0.0]
        set_normal_count = 0
        
        for face in faces:
            triangle_indices = []
            
            for i in range(3):
                v_idx = face['vertices'][i]
                vn_idx = face['normals'][i]
                position = webgl_vertices[v_idx]

                if vn_idx is not None and vn_idx < len(webgl_normals):
                    normal = webgl_normals[vn_idx]
                else:
                    # Compute face normal using WebGL-space positions
                    p0 = webgl_vertices[face['vertices'][0]]
                    p1 = webgl_vertices[face['vertices'][1]]
                    p2 = webgl_vertices[face['vertices'][2]]
                    normal = compute_face_normal(p0, p1, p2)

                vt_idx = face['uvs'][i]
                if vt_idx is not None and vt_idx < len(obj_uvs):
                    uv_values = obj_uvs[vt_idx]
                    u = uv_values[0]
                    v = uv_values[1] if len(uv_values) >= 2 else 0.0
                    # Provide UVs such that shader's flip (1 - x, 1 - y) restores Blender UVs.
                    uv = [1.0 - u, 1.0 - v]
                else:
                    uv = [0.0, 0.0]
                
                # Create unique key based on position and normal
                position_key = tuple(round(component, 6) for component in position)
                normal_key = tuple(round(component, 6) for component in normal)
                uv_key = tuple(round(component, 6) for component in uv)
                key = (position_key, normal_key, uv_key)
                
                if key not in vertex_map:
                    new_idx = len(vertices)
                    vertex_map[key] = new_idx
                    
                    # Add vertex
                    vertices.append(position)
                    for axis in range(3):
                        set_min[axis] = min(set_min[axis], position[axis])
                        set_max[axis] = max(set_max[axis], position[axis])
                        scene_min[axis] = min(scene_min[axis], position[axis])
                        scene_max[axis] = max(scene_max[axis], position[axis])
                    
                    # Add normal (or compute from face if not available)
                    normals.append(normal)
                    set_normal_sum[0] += normal[0]
                    set_normal_sum[1] += normal[1]
                    set_normal_sum[2] += normal[2]
                    scene_normal_sum[0] += normal[0]
                    scene_normal_sum[1] += normal[1]
                    scene_normal_sum[2] += normal[2]
                    set_normal_count += 1
                    scene_normal_count += 1

                    # Add uv
                    uvs.append(list(uv))
                    
                    triangle_indices.append(new_idx)
                else:
                    triangle_indices.append(vertex_map[key])
            
            triangles.append(triangle_indices)
        
        # Create output object
        obj_output = {
            "material": {
                "ambient": material['ambient'],
                "diffuse": material['diffuse'],
                "specular": material['specular'],
                "n": material['n'],
                "alpha": material.get('alpha', 1.0),
                "texture": material.get('texture')
            },
            "vertices": vertices,
            "normals": normals,
            "uvs": uvs,
            "triangles": triangles
        }
        
        output.append(obj_output)
        
        print(f"  Vertices: {len(vertices)}")
        print(f"  Triangles: {len(triangles)}")
        print(f"  Texture: {material.get('texture', 'None')}")
        
        if vertices:
            set_center = [(set_min[i] + set_max[i]) / 2.0 for i in range(3)]
            set_size = [set_max[i] - set_min[i] for i in range(3)]
            set_diagonal = math.sqrt(sum(component ** 2 for component in set_size))
            max_extent = max(set_size)
            fov_radians = math.pi / 2.0  # 90 degrees, matches make_it_your_own.js
            radius = set_diagonal * 0.5
            camera_distance = radius / math.tan(fov_radians / 2.0) if radius > 0 else 1.0
            suggested_eye = [
                round(set_center[0], 4),
                round(set_center[1], 4),
                round(set_center[2] - camera_distance, 4)
            ]
            print("  Bounds (WebGL):")
            print(f"    X: {set_min[0]:.4f} -> {set_max[0]:.4f} (width {set_size[0]:.4f})")
            print(f"    Y: {set_min[1]:.4f} -> {set_max[1]:.4f} (height {set_size[1]:.4f})")
            print(f"    Z: {set_min[2]:.4f} -> {set_max[2]:.4f} (depth {set_size[2]:.4f})")
            print(f"    Center (use as camera target): {[round(c, 4) for c in set_center]}")
            print(f"    Suggested translation to center at origin: {[round(-c, 4) for c in set_center]}")
            print(f"    Suggested camera eye (look towards +Z): {suggested_eye}")
            if set_normal_count:
                avg_normal = normalize([
                    set_normal_sum[0] / set_normal_count,
                    set_normal_sum[1] / set_normal_count,
                    set_normal_sum[2] / set_normal_count
                ])
                print(f"    Average vertex normal: {[round(component, 4) for component in avg_normal]}")
                if avg_normal[1] < 0:
                    print("    Note: average normal points downward; model may appear inverted around X axis.")
    
    if webgl_vertices:
        scene_center = [(scene_min[i] + scene_max[i]) / 2.0 for i in range(3)]
        scene_size = [scene_max[i] - scene_min[i] for i in range(3)]
        scene_diagonal = math.sqrt(sum(component ** 2 for component in scene_size))
        fov_radians = math.pi / 2.0
        radius = scene_diagonal * 0.5
        camera_distance = radius / math.tan(fov_radians / 2.0) if radius > 0 else 1.0
        suggested_eye = [
            round(scene_center[0], 4),
            round(scene_center[1], 4),
            round(scene_center[2] - camera_distance, 4)
        ]
        print("\nScene diagnostics:")
        print(f"  Scene bounds (WebGL):")
        print(f"    X: {scene_min[0]:.4f} -> {scene_max[0]:.4f} (width {scene_size[0]:.4f})")
        print(f"    Y: {scene_min[1]:.4f} -> {scene_max[1]:.4f} (height {scene_size[1]:.4f})")
        print(f"    Z: {scene_min[2]:.4f} -> {scene_max[2]:.4f} (depth {scene_size[2]:.4f})")
        print(f"    Scene center (camera target): {[round(c, 4) for c in scene_center]}")
        print(f"    Suggested translation to center at origin: {[round(-c, 4) for c in scene_center]}")
        print(f"    Suggested camera eye (look towards +Z): {suggested_eye}")
        if scene_normal_count:
            avg_scene_normal = normalize([
                scene_normal_sum[0] / scene_normal_count,
                scene_normal_sum[1] / scene_normal_count,
                scene_normal_sum[2] / scene_normal_count
            ])
            print(f"    Average vertex normal (scene): {[round(component, 4) for component in avg_scene_normal]}")
            if avg_scene_normal[1] < 0:
                print("    Note: average scene normal points downward; consider rotating 180 degrees about the X axis.")
    
    # Write JSON file
    print(f"\nWriting {json_filename}...")
    with open(json_filename, 'w') as f:
        json.dump(output, f, indent=2)
    
    total_triangles = sum(len(obj['triangles']) for obj in output)
    total_vertices = sum(len(obj['vertices']) for obj in output)
    
    print(f"\nConversion complete!")
    print(f"Total vertices: {total_vertices}")
    print(f"Total triangles: {total_triangles}")
    print(f"Material groups: {len(output)}")
    print(f"Coordinate system: WebGL (Y-up, right-handed)")


if __name__ == "__main__":
    import sys
    
    # Default filenames
    obj_file = "scene.obj"
    json_file = "scene.json"
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        obj_file = sys.argv[1]
    if len(sys.argv) > 2:
        json_file = sys.argv[2]
    
    # Default material (used if no MTL file or material is found)
    default_material = {
        "ambient": [0.2, 0.2, 0.2],
        "diffuse": [0.8, 0.8, 0.8],
        "specular": [0.3, 0.3, 0.3],
        "n": 11,
        "alpha": 1.0,
        "texture": None
    }
    
    print("Scene OBJ to JSON Converter with Object-Specific Textures")
    print("=" * 60)
    print(f"Input: {obj_file}")
    print(f"Output: {json_file}")
    print("=" * 60)
    print()
    
    convert_obj_to_json(obj_file, json_file, default_material)

