/** Overlay mount target. Prefer `'body'`; use `'self'` / `false` to keep in place. */
export type WdAppendTo = string | HTMLElement | 'self' | false

export interface WdOverlayMountProps {
  /**
   * Whether to Teleport the overlay. Defaults to `true`.
   * Prefer `appendTo` when you need a custom container.
   */
  teleport?: boolean
  /**
   * Teleport target. Defaults to `'body'`.
   * Pass `'self'` or `false` to render in place (same as `teleport: false`).
   */
  appendTo?: WdAppendTo
}

export function resolveOverlayTeleport(options: WdOverlayMountProps = {}): {
  disabled: boolean
  to: string | HTMLElement
} {
  const teleport = options.teleport !== false
  const appendTo = options.appendTo ?? 'body'
  if (!teleport || appendTo === false || appendTo === 'self') {
    return { disabled: true, to: 'body' }
  }
  return { disabled: false, to: appendTo }
}

export function isOverlayTeleported(options: WdOverlayMountProps = {}): boolean {
  return !resolveOverlayTeleport(options).disabled
}
