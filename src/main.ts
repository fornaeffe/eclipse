import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import {Text} from 'troika-three-text';

// Parameters
const modelScale = 0.2;
const offsetY = 1.5;
const offsetZ = -1.5;

const earthOrbitRadius = 10 * modelScale;
const moonOrbitRadius = 3 * modelScale;
const sunRadius = 1 * modelScale;
const earthRadius = 0.5 * modelScale;
const moonRadius = 0.3 * modelScale;

// State variables
let speed = 0; // Simulation speed

// Links to page elements
const mainCanvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
const moonViewer = document.getElementById('moonViewer') as HTMLCanvasElement;
const moon_tiltSlider = document.getElementById("moon_tilt") as HTMLInputElement;
const earthcamSwitch = document.getElementById("earthcam") as HTMLInputElement;
const earthrot = document.getElementById("earthrot") as HTMLInputElement;
const earthrev = document.getElementById("earthrev") as HTMLInputElement;
const moonrev = document.getElementById("moonrev") as HTMLInputElement;	
const speedSlider = document.getElementById("speed") as HTMLInputElement;	

// Setup  main renderer
const renderer = new THREE.WebGLRenderer({canvas: mainCanvas, alpha: true});
const width = window.innerWidth * 0.99;
const height = window.innerHeight * 0.99;
const aspect_ratio = width / height;
renderer.setSize( width, height );
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor("#121212", 1);
renderer.shadowMap.enabled = true;

// Setup Moon Renderer
const moonRenderer = new THREE.WebGLRenderer({canvas: moonViewer, alpha: true});
const width2 = Math.min(window.innerWidth, window.innerHeight) * 0.3;
moonRenderer.setSize( width2, width2 );
moonRenderer.setPixelRatio(window.devicePixelRatio);
moonRenderer.setClearColor("#121212", 1);
moonRenderer.shadowMap.enabled = true;


// Setup VR button
const myVRButton = VRButton.createButton( renderer )
document.body.appendChild( myVRButton )
renderer.xr.enabled = true;

// Show VR button only if VR is supported
if ( !('xr' in navigator) ) {
    myVRButton.style.visibility = "hidden"
} else {
    navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        if (!supported) myVRButton.style.visibility = "hidden"
    })
}

// SCENE
const scene = new THREE.Scene();

// MAIN GROUP
const mainGroup = new THREE.Group();

// MAIN CAMERA
const camera = new THREE.OrthographicCamera( - 12 * aspect_ratio * modelScale, 12 * aspect_ratio * modelScale, 12 * modelScale, -12 * modelScale, 1 * modelScale, 1000 );
camera.position.set(0, earthOrbitRadius * 3, 0);
camera.layers.enable(1);
camera.layers.enable(2);
mainGroup.add(camera)

// Mooncam
const mooncam = new THREE.PerspectiveCamera( 20, 1, earthRadius * 1.1, earthOrbitRadius * 2 );
mooncam.position.set(0, 0, 0);
mooncam.lookAt(moonOrbitRadius, 0, 0);

// Earthcam
const earthcam = new THREE.OrthographicCamera( - 1.2 * moonOrbitRadius * aspect_ratio, 1.2 * moonOrbitRadius * aspect_ratio, 1.2 * moonOrbitRadius, -1.2 * moonOrbitRadius, 1, 1000);
earthcam.position.set(earthOrbitRadius, earthOrbitRadius * 3, 0);
earthcam.lookAt(earthOrbitRadius, 0, 0);
earthcam.layers.enable(1);
earthcam.layers.enable(2);
        
// ORBIT CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;

// TEXTURES
const loader = new THREE.TextureLoader();
const sunTexture = loader.load("assets/sun.jpg");
const earthTexture = loader.load("assets/earth.jpg");
const moonTexture = loader.load("assets/moon.jpg");

// MATERIALS
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
const moonMaterial = new THREE.MeshStandardMaterial({ map: moonTexture });

const orbitMaterial = new THREE.LineBasicMaterial( { color : 0xff0000 } );

// GEOMETRY

// Planets
const geometry = new THREE.SphereGeometry(1, 32, 16);

// Orbits
const orbit = new THREE.EllipseCurve(
    0,  0,            // ax, aY
    1, 1,           // xRadius, yRadius
    0,  2 * Math.PI,  // aStartAngle, aEndAngle
    false,            // aClockwise
    0                 // aRotation
);
const points = orbit.getPoints( 50 );
const orbitGeometry = new THREE.BufferGeometry().setFromPoints( points );

// MESHES

// Sun
const sunMesh = new THREE.Mesh(geometry, sunMaterial);
sunMesh.position.set(0, 0, 0);
sunMesh.scale.setScalar(sunRadius);
mainGroup.add(sunMesh);

// Earth
const earthGroup = new THREE.Group();		// create new Group
const earthMesh = new THREE.Mesh(geometry, earthMaterial);
earthMesh.position.set(earthOrbitRadius, 0, 0);
earthMesh.scale.setScalar(earthRadius);
earthMesh.castShadow = true;
earthMesh.receiveShadow = true;
earthMesh.rotation.y = Math.PI;
earthGroup.add(earthMesh);
earthGroup.add(earthcam);

// Earth orbit	
const earthOrbit = new THREE.Line( orbitGeometry, orbitMaterial );
earthOrbit.rotation.x = Math.PI / 2;
earthOrbit.scale.setScalar(earthOrbitRadius);
earthOrbit.layers.set(1);
earthOrbit.layers.enable(2);
earthGroup.add(earthOrbit);

mainGroup.add(earthGroup);



// Moon
const moonMainGroup = new THREE.Group();

const moonGroup = new THREE.Group();

