import "./App.css";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { XREstimatedLight } from "three/examples/jsm/webxr/XREstimatedLight";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"; // Tambahkan OrbitControls
import { useState, useEffect, useRef } from "react";

function App() {
  let reticle;
  let hitTestSource = null;
  let hitTestSourceRequested = false;

  let scene, camera, renderer, controls;
  let orbitEnabled = false; // Flag untuk kontrol orbit
  let lastSpawnedModel = null; // Variabel untuk menyimpan objek terakhir yang di-spawn

  const handleBackButtonClick = () => {
    window.location.href = "https://loettaliving.com/";
  };

  let models = [
    "./Rheina-Chair.glb",
    "./Round-Table.glb",
    "./Renata-Square-Dining-Table.glb",
    "./Lala-Chair.glb",
    "./Almira-Bar-Table.glb",
    "./Renata-Big-Recta-Dining-Table.glb",
    "./Rama-Big-Round-Table.glb",
    "./Alma-Chair.glb",
    "./Deva-Round-SIde-Table.glb",
    "./High-Baack-Stool.glb",
    "./Indian-Barstool.glb",
    "./Lily-Side-Chair.glb",
    "./Jungle-Side-Table.glb",
    "./Rama-Small-Round-Table.glb",
    "./Renata-Side-Table.glb",
    "./Altha-Chair.glb",
    "./Lulu-Chair.glb",
  ];

  let modelScaleFactor = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  let items = [];
  let itemSelectedIndex = 0;

  let controller;
  const [hitTestVisible, setHitTestVisible] = useState(true);

  useEffect(() => {
    init();
    setupFurnitureSelection();
    animate();
  }, []);

  function init() {
    let myCanvas = document.getElementById("canvas");
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, myCanvas.innerWidth / myCanvas.innerHeight, 0.01, 20);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    renderer = new THREE.WebGLRenderer({
      canvas: myCanvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(myCanvas.innerWidth, myCanvas.innerHeight);
    renderer.xr.enabled = true;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;

    const xrLight = new XREstimatedLight(renderer);
    xrLight.addEventListener("estimationstart", () => {
      scene.add(xrLight);
      scene.remove(light);
      if (xrLight.environment) {
        scene.environment = xrLight.environment;
      }
    });

    xrLight.addEventListener("estimationend", () => {
      scene.add(light);
      scene.remove(xrLight);
    });

    let arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay", "light-estimation"],
      domOverlay: { root: document.body },
    });
    arButton.style.bottom = "22%";
    document.body.appendChild(arButton);

    for (let i = 0; i < models.length; i++) {
      const loader = new GLTFLoader();
      loader.load(models[i], function (glb) {
        let model = glb.scene;
        items[i] = model;
      });
    }

    controller = renderer.xr.getController(0);
    controller.addEventListener("select", onSelect);
    scene.add(controller);

    // Inisialisasi reticle
    reticle = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial());
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
  }

  let selectedObject = null;

  function onSelect() {
    const currentTime = performance.now();
    if (reticle.visible && currentTime - tapStartTime < TAP_THRESHOLD) {
      // Check if tap is within the threshold
      let newModel = items[itemSelectedIndex].clone();
      newModel.visible = true;

      reticle.matrix.decompose(newModel.position, newModel.quaternion, newModel.scale);
      let scaleFactor = modelScaleFactor[itemSelectedIndex];
      newModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

      scene.add(newModel);

      // Set objek yang dipilih ke objek baru
      selectedObject = newModel;

      // Matikan hit test setelah objek di-spawn
      // hitTestSourceRequested = false;
      // hitTestSource = null;
      // reticle.visible = false;

      // Aktifkan OrbitControls
      orbitEnabled = true;
      controls.enabled = true;
      controls.target.copy(newModel.position);
      controls.update();
    }
  }

  // Tambahkan event listener untuk touchmove untuk rotasi objek
  let initialX = 0;
  let tapStartTime = 0; // Time when touch starts
  const TAP_THRESHOLD = 200; // Maximum duration in milliseconds for a tap

  function onTouchMove(event) {
    if (selectedObject) {
      let deltaX = event.touches[0].pageX - initialX;
      initialX = event.touches[0].pageX;

      // Rotasi objek berdasarkan geser jari pengguna
      selectedObject.rotation.y += deltaX * 0.01; // Adjust multiplier for rotation speed
    }
  }

  function onTouchStart(event) {
    initialX = event.touches[0].pageX;
    tapStartTime = performance.now(); // Record start time of the touch
  }

  function onTouchEnd(event) {
    const tapEndTime = performance.now();
    const tapDuration = tapEndTime - tapStartTime;

    if (tapDuration < TAP_THRESHOLD) {
      // Consider this as a tap event
      handleTapEvent(event);
    }

    initialX = 0;
  }

  function handleTapEvent(event) {
    // You can add additional logic here if needed for tap-specific actions
    console.log("Tap detected.");
  }

  // Tambahkan event listener untuk gesture
  document.addEventListener("touchstart", onTouchStart);
  document.addEventListener("touchmove", onTouchMove);
  document.addEventListener("touchend", onTouchEnd);

  const onClicked = (e, selectItem, index) => {
    itemSelectedIndex = index;
    for (let i = 0; i < models.length; i++) {
      const el = document.querySelector(`#item` + i);
      el.classList.remove("clicked");
    }
    e.target.classList.add("clicked");
  };

  function setupFurnitureSelection() {
    for (let i = 0; i < models.length; i++) {
      const el = document.querySelector(`#item` + i);
      el.addEventListener("beforexrselect", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      el.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClicked(e, items[i], i);
      });
    }
  }

  function addMoreObjects() {
    console.log("Adding more objects...");
    console.log("Initial reticle visibility:", reticle.visible);

    // Reset status orbit control dan selected object
    orbitEnabled = false;
    controls.enabled = false;
    selectedObject = null; // Hapus referensi ke objek yang terakhir dipilih

    // Reset hit test untuk menampilkan reticle kembali
    hitTestSourceRequested = false;
    hitTestSource = null;

    // Tampilkan reticle untuk hit test lagi
    reticle.visible = true; // Pastikan reticle visibel
    setHitTestVisible(true); // Sembunyikan teks scanning
    console.log("Updated reticle visibility:", reticle.visible);
  }

  function animate() {
    renderer.setAnimationLoop(render);
  }

  function render(timestamp, frame) {
    if (frame) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const session = renderer.xr.getSession();

      // Jika hit test belum diminta dan kontrol orbit tidak aktif
      if (hitTestSourceRequested === false && !orbitEnabled) {
        session.requestReferenceSpace("viewer").then(function (referenceSpace) {
          session.requestHitTestSource({ space: referenceSpace }).then(function (source) {
            hitTestSource = source;
          });
        });

        session.addEventListener("end", function () {
          hitTestSourceRequested = false;
          hitTestSource = null;
        });

        hitTestSourceRequested = true;
      }

      if (hitTestSource) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);

        if (hitTestResults.length) {
          const hit = hitTestResults[0];
          reticle.visible = true;
          reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
          setHitTestVisible(false); // Sembunyikan teks scanning
        } else {
          reticle.visible = false;
        }
      }
    }

    renderer.render(scene, camera);
  }

  return (
    <div className="App">
      <canvas id="canvas"></canvas>

      {/* Back Button */}
      <button className="back-button" onClick={handleBackButtonClick}>
        Back
      </button>

      {hitTestVisible && (
        <div className="scanning-message">
          <div className="typing-text">Our System is Scanning Your Surface Now</div>
        </div>
      )}

      {/* Button for adding more objects */}
      <button className="add-more-button" onClick={addMoreObjects}>
        Add More
      </button>
    </div>
  );
}

export default App;
