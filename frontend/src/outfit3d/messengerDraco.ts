import * as THREE from "three";

type DecodedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

type TypedArrayCtor<T extends DecodedArray = DecodedArray> = {
  new (buffer: ArrayBufferLike, byteOffset: number, length: number): T;
  readonly BYTES_PER_ELEMENT: number;
};

type MetadataInfo = {
  attributes: Array<[string, number]>;
  userData?: Record<string, unknown>;
};

type DecodedAttribute = {
  name: string;
  array: DecodedArray;
  itemSize: number;
};

type DecodedGeometry = {
  index: { array: Uint32Array; itemSize: 1 } | null;
  attributes: DecodedAttribute[];
  userData: Record<string, unknown>;
};

const ASSET_BASE = "/messenger-avatar";
const decoder = new TextDecoder();
const typedArrays: TypedArrayCtor[] = [
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array
];

let dracoModulePromise: Promise<any> | undefined;
const geometryCache = new Map<string, Promise<THREE.BufferGeometry>>();

async function loadDracoModule() {
  if (!dracoModulePromise) {
    dracoModulePromise = Promise.all([
      import(/* @vite-ignore */ `${ASSET_BASE}/libs/draco/draco_wasm_wrapper.js`) as Promise<{ default: (options: { wasmBinary: ArrayBuffer }) => Promise<any> }>,
      fetch(`${ASSET_BASE}/libs/draco/draco_decoder.wasm`, { credentials: "same-origin" }).then((response) => {
        if (!response.ok) throw new Error("Draco wasm 加载失败");
        return response.arrayBuffer();
      })
    ]).then(([module, wasmBinary]) => module.default({ wasmBinary }));
  }
  return dracoModulePromise;
}

function getDracoDataType(draco: any, ArrayType: TypedArrayCtor) {
  if (ArrayType === Float32Array) return draco.DT_FLOAT32;
  if (ArrayType === Float64Array) return draco.DT_FLOAT64;
  if (ArrayType === Int8Array) return draco.DT_INT8;
  if (ArrayType === Int16Array) return draco.DT_INT16;
  if (ArrayType === Int32Array) return draco.DT_INT32;
  if (ArrayType === Uint8Array || ArrayType === Uint8ClampedArray) return draco.DT_UINT8;
  if (ArrayType === Uint16Array) return draco.DT_UINT16;
  if (ArrayType === Uint32Array) return draco.DT_UINT32;
  throw new Error("不支持的 Draco attribute 类型");
}

function decodeIndex(draco: any, decoderInstance: any, mesh: any) {
  const indexCount = mesh.num_faces() * 3;
  const byteLength = indexCount * Uint32Array.BYTES_PER_ELEMENT;
  const pointer = draco._malloc(byteLength);
  decoderInstance.GetTrianglesUInt32Array(mesh, byteLength, pointer);
  const array = new Uint32Array(draco.HEAPF32.buffer, pointer, indexCount).slice();
  draco._free(pointer);
  return { array, itemSize: 1 as const };
}

function decodeAttribute(draco: any, decoderInstance: any, geometry: any, name: string, ArrayType: TypedArrayCtor, attribute: any): DecodedAttribute {
  const itemSize = attribute.num_components();
  const arrayLength = geometry.num_points() * itemSize;
  const byteLength = arrayLength * ArrayType.BYTES_PER_ELEMENT;
  const dracoType = getDracoDataType(draco, ArrayType);
  const pointer = draco._malloc(byteLength);
  decoderInstance.GetAttributeDataArrayForAllPoints(geometry, attribute, dracoType, byteLength, pointer);
  const array = new ArrayType(draco.HEAPF32.buffer, pointer, arrayLength).slice();
  draco._free(pointer);
  return { name, array, itemSize };
}

function readWrappedDraco(buffer: ArrayBuffer) {
  const isRawDraco = decoder.decode(new Uint8Array(buffer, 0, Math.min(5, buffer.byteLength))) === "DRACO";
  if (isRawDraco) {
    return { encoded: new Int8Array(buffer), metadata: undefined };
  }

  const metadataByteLength = new Uint32Array(buffer.slice(0, 4))[0];
  const metadata = JSON.parse(decoder.decode(buffer.slice(4, 4 + metadataByteLength))) as MetadataInfo;
  return {
    encoded: new Int8Array(buffer.slice(4 + metadataByteLength)),
    metadata
  };
}

