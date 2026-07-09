import * as THREE from "three";
import type { OutfitAction, OutfitSelection } from "../types/outfit";
import { loadMessengerGeometry } from "./messengerDraco";

type PartName = "base" | OutfitSelection[keyof OutfitSelection];

export type MessengerAvatarInstance = {
  object: THREE.Group;
  mixer: THREE.AnimationMixer;
  skeleton: THREE.Skeleton;
};

const accessoriesBasePath = "/messenger-avatar/geometries/avatar/accessories";
const animationsBasePath = "/messenger-avatar/geometries/avatar/animations";

const actionFileNames: Record<OutfitAction, string> = {
  idle: "avatar-idle",
  run: "avatar-run",
  sprint: "avatar-sprint",
  air: "avatar-air",
  afk1: "avatar-afk1",
  afk2: "avatar-afk2",
  afk3: "avatar-afk3"
};

const materialColors = {
  skin: "#f0b88d",
  hair: {
    hair1: "#211915",
    hair2: "#5a3b25",
    hair3: "#c8a65d",
    hair4: "#20242b",
    hair5: "#7e4a68",
    hair6: "#31594c",
    hair7: "#d06f4d"
  },
  top: {
    top1: "#f4f1e8",
    top2: "#397d6d",
    top3: "#b84f4b",
    top4: "#315f9f",
    top5: "#262626",
    top6: "#cf9948",
    top7: "#6a6278",
    top8: "#e4cf52",
    top9: "#8d3d5c"
  },
  bottom: {
    bottom1: "#5d7f88",
    bottom2: "#8f774f",
    bottom3: "#2f4c78",
    bottom4: "#3f4542",
    bottom5: "#7b675a",
    bottom6: "#2f6b55",
    bottom7: "#594875"
  },
  shoes: {
    shoes1: "#262626",
    shoes2: "#f0efe9",
    shoes3: "#70442f",
    shoes4: "#3f4248",
    shoes5: "#7f4936",
    shoes6: "#294d73",
    shoes7: "#c65343"
  }
} satisfies {
  skin: string;
  hair: Record<OutfitSelection["hair"], string>;
  top: Record<OutfitSelection["top"], string>;
  bottom: Record<OutfitSelection["bottom"], string>;
  shoes: Record<OutfitSelection["shoes"], string>;
};

const animationClipCache = new Map<OutfitAction, Promise<THREE.AnimationClip>>();

function createMaterials(selection: OutfitSelection) {
  return [
    new THREE.MeshStandardMaterial({ color: materialColors.skin, roughness: 0.72, metalness: 0.02, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: materialColors.hair[selection.hair], roughness: 0.82, metalness: 0, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: materialColors.top[selection.top], roughness: 0.76, metalness: 0.03, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: materialColors.bottom[selection.bottom], roughness: 0.78, metalness: 0.02, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: materialColors.shoes[selection.shoes], roughness: 0.62, metalness: 0.05, side: THREE.DoubleSide })
  ];
}

async function loadAccessory(part: PartName) {
  const geometry = await loadMessengerGeometry(`${accessoriesBasePath}/${part}.drc`);
  return geometry.clone();
}

async function createSkeleton() {
  const geometry = await loadMessengerGeometry(`${animationsBasePath}/avatar-bones.drc`);
  const position = geometry.getAttribute("position");
  const quaternion = geometry.getAttribute("quaternion");
  const scale = geometry.getAttribute("scale");
  const hierarchy = geometry.getAttribute("hierarchy");

  if (!position || !quaternion || !scale || !hierarchy) {
    throw new Error("avatar-bones.drc 缺少骨骼属性");
  }

  const bones = Array.from({ length: position.count }, (_, index) => {
    const bone = new THREE.Bone();
    bone.name = `bone_${index}`;
    bone.position.set(position.getX(index), position.getY(index), position.getZ(index));
    bone.quaternion.set(quaternion.getX(index), quaternion.getY(index), quaternion.getZ(index), quaternion.getW(index)).normalize();
    bone.scale.set(scale.getX(index), scale.getY(index), scale.getZ(index));
    return bone;
  });

  const rootIndices: number[] = [];
  bones.forEach((bone, index) => {
    const parentIndex = Math.round(hierarchy.getX(index)) - 1;
    if (parentIndex >= 0 && bones[parentIndex]) {
      bones[parentIndex].add(bone);
    } else {
      rootIndices.push(index);
    }
  });

  return {
    bones,
    rootIndices,
    skeleton: new THREE.Skeleton(bones)
  };
}

