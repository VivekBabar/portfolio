// three-scene.js
// Upgraded high-end interactive 3D AI neural network environment.
// Features: Dynamic plexus, mouse attraction, click repulsion with visual rings, central core waves, and zipping connection pulses.

let scene, camera, renderer;
let nodes = [];                 // Array of dynamic plexus node objects
let backgroundStars;            // Faint background depth particles
let centralCoreGroup;           // Contains the central pulsating AI core
let coreShell, corePoints;      // Central core geometries

let dynamicLines;               // LineSegments for plexus connections
let linePositionsAttr;
let lineColorsAttr;

let connectionPulses = [];      // Glowing energy packets travelling along lines
let pulsePoints;                // Points mesh representing the energy packets
let nodePoints;                 // Points mesh representing the plexus junctions (nodes)

let clickRipples = [];          // Expanding holographic rings on click

// Mouse coordinates & projection vectors
let mouse3D = new THREE.Vector3(0, 0, 0);
let targetMouseX = 0, targetMouseY = 0;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// Configurations
const NODE_COUNT = 200;
const BACKGROUND_STAR_COUNT = 450;
const MAX_CONNECTION_DIST = 175;
const PULSE_COUNT = 30;

// Palettes
const themeColors = {
  dark: {
    bg: 0x03001e,
    node: 0x00f0ff,       // Cyan
    lineStart: 0x0066ff,  // Blue
    lineEnd: 0xd900ff,    // Purple
    core: 0x00f0ff,
    pulse: 0x39ff14,      // Neon Green
    star: 0xffffff
  },
  light: {
    bg: 0xf5f7ff,
    node: 0x0066ff,
    lineStart: 0x00a3cc,
    lineEnd: 0xb000cc,
    core: 0xb000cc,
    pulse: 0x00ffaa,
    star: 0x0066ff
  }
};

let currentTheme = 'dark';

// Node physics class
class NetworkNode {
  constructor() {
    this.position = new THREE.Vector3(
      (Math.random() - 0.5) * 1500,
      (Math.random() - 0.5) * 1300,
      (Math.random() - 0.5) * 850
    );
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 1.2,
      (Math.random() - 0.5) * 1.2,
      (Math.random() - 0.5) * 1.2
    );
    // Base velocity to return to after perturbations
    this.baseVelocity = this.velocity.clone();
    this.friction = 0.96; // Slow down drag force
  }

  update(time) {
    // Return slowly towards base velocity direction
    this.velocity.lerp(this.baseVelocity, 0.02);
    
    // Apply friction to dampen strong impulses (like click repulsion)
    this.velocity.multiplyScalar(this.friction);
    
    this.position.add(this.velocity);

    // Boundary bounce checks
    const boundsX = 900, boundsY = 750, boundsZ = 500;
    if (Math.abs(this.position.x) > boundsX) {
      this.position.x = Math.sign(this.position.x) * boundsX;
      this.velocity.x *= -1;
      this.baseVelocity.x *= -1;
    }
    if (Math.abs(this.position.y) > boundsY) {
      this.position.y = Math.sign(this.position.y) * boundsY;
      this.velocity.y *= -1;
      this.baseVelocity.y *= -1;
    }
    if (Math.abs(this.position.z) > boundsZ) {
      this.position.z = Math.sign(this.position.z) * boundsZ;
      this.velocity.z *= -1;
      this.baseVelocity.z *= -1;
    }
  }
}

// Click Ripple Shockwave Class
class ClickRipple {
  constructor(position) {
    this.position = position.clone();
    this.maxRadius = 240;
    this.currentRadius = 10;
    this.speed = 4.5;
    this.opacity = 0.85;

    const geom = new THREE.RingGeometry(this.currentRadius - 1.5, this.currentRadius + 1.5, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: themeColors[currentTheme].lineEnd,
      transparent: true,
      opacity: this.opacity,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.position.copy(this.position);
    
    // Align face towards camera
    this.mesh.lookAt(camera.position);

    scene.add(this.mesh);
  }

  update() {
    this.currentRadius += this.speed;
    this.opacity = 1.0 - (this.currentRadius / this.maxRadius);

    if (this.currentRadius >= this.maxRadius) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      return false; // mark for deletion
    }

    // Rebuild geometry to expand the ring radius
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.RingGeometry(this.currentRadius - 1.5, this.currentRadius + 1.5, 32);
    this.mesh.material.opacity = this.opacity;
    scene.add(this.mesh);
    
    return true; // keep alive
  }
}

