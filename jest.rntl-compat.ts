type TestInstanceLike = {
  type: string;
  props: Record<string, any>;
  children: Array<TestInstanceLike | string>;
  queryAll?: (
    predicate: (instance: TestInstanceLike) => boolean,
    options?: { includeSelf?: boolean },
  ) => TestInstanceLike[];
  [key: string]: any;
};

const getTypeName = (type: unknown): string => {
  if (typeof type === 'string') {
    return type;
  }
  if (typeof type === 'function') {
    return (type as any).displayName || (type as any).name;
  }
  return String(type);
};

// RNTL 14 renamed several host elements (ScrollView -> RCTScrollView, etc).
// Legacy tests still pass the old names to UNSAFE_getByType / findAllByType,
// so accept either alias when matching by string name.
const HOST_ALIASES: Record<string, string[]> = {
  ScrollView: ['ScrollView', 'RCTScrollView'],
  RCTScrollView: ['ScrollView', 'RCTScrollView'],
  Switch: ['Switch', 'RCTSwitch'],
  RCTSwitch: ['Switch', 'RCTSwitch'],
  Text: ['Text', 'RCTText'],
  RCTText: ['Text', 'RCTText'],
};

const instanceMatchesType = (
  node: TestInstanceLike,
  type: unknown,
): boolean => {
  if (node.type === type) {
    return true;
  }

  const typeName = getTypeName(type);
  if (node.type === typeName) {
    return true;
  }

  if (
    typeof typeName === 'string' &&
    HOST_ALIASES[typeName]?.includes(node.type)
  ) {
    return true;
  }

  const fiber: any = node.unstable_fiber;
  if (!fiber) return false;

  // Direct host fiber match (legacy behaviour).
  const fiberTypes = [fiber.type, fiber.elementType];
  for (const ft of fiberTypes) {
    if (ft == null) continue;
    if (ft === type) return true;
    if (getTypeName(ft) === typeName) return true;
  }

  // Composite-component match: legacy UNSAFE_getAllByType(TouchableOpacity)
  // returned one entry per composite instance. RNTL 14's host-only tree
  // hides composites, so walk up the fiber chain — but only count a host
  // as a match if it is the OUTERMOST host under the composite (no other
  // host fiber appears between it and the composite ancestor). That keeps
  // the result count "one per composite" instead of every descendant host.
  let parent = fiber.return;
  while (parent) {
    if (typeof parent.type === 'string') {
      // A wrapping host fiber sits between us and any composite — bail.
      return false;
    }
    if (
      parent.type === type ||
      parent.elementType === type ||
      getTypeName(parent.type) === typeName ||
      getTypeName(parent.elementType) === typeName
    ) {
      return true;
    }
    parent = parent.return;
  }
  return false;
};

const queryAll = (
  root: TestInstanceLike,
  predicate: (instance: TestInstanceLike) => boolean,
  includeSelf = false,
): TestInstanceLike[] => {
  const builtIn = root.queryAll?.bind(root);
  const matches = builtIn
    ? builtIn(predicate, { includeSelf })
    : walk(root, predicate, includeSelf);
  return matches.map(decorateInstance);
};

const walk = (
  root: TestInstanceLike,
  predicate: (instance: TestInstanceLike) => boolean,
  includeSelf = false,
): TestInstanceLike[] => {
  const matches: TestInstanceLike[] = [];
  const visit = (node: TestInstanceLike | string, isRoot = false) => {
    if (typeof node === 'string') {
      return;
    }
    if ((!isRoot || includeSelf) && predicate(node)) {
      matches.push(node);
    }
    for (const child of node.children || []) {
      visit(child);
    }
  };
  visit(root, true);
  return matches;
};

const propsMatch = (
  actual: Record<string, any>,
  expected: Record<string, any>,
) => Object.entries(expected).every(([key, value]) => actual?.[key] === value);

const firstOrThrow = (items: TestInstanceLike[], message: string) => {
  if (items.length === 0) {
    throw new Error(message);
  }
  return items[0];
};