function sameAttributeLayout(left: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, right: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) {
  return left.itemSize === right.itemSize && left.normalized === right.normalized && left.array.constructor === right.array.constructor;
}

function mergeAccessoryGeometries(parts: Array<{ geometry: THREE.BufferGeometry; materialIndex: number }>) {
  const merged = new THREE.BufferGeometry();
  const baseAttributes = Object.keys(parts[0].geometry.attributes).filter((name) =>
    parts.every((part) => {
      const first = parts[0].geometry.getAttribute(name);
      const current = part.geometry.getAttribute(name);
      return Boolean(first && current && sameAttributeLayout(first, current));
    })
  );
  const vertexCounts = parts.map((part) => part.geometry.getAttribute("position").count);
  const totalVertices = vertexCounts.reduce((total, count) => total + count, 0);

  baseAttributes.forEach((name) => {
    const first = parts[0].geometry.getAttribute(name) as THREE.BufferAttribute;
    const ArrayType = first.array.constructor as {
      new (length: number): THREE.TypedArray;
    };
    const array = new ArrayType(totalVertices * first.itemSize);
    let offset = 0;
    parts.forEach((part) => {
      const attribute = part.geometry.getAttribute(name) as THREE.BufferAttribute;
      array.set(attribute.array, offset);
      offset += attribute.array.length;
    });
    merged.setAttribute(name, new THREE.BufferAttribute(array, first.itemSize, first.normalized));
  });

  const totalIndices = parts.reduce((total, part, index) => {
    const partIndex = part.geometry.getIndex();
    return total + (partIndex?.count ?? vertexCounts[index]);
  }, 0);
  const indexArray = new Uint32Array(totalIndices);
  let indexOffset = 0;
  let vertexOffset = 0;

  parts.forEach((part, partIndex) => {
    const sourceIndex = part.geometry.getIndex();
    const indexCount = sourceIndex?.count ?? vertexCounts[partIndex];
    merged.addGroup(indexOffset, indexCount, part.materialIndex);
    if (sourceIndex) {
      for (let index = 0; index < sourceIndex.count; index += 1) {
        indexArray[indexOffset + index] = sourceIndex.getX(index) + vertexOffset;
      }
    } else {
      for (let index = 0; index < vertexCounts[partIndex]; index += 1) {
        indexArray[indexOffset + index] = vertexOffset + index;
      }
    }
    indexOffset += indexCount;
    vertexOffset += vertexCounts[partIndex];
  });

  merged.setIndex(new THREE.BufferAttribute(indexArray, 1));
  if (!merged.getAttribute("normal")) {
    merged.computeVertexNormals();
  }
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return merged;
}

function normalizeAvatarGroup(group: THREE.Group) {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const height = size.y || 1;
  const scale = 2.72 / height;
  group.scale.setScalar(scale);
  group.position.set(-center.x * scale, -box.min.y * scale - 1.36, -center.z * scale);
}