function initThree() {
  const container = document.getElementById('three-container');
  if (!container) return;

  // 1. Setup Scene, Camera, and Renderer
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(themeColors[currentTheme].bg, 0.0012);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1500);
  camera.position.z = 580;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // 2. Initialize Plexus Nodes
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push(new NetworkNode());
  }

  // 3. Create Dynamic Plexus Line Mesh
  createDynamicLines();

  // Create Plexus Node Points
  createNodePoints();

  // 4. Create Background Drifting Stars
  createBackgroundStars();

  // 5. Create central AI Hologram Core
  createAICore();

  // 6. Create connection traveling energy pulses
  createConnectionPulses();

  // 7. Event listeners
  document.addEventListener('mousemove', onDocumentMouseMove);
  window.addEventListener('click', onDocumentClick);
  window.addEventListener('resize', onWindowResize);

  // 8. Start Loop
  animate();
}

function createDynamicLines() {
  // Max connections is bounded to prevent buffer overheads
  const maxLines = NODE_COUNT * 8;
  const geom = new THREE.BufferGeometry();
  
  const positions = new Float32Array(maxLines * 2 * 3); // 2 vertices per line, 3 coords each
  const colors = new Float32Array(maxLines * 2 * 3);

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    linewidth: 1 // WebGL limitations lock line width to 1
  });

  dynamicLines = new THREE.LineSegments(geom, mat);
  linePositionsAttr = dynamicLines.geometry.attributes.position;
  lineColorsAttr = dynamicLines.geometry.attributes.color;
  scene.add(dynamicLines);
}

function createNodePoints() {
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(NODE_COUNT * 3);
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: themeColors[currentTheme].node,
    size: 8.0,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });

  nodePoints = new THREE.Points(geom, mat);
  scene.add(nodePoints);
}

function createBackgroundStars() {
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(BACKGROUND_STAR_COUNT * 3);
  const colors = new Float32Array(BACKGROUND_STAR_COUNT * 3);
  const color = new THREE.Color(themeColors[currentTheme].star);

  for (let i = 0; i < BACKGROUND_STAR_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 2600;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2200;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1500 - 400; // Far background shift

    colors[i * 3] = color.r * (0.3 + Math.random() * 0.4);
    colors[i * 3 + 1] = color.g * (0.3 + Math.random() * 0.4);
    colors[i * 3 + 2] = color.b * (0.3 + Math.random() * 0.4);
  }

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending
  });

  backgroundStars = new THREE.Points(geom, mat);
  scene.add(backgroundStars);
}

function createAICore() {
  centralCoreGroup = new THREE.Group();
  scene.add(centralCoreGroup);

  // A. Inner dense wireframe sphere
  const shellGeom = new THREE.IcosahedronGeometry(130, 2);
  const shellMat = new THREE.MeshBasicMaterial({
    color: themeColors[currentTheme].core,
    wireframe: true,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending
  });
  coreShell = new THREE.Mesh(shellGeom, shellMat);
  centralCoreGroup.add(coreShell);

  // B. Glowing points on core surface
  const pointsGeom = new THREE.IcosahedronGeometry(130, 2);
  const pointsMat = new THREE.PointsMaterial({
    color: themeColors[currentTheme].node,
    size: 5.0,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  corePoints = new THREE.Points(pointsGeom, pointsMat);
  
  // Save original positions to run core distortions
  const posAttr = pointsGeom.attributes.position;
  const originalPos = [];
  for (let i = 0; i < posAttr.count; i++) {
    originalPos.push(new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)));
  }
  corePoints.userData = { originalPos, posAttr };

  centralCoreGroup.add(corePoints);
}

function createConnectionPulses() {
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(PULSE_COUNT * 3);
  
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: themeColors[currentTheme].pulse,
    size: 9.5,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });

  pulsePoints = new THREE.Points(geom, mat);
  scene.add(pulsePoints);

  // Setup pulse objects metadata
  for (let i = 0; i < PULSE_COUNT; i++) {
    connectionPulses.push({
      startNode: -1,
      endNode: -1,
      progress: 1.0, // immediately trigger search on first run
      speed: 0.015 + Math.random() * 0.02
    });
  }
}

// Convert 2D screen coordinate to 3D world coordinate at depth z = 0
function updateMouse3D(clientX, clientY) {
  const vector = new THREE.Vector3(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1,
    0.5
  );
  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  mouse3D.copy(camera.position).add(dir.multiplyScalar(distance));
}

function onDocumentMouseMove(event) {
  targetMouseX = event.clientX - windowHalfX;
  targetMouseY = event.clientY - windowHalfY;
  updateMouse3D(event.clientX, event.clientY);
}

