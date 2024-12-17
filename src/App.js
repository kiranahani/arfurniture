import "./App.css";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { XREstimatedLight } from "three/examples/jsm/webxr/XREstimatedLight";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"; // Tambahkan OrbitControls
import { useState, useEffect, useRef } from "react";

const referrer = document.referrer;

// Periksa apakah ada referrer dan tampilkan di console
if (referrer) {
    console.log(`User datang dari: ${referrer}`);
} else {
    console.log("User mengakses langsung atau tidak ada referrer.");
}

function App() {
  let reticle;
  let hitTestSource = null;
  let hitTestSourceRequested = false;

  let scene, camera, renderer, controls;
  let orbitEnabled = false; // Flag untuk kontrol orbit
  let lastSpawnedModel = null; // Variabel untuk menyimpan objek terakhir yang di-spawn

  let models = [
    "./Rheina-Chair.glb",
    "./Round-Table.glb",
    "./Renata-Square-Dining-Table.glb",
    "./Lala-Chair.glb",
    "./Almira-Bar-Table.glb",
    "./Renata-Big-Recta-Dining-Table.glb",
    "./Rama-Big-Round-Table.glb",
    "./alma-chair.glb",
    "./Deva-Round-SIde-Table.glb",
    "./High-Baack-Stool.glb",
    "./Indian-Barstool.glb",
    "./Lily-Side-Chair.glb",
    "./Jungle-Side-Table.glb",
    "./Rama-Small-Round-Table.glb",
    "./Renata-Side-Table.glb",
    "./Altha-Chair.glb",
    "./Lulu-Chair.glb",
    "./LoettaSofa.glb",
    "./DidoStool.glb",
    "./RenataSquareCoffeTable.glb",
    "./Lula-Chair.glb",
    "./ZeezeeOttoman.glb",
    "./RumiChair.glb",
    "./GemmySideTable.glb",
    "./Lulu2seater.glb",
    "./LupitaChair.glb",
    "./GemmySunTable.glb",
    "./Renata-Big-Recta-Dining-Table.glb",
    "./RenataBigRectaDinningTable.glb",
    "./DonaStool.glb"
  ];

  let modelScaleFactor = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  let items = [];
  let itemSelectedIndex = 0;

  let controller;
  const [hitTestVisible, setHitTestVisible] = useState(true);

  function handleBackButton() {
    if (window.history.length > 1) {
      window.history.back(); // Kembali ke halaman sebelumnya jika ada riwayat
    } else {
      window.location.href = 'https://loettaliving.com'; // Arahkan ke halaman utama jika tidak ada riwayat
    }
  }
  

  document.addEventListener("DOMContentLoaded", () => {
    setupItemListeners(); // Tambahkan listener pada semua tombol
    setSelectedModelFromURL(); // Aktifkan model berdasarkan URL
});

function setupItemListeners() {
  const itemContainers = document.querySelectorAll(".item-container img"); // Ambil semua elemen <img>
  itemContainers.forEach((img) => {
    img.addEventListener("click", () => {
      const itemId = img.id.replace("item", ""); // Ambil ID item dari "itemX"
      const index = parseInt(itemId, 10); // Konversi ke angka
      selectModelByIndex(index);
    });
  });
}

function selectModelByIndex(index) {
  if (index >= 0 && index < items.length) {
    itemSelectedIndex = index; // Set index yang dipilih
    console.log(`Model selected: ${index}`);
    onSelect(); // Aktifkan logika untuk menampilkan model
  } else {
    console.error("Invalid model index:", index);
  }
}

function setSelectedModelFromURL() {
  const referrer = document.referrer;

  // Daftar URL dan indeks model yang sesuai
  const urlToIndex = {
    "https://loettaliving.com/product/renata-side-table": 14,
    "https://loettaliving.com/product/jungle-side-table": 12,
    "https://loettaliving.com/product/deva-side-table":8,
    "https://loettaliving.com/product/renata-square-dining-table": 2,
    "https://loettaliving.com/product/renata-big-recta-dt": 5,
    "https://loettaliving.com/product/rama-small-dt": 13,
    "https://loettaliving.com/product/rama-big-dit": 6,
    "https://loettaliving.com/product/renata-square-cofe-tabble": 19,
    "https://loettaliving.com/product/renata-recta-cofe-table": 28,
    "https://loettaliving.com/product/round-tabble": 1,
    "https://loettaliving.com/product/dhea-recta-cofe-table": 27,
    "https://loettaliving.com/product/almira-bar-tabble": 4,
    "https://loettaliving.com/product/lulu-2-seater-sofa": 24,
    "https://loettaliving.com/product/loetta-sofa": 17,
    "https://loettaliving.com/product/rheina-chair": 0,
    "https://loettaliving.com/product/lulu-chair": 16,
    "https://loettaliving.com/product/lula-chair": 20,
    "https://loettaliving.com/product/lily-side-chair": 11,
    "https://loettaliving.com/product/lala-chair": 3,
    "https://loettaliving.com/product/altha-chair": 15,
    "https://loettaliving.com/product/alma-chair": 7,
    "https://loettaliving.com/product/indian-bar-stool": 10,
    "https://loettaliving.com/product/high-back-stool": 9,
    "https://loettaliving.com/product/dona-stool" : 18,
    "https://loettaliving.com/product/gemmy-side-table" : 23,
    "https://loettaliving.com/product/lupita-chair": 25,
    "https://loettaliving.com/product/gemmy-sun-bed": 26,
    "https://loettaliving.com/product/dona-stool-2": 29,
    "https://test-web-weld-psi.vercel.app/": 2
  };


  const index = urlToIndex[referrer];
  if (index !== undefined) {
    selectModelByIndex(index); 
  } else {
    console.log("Model tidak ditemukan untuk URL ini");
  }
}

useEffect(() => {
  init();
  setupFurnitureSelection();
  animate();
  setSelectedModelFromURL(); 
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

  // Pastikan objek belum dipilih ulang
  if (!items[itemSelectedIndex] || orbitEnabled) {
    return; // Jika OrbitControls aktif, hentikan proses
  }

  if (reticle.visible && currentTime - tapStartTime < TAP_THRESHOLD) {
    // Clone model baru
    let newModel = items[itemSelectedIndex].clone();
    newModel.visible = true;

    // Tempatkan objek pada posisi reticle
    reticle.matrix.decompose(newModel.position, newModel.quaternion, newModel.scale);
    let scaleFactor = modelScaleFactor[itemSelectedIndex];
    newModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

    scene.add(newModel);

    // Set objek yang dipilih ke objek baru
    selectedObject = newModel;

    // Matikan hit test setelah objek di-spawn
    reticle.visible = false;
    hitTestSourceRequested = false;

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
let lastTapTime = 0; // Time of the last tap
let tapCount = 0; // Count of taps
const TAP_THRESHOLD = 200; // Maximum duration in milliseconds for a tap
const DOUBLE_TAP_INTERVAL = 300; // Maximum time interval between taps for double-tap
let isDragging = false; // Untuk melacak apakah gesture adalah drag

function onTouchStart(event) {
  initialX = event.touches[0].pageX;
  tapStartTime = performance.now(); // Record start time of the touch
  isDragging = false; // Reset status dragging
}

function onTouchMove(event) {
  if (selectedObject) {
    isDragging = true; // Deteksi pergerakan jari
    let deltaX = event.touches[0].pageX - initialX;
    initialX = event.touches[0].pageX;

    // Rotasi objek berdasarkan geser jari pengguna
    selectedObject.rotation.y += deltaX * 0.01; // Adjust multiplier for rotation speed
  }
}

function onTouchEnd(event) {
  const tapEndTime = performance.now();
  const tapDuration = tapEndTime - tapStartTime;

  if (!isDragging && tapDuration < TAP_THRESHOLD) {
    // Hitung interval sejak tap terakhir
    const timeSinceLastTap = tapEndTime - lastTapTime;

    if (timeSinceLastTap < DOUBLE_TAP_INTERVAL) {
      tapCount++; // Tambahkan jumlah tap
    } else {
      tapCount = 1; // Reset jika terlalu lama sejak tap terakhir
    }

    lastTapTime = tapEndTime; // Update waktu tap terakhir

    if (tapCount === 2) {
      // Jika double-tap terdeteksi
      handleDoubleTapEvent(event);
    }
  } else {
    console.log("Gesture dianggap sebagai drag atau tap lama.");
  }

  initialX = 0; // Reset posisi awal
}

function handleDoubleTapEvent(event) {
  if (selectedObject) {
    // Hapus objek yang dipilih dari scene
    scene.remove(selectedObject);
    selectedObject = null; // Reset referensi

    // Nonaktifkan OrbitControls
    orbitEnabled = false;
    controls.enabled = false;
    console.log("Selected object deleted on double-tap.");
  } else {
    console.log("No object selected to delete.");
  }
}

const onClicked = (e, selectItem, index) => {
  // Reset OrbitControls
  orbitEnabled = false;
  controls.enabled = false;

  // Set indeks objek yang dipilih
  itemSelectedIndex = index;

  // Update UI
  for (let i = 0; i < models.length; i++) {
    const el = document.querySelector(`#item` + i);
    el.classList.remove("clicked");
  }
  e.target.classList.add("clicked");

  // Tampilkan kembali reticle
  reticle.visible = true;
  hitTestSourceRequested = true; // Aktifkan kembali hit test
};

// Tambahkan event listener untuk gesture
document.addEventListener("touchstart", onTouchStart);
document.addEventListener("touchmove", onTouchMove);
document.addEventListener("touchend", onTouchEnd);

  

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


  function animate() {
    renderer.setAnimationLoop(render);
  }

  function render(timestamp, frame) {
    if (frame) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const session = renderer.xr.getSession();
  
      if (!orbitEnabled && hitTestSourceRequested === false) {
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
  
      if (hitTestSource && !orbitEnabled) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
  
        if (hitTestResults.length) {
          const hit = hitTestResults[0];
          reticle.visible = true;
          reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
          setHitTestVisible(false);
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
      <button className="back-button" onClick={handleBackButton}>
        Back
      </button>

      {hitTestVisible && (
        <div className="scanning-message">
          <div className="typing-text">Our System is Scanning Your Surface Now</div>
        </div>
      )}


    </div>
  );
}

export default App;
