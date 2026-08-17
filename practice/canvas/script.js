import * as THREE from "three";
import imageUrl from "/src/assets/images/sculptural-still-lifes/blue-black-geometry.webp";
import imageUrl1 from "/src/assets/images/sculptural-still-lifes/blue-black-geometry.webp";
import imageUrl2 from "/src/assets/images/sculptural-still-lifes/blush-pastel-forms.webp";
import imageUrl3 from "/src/assets/images/sculptural-still-lifes/emerald-forms.webp";

const imageUrls = [imageUrl1, imageUrl2, imageUrl3];

const planes = [];

const CAMERA_FOV = 75;
const PLANE_WIDTH = 500;

// DOMとビューポート
const canvas = document.querySelector("[data-webgl-canvas]");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

function resizePlanes() {
  const planeWidth = Math.min(PLANE_WIDTH, sizes.width * 0.8);

  planes.forEach((plane) => {
    const imageAspect = plane.userData.imageAspect;

    plane.scale.set(planeWidth, planeWidth / imageAspect, 1);
  });
}

// Three.jsの基本構成
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(sizes.width, sizes.height);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  CAMERA_FOV,
  sizes.width / sizes.height,
  0.1,
  1000,
);

function getCameraDistance(viewportHeight) {
  const halfViewportHeight = viewportHeight / 2;
  const halfFov = THREE.MathUtils.degToRad(CAMERA_FOV / 2);

  return halfViewportHeight / Math.tan(halfFov);
}

camera.position.z = getCameraDistance(sizes.height);

// 画像を貼ったPlane
const textureLoader = new THREE.TextureLoader();
const geometry = new THREE.PlaneGeometry(1, 1);

imageUrls.forEach((imageUrl) => {
  const material = new THREE.MeshBasicMaterial();
  const plane = new THREE.Mesh(geometry, material);

  plane.userData.imageAspect = 1;

  planes.push(plane);
  scene.add(plane);

  textureLoader.load(imageUrl, (loadedTexture) => {
    const { width, height } = loadedTexture.image;

    loadedTexture.colorSpace = THREE.SRGBColorSpace;

    material.map = loadedTexture;
    material.needsUpdate = true;

    plane.userData.imageAspect = width / height;

    resizePlanes();
    renderer.render(scene, camera);
  });
});


// 初期描画
renderer.render(scene, camera);

// ビューポート変更
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  renderer.setSize(sizes.width, sizes.height);
  camera.aspect = sizes.width / sizes.height;
  camera.position.z = getCameraDistance(sizes.height);
  camera.updateProjectionMatrix();
  resizePlanes();
  renderer.render(scene, camera);
});
