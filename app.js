// all constants

//defining constants for camera position  and the tetrahedron vertices

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
const va = vec4(0.0, 0.0, -1.0, 1);
const vb = vec4(0.0, 0.942809, 0.333333, 1);
const vc = vec4(-0.816497, -0.471405, 0.333333, 1);
const vd = vec4(0.816497, -0.471405, 0.333333, 1);

// all global variables --tetrahedron properties, camera properties, and webgl setup

var numTimesToSubdivide = 5;
var index = 0;
var positions = [];
var near = -20;
var far = 20;
var radius = 2.0;
var theta = 25.0;
var phi = 30.0;
var dr = 2.0 * Math.PI / 180.0;
var left = -2.0;
var right = 2.0;
var ytop = 2.0;
var bottom = -2.0;

//model and projection matrixes

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eye;
let autoRotate = true;

// triangle functions to draw and divide triangles

function triangle(a, b, c) {
    positions.push(a);
    positions.push(b);
    positions.push(c);
    index += 3;
}

function divideTriangle(a, b, c, count) {
    if (count > 0) {
        const ab = normalize(mix(a, b, 0.5), true);
        const ac = normalize(mix(a, c, 0.5), true);
        const bc = normalize(mix(b, c, 0.5), true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    } else {
        triangle(a, b, c);
    }
}

//tetrahedron creation by dividing our triangles

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

// webgl setup

const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl') || canvas.getContext('2d');
if (!gl) {
    console.log('WebGL not supported');
} else {
    console.log('Using WebGL context');
}

//viewport

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LESS);
gl.enable(gl.POLYGON_OFFSET_FILL);
gl.polygonOffset(1.0, 2.0);

// shader setup ((vertex shader and fragment shader))

const vertexShaderSource = `
    attribute vec4 aVertexPosition;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
`;
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);

const fragmentShaderSource = `
    precision mediump float;
    void main() {
        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
    }
`;
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

//tetrahedron creation

tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

//shader attributes and locations

const aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
const uModelViewMatrix = gl.getUniformLocation(program, 'uModelViewMatrix');
const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');

gl.vertexAttribPointer(aVertexPosition, 4, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aVertexPosition);

// event listener

window.addEventListener("message", function (event) {
    if (event.source !== window.parent) return;
    if (event.data.type === "increase-subdivision") {
        if (numTimesToSubdivide < 8) {
            numTimesToSubdivide++;
            index = 0;
            positions = [];
            tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
        }
    } else if (event.data.type === "decrease-subdivision") {
        if (numTimesToSubdivide > 0) {
            numTimesToSubdivide--;
            index = 0;
            positions = [];
            tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
        }
    }
});

// animation and render

setInterval(() => {
    if (autoRotate) {
        theta -= Math.PI / 500;
    }
}, 10);

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(theta));

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(projectionMatrix));

    for (var i = 0; i < index; i += 3) {
        gl.drawArrays(gl.LINE_LOOP, i, 3);
    }
    requestAnimationFrame(render);
}

render();
