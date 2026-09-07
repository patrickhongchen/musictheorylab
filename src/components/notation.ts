import { useEffect, useState, type RefObject } from 'react'
import type { Pitch } from '../music/types'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

export const SVG_DISPLAY_FONT = "var(--font-display, Georgia, 'Times New Roman', serif)"
export const SVG_BODY_FONT = 'var(--font-body, system-ui, sans-serif)'

export function vexKey(pitch: Pitch) {
  return `${pitch.letter.toLowerCase()}${pitch.accidental}/${pitch.octave}`
}

export function prepareNotationSvg(svg: SVGSVGElement, width: number, height: number) {
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  svg.removeAttribute('width')
  svg.removeAttribute('height')
  svg.style.width = '100%'
  svg.style.height = 'auto'
  svg.setAttribute('aria-hidden', 'true')
}

export function appendSvgText(svg: SVGSVGElement, x: number, y: number, text: string, options: {
  readonly color: string
  readonly family: string
  readonly size: number
  readonly weight?: string
  readonly anchor?: 'start' | 'middle' | 'end'
}) {
  const label = document.createElementNS(SVG_NAMESPACE, 'text')
  label.setAttribute('x', String(x))
  label.setAttribute('y', String(y))
  label.setAttribute('text-anchor', options.anchor ?? 'middle')
  label.setAttribute('fill', options.color)
  // VexFlow's SVG sets a stroke for engraving; text labels need fill only.
  label.setAttribute('stroke', 'none')
  label.setAttribute('font-family', options.family)
  label.setAttribute('font-size', String(options.size))
  label.setAttribute('font-weight', options.weight ?? '400')
  label.textContent = text
  svg.append(label)
  return label
}

/** Coordinates font loading, responsive redraws, and cleanup for VexFlow SVGs. */
export function useNotationRenderer(
  hostRef: RefObject<HTMLDivElement | null>,
  draw: (host: HTMLDivElement) => void,
) {
  const [error, setError] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    let revision = 0
    let frame: number | undefined

    const render = () => {
      const currentRevision = ++revision
      if (frame !== undefined) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        void (async () => {
          await document.fonts.ready
          if (cancelled || currentRevision !== revision) return
          host.replaceChildren()
          draw(host)
          if (!cancelled && currentRevision === revision) setError(false)
        })().catch(() => {
          if (!cancelled && currentRevision === revision) setError(true)
        })
      })
    }

    const observer = new ResizeObserver(render)
    observer.observe(host)
    render()

    return () => {
      cancelled = true
      revision++
      if (frame !== undefined) cancelAnimationFrame(frame)
      observer.disconnect()
      host.replaceChildren()
    }
  }, [draw, hostRef])

  return error
}
