type VirtualNode = [
  keyof HTMLElementTagNameMap,
  Record<string, string | number> | null,
  (VirtualNode | string)[] | null,
];

// Create a DOM element
const createElement = (virtualNode: VirtualNode | string) => {
  if (typeof virtualNode === 'string') {
    return document.createTextNode(virtualNode);
  }

  const [tag, props, children] = virtualNode;
  const element = document.createElement(tag);

  // Apply props
  if (props) {
    Object.entries(props).map(([key, value]) => {
      element.setAttribute(key, String(value));
    });
  }

  // Recursively create children DOM elements and append it to the main element
  if (Array.isArray(children)) {
    children
      .map(createElement)
      .forEach((childElement) => element.appendChild(childElement));
  }

  return element;
};

// Is Virtual DOM nodes are changed
const changed = (nodeA?: VirtualNode, nodeB?: VirtualNode): boolean => {
  const typesAreDifferent = typeof nodeA !== typeof nodeB;
  const typesAreStrings =
    typeof nodeA === 'string' && typeof nodeB === 'string';
  const stringAreDifferent = typesAreStrings && nodeA !== nodeB;

  const [tagA, propsA] = nodeA ?? [];
  const [tagB, propsB] = nodeB ?? [];

  // "props" are changed
  if (nodeA !== undefined && nodeB !== undefined && !typesAreStrings) {
    return JSON.stringify(propsA) !== JSON.stringify(propsB);
  }

  return typesAreDifferent || stringAreDifferent || tagA !== tagB;
};

const update = (
  currentVirtualNode: VirtualNode,
  nextVirtualNode: VirtualNode,
  index = 0,
  root: ChildNode,
) => {
  const bothAreStrings =
    typeof currentVirtualNode === 'string' &&
    typeof nextVirtualNode === 'string';

  const isChanged = changed(currentVirtualNode, nextVirtualNode);

  if (!nextVirtualNode) {
    root.removeChild(root.childNodes[index]);
  } else if (!currentVirtualNode) {
    root.appendChild(createElement(nextVirtualNode));
  } else if (isChanged) {
    root.replaceChild(createElement(nextVirtualNode), root.childNodes[index]);
  } else if (!bothAreStrings) {
    // Recursively updated DOM
    const [, , childrenA] = currentVirtualNode;
    const [, , childrenB] = nextVirtualNode;

    for (let i = 0; i < Math.max(childrenA!.length, childrenB!.length); i++) {
      update(
        (childrenA as VirtualNode[])[i],
        (childrenB as VirtualNode[])[i],
        i,
        root.childNodes[index],
      );
    }
  }
};

const virtualDomSnapshotA: VirtualNode = [
  'div',
  {
    'data-testid': 0,
  },
  [['h1', null, ['See how DOM element with [data-testid=0]']]],
];

const virtualDomSnapshotB: VirtualNode = [
  'div',
  {
    'data-testid': 0,
  },
  [
    [
      'h1',
      null,
      [
        'See how DOM element with [data-testid=0]',
        ['span', { style: 'color: green;' }, [' does not changing!']],
      ],
    ],
  ],
];

const app = document.querySelector<HTMLDivElement>('#app')!;

// Initial render
app.appendChild(createElement(virtualDomSnapshotA));

// Emulating updates
let count = 0;

setInterval(() => {
  if (count % 2 === 0) {
    update(virtualDomSnapshotA, virtualDomSnapshotB, 0, app);
  } else {
    update(virtualDomSnapshotB, virtualDomSnapshotA, 0, app);
  }

  count++;
}, 2000);
