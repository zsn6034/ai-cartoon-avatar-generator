import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { OutfitAction, OutfitSelection } from "../../types/outfit";
import { createMessengerAvatar, disposeMessengerAvatar, type MessengerAvatarInstance } from "../../outfit3d/messengerAvatar";

type Props = {
  selection: OutfitSelection;
  action: OutfitAction;
};

type SceneState = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  clock: THREE.Clock;
  avatar?: MessengerAvatarInstance;
  animationFrame?: number;
};

const previewBackgroundColor = "#d9fb9f";

function fitCamera(camera: THREE.PerspectiveCamera) {
  camera.position.set(0, 0.25, 5.2);
  camera.lookAt(0, 0.05, 0);
  camera.updateProjectionMatrix();
}

export function OutfitViewer({ selection, action }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<SceneState | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const activeContainer = container;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const clock = new THREE.Clock();
    const hemisphere = new THREE.HemisphereLight(0xffffff, 0x4b5560, 2.1);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    const fillLight = new THREE.DirectionalLight(0xfff1d6, 1.1);
    let dragging = false;
    let lastX = 0;

    scene.background = new THREE.Color(previewBackgroundColor);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(previewBackgroundColor, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = "outfit-canvas";
    activeContainer.appendChild(renderer.domElement);

    keyLight.position.set(3, 4, 4);
    keyLight.castShadow = true;
    fillLight.position.set(-3.5, 2.2, -2);
    scene.add(hemisphere, keyLight, fillLight);
    fitCamera(camera);

    function resize() {
      const width = Math.max(1, activeContainer.clientWidth);
      const height = Math.max(1, activeContainer.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(activeContainer);
    resize();

    function onPointerDown(event: PointerEvent) {
      dragging = true;
      lastX = event.clientX;
      renderer.domElement.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event: PointerEvent) {
      if (!dragging || !stateRef.current?.avatar) return;
      const deltaX = event.clientX - lastX;
      lastX = event.clientX;
      stateRef.current.avatar.object.rotation.y += deltaX * 0.01;
    }

    function onPointerUp(event: PointerEvent) {
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);

    const state: SceneState = { scene, camera, renderer, clock };
    stateRef.current = state;

    function render() {
      const delta = clock.getDelta();
      const avatar = stateRef.current?.avatar;
      if (avatar) {
        avatar.mixer.update(delta);
        if (!dragging) {
          avatar.object.rotation.y += delta * 0.16;
        }
      }
      renderer.render(scene, camera);
      state.animationFrame = requestAnimationFrame(render);
    }
    render();

    return () => {
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      if (state.animationFrame) cancelAnimationFrame(state.animationFrame);
      if (state.avatar) {
        scene.remove(state.avatar.object);
        disposeMessengerAvatar(state.avatar);
      }
      renderer.dispose();
      renderer.domElement.remove();
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const previousAvatar = stateRef.current?.avatar;
    const previousRotation = previousAvatar?.object.rotation.clone();
    const previousMixerTime = previousAvatar?.mixer.time ?? 0;

    setLoadState(previousAvatar ? "ready" : "loading");
    setError(undefined);

    createMessengerAvatar(selection, action)
      .then((avatar) => {
        if (cancelled) {
          disposeMessengerAvatar(avatar);
          return;
        }
        const state = stateRef.current;
        if (!state) {
          disposeMessengerAvatar(avatar);
          return;
        }

        const outgoingAvatar = state.avatar;
        if (previousRotation) {
          avatar.object.rotation.copy(previousRotation);
        }
        if (previousMixerTime > 0) {
          avatar.mixer.setTime(previousMixerTime);
        }

        state.avatar = avatar;
        state.scene.add(avatar.object);
        if (outgoingAvatar) {
          state.scene.remove(outgoingAvatar.object);
          disposeMessengerAvatar(outgoingAvatar);
        }
        fitCamera(state.camera);
        setLoadState("ready");
      })
      .catch((caught) => {
        if (cancelled) return;
        setLoadState(previousAvatar ? "ready" : "error");
        setError(caught instanceof Error ? caught.message : "3D 资产加载失败");
      });

    return () => {
      cancelled = true;
    };
  }, [action, selection.bottom, selection.hair, selection.shoes, selection.top]);

  return (
    <div className="outfit-viewer" ref={containerRef}>
      {loadState === "loading" && (
        <div className="viewer-status" role="status">
          <span className="loading-spinner" />
          <span>加载 3D 资产...</span>
        </div>
      )}
      {loadState === "error" && <div className="viewer-status error">{error}</div>}
    </div>
  );
}
