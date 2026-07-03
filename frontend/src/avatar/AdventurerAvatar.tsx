import { createElement, Fragment } from "react";
import type { ReactNode } from "react";
import adventurerDefinition from "./adventurer.min.json";
import type { AvatarSelection } from "../types/face";

type ColorToken = {
  type: "color";
  name: "hair" | "skin";
};

type AttributeValue = string | number | ColorToken;

type DefinitionElement = {
  name: string;
  type: "component" | "element";
  attributes?: Record<string, AttributeValue>;
  children?: DefinitionElement[];
};

type ComponentVariant = {
  elements: DefinitionElement[];
};

type ComponentDefinition = {
  variants: Record<string, ComponentVariant>;
};

type AdventurerDefinition = {
  canvas: {
    width: number;
    height: number;
    elements: DefinitionElement[];
  };
  components: Record<string, ComponentDefinition>;
};

type Props = {
  avatar: AvatarSelection;
};

const definition = adventurerDefinition as unknown as AdventurerDefinition;
const background = "#d9fb9f";

const attributeNames: Record<string, string> = {
  "clip-rule": "clipRule",
  "fill-rule": "fillRule",
  "shape-rendering": "shapeRendering"
};

function normalizeValue(value: AttributeValue, avatar: AvatarSelection) {
  if (typeof value === "object" && value.type === "color") {
    return value.name === "hair" ? avatar.hairColor : avatar.skinColor;
  }
  return value;
}

function normalizeAttributes(attributes: DefinitionElement["attributes"], avatar: AvatarSelection) {
  if (!attributes) return undefined;

  return Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => [attributeNames[key] ?? key, normalizeValue(value, avatar)])
  );
}

function renderNodes(nodes: DefinitionElement[] | undefined, avatar: AvatarSelection, keyPrefix: string): ReactNode[] {
  return (nodes ?? []).map((node, index) => renderNode(node, avatar, `${keyPrefix}-${node.name}-${index}`));
}

function selectedVariantForComponent(name: string, avatar: AvatarSelection) {
  if (name === "head") return "default";
  if (name === "hair") return avatar.hair;
  if (name === "eyes") return avatar.eyes;
  if (name === "eyebrows") return avatar.eyebrows;
  if (name === "mouth") return avatar.mouth;
  if (name === "details") return avatar.details === "none" ? undefined : avatar.details;
  if (name === "glasses") return avatar.glasses === "none" ? undefined : avatar.glasses;
  if (name === "earrings") return avatar.earrings === "none" ? undefined : avatar.earrings;
  return undefined;
}

function renderComponent(node: DefinitionElement, avatar: AvatarSelection, key: string) {
  const selectedVariant = selectedVariantForComponent(node.name, avatar);
  if (!selectedVariant) return null;

  const component = definition.components[node.name];
  const variant = component?.variants[String(selectedVariant)];
  if (!variant) return null;

  return (
    <g key={key} {...normalizeAttributes(node.attributes, avatar)}>
      {renderNodes(variant.elements, avatar, key)}
    </g>
  );
}

function renderNode(node: DefinitionElement, avatar: AvatarSelection, key: string): ReactNode {
  if (node.type === "component") {
    return renderComponent(node, avatar, key);
  }

  const children = renderNodes(node.children, avatar, key);
  return createElement(
    node.name,
    {
      key,
      ...normalizeAttributes(node.attributes, avatar)
    },
    children.length ? children : undefined
  );
}

export function AdventurerAvatar({ avatar }: Props) {
  return (
    <svg
      className="avatar-svg"
      viewBox={`0 0 ${definition.canvas.width} ${definition.canvas.height}`}
      role="img"
      aria-label="卡通头像预览"
    >
      <title>卡通头像预览</title>
      <rect width={definition.canvas.width} height={definition.canvas.height} fill={background} />
      <g transform="translate(85 62) scale(0.74)">
        <Fragment>{renderNodes(definition.canvas.elements, avatar, "canvas")}</Fragment>
      </g>
    </svg>
  );
}
