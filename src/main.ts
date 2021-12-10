interface VirtualNode {
  tag: string;
  props: Record<string, any> | null;
  children: (VirtualNode | string)[] | null;
}

// Create a DOM element
const createElement = (virtualNode: VirtualNode | string) => {
  if (typeof virtualNode === 'string') {
    return document.createTextNode(virtualNode);
  }

  const element = document.createElement(virtualNode.tag);

  // Apply props
  if (virtualNode.props) {
    Object.entries(virtualNode.props).map(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  // Recursively create children DOM elements and append it to the main element
  if (Array.isArray(virtualNode.children)) {
    virtualNode.children
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

  // "props" are changed
  if (nodeA !== undefined && nodeB !== undefined && !typesAreStrings) {
    return JSON.stringify(nodeA.props) !== JSON.stringify(nodeB.props);
  }

  return typesAreDifferent || stringAreDifferent || nodeA!.tag !== nodeB!.tag;
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
    for (
      let i = 0;
      i <
      Math.max(
        currentVirtualNode.children!.length,
        nextVirtualNode.children!.length,
      );
      i++
    ) {
      update(
        (currentVirtualNode.children as VirtualNode[])[i],
        (nextVirtualNode.children as VirtualNode[])[i],
        i,
        root.childNodes[index],
      );
    }
  }
};

const virtualDomSnapshotA: VirtualNode = {
  tag: 'div',
  props: {
    'data-testid': 0,
  },
  children: [
    {
      tag: 'h1',
      props: null,
      children: ['See how DOM element with [data-testid=0]'],
    },
  ],
};

const virtualDomSnapshotB: VirtualNode = {
  tag: 'div',
  props: {
    'data-testid': 0,
  },
  children: [
    {
      tag: 'h1',
      props: null,
      children: [
        'See how DOM element with [data-testid=0]',
        {
          tag: 'highlight',
          props: {
            style: 'color: green;',
          },
          children: [' does not change!'],
        },
      ],
    },
  ],
};

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
