const viewerRoot = document.querySelector("[data-bluebox-hero-model]");

if (viewerRoot) {
  const canvas = viewerRoot.querySelector("canvas");
  const modelSrc = viewerRoot.dataset.modelSrc;
  const hero = viewerRoot.closest(".home-hero");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileViewport = window.matchMedia("(max-width: 760px)");

  if (canvas && modelSrc && !mobileViewport.matches) {
    initBlueBoxViewer({ canvas, hero, modelSrc, reducedMotion }).catch(() => {
      viewerRoot.classList.add("is-unavailable");
    });
  }
}

async function initBlueBoxViewer({ canvas, hero, modelSrc, reducedMotion }) {
  const root = canvas.closest("[data-bluebox-hero-model]");
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    depth: true,
    premultipliedAlpha: false,
  });

  if (!gl) {
    throw new Error("WebGL unavailable");
  }

  const model = await loadGlb(modelSrc);
  const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
  const attributes = {
    position: gl.getAttribLocation(program, "aPosition"),
    normal: gl.getAttribLocation(program, "aNormal"),
    color: gl.getAttribLocation(program, "aColor"),
  };
  const uniforms = {
    model: gl.getUniformLocation(program, "uModel"),
    viewProjection: gl.getUniformLocation(program, "uViewProjection"),
    camera: gl.getUniformLocation(program, "uCamera"),
    pointer: gl.getUniformLocation(program, "uPointer"),
    resolution: gl.getUniformLocation(program, "uResolution"),
    revealRadius: gl.getUniformLocation(program, "uRevealRadius"),
    revealSoftness: gl.getUniformLocation(program, "uRevealSoftness"),
    revealStrength: gl.getUniformLocation(program, "uRevealStrength"),
  };

  const positionBuffer = makeArrayBuffer(gl, model.positions);
  const normalBuffer = makeArrayBuffer(gl, model.normals);
  const colorBuffer = makeArrayBuffer(gl, model.colors);
  const indexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.indices, gl.STATIC_DRAW);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 0);

  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  const reveal = { x: 0.5, y: 0.54 };
  const revealTarget = { x: 0.5, y: 0.54 };
  let revealTargetStrength = 0;
  let revealStrength = 0;
  let frameId = null;
  let firstFrameDrawn = false;
  let width = 0;
  let height = 0;

  const updatePointer = (event) => {
    if (reducedMotion.matches || !hero) {
      return;
    }

    const rect = hero.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const isOverCanvas =
      event.clientX >= canvasRect.left &&
      event.clientX <= canvasRect.right &&
      event.clientY >= canvasRect.top &&
      event.clientY <= canvasRect.bottom;

    target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    revealTargetStrength = isOverCanvas ? 1 : 0;

    if (isOverCanvas) {
      revealTarget.x = clamp((event.clientX - canvasRect.left) / canvasRect.width, 0, 1);
      revealTarget.y = clamp(1 - (event.clientY - canvasRect.top) / canvasRect.height, 0, 1);
    }
  };

  const resetPointer = () => {
    target.x = 0;
    target.y = 0;
    revealTargetStrength = 0;
  };

  hero?.addEventListener("pointermove", updatePointer, { passive: true });
  hero?.addEventListener("pointerleave", resetPointer, { passive: true });

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width * ratio));
    height = Math.max(1, Math.floor(rect.height * ratio));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    gl.viewport(0, 0, width, height);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  window.addEventListener("resize", resize, { passive: true });
  resize();

  const render = (time = 0) => {
    pointer.x += (target.x - pointer.x) * 0.055;
    pointer.y += (target.y - pointer.y) * 0.055;
    reveal.x += (revealTarget.x - reveal.x) * 0.14;
    reveal.y += (revealTarget.y - reveal.y) * 0.14;
    revealStrength += (revealTargetStrength - revealStrength) * 0.16;

    const motion = reducedMotion.matches ? 0 : 1;
    const idle = Math.sin(time * 0.00045) * 0.035 * motion;
    const breathe = Math.sin(time * 0.0007) * 0.045 * motion;

    const aspect = width / Math.max(height, 1);
    const projection = perspective(degToRad(39), aspect, 0.1, 80);
    const camera = [
      0.1 + pointer.x * 0.38 * motion,
      3.35 - pointer.y * 0.22 * motion,
      -10.2,
    ];
    const view = lookAt(camera, [0, 0.78, 0.06], [0, 1, 0]);
    const viewProjection = multiply(projection, view);

    let modelMatrix = identity();
    modelMatrix = multiply(modelMatrix, rotationX(degToRad(-9 + pointer.y * 4.5 * motion)));
    modelMatrix = multiply(modelMatrix, rotationY(degToRad(14 + pointer.x * 8 * motion) + idle));
    modelMatrix = multiply(modelMatrix, rotationZ(degToRad(pointer.x * 1.8 * motion)));
    modelMatrix = multiply(modelMatrix, translation(0.02, 0.18 + breathe, 0));
    modelMatrix = multiply(modelMatrix, scale(1.08, 1.08, 1.08));

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniformMatrix4fv(uniforms.model, false, modelMatrix);
    gl.uniformMatrix4fv(uniforms.viewProjection, false, viewProjection);
    gl.uniform3fv(uniforms.camera, camera);
    gl.uniform2f(uniforms.pointer, reveal.x, reveal.y);
    gl.uniform2f(uniforms.resolution, width, height);
    gl.uniform1f(uniforms.revealRadius, 0.16);
    gl.uniform1f(uniforms.revealSoftness, 0.075);
    gl.uniform1f(uniforms.revealStrength, revealStrength);

    bindAttribute(gl, positionBuffer, attributes.position, 3);
    bindAttribute(gl, normalBuffer, attributes.normal, 3);
    bindAttribute(gl, colorBuffer, attributes.color, 3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);

    if (!firstFrameDrawn) {
      firstFrameDrawn = true;
      root?.classList.add("is-ready");
    }

    frameId = requestAnimationFrame(render);
  };

  frameId = requestAnimationFrame(render);

  window.addEventListener("pagehide", () => {
    if (frameId) {
      cancelAnimationFrame(frameId);
    }
    resizeObserver.disconnect();
  });
}