function onDocumentClick(event) {
  updateMouse3D(event.clientX, event.clientY);
  
  // 1. Trigger physical repelling impulse on nodes close to click location
  nodes.forEach(node => {
    const fromClick = new THREE.Vector3().subVectors(node.position, mouse3D);
    const dist = fromClick.length();
    if (dist < 260) {
      // Outward force scaled by proximity
      const impulse = (1.0 - (dist / 260)) * 14.0;
      node.velocity.add(fromClick.normalize().multiplyScalar(impulse));
    }
  });

  // 2. Spawn expanding holographic ring at clicked position
  clickRipples.push(new ClickRipple(mouse3D));
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.001;

  // 1. Soft hover drag lag on cursor coordinates
  mouseX += (targetMouseX - mouseX) * 0.06;
  mouseY += (targetMouseY - mouseY) * 0.06;

  // 2. Slow orbital floating movements on the camera
  camera.position.x += (mouseX * 0.22 - camera.position.x) * 0.05;
  camera.position.y += (-mouseY * 0.22 - camera.position.y) * 0.05;
  camera.position.x += Math.sin(time * 0.35) * 1.5;
  camera.position.y += Math.cos(time * 0.35) * 1.5;
  camera.lookAt(scene.position);

  // 3. Central Holographic Core animation
  animateAICore(time);

  // 4. Update Click shockwave ripples
  clickRipples = clickRipples.filter(ripple => ripple.update());

  // 5. Update nodes positions & handle mouse attraction
  nodes.forEach(node => {
    const toMouse = new THREE.Vector3().subVectors(mouse3D, node.position);
    const dist = toMouse.length();
    if (dist < 250 && dist > 10) {
      // Soft gravitational drag towards cursor
      const attraction = (1.0 - (dist / 250)) * 0.45;
      node.velocity.add(toMouse.normalize().multiplyScalar(attraction));
    }
    node.update(time);
  });

  // Update visual node point positions at plexus junctions
  if (nodePoints) {
    const nodePosAttr = nodePoints.geometry.attributes.position;
    const posArray = nodePosAttr.array;
    for (let i = 0; i < NODE_COUNT; i++) {
      posArray[i * 3] = nodes[i].position.x;
      posArray[i * 3 + 1] = nodes[i].position.y;
      posArray[i * 3 + 2] = nodes[i].position.z;
    }
    nodePosAttr.needsUpdate = true;
  }

  // 6. Draw dynamic connection lines and build active links pool
  const activeLinks = updateDynamicLinesAndGetActiveLinks();

  // 7. Update and render zipping connection pulses
  updateConnectionPulses(activeLinks);

  // 8. Background stars drifting
  if (backgroundStars) {
    backgroundStars.rotation.y = time * 0.006;
    backgroundStars.rotation.x = time * 0.002;
  }

  renderer.render(scene, camera);
}

function animateAICore(time) {
  if (!centralCoreGroup) return;

  // Slowly rotate on all axes
  centralCoreGroup.rotation.y = time * 0.15;
  centralCoreGroup.rotation.x = time * 0.08;
  centralCoreGroup.rotation.z = time * 0.05;

  // Core breathing scales
  const breathing = 1.0 + Math.sin(time * 2.2) * 0.05;
  centralCoreGroup.scale.set(breathing, breathing, breathing);

  // Displace core points to resemble energy wave pulses
  const { originalPos, posAttr } = corePoints.userData;
  const speed = time * 4.0;
  
  for (let i = 0; i < posAttr.count; i++) {
    const orig = originalPos[i];
    // Wave ripple distortion
    const distortion = 1.0 + Math.sin(orig.x * 0.045 + speed) * Math.cos(orig.y * 0.045 + speed) * 0.08;
    const newPos = orig.clone().multiplyScalar(distortion);
    
    posAttr.setXYZ(i, newPos.x, newPos.y, newPos.z);
  }
  posAttr.needsUpdate = true;
}

