const Models = (function() {
    'use strict';

    var inputTriangles = [];
    var inputEllipsoids = [];
    var numTriangleSets = 0;
    var numEllipsoids = 0;
    var vertexBuffers = [];
    var normalBuffers = [];
    var triSetSizes = [];
    var triangleBuffers = [];

    function makeEllipsoid(ellipsoid, numLongSteps) {
        try {
            if (numLongSteps % 2 != 0)
                throw "in makeEllipsoid: uneven number of longitude steps!";
            else if (numLongSteps < 4)
                throw "in makeEllipsoid: number of longitude steps too small!";
            else {
                var ellipsoidVertices = [0, -1, 0];
                var angleIncr = (Math.PI + Math.PI) / numLongSteps;  
                var latLimitAngle = angleIncr * (Math.floor(numLongSteps / 4) - 1);
                var latRadius, latY; 
                for (var latAngle = -latLimitAngle; latAngle <= latLimitAngle; latAngle += angleIncr) {
                    latRadius = Math.cos(latAngle); 
                    latY = Math.sin(latAngle); 
                    for (var longAngle = 0; longAngle < 2 * Math.PI; longAngle += angleIncr) 
                        ellipsoidVertices.push(latRadius * Math.sin(longAngle), latY, latRadius * Math.cos(longAngle));
                } 
                ellipsoidVertices.push(0, 1, 0);
                ellipsoidVertices = ellipsoidVertices.map(function(val, idx) { 
                    switch (idx % 3) {
                        case 0:
                            return (val * ellipsoid.a + ellipsoid.x);
                        case 1:
                            return (val * ellipsoid.b + ellipsoid.y);
                        case 2:
                            return (val * ellipsoid.c + ellipsoid.z);
                    } 
                });

                var ellipsoidNormals = ellipsoidVertices.slice(); 
                ellipsoidNormals = ellipsoidNormals.map(function(val, idx) { 
                    switch (idx % 3) {
                        case 0: 
                            return (2 / (ellipsoid.a * ellipsoid.a) * (val - ellipsoid.x));
                        case 1: 
                            return (2 / (ellipsoid.b * ellipsoid.b) * (val - ellipsoid.y));
                        case 2: 
                            return (2 / (ellipsoid.c * ellipsoid.c) * (val - ellipsoid.z));
                    } 
                });

                var ellipsoidTriangles = []; 
                for (var whichLong = 1; whichLong < numLongSteps; whichLong++) 
                    ellipsoidTriangles.push(0, whichLong, whichLong + 1);
                ellipsoidTriangles.push(0, numLongSteps, 1); 
                var llVertex; 
                for (var whichLat = 0; whichLat < (numLongSteps / 2 - 2); whichLat++) {
                    for (var whichLong = 0; whichLong < numLongSteps - 1; whichLong++) {
                        llVertex = whichLat * numLongSteps + whichLong + 1;
                        ellipsoidTriangles.push(llVertex, llVertex + numLongSteps, llVertex + numLongSteps + 1);
                        ellipsoidTriangles.push(llVertex, llVertex + numLongSteps + 1, llVertex + 1);
                    } 
                    ellipsoidTriangles.push(llVertex + 1, llVertex + numLongSteps + 1, llVertex + 2);
                    ellipsoidTriangles.push(llVertex + 1, llVertex + 2, llVertex - numLongSteps + 2);
                } 
                for (var whichLong = llVertex + 2; whichLong < llVertex + numLongSteps + 1; whichLong++) 
                    ellipsoidTriangles.push(whichLong, ellipsoidVertices.length / 3 - 1, whichLong + 1);
                ellipsoidTriangles.push(ellipsoidVertices.length / 3 - 2, ellipsoidVertices.length / 3 - 1,
                    ellipsoidVertices.length / 3 - numLongSteps - 1); 
            } 
            return { vertices: ellipsoidVertices, normals: ellipsoidNormals, triangles: ellipsoidTriangles };
        } 

        catch(e) {
            console.log(e);
            return null;
        }
    }

    function loadTriangles(gl, trianglesData) {
        inputTriangles = trianglesData;
        numTriangleSets = inputTriangles.length;
        var maxCorner = vec3.fromValues(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
        var minCorner = vec3.fromValues(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);

        for (var whichSet = 0; whichSet < numTriangleSets; whichSet++) {
            inputTriangles[whichSet].center = vec3.fromValues(0, 0, 0);
            inputTriangles[whichSet].on = false;
            inputTriangles[whichSet].translation = vec3.fromValues(0, 0, 0);
            inputTriangles[whichSet].xAxis = vec3.fromValues(1, 0, 0);
            inputTriangles[whichSet].yAxis = vec3.fromValues(0, 1, 0);

            inputTriangles[whichSet].glVertices = [];
            inputTriangles[whichSet].glNormals = [];
            var numVerts = inputTriangles[whichSet].vertices.length;
            for (var whichSetVert = 0; whichSetVert < numVerts; whichSetVert++) {
                var vtxToAdd = inputTriangles[whichSet].vertices[whichSetVert];
                var normToAdd = inputTriangles[whichSet].normals[whichSetVert];
                inputTriangles[whichSet].glVertices.push(vtxToAdd[0], vtxToAdd[1], vtxToAdd[2]);
                inputTriangles[whichSet].glNormals.push(normToAdd[0], normToAdd[1], normToAdd[2]);
                vec3.max(maxCorner, maxCorner, vtxToAdd);
                vec3.min(minCorner, minCorner, vtxToAdd);
                vec3.add(inputTriangles[whichSet].center, inputTriangles[whichSet].center, vtxToAdd);
            }
            vec3.scale(inputTriangles[whichSet].center, inputTriangles[whichSet].center, 1 / numVerts);

            vertexBuffers[whichSet] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[whichSet]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inputTriangles[whichSet].glVertices), gl.STATIC_DRAW);
            normalBuffers[whichSet] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffers[whichSet]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inputTriangles[whichSet].glNormals), gl.STATIC_DRAW);

            inputTriangles[whichSet].glTriangles = [];
            triSetSizes[whichSet] = inputTriangles[whichSet].triangles.length;
            for (var whichSetTri = 0; whichSetTri < triSetSizes[whichSet]; whichSetTri++) {
                var triToAdd = inputTriangles[whichSet].triangles[whichSetTri];
                inputTriangles[whichSet].glTriangles.push(triToAdd[0], triToAdd[1], triToAdd[2]);
            }

            triangleBuffers.push(gl.createBuffer());
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffers[whichSet]);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(inputTriangles[whichSet].glTriangles), gl.STATIC_DRAW);
        }

        var temp = vec3.create();
        var viewDelta = vec3.length(vec3.subtract(temp, maxCorner, minCorner)) / 100;
        return viewDelta;
    }

    function loadEllipsoids(gl, ellipsoidsData, numLongSteps) {
        numLongSteps = numLongSteps || 32;
        inputEllipsoids = ellipsoidsData;
        numEllipsoids = inputEllipsoids.length;

        for (var whichEllipsoid = 0; whichEllipsoid < numEllipsoids; whichEllipsoid++) {
            var ellipsoid = inputEllipsoids[whichEllipsoid];
            ellipsoid.on = false;
            ellipsoid.translation = vec3.fromValues(0, 0, 0);
            ellipsoid.xAxis = vec3.fromValues(1, 0, 0);
            ellipsoid.yAxis = vec3.fromValues(0, 1, 0);
            ellipsoid.center = vec3.fromValues(ellipsoid.x, ellipsoid.y, ellipsoid.z);

            var ellipsoidModel = makeEllipsoid(ellipsoid, numLongSteps);

            vertexBuffers.push(gl.createBuffer());
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[vertexBuffers.length - 1]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ellipsoidModel.vertices), gl.STATIC_DRAW);
            normalBuffers.push(gl.createBuffer());
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffers[normalBuffers.length - 1]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ellipsoidModel.normals), gl.STATIC_DRAW);

            triSetSizes.push(ellipsoidModel.triangles.length);

            triangleBuffers.push(gl.createBuffer());
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffers[triangleBuffers.length - 1]);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ellipsoidModel.triangles), gl.STATIC_DRAW);
        }
    }

    function resetTransforms() {
        for (var whichTriSet = 0; whichTriSet < numTriangleSets; whichTriSet++) {
            vec3.set(inputTriangles[whichTriSet].translation, 0, 0, 0);
            vec3.set(inputTriangles[whichTriSet].xAxis, 1, 0, 0);
            vec3.set(inputTriangles[whichTriSet].yAxis, 0, 1, 0);
        }
        for (var whichEllipsoid = 0; whichEllipsoid < numEllipsoids; whichEllipsoid++) {
            vec3.set(inputEllipsoids[whichEllipsoid].translation, 0, 0, 0);
            vec3.set(inputEllipsoids[whichEllipsoid].xAxis, 1, 0, 0);
            vec3.set(inputEllipsoids[whichEllipsoid].yAxis, 0, 1, 0);
        }
    }

    function getTriangles() {
        return inputTriangles;
    }

    function getEllipsoids() {
        return inputEllipsoids;
    }

    function getNumTriangleSets() {
        return numTriangleSets;
    }

    function getNumEllipsoids() {
        return numEllipsoids;
    }

    function getVertexBuffers() {
        return vertexBuffers;
    }

    function getNormalBuffers() {
        return normalBuffers;
    }

    function getTriangleBuffers() {
        return triangleBuffers;
    }

    function getTriSetSizes() {
        return triSetSizes;
    }

    return {
        makeEllipsoid: makeEllipsoid,
        loadTriangles: loadTriangles,
        loadEllipsoids: loadEllipsoids,
        resetTransforms: resetTransforms,
        getTriangles: getTriangles,
        getEllipsoids: getEllipsoids,
        getNumTriangleSets: getNumTriangleSets,
        getNumEllipsoids: getNumEllipsoids,
        getVertexBuffers: getVertexBuffers,
        getNormalBuffers: getNormalBuffers,
        getTriangleBuffers: getTriangleBuffers,
        getTriSetSizes: getTriSetSizes
    };
})();