async function loadGlb(url) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Could not load GLB: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const data = new DataView(arrayBuffer);

  if (data.getUint32(0, true) !== 0x46546c67 || data.getUint32(4, true) !== 2) {
    throw new Error("Invalid GLB header");
  }

  const jsonLength = data.getUint32(12, true);
  const jsonType = data.getUint32(16, true);

  if (jsonType !== 0x4e4f534a) {
    throw new Error("Missing JSON chunk");
  }

  const jsonStart = 20;
  const jsonEnd = jsonStart + jsonLength;
  const gltf = JSON.parse(new TextDecoder().decode(bytes.subarray(jsonStart, jsonEnd)).trim());
  const binLength = data.getUint32(jsonEnd, true);
  const binType = data.getUint32(jsonEnd + 4, true);

  if (binType !== 0x004e4942) {
    throw new Error("Missing BIN chunk");
  }

  const bin = bytes.subarray(jsonEnd + 8, jsonEnd + 8 + binLength);
  const primitive = gltf.meshes[0].primitives[0];

  return {
    positions: accessorFloat32(gltf, bin, primitive.attributes.POSITION, 3),
    normals: accessorFloat32(gltf, bin, primitive.attributes.NORMAL, 3),
    colors: accessorFloat32(gltf, bin, primitive.attributes.COLOR_0, 3),
    indices: accessorUint16(gltf, bin, primitive.indices),
  };
}

function accessorFloat32(gltf, bin, accessorIndex, components) {
  const accessor = gltf.accessors[accessorIndex];
  const view = gltf.bufferViews[accessor.bufferView];
  const offset = (view.byteOffset || 0) + (accessor.byteOffset || 0);

  return new Float32Array(bin.buffer, bin.byteOffset + offset, accessor.count * components);
}

function accessorUint16(gltf, bin, accessorIndex) {
  const accessor = gltf.accessors[accessorIndex];
  const view = gltf.bufferViews[accessor.bufferView];
  const offset = (view.byteOffset || 0) + (accessor.byteOffset || 0);

  return new Uint16Array(bin.buffer, bin.byteOffset + offset, accessor.count);
}

function makeArrayBuffer(gl, data) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buffer;
}

function bindAttribute(gl, buffer, location, size) {
  if (location < 0) {
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(message || "Could not link shader program");
  }

  return program;
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message || "Could not compile shader");
  }

  return shader;
}

function degToRad(value) {
  return (value * Math.PI) / 180;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function identity() {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

function multiply(a, b) {
  const out = new Float32Array(16);

  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[column * 4 + row] =
        a[0 * 4 + row] * b[column * 4 + 0] +
        a[1 * 4 + row] * b[column * 4 + 1] +
        a[2 * 4 + row] * b[column * 4 + 2] +
        a[3 * 4 + row] * b[column * 4 + 3];
    }
  }

  return out;
}

function translation(x, y, z) {
  const out = identity();
  out[12] = x;
  out[13] = y;
  out[14] = z;
  return out;
}

function scale(x, y, z) {
  const out = identity();
  out[0] = x;
  out[5] = y;
  out[10] = z;
  return out;
}

