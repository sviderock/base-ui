/* eslint-disable solid/reactivity */
import { createMemo } from 'solid-js';
import type { FloatingContext } from '../types';
import { getNodeAncestors, getNodeChildren } from './nodes';

const contextOpen = { open: createMemo(() => true) } as FloatingContext;
const contextClosed = { open: createMemo(() => false) } as FloatingContext;

test('getNodeChildren returns an array of children, ignoring closed ones when onlyOpenChildren=true', () => {
  const nodes = [
    { id: '0', parentId: null, context: contextOpen },
    { id: '1', parentId: '0', context: contextOpen },
    { id: '2', parentId: '1', context: contextOpen },
    { id: '3', parentId: '1', context: contextOpen },
    { id: '4', parentId: '1', context: contextClosed },
  ];

  const result = getNodeChildren(nodes, '0', true);

  expect(
    result.map((node) => ({
      id: node.id,
      parentId: node.parentId,
      context: node.context,
    })),
  ).toEqual([
    { id: '1', parentId: '0', context: contextOpen },
    { id: '2', parentId: '1', context: contextOpen },
    { id: '3', parentId: '1', context: contextOpen },
  ]);
});

test('getNodeChildren returns an array of children, including closed ones when onlyOpenChildren=false', () => {
  const nodes = [
    { id: '0', parentId: null, context: contextOpen },
    { id: '1', parentId: '0', context: contextOpen },
    { id: '2', parentId: '1', context: contextOpen },
    { id: '3', parentId: '1', context: contextOpen },
    { id: '4', parentId: '1', context: contextClosed },
  ];

  const result = getNodeChildren(nodes, '0', false);

  expect(result).toEqual([
    { id: '1', parentId: '0', context: contextOpen },
    { id: '2', parentId: '1', context: contextOpen },
    { id: '3', parentId: '1', context: contextOpen },
    { id: '4', parentId: '1', context: contextClosed },
  ]);
});

test('getNodeChildren handles deep parent structures correctly (onlyOpenChildren=true)', () => {
  const nodes = [
    { id: '0', parentId: null, context: contextOpen },
    { id: '1', parentId: '0', context: contextOpen },
    { id: '2', parentId: '1', context: contextClosed },
    { id: '3', parentId: '2', context: contextOpen },
    { id: '4', parentId: '2', context: contextClosed },
    { id: '5', parentId: '0', context: contextOpen },
    { id: '6', parentId: '5', context: contextOpen },
  ];

  const result = getNodeChildren(nodes, '0', true);

  expect(result).toEqual([
    { id: '1', parentId: '0', context: contextOpen },
    { id: '5', parentId: '0', context: contextOpen },
    { id: '6', parentId: '5', context: contextOpen },
  ]);
});

test('getNodeChildren handles deep parent structures correctly (onlyOpenChildren=false)', () => {
  const nodes = [
    { id: '0', parentId: null, context: contextOpen },
    { id: '1', parentId: '0', context: contextOpen },
    { id: '2', parentId: '1', context: contextClosed },
    { id: '3', parentId: '2', context: contextOpen },
    { id: '4', parentId: '2', context: contextClosed },
    { id: '5', parentId: '0', context: contextOpen },
    { id: '6', parentId: '5', context: contextOpen },
  ];

  const result = getNodeChildren(nodes, '0', false);

  expect(result).toEqual([
    { id: '1', parentId: '0', context: contextOpen },
    { id: '2', parentId: '1', context: contextClosed },
    { id: '3', parentId: '2', context: contextOpen },
    { id: '4', parentId: '2', context: contextClosed },
    { id: '5', parentId: '0', context: contextOpen },
    { id: '6', parentId: '5', context: contextOpen },
  ]);
});

test('getNodeAncestors returns an array of ancestors', () => {
  const nodes = [
    { id: '0', parentId: null },
    { id: '1', parentId: '0' },
    { id: '2', parentId: '1' },
  ];

  const result = getNodeAncestors(nodes, '2');

  expect(result).toEqual([
    { id: '1', parentId: '0' },
    { id: '0', parentId: null },
  ]);
});
