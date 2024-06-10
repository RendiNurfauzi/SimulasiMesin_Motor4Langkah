// Siapkan scene, kamera, dan renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Ukuran grid
const gridSize = 10;
const gridDivisions = 10;
const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x808080, 0x808080);
gridHelper.position.set(0, -1, 0);
scene.add(gridHelper);

// Tambahkan pencahayaan
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x404040, 1);
scene.add(hemisphereLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5).normalize();
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

// Fungsi untuk interpolasi warna
function interpolateColor(color1, color2, factor) {
    const result = color1.clone();
    result.lerp(color2, factor);
    return result;
}

// Warna-warna untuk interpolasi
const colors = [
    new THREE.Color(0x808080), // Gray
    new THREE.Color(0x0000ff), // Blue
    new THREE.Color(0xffff00), // Yellow
    new THREE.Color(0xff0000), // Red
    new THREE.Color(0x808080), // Gray
    new THREE.Color(0x0000ff), // Blue
    new THREE.Color(0xffff00), // Yellow
    new THREE.Color(0xff0000), // Red
    new THREE.Color(0x808080)  // Gray
];

// Durasi transisi warna dalam detik
const colorTransitionDuration = 2; // Ubah durasi transisi warna di sini

// Load GLTF model
const loader = new THREE.GLTFLoader();
loader.load('models/Model.glb', function(gltf) {
    const model = gltf.scene;
    const animations = gltf.animations;

    model.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            // Set initial color for a specific material
            if (child.material.name === "Siklus") {
                child.material.color.set(0x808080); // Set initial color
                child.material.transparent = true; // Enable transparency
                child.material.opacity = 0.5; // Set initial opacity
            }
        }
    });
    scene.add(model);

    const mixer = new THREE.AnimationMixer(model);
    const frameRate = 24;
    const totalFrames = 200;
    const targetDuration = totalFrames / frameRate;

    animations.forEach((clip) => {
        clip.duration = targetDuration;
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat);
        action.play();
    });

    camera.position.set(4.5,3.5, 0);
    controls.update();

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();
        mixer.update(delta);
        controls.update();

        // Interpolasi warna untuk material Siklus
        const cycleTime = colorTransitionDuration * (colors.length - 1);
        const timeFactor = (elapsedTime % cycleTime) / colorTransitionDuration;
        const colorIndex = Math.floor(timeFactor);
        const nextColorIndex = (colorIndex + 1) % colors.length;
        const frameFactor = timeFactor - colorIndex;

        scene.traverse(function(child) {
            if (child.isMesh && child.material.name === "Siklus") {
                const interpolatedColor = interpolateColor(colors[colorIndex], colors[nextColorIndex], frameFactor);
                child.material.color.set(interpolatedColor);
                child.material.opacity = 0.8; // Set opacity
            }
        });

        // Log posisi kamera
        console.log(`Camera position: x=${camera.position.x}, y=${camera.position.y}, z=${camera.position.z}`);

        renderer.render(scene, camera);
    }

    animate();
}, undefined, function(error) {
    console.error(error);
});

// Resize handler
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