function updateDynamicLinesAndGetActiveLinks() {
  const linePos = linePositionsAttr.array;
  const lineCol = lineColorsAttr.array;
  
  let lineIdx = 0;
  const activeLinks = []; // Store pairs of node coordinates that are connected
  
  const colStart = new THREE.Color(themeColors[currentTheme].lineStart);
  const colEnd = new THREE.Color(themeColors[currentTheme].lineEnd);
  
  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      const p1 = nodes[i].position;
      const p2 = nodes[j].position;
      const dist = p1.distanceTo(p2);

      if (dist < MAX_CONNECTION_DIST) {
        // Save indices as an active link
        activeLinks.push({ i, j });

        // Add line vertices coordinates
        const drawIdx = lineIdx * 6;
        linePos[drawIdx] = p1.x;
        linePos[drawIdx + 1] = p1.y;
        linePos[drawIdx + 2] = p1.z;
        
        linePos[drawIdx + 3] = p2.x;
        linePos[drawIdx + 4] = p2.y;
        linePos[drawIdx + 5] = p2.z;

        // Fading intensity/opacity based on distance
        const strength = 1.0 - (dist / MAX_CONNECTION_DIST);
        const col = colStart.clone().lerp(colEnd, dist / MAX_CONNECTION_DIST);

        // Map colors (multiplied by strength to fade them out)
        lineCol[drawIdx] = col.r * strength * 0.65;
        lineCol[drawIdx + 1] = col.g * strength * 0.65;
        lineCol[drawIdx + 2] = col.b * strength * 0.65;

        lineCol[drawIdx + 3] = col.r * strength * 0.65;
        lineCol[drawIdx + 4] = col.g * strength * 0.65;
        lineCol[drawIdx + 5] = col.b * strength * 0.65;

        lineIdx++;
        // Buffer boundary lock check
        if (lineIdx * 2 >= linePositionsAttr.count) break;
      }
    }
  }

  // Clear rest of line buffer positions to hide unused segments
  for (let i = lineIdx * 6; i < linePos.length; i++) {
    linePos[i] = 0;
    lineCol[i] = 0;
  }

  linePositionsAttr.needsUpdate = true;
  lineColorsAttr.needsUpdate = true;

  return activeLinks;
}

function updateConnectionPulses(activeLinks) {
  const pulsePosAttr = pulsePoints.geometry.attributes.position;
  const pulsePositions = pulsePosAttr.array;

  for (let idx = 0; idx < PULSE_COUNT; idx++) {
    const pulse = connectionPulses[idx];

    // If pulse finished travelling or lost connection, assign to a new active link
    if (pulse.progress >= 1.0) {
      if (activeLinks.length > 0) {
        const randomLink = activeLinks[Math.floor(Math.random() * activeLinks.length)];
        // Randomize direction
        if (Math.random() > 0.5) {
          pulse.startNode = randomLink.i;
          pulse.endNode = randomLink.j;
        } else {
          pulse.startNode = randomLink.j;
          pulse.endNode = randomLink.i;
        }
        pulse.progress = 0.0;
        pulse.speed = 0.012 + Math.random() * 0.022;
      } else {
        // No links active, hide pulse at origin
        pulse.startNode = -1;
        pulse.endNode = -1;
        pulsePositions[idx * 3] = 0;
        pulsePositions[idx * 3 + 1] = 0;
        pulsePositions[idx * 3 + 2] = 0;
        continue;
      }
    }

    // Verify node references still exist
    if (pulse.startNode !== -1 && pulse.endNode !== -1) {
      const pStart = nodes[pulse.startNode].position;
      const pEnd = nodes[pulse.endNode].position;

      // Check if they moved too far apart, breaking the connection
      if (pStart.distanceTo(pEnd) > MAX_CONNECTION_DIST + 15) {
        pulse.progress = 1.0; // Force respawn
        continue;
      }

      // Linear interpolation along the link
      pulse.progress += pulse.speed;
      const t = Math.min(pulse.progress, 1.0);
      
      pulsePositions[idx * 3] = pStart.x + (pEnd.x - pStart.x) * t;
      pulsePositions[idx * 3 + 1] = pStart.y + (pEnd.y - pStart.y) * t;
      pulsePositions[idx * 3 + 2] = pStart.z + (pEnd.z - pStart.z) * t;
    }
  }

  pulsePosAttr.needsUpdate = true;
}

// Function to update colors dynamically on theme changes
function updateThreeTheme(theme) {
  currentTheme = theme;
  if (!scene) return;

  const colors = themeColors[theme];
  scene.fog.color.setHex(colors.bg);

  // Recolor elements
  if (coreShell) coreShell.material.color.setHex(colors.core);
  if (corePoints) corePoints.material.color.setHex(colors.node);
  if (nodePoints) nodePoints.material.color.setHex(colors.node);
  if (pulsePoints) pulsePoints.material.color.setHex(colors.pulse);
  
  if (backgroundStars) {
    const starColors = backgroundStars.geometry.attributes.color.array;
    const c = new THREE.Color(colors.star);
    for (let i = 0; i < starColors.length / 3; i++) {
      starColors[i * 3] = c.r * (0.3 + Math.random() * 0.4);
      starColors[i * 3 + 1] = c.g * (0.3 + Math.random() * 0.4);
      starColors[i * 3 + 2] = c.b * (0.3 + Math.random() * 0.4);
    }
    backgroundStars.geometry.attributes.color.needsUpdate = true;
  }
}

// Start Three when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  initThree();
});
