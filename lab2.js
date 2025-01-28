import * as THREE from 'three';

var container;
var camera, scene, renderer;
var mouseX = 0,
    mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

// Object3D ("Group") nodes and Mesh nodes
var sceneRoot = new THREE.Group();
var earthSpin = new THREE.Group();
var earthOrbit = new THREE.Group(); //Omloppsbanan för jorden
var earthTilt = new THREE.Group(); //Ny grupp för jordens lutning
var earthMesh = new THREE.Group();
var sunMesh = new THREE.Group();
var marsSpin = new THREE.Group(); 
var marsOrbit = new THREE.Group(); //Omloppsbana för Mars
var marsTilt = new THREE.Group(); //Mars lutning
var marsMesh = new THREE.Group();
var moonMesh = new THREE.Group();
var moonOrbit = new THREE.Group(); //Månens omloppsbana runt jorden
var moonTilt = new THREE.Group(); //Månens lutning

var clock = new THREE.Clock(); // Lägg till en klocka för att mäta tid

var animation = true;

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
    // mouseX, mouseY are in the range [-1, 1]
    mouseX = (event.clientX - windowHalfX) / windowHalfX;
    mouseY = (event.clientY - windowHalfY) / windowHalfY;
}

function createSceneGraph() {
    scene = new THREE.Scene();

    // Top-level node
    scene.add(sceneRoot);

    // Light source 
    const pointLight = new THREE.PointLight(0xffffff, 1, 100); // (färg, intensitet, avstånd)
    pointLight.position.set(0,0,0); //Samma som solen
    sceneRoot.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0x202020);
    scene.add(ambientLight);

    // Earth branch
    sceneRoot.add(earthOrbit);
    earthTilt.rotation.z = THREE.MathUtils.degToRad(23.44); // Jordens lutning

    earthOrbit.add(earthSpin); // Omloppsbana runt solen
    earthSpin.add(earthTilt); // Lutning
    earthTilt.add(earthMesh); // Jordens sfär

    earthSpin.position.set(10, 0, 0); // Jorden är 10 enheter från solen

    // Moon branch
    moonTilt.rotation.z = THREE.MathUtils.degToRad(5.15); // Månens lutning

    moonOrbit.add(moonTilt); // Lutning
    earthTilt.add(moonOrbit); // Månens omloppsbana

    const moonGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const moonMaterial = new THREE.MeshLambertMaterial({
        map: new THREE.TextureLoader().load('tex/2k_moon.jpg'),
    });
    moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    moonMesh.position.set(2, 0, 0); // Månen är 2 enheter från jorden
    moonTilt.add(moonMesh); // Lägg till månsfären

    // Sun branch
    const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('tex/2k_sun.jpg'),
    });
    sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunMesh.position.set(0, 0, 0);
    sceneRoot.add(sunMesh); // Solen i centrum

    // Mars branch
    sceneRoot.add(marsOrbit); // Lägg till Mars omloppsbana
    marsTilt.rotation.z = THREE.MathUtils.degToRad(25); // Mars lutning

    marsOrbit.add(marsSpin); // Mars omloppsbana runt solen
    marsSpin.add(marsTilt); // Mars rotation och lutning

    const marsGeometry = new THREE.SphereGeometry(0.6, 32, 32);
    const marsMaterial = new THREE.MeshLambertMaterial({
        map: new THREE.TextureLoader().load('tex/2k_mars.jpg'),
    });
    marsMesh = new THREE.Mesh(marsGeometry, marsMaterial);
    marsSpin.position.set(15, 0, 0); // Mars är 15 enheter från solen
    marsTilt.add(marsMesh); // Lägg till Mars-sfären
}


function init() {
    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 25;

    var texloader = new THREE.TextureLoader();

    // Earth mesh
    var geometryEarth = new THREE.SphereGeometry(1, 32, 32); // (radie, lodräta indelningar, vågräta indelningar)

    var materialEarth = new THREE.MeshLambertMaterial();
    materialEarth.combine = 0;
    materialEarth.needsUpdate = true;
    materialEarth.wireframe = false;

    const earthTexture = texloader.load('tex/2k_earth_daymap.jpg');
    materialEarth.map = earthTexture;

    // Task 7: material using custom Vertex Shader and Fragment Shader
    var uniforms = THREE.UniformsUtils.merge([
        { colorTexture: { value: new THREE.Texture() } },
        THREE.UniformsLib["lights"],
    ]);

    const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById('vertexShader').textContent.trim(),
        fragmentShader: document.getElementById('fragmentShader').textContent.trim(),
        lights: true,
    });

    // Lägg till jordtexturen
    shaderMaterial.uniforms.colorTexture.value = earthTexture;

    // Ladda och lägg till specular map
    const specularTexture = texloader.load('tex/2k_earth_specular_map.jpg');
    shaderMaterial.uniforms.specularMap = { value: specularTexture }; // Här läggs specular map till uniforms

    earthMesh = new THREE.Mesh(geometryEarth, shaderMaterial);

    createSceneGraph();

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    container.appendChild(renderer.domElement);

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);

    var checkBoxAnim = document.getElementById('animation');
    animation = checkBoxAnim.checked;
    checkBoxAnim.addEventListener('change', (event) => {
        animation = event.target.checked;
    });

    var checkBoxWireframe = document.getElementById('wireframe');
    earthMesh.material.wireframe = checkBoxWireframe.checked;
    checkBoxWireframe.addEventListener('change', (event) => {
        earthMesh.material.wireframe = event.target.checked;
    });
}

function render() {
    // Set up the camera
    camera.position.x = mouseX * 10;
    camera.position.y = -mouseY * 10;
    camera.lookAt(scene.position);

    var delta = clock.getDelta(); // Tiden mellan två frames

    // Perform animations
    if (animation) {
        earthOrbit.rotation.y += delta * (2 * Math.PI / 365); // Jordens omlopp
        earthMesh.rotation.y += delta * (2 * Math.PI / 1);    // Jordens rotation
        moonOrbit.rotation.y += delta * (2 * Math.PI / 27.3); // Månens omlopp
    
        sunMesh.rotation.y += delta * (2 * Math.PI / 25); // Solens rotation
    
        marsOrbit.rotation.y += delta * (2 * Math.PI / 687); // Mars omlopp
        marsMesh.rotation.y += delta * (2 * Math.PI / 1.03); // Mars rotation
    }
    

    // Render the scene
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate); // Request to be called again för nästa frame
    render();
}

init(); // Set up the scene
animate(); // Enter an infinite loop