const moonMesh = new THREE.Mesh(geometry, moonMaterial);
moonMesh.position.set(moonOrbitRadius, 0, 0);
moonMesh.scale.setScalar(moonRadius);
moonMesh.castShadow = true;
moonMesh.receiveShadow = true;
moonMesh.rotation.y = Math.PI;
moonGroup.add(moonMesh);

// Moon orbit
const moonOrbit = new THREE.Line( orbitGeometry, orbitMaterial );
moonOrbit.rotation.x = Math.PI / 2;
moonOrbit.scale.setScalar(moonOrbitRadius);
moonOrbit.layers.set(1);
moonOrbit.layers.enable(2);
moonGroup.add(moonOrbit);
moonGroup.add(mooncam);

moonMainGroup.add(moonGroup);
            
moonMainGroup.position.set(earthOrbitRadius, 0, 0);
moonMainGroup.rotation.z = +moon_tiltSlider.value * 5.14 * Math.PI / 180;

mainGroup.add(moonMainGroup);



// Lighting
const light = new THREE.DirectionalLight( 0xffffff, 2 );
light.position.set( 0, 0, 0 );
light.target = earthMesh;
light.castShadow = true;
mainGroup.add(light);

scene.add(mainGroup);

// Controls
moon_tiltSlider.oninput = function() {
    moonMainGroup.rotation.z = +moon_tiltSlider.value * 5.14 * Math.PI / 180;
}

// Resizer
function resizer() {			
    const width = window.innerWidth * 0.99;
    const height = window.innerHeight * 0.99;
    const aspect_ratio = width / height;
    renderer.setSize( width, height );
    const width2 = Math.min(window.innerWidth, window.innerHeight) * 0.3;
    moonRenderer.setSize( width2, width2 );
    camera.left = camera.bottom * aspect_ratio;
    camera.right = camera.top * aspect_ratio;
    camera.updateProjectionMatrix();
    earthcam.left =  earthcam.bottom * aspect_ratio;
    earthcam.right =  earthcam.top * aspect_ratio;
    earthcam.updateProjectionMatrix();
}
window.addEventListener('resize', resizer);

// XR session initialization
renderer.xr.addEventListener("sessionstart", (e) => {

    // Move the scene in front of the observer
    const baseReferenceSpace = renderer.xr.getReferenceSpace()
    const myTransform = new XRRigidTransform({y: offsetY, z: offsetZ})
    const newReferenceSpace = baseReferenceSpace.getOffsetReferenceSpace(myTransform)
    renderer.xr.setReferenceSpace(newReferenceSpace)

    // Give instructions
    const myText = new Text()
    scene.add(myText)
    // Set properties to configure:
    myText.text = 'Main button: move simulation forward\n' +
        'Squeeze button: move simulation backward\n' +
        'Thumbstick: fly'
    myText.fontSize = 0.2
    myText.position.x = -1
    myText.position.z = -2
    myText.position.y = 1.7
    myText.color = 0x9966FF
    
    // Dispose the text
    setTimeout(() => {
        scene.remove(myText)
        myText.Dispose()
    }, 10000)
})


function render() {
    // Movements
    speed = +speedSlider.value

    // Check if VR is ON
    const session = renderer.xr.getSession()
    if (session && session.inputSources[0] && session.inputSources[0].gamepad && session.inputSources[0].gamepad.buttons[0]) {
        let tX = 0
        let tZ = 0

        const myGamepad = session.inputSources[0].gamepad

        // Set speed proportional to how much main button is pressed
        speed = myGamepad.buttons[0].value * 3

        // If secondary button is pressed, set negative speed
        if (myGamepad.buttons[1].value > 0)
            speed = - myGamepad.buttons[1].value * 3

        // Move user with thumbstick
        if (myGamepad.axes[2] && myGamepad.axes[2] != 0)
            tX = myGamepad.axes[2] * 0.01
        
        if (myGamepad.axes[3] && myGamepad.axes[3] != 0)
            tZ = myGamepad.axes[3] * 0.01

        if (tX != 0 || tZ != 0) {
            // MOVE OBSERVER
            // Get actual reference space
            const baseReferenceSpace = renderer.xr.getReferenceSpace()
            // Movement in observer space (inverted because it will be a reference space movement)
            let myVector = new THREE.Vector3(-tX, 0, -tZ)
            // Rotate the movement to get the movement vector in world space
            myVector.applyQuaternion(renderer.xr.getCamera().quaternion)
            // Change reference space
            const myTransform = new XRRigidTransform(myVector) 
            const newReferenceSpace = baseReferenceSpace.getOffsetReferenceSpace(myTransform)
            renderer.xr.setReferenceSpace(newReferenceSpace)
        }
        
        earthrot.checked = true
        earthrev.checked = true
        moonrev.checked = true
    }

    const deltaT = Math.pow(speed, 3) / 100;
    if (earthrot.checked) earthMesh.rotation.y += deltaT * Math.PI * 2;
    if (earthrev.checked) {
        earthGroup.rotation.y += deltaT / 365.25 * Math.PI * 2;
        moonMainGroup.position.set(earthOrbitRadius * Math.cos(earthGroup.rotation.y), 0, - earthOrbitRadius * Math.sin(earthGroup.rotation.y));
    }
    if (moonrev.checked) moonGroup.rotation.y += deltaT / 29.5 * Math.PI * 2;

    renderer.render( scene, earthcamSwitch.checked ?  earthcam : camera );
    moonRenderer.render( scene, mooncam );
}

renderer.setAnimationLoop(render)


// Dropdown controls
const toggler = document.getElementsByClassName("caret");

for (let i = 0; i < toggler.length; i++) {
    toggler[i].addEventListener("click", function() {
        this.parentElement.querySelector(".nested").classList.toggle("active");
        this.classList.toggle("caret-down");
    });
}