function rotationX(rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);

  return new Float32Array([
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1,
  ]);
}

function rotationY(rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);

  return new Float32Array([
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1,
  ]);
}

function rotationZ(rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);

  return new Float32Array([
    c, s, 0, 0,
    -s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

function perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2);
  const range = 1 / (near - far);

  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * range, -1,
    0, 0, near * far * range * 2, 0,
  ]);
}

function lookAt(eye, center, up) {
  const z = normalize([
    eye[0] - center[0],
    eye[1] - center[1],
    eye[2] - center[2],
  ]);
  const x = normalize(cross(up, z));
  const y = cross(z, x);

  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
  ]);
}

function normalize(value) {
  const length = Math.hypot(value[0], value[1], value[2]) || 1;
  return [value[0] / length, value[1] / length, value[2] / length];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

const vertexShaderSource = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  attribute vec3 aColor;

  uniform mat4 uModel;
  uniform mat4 uViewProjection;

  varying vec3 vNormal;
  varying vec3 vColor;
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = uModel * vec4(aPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormal = mat3(uModel) * aNormal;
    vColor = aColor;
    gl_Position = uViewProjection * worldPosition;
  }
`;

const fragmentShaderSource = `
  precision highp float;

  uniform vec3 uCamera;
  uniform vec2 uPointer;
  uniform vec2 uResolution;
  uniform float uRevealRadius;
  uniform float uRevealSoftness;
  uniform float uRevealStrength;

  varying vec3 vNormal;
  varying vec3 vColor;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightA = normalize(vec3(-0.45, 0.9, -0.38));
    vec3 lightB = normalize(vec3(0.72, 0.46, 0.55));
    vec3 viewDirection = normalize(uCamera - vWorldPosition);

    float diffuseA = max(dot(normal, lightA), 0.0);
    float diffuseB = max(dot(normal, lightB), 0.0);
    float rim = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.0);
    vec3 color = vColor * (0.72 + diffuseA * 0.34 + diffuseB * 0.24) + vec3(0.14, 0.2, 0.34) * rim * 0.48;
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 distanceVector = vec2((uv.x - uPointer.x) * (uResolution.x / uResolution.y), uv.y - uPointer.y);
    float distanceFromPointer = length(distanceVector);
    float reveal = (1.0 - smoothstep(uRevealRadius, uRevealRadius + uRevealSoftness, distanceFromPointer)) * uRevealStrength;
    float revealRing = (1.0 - smoothstep(0.012, 0.055, abs(distanceFromPointer - uRevealRadius))) * uRevealStrength;
    float interior = smoothstep(0.22, 0.34, vColor.r);
    float shellBlue = smoothstep(0.17, 0.28, vColor.b) * (1.0 - smoothstep(0.18, 0.34, vColor.r));
    float frontWallBase = 1.0 - smoothstep(0.028, 0.08, distance(vColor, vec3(0.095, 0.16, 0.39)));
    float frontWallRib = 1.0 - smoothstep(0.028, 0.08, distance(vColor, vec3(0.135, 0.22, 0.5)));
    float roofBase = 1.0 - smoothstep(0.028, 0.08, distance(vColor, vec3(0.075, 0.135, 0.35)));
    float roofRib = 1.0 - smoothstep(0.028, 0.08, distance(vColor, vec3(0.115, 0.205, 0.47)));
    float revealWall = max(max(frontWallBase, frontWallRib), max(roofBase, roofRib));
    float wallSurface = shellBlue * (1.0 - smoothstep(0.34, 0.78, abs(normal.y)));
    float ribPattern = abs(fract(vWorldPosition.x * 4.9) - 0.5);
    float ridgeHighlight = 1.0 - smoothstep(0.16, 0.25, ribPattern);
    float ridgeGroove = 1.0 - smoothstep(0.018, 0.07, ribPattern);

    if (revealWall > 0.45 && reveal > 0.12) {
      discard;
    }

    if (interior > 0.45 && reveal < 0.035) {
      discard;
    }

    color = mix(color, color + vec3(0.04, 0.07, 0.14), shellBlue * 0.42);
    color += vec3(0.08, 0.12, 0.2) * ridgeHighlight * wallSurface * 0.32;
    color -= vec3(0.035, 0.045, 0.07) * ridgeGroove * wallSurface * 0.55;
    color += vec3(0.18, 0.23, 0.36) * revealRing * 0.2;
    color = mix(color * 0.86, color * 1.14 + vec3(0.03, 0.04, 0.08), interior * reveal * 0.82);

    gl_FragColor = vec4(color, 1.0);
  }
`;
