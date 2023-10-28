// Helper Functions

//convert arguments to flat array

function _argumentsToArray(args) {
    return Array.from(args).flat();
}

// Conversion Functions

function radians(degrees) {
    return degrees * (Math.PI / 180.0);
}

// Vector Constructors

//creates a 3 dimensional vector

function vec3() {
    var result = _argumentsToArray(arguments);
    while (result.length < 3) {
        result.push(0.0);
    }
    return result.slice(0, 3);
}

//4 dimensional vector
function vec4() {
    var result = _argumentsToArray(arguments);
    while (result.length < 4) {
        result.push(result.length === 3 ? 1.0 : 0.0);
    }
    return result.slice(0, 4);
}

// 4x4 matrix , using default as the identity matrix

function mat4() {
    var v = _argumentsToArray(arguments);
    var m = [];
    switch (v.length) {
        case 0:
            v.push(1);
        case 1:
            for (var i = 0; i < 4; i++) {
                var row = [];
                for (var j = 0; j < 4; j++) {
                    row.push(i === j ? v[0] : 0.0);
                }
                m.push(vec4(row));
            }
            break;
        default:
            while (v.length > 0) {
                m.push(vec4(v.splice(0, 4)));
            }
            break;
    }
    m.matrix = true;
    return m;
}

// Vector Operations

function dot(u, v) {
    if (u.length !== v.length) {
        throw "dot(): the vectors are not the same dimension";
    }
    var sum = 0.0;
    for (var i = 0; i < u.length; ++i) {
        sum += u[i] * v[i];
    }
    return sum;
}

//calculate length of vector

function length(u) {
    return Math.sqrt(dot(u, u));
}

//normalize a vector to unit length

function normalize(u, excludeLastComponent) {
    if (excludeLastComponent) {
        var last = u.pop();
    }
    var len = length(u);
    if (!isFinite(len)) {
        throw "normalize: the vector" + u + " has zero length";
    }
    for (var i = 0; i < u.length; ++i) {
        u[i] /= len;
    }
    if (excludeLastComponent) {
        u.push(last);
    }
    return u;
}

//linear interpolation between two vectors

function mix(u, v, s) {
    if (typeof s !== "number") {
        throw new Error("mix: the last parameter " + s + " must be a number");
    }
    if (u.length !== v.length) {
        throw new Error("vector dimension mismatch");
    }
    return u.map((valueU, index) => (1.0 - s) * valueU + s * v[index]);
}

//subtract one vector from another

function subtract(u, v) {
    if (u.matrix && v.matrix) {
        if (u.length !== v.length) {
            throw "subtract(): atempting to subtract matrices of different dimensions";
        }
        var result = [];
        for (var i = 0; i < u.length; ++i) {
            if (u[i].length !== v[i].length) {
                throw "subtract(): attempting to subtract matrices of different dimensions";
            }
            var row = [];
            for (var j = 0; j < u[i].length; ++j) {
                row.push(u[i][j] - v[i][j]);
            }
            result.push(row);
        }
        result.matrix = true;
        return result;
    } else if (u.length !== v.length) {
        throw "subtract(): vectors are not the same length";
    } else {
        return u.map((value, index) => value - v[index]);
    }
}

// negate a vector/matrix

function negate(u) {
    return u.map(value => -value);
}

//check if two vectors or matrixes are equal

function equal(u, v) {
    if (u.length !== v.length) {
        return false;
    }
    for (var i = 0; i < u.length; ++i) {
        if (u[i] !== v[i]) {
            return false;
        }
    }
    return true;
}

//calculate cross product of two 3d vectors

function cross(u, v) {
    if (!Array.isArray(u) || u.length < 3 || !Array.isArray(v) || v.length < 3) {
        throw new Error("cross(): arguments are not 3D vectors");
    }
    return [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0]
    ];
}

// Matrix Operations

//generate view matrix to simulate camera looking at object

function lookAt(eye, at, up) {
    var viewDirection = normalize(subtract(at, eye));
    var right = normalize(cross(up, viewDirection));
    var newUp = cross(viewDirection, right);
    return mat4(
        vec4(right, -dot(right, eye)),
        vec4(newUp, -dot(newUp, eye)),
        vec4(negate(viewDirection), dot(viewDirection, eye)),
        vec4()
    );
}

//create orthographic projection matrix

function ortho(left, right, bottom, top, near, far) {
    var w = right - left;
    var h = top - bottom;
    var d = far - near;
    return mat4(
        vec4(2.0 / w, 0, 0, 0),
        vec4(0, 2.0 / h, 0, 0),
        vec4(0, 0, -2.0 / d, 0),
        vec4(-(left + right) / w, -(top + bottom) / h, -(near + far) / d, 1)
    );
}

//convert matrix to single array of floats

function flatten(v) {
    if (v.matrix) {
        v = transpose(v);
    }
    const floats = new Float32Array(v.flat().length);
    v.flat().forEach((value, index) => floats[index] = value);
    return floats;
}

//transpose 

function transpose(m) {
    if (!m.matrix) {
        throw "transpose(): trying to transpose a non matrix";
    }
    return m[0].map((_, i) => m.map(row => row[i]));
}

//multiplication of two  matrixes

function mult(u, v) {
    var result = [];
    if (u.matrix && v.matrix) {
        if (u.length !== v.length) {
            throw "mult(): matrixes must have the same dimensions";
        }
        for (var i = 0; i < u.length; ++i) {
            var row = [];
            for (var j = 0; j < v.length; ++j) {
                var sum = 0.0;
                for (var k = 0; k < u.length; ++k) {
                    sum += u[i][k] * v[k][j];
                }
                row.push(sum);
            }
            result.push(row);
        }
        result.matrix = true;
        return result;
    } else {
        throw "mult(): input dimensions are not compatible";
    }
}

//rotation by axis 

function rotate(angle, axis) {
    var v = normalize(axis);
    var c = Math.cos(radians(angle));
    var omc = 1.0 - c;
    var s = Math.sin(radians(angle));
    return mat4(
        vec4(v[0] * v[0] * omc + c, v[0] * v[1] * omc + v[2] * s, v[0] * v[2] * omc - v[1] * s, 0.0),
        vec4(v[0] * v[1] * omc - v[2] * s, v[1] * v[1] * omc + c, v[1] * v[2] * omc + v[0] * s, 0.0),
        vec4(v[0] * v[2] * omc + v[1] * s, v[1] * v[2] * omc - v[0] * s, v[2] * v[2] * omc + c, 0.0),
        vec4()
    );
}