const decorateInstance = <T extends TestInstanceLike>(instance: T): T => {
  if (
    !instance ||
    typeof instance === 'string' ||
    instance.__rntlCompatDecorated
  ) {
    return instance;
  }

  Object.defineProperties(instance, {
    __rntlCompatDecorated: { value: true, enumerable: false },
    findAll: {
      value: (predicate: (node: TestInstanceLike) => boolean) =>
        queryAll(instance, predicate, true),
      enumerable: false,
    },
    find: {
      value: (predicate: (node: TestInstanceLike) => boolean) =>
        firstOrThrow(queryAll(instance, predicate, true), 'No instances found'),
      enumerable: false,
    },
    findAllByType: {
      value: (type: unknown) => {
        return queryAll(
          instance,
          node => instanceMatchesType(node, type),
          true,
        );
      },
      enumerable: false,
    },
    findByType: {
      value: (type: unknown) => {
        return firstOrThrow(
          queryAll(instance, node => instanceMatchesType(node, type), true),
          `No instances found with type ${getTypeName(type)}`,
        );
      },
      enumerable: false,
    },
    findAllByProps: {
      value: (props: Record<string, any>) =>
        queryAll(instance, node => propsMatch(node.props, props), true),
      enumerable: false,
    },
    findByProps: {
      value: (props: Record<string, any>) =>
        firstOrThrow(
          queryAll(instance, node => propsMatch(node.props, props), true),
          `No instances found with props ${JSON.stringify(props)}`,
        ),
      enumerable: false,
    },
  });

  return instance;
};

const emptyRootStub = (): TestInstanceLike => ({
  type: '',
  props: {},
  children: [],
});

const attachLegacyQueries = <T extends Record<string, any>>(result: T): T => {
  const container = decorateInstance(result.container as TestInstanceLike);
  const getRoot = () => {
    const root = result.root as TestInstanceLike | undefined | null;
    // RNTL 14 leaves result.root undefined when the component renders no
    // host output (e.g. returns null). Legacy tests still expect
    // UNSAFE_root.children to be an empty array, so synthesise one.
    if (root == null) {
      return decorateInstance(emptyRootStub());
    }
    return decorateInstance(root);
  };

  Object.defineProperties(result, {
    UNSAFE_root: {
      get: getRoot,
      enumerable: false,
      configurable: true,
    },
    UNSAFE_getAllByType: {
      value: (type: unknown) => {
        return queryAll(
          container,
          node => instanceMatchesType(node, type),
          true,
        );
      },
      enumerable: false,
    },
    UNSAFE_getByType: {
      value: (type: unknown) => {
        return firstOrThrow(
          queryAll(container, node => instanceMatchesType(node, type), true),
          `No instances found with type ${getTypeName(type)}`,
        );
      },
      enumerable: false,
    },
    UNSAFE_queryAllByType: {
      value: (type: unknown) => {
        return queryAll(
          container,
          node => instanceMatchesType(node, type),
          true,
        );
      },
      enumerable: false,
    },
    UNSAFE_getAllByProps: {
      value: (props: Record<string, any>) =>
        queryAll(container, node => propsMatch(node.props, props), true),
      enumerable: false,
    },
    UNSAFE_getByProps: {
      value: (props: Record<string, any>) =>
        firstOrThrow(
          queryAll(container, node => propsMatch(node.props, props), true),
          `No instances found with props ${JSON.stringify(props)}`,
        ),
      enumerable: false,
    },
  });

  return result;
};

jest.mock('@testing-library/react-native', () => {
  const actual = jest.requireActual('@testing-library/react-native');

  return {
    ...actual,
    render: async (...args: Parameters<typeof actual.render>) =>
      attachLegacyQueries(await actual.render(...args)),
    renderHook: async (...args: Parameters<typeof actual.renderHook>) =>
      attachLegacyQueries(await actual.renderHook(...args)),
  };
});

export {};
