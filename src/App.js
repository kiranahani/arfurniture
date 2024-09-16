import "./App.css";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { XREstimatedLight } from "three/examples/jsm/webxr/XREstimatedLight";
import { useState, useEffect, useRef } from "react";

function App() {
  let reticle;
  let hitTestSource = null;
  let hitTestSourceRequested = false;

  let scene, camera, renderer;
  const handleBackButtonClick = () => {
    window.location.href = 'https://loettaliving.com/'; // Replace with the URL you want to navigate to
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
    "./Lulu-Chair.glb"]
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

    // Don't add the XREstimatedLight to the scene initially
    // It doesn't have any estimated lighting values until an AR session starts
    const xrLight = new XREstimatedLight(renderer);
    xrLight.addEventListener("estimationstart", () => {
      // Swap the default light out for the estimated one so we start getting some estimated values.
      scene.add(xrLight);
      scene.remove(light);
      // The estimated lighting also provides an env cubemap which we apply here
      if (xrLight.environment) {
        scene.environment = xrLight.environment;
      }
    });

    xrLight.addEventListener("estimationend", () => {
      // Swap the lights back when we stop receiving estimated values
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

    reticle = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial());
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
  }

  function onSelect() {
    if (reticle.visible) {
      let newModel = items[itemSelectedIndex].clone();
      newModel.visible = true;
      
      // Set posisi dan rotasi berdasarkan reticle
      reticle.matrix.decompose(newModel.position, newModel.quaternion, newModel.scale);
  
      // Set skala model ke nilai yang diinginkan, jika diperlukan
      let scaleFactor = modelScaleFactor[itemSelectedIndex];
      newModel.scale.set(scaleFactor, scaleFactor, scaleFactor);
  
      scene.add(newModel);
    }
  }
  
  const onClicked = (e, selectItem, index) => {
    itemSelectedIndex = index;

    // remove image selection from others to indicate unclicked
    for (let i = 0; i < models.length; i++) {
      const el = document.querySelector(`#item` + i);
      el.classList.remove("clicked");
    }
    // set image to selected
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

  function animate() {
    renderer.setAnimationLoop(render);
  }

  function render(timestamp, frame) {
    if (frame) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const session = renderer.xr.getSession();

      if (hitTestSourceRequested === false) {
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

          // Hide the "scanning" message when hit test results are available
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
      <button className="back-button" onClick={handleBackButtonClick}>
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
