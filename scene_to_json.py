#!/usr/bin/env python3
"""
Convert scene.obj file to triangles.json format "as is".

This script converts OBJ data directly to JSON without coordinate system transformations.
It relies on the OBJ file already having the desired coordinate system (e.g. from Blender export settings).

Output JSON structure:
[
  {
    "material": { ... },
    "vertices": [...],
    "normals": [...],
    "triangles": [...]
  }
]
"""

import json
import os
from collections import defaultdict
import math

def parse_mtl_file(mtl_filename):
    """
    Parse MTL (material) file and extract material properties
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
                if command == 'Ka':
                    materials[current_material]['ambient'] = [float(parts[1]), float(parts[2]), float(parts[3])]
                elif command == 'Kd':
                    materials[current_material]['diffuse'] = [float(parts[1]), float(parts[2]), float(parts[3])]
                elif command == 'Ks':
                    materials[current_material]['specular'] = [float(parts[1]), float(parts[2]), float(parts[3])]
                elif command == 'Ns':
                    materials[current_material]['n'] = float(parts[1])
                elif command in ['map_Kd', 'map_Ka', 'map_d']:
                    materials[current_material]['texture'] = ' '.join(parts[1:])
                elif command == 'd':
                    materials[current_material]['alpha'] = float(parts[1])
                elif command == 'Tr':
                    materials[current_material]['alpha'] = 1.0 - float(parts[1])
    
    return materials


def get_object_texture(object_name):
    """
    Get the texture file for a specific object name.
    """
    model_type = object_name.split('.')[0]
    return model_type + '.png'


def read_obj_file(filename):
    """
    Read OBJ file and return vertices, normals, UVs, and faces with object tracking
    """
    vertices = []
    normals = []
    uvs = []
    faces = []
    
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
            
            if command == 'o':
                current_object = parts[1] if len(parts) > 1 else None
            elif command == 'mtllib':
                mtl_filename = ' '.join(parts[1:])
                mtl_path = os.path.join(os.path.dirname(filename), mtl_filename)
                materials = parse_mtl_file(mtl_path)
            elif command == 'usemtl':
                current_material = parts[1]
            elif command == 'v':
                x, y, z = float(parts[1]), float(parts[2]), float(parts[3])
                vertices.append([x, y, z])
            elif command == 'vn':
                nx, ny, nz = float(parts[1]), float(parts[2]), float(parts[3])
                normals.append([nx, ny, nz])
            elif command == 'vt':
                u, v = float(parts[1]), float(parts[2])
                uvs.append([u, v])
            elif command == 'f':
                face = {
                    'vertices': [],
                    'normals': [],
                    'uvs': [],
                    'material': current_material,
                    'object': current_object
                }
                for vertex_str in parts[1:]:
                    indices = vertex_str.split('/')
                    v_idx = int(indices[0]) - 1
                    face['vertices'].append(v_idx)
                    
                    if len(indices) > 1 and indices[1]:
                        vt_idx = int(indices[1]) - 1
                        face['uvs'].append(vt_idx)
                    else:
                        face['uvs'].append(None)
                    
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
    
    # Use vertices and normals exactly as they appear in the OBJ file
    print("Using OBJ coordinates 'as is' (assuming correct export settings)...")
    raw_vertices = obj_data['vertices']
    raw_normals = [normalize(n) for n in obj_data['normals']]
    raw_uvs = obj_data['uvs']
    
    obj_faces = obj_data['faces']
    obj_materials = obj_data['materials']
    
    scene_min = [float("inf")] * 3
    scene_max = [float("-inf")] * 3
    
    faces_by_object = defaultdict(list)
    material_by_object = {}
    
    for face in obj_faces:
        triangles = triangulate_face(face)
        material_name = face['material'] or 'default'
        object_name = face['object'] or 'unknown'
        
        # Group by object only
        faces_by_object[object_name].extend(triangles)
        
        # Store the first material encountered for each object
        if object_name not in material_by_object:
            material_by_object[object_name] = material_name
    
    print(f"Found {len(faces_by_object)} objects")
    
    output = []
    
    for object_name, faces in faces_by_object.items():
        print(f"\nProcessing object: {object_name}")
        
        # Use the first material found for this object
        material_name = material_by_object.get(object_name, 'default')
        
        if material_name in obj_materials:
            material = obj_materials[material_name].copy()
        else:
            material = default_material.copy()
        
        object_texture = get_object_texture(object_name)
        if object_texture:
            material['texture'] = object_texture
        
        vertex_map = {}
        vertices = []
        normals = []
        uvs = []
        triangles = []
        
        set_min = [float("inf")] * 3
        set_max = [float("-inf")] * 3
        
        for face in faces:
            triangle_indices = []
            
            for i in range(3):
                v_idx = face['vertices'][i]
                vn_idx = face['normals'][i]
                position = raw_vertices[v_idx] # Direct access, no transform

                if vn_idx is not None and vn_idx < len(raw_normals):
                    normal = raw_normals[vn_idx] # Direct access, no transform
                else:
                    p0 = raw_vertices[face['vertices'][0]]
                    p1 = raw_vertices[face['vertices'][1]]
                    p2 = raw_vertices[face['vertices'][2]]
                    normal = compute_face_normal(p0, p1, p2)

                vt_idx = face['uvs'][i]
                if vt_idx is not None and vt_idx < len(raw_uvs):
                    uv_values = raw_uvs[vt_idx]
                    # Direct access 'as is', no 1.0 - u flips
                    uv = [uv_values[0], uv_values[1]]
                else:
                    uv = [0.0, 0.0]
                
                position_key = tuple(round(c, 6) for c in position)
                normal_key = tuple(round(c, 6) for c in normal)
                uv_key = tuple(round(c, 6) for c in uv)
                key = (position_key, normal_key, uv_key)
                
                if key not in vertex_map:
                    new_idx = len(vertices)
                    vertex_map[key] = new_idx
                    
                    vertices.append(position)
                    for axis in range(3):
                        set_min[axis] = min(set_min[axis], position[axis])
                        set_max[axis] = max(set_max[axis], position[axis])
                        scene_min[axis] = min(scene_min[axis], position[axis])
                        scene_max[axis] = max(scene_max[axis], position[axis])
                    
                    normals.append(normal)
                    uvs.append(list(uv))
                    triangle_indices.append(new_idx)
                else:
                    triangle_indices.append(vertex_map[key])
            
            triangles.append(triangle_indices)
        
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
    
    print(f"\nWriting {json_filename}...")
    with open(json_filename, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"Conversion complete! Coordinates preserved 'as is'.")


if __name__ == "__main__":
    import sys
    
    obj_file = "scene.obj"
    json_file = "scene.json"
    
    if len(sys.argv) > 1:
        obj_file = sys.argv[1]
    if len(sys.argv) > 2:
        json_file = sys.argv[2]
    
    # Default material
    default_material = {
        "ambient": [0.2, 0.2, 0.2],
        "diffuse": [0.8, 0.8, 0.8],
        "specular": [0.3, 0.3, 0.3],
        "n": 11,
        "alpha": 1.0,
        "texture": None
    }
    
    print("Scene OBJ to JSON Converter (No Axis Transforms)")
    print(f"Input: {obj_file}")
    print(f"Output: {json_file}")
    
    convert_obj_to_json(obj_file, json_file, default_material)