function readRawMetadata(draco: any, decoderInstance: any, geometry: any) {
  const metadataQuerier = new draco.MetadataQuerier();
  try {
    const metadata = decoderInstance.GetMetadata(geometry);
    if (metadataQuerier.HasEntry(metadata, "info")) {
      return JSON.parse(metadataQuerier.GetStringEntry(metadata, "info")) as MetadataInfo;
    }
  } finally {
    draco.destroy(metadataQuerier);
  }
  return undefined;
}

async function decodeDracoBuffer(buffer: ArrayBuffer): Promise<DecodedGeometry> {
  const draco = await loadDracoModule();
  const decoderInstance = new draco.Decoder();
  let dracoGeometry: any;

  try {
    const wrapped = readWrappedDraco(buffer);
    const geometryType = decoderInstance.GetEncodedGeometryType(wrapped.encoded);

    if (geometryType === draco.TRIANGULAR_MESH) {
      dracoGeometry = new draco.Mesh();
      const status = decoderInstance.DecodeArrayToMesh(wrapped.encoded, wrapped.encoded.byteLength, dracoGeometry);
      if (!status.ok() || dracoGeometry.ptr === 0) {
        throw new Error(`Draco mesh 解码失败：${status.error_msg()}`);
      }
    } else if (geometryType === draco.POINT_CLOUD) {
      dracoGeometry = new draco.PointCloud();
      const status = decoderInstance.DecodeArrayToPointCloud(wrapped.encoded, wrapped.encoded.byteLength, dracoGeometry);
      if (!status.ok() || dracoGeometry.ptr === 0) {
        throw new Error(`Draco point cloud 解码失败：${status.error_msg()}`);
      }
    } else {
      throw new Error("未知的 Draco 几何类型");
    }

    const metadata = wrapped.metadata ?? readRawMetadata(draco, decoderInstance, dracoGeometry);
    if (!metadata?.attributes?.length) {
      throw new Error("Messenger Draco 文件缺少 attributes metadata");
    }

    const attributes: DecodedAttribute[] = [];
    metadata.attributes.forEach(([name, typedArrayIndex], uniqueId) => {
      const ArrayType = typedArrays[typedArrayIndex];
      if (!ArrayType) return;
      const attribute = decoderInstance.GetAttributeByUniqueId(dracoGeometry, uniqueId);
      attributes.push(decodeAttribute(draco, decoderInstance, dracoGeometry, name, ArrayType, attribute));
    });

    return {
      index: geometryType === draco.TRIANGULAR_MESH ? decodeIndex(draco, decoderInstance, dracoGeometry) : null,
      attributes,
      userData: metadata.userData ?? {}
    };
  } finally {
    if (dracoGeometry) draco.destroy(dracoGeometry);
    draco.destroy(decoderInstance);
  }
}

function createThreeGeometry(decoded: DecodedGeometry) {
  const geometry = new THREE.BufferGeometry();
  if (decoded.index) {
    geometry.setIndex(new THREE.BufferAttribute(decoded.index.array, decoded.index.itemSize));
  }
  decoded.attributes.forEach((attribute) => {
    geometry.setAttribute(attribute.name, new THREE.BufferAttribute(attribute.array, attribute.itemSize));
  });
  geometry.userData = decoded.userData;
  if (!geometry.getAttribute("normal") && geometry.getAttribute("position")) {
    geometry.computeVertexNormals();
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export async function loadMessengerGeometry(path: string) {
  const url = path.startsWith("/") ? path : `${ASSET_BASE}/${path}`;
  if (!geometryCache.has(url)) {
    geometryCache.set(
      url,
      fetch(url, { credentials: "same-origin" })
        .then((response) => {
          if (!response.ok) throw new Error(`3D 资产加载失败：${url}`);
          return response.arrayBuffer();
        })
        .then(decodeDracoBuffer)
        .then(createThreeGeometry)
    );
  }
  return geometryCache.get(url)!;
}
