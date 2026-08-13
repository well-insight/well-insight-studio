import {
  computeAbstractModifier,
  computeAccessibilityModifier,
  computeDecoratedModifier,
  computeOverrideModifier,
  computeStaticModifier,
} from './common-modifiers.js'
import { computeDependencyName } from '../compute-dependency-name.js'
import { computeMethodOrPropertyNameDetails } from './compute-method-or-property-name-details.js'
/**
 * Computes details related to an accessor property.
 *
 * @param params - Parameters object.
 * @param params.isDecorated - Whether the accessor is decorated.
 * @param params.sourceCode - The source code object.
 * @param params.accessor - The accessor node to compute information for.
 * @returns An object containing various details about the accessor.
 */
function computeAccessorDetails({ isDecorated, sourceCode, accessor }) {
  let nameDetails = computeMethodOrPropertyNameDetails(accessor, sourceCode)
  let modifiers = computeModifiers({
    hasPrivateHash: nameDetails.hasPrivateHash,
    isDecorated,
    accessor,
  })
  return {
    dependencyNames: [
      computeDependencyName({
        nodeNameWithoutStartingHash: nameDetails.nameWithoutStartingHash,
        hasPrivateHash: nameDetails.hasPrivateHash,
        isStatic: modifiers.includes('static'),
      }),
    ],
    selectors: ['accessor-property'],
    isStatic: accessor.static,
    nameDetails,
    modifiers,
  }
}
function computeModifiers({ hasPrivateHash, isDecorated, accessor }) {
  return [
    ...computeStaticModifier(accessor),
    ...computeAbstractModifier(accessor),
    ...computeDecoratedModifier(isDecorated),
    ...computeOverrideModifier(accessor),
    ...computeAccessibilityModifier({
      hasPrivateHash,
      node: accessor,
    }),
  ]
}
export { computeAccessorDetails }