function buildAnimationClip(action: OutfitAction, geometry: THREE.BufferGeometry) {
  const frames = Number(geometry.userData.frames ?? 0);
  const fps = Number(geometry.userData.fps ?? 30);
  const position = geometry.getAttribute("position");
  const quaternion = geometry.getAttribute("quaternion");
  const scale = geometry.getAttribute("scale");

  if (!frames || !position || !quaternion || !scale) {
    return new THREE.AnimationClip(action, -1, []);
  }

  const boneCount = Math.floor(position.count / frames);
  const duration = frames / fps;
  const interval = frames > 1 ? duration / (frames - 1) : 0;
  const times = new Float32Array(frames);
  for (let frame = 0; frame < frames; frame += 1) {
    times[frame] = frame * interval;
  }

  const tracks: THREE.KeyframeTrack[] = [];
  const vectorAttributes = [
    { name: "position", attribute: position, Track: THREE.VectorKeyframeTrack },
    { name: "scale", attribute: scale, Track: THREE.VectorKeyframeTrack }
  ];

  vectorAttributes.forEach(({ name, attribute, Track }) => {
    for (let boneIndex = 0; boneIndex < boneCount; boneIndex += 1) {
      const values = new Float32Array(frames * attribute.itemSize);
      for (let frame = 0; frame < frames; frame += 1) {
        const sourceIndex = frame * boneCount + boneIndex;
        const targetIndex = frame * attribute.itemSize;
        values[targetIndex] = attribute.getX(sourceIndex);
        values[targetIndex + 1] = attribute.getY(sourceIndex);
        values[targetIndex + 2] = attribute.getZ(sourceIndex);
      }
      tracks.push(new Track(`bone_${boneIndex}.${name}`, times, values));
    }
  });

  for (let boneIndex = 0; boneIndex < boneCount; boneIndex += 1) {
    const values = new Float32Array(frames * quaternion.itemSize);
    for (let frame = 0; frame < frames; frame += 1) {
      const sourceIndex = frame * boneCount + boneIndex;
      const targetIndex = frame * quaternion.itemSize;
      const frameQuaternion = new THREE.Quaternion(
        quaternion.getX(sourceIndex),
        quaternion.getY(sourceIndex),
        quaternion.getZ(sourceIndex),
        quaternion.getW(sourceIndex)
      ).normalize();
      values[targetIndex] = frameQuaternion.x;
      values[targetIndex + 1] = frameQuaternion.y;
      values[targetIndex + 2] = frameQuaternion.z;
      values[targetIndex + 3] = frameQuaternion.w;
    }
    tracks.push(new THREE.QuaternionKeyframeTrack(`bone_${boneIndex}.quaternion`, times, values));
  }

  return new THREE.AnimationClip(action, duration, tracks);
}

async function loadAnimationClip(action: OutfitAction) {
  if (!animationClipCache.has(action)) {
    animationClipCache.set(
      action,
      loadMessengerGeometry(`${animationsBasePath}/${actionFileNames[action]}.drc`).then((geometry) => buildAnimationClip(action, geometry))
    );
  }
  return animationClipCache.get(action)!;
}

export async function createMessengerAvatar(selection: OutfitSelection, action: OutfitAction): Promise<MessengerAvatarInstance> {
  const [base, hair, top, bottom, shoes, skeletonData, clip] = await Promise.all([
    loadAccessory("base"),
    loadAccessory(selection.hair),
    loadAccessory(selection.top),
    loadAccessory(selection.bottom),
    loadAccessory(selection.shoes),
    createSkeleton(),
    loadAnimationClip(action)
  ]);
  const geometry = mergeAccessoryGeometries([
    { geometry: base, materialIndex: 0 },
    { geometry: hair, materialIndex: 1 },
    { geometry: top, materialIndex: 2 },
    { geometry: bottom, materialIndex: 3 },
    { geometry: shoes, materialIndex: 4 }
  ]);
  const materials = createMaterials(selection);
  const mesh = new THREE.SkinnedMesh(geometry, materials);
  const group = new THREE.Group();

  mesh.name = "messenger-avatar";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  skeletonData.rootIndices.forEach((index: number) => mesh.add(skeletonData.bones[index]));
  mesh.bind(skeletonData.skeleton);
  mesh.normalizeSkinWeights();
  group.add(mesh);
  normalizeAvatarGroup(group);

  const mixer = new THREE.AnimationMixer(group);
  if (clip.tracks.length > 0) {
    const clipAction = mixer.clipAction(clip);
    clipAction.reset().fadeIn(0.12).play();
  }

  base.dispose();
  hair.dispose();
  top.dispose();
  bottom.dispose();
  shoes.dispose();

  return {
    object: group,
    mixer,
    skeleton: skeletonData.skeleton
  };
}

export function disposeMessengerAvatar(instance: MessengerAvatarInstance) {
  instance.mixer.stopAllAction();
  instance.object.traverse((child: THREE.Object3D) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach((item) => item.dispose());
    } else if (material) {
      material.dispose();
    }
  });
  instance.skeleton.dispose();
}
