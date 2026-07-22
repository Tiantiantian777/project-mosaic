import {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  BOARD_SLOT_COUNT,
  GameState,
  canSlide,
  getSingleEmptySlot,
  toBoardCoordinates,
} from '../engine'
import { MosaicTile } from './MosaicTile'

interface PuzzleBoardProps {
  state: GameState
  onPlace: (slotIndex: number) => void
  onSlide: (tileId: string) => void
}

interface DragState {
  tileId: string
  pointerId: number
  startX: number
  startY: number
  targetX: number
  targetY: number
  progress: number
  settling: boolean
}

const DRAG_THRESHOLD = 0.35
const TAP_DISTANCE = 6

export function PuzzleBoard({ state, onPlace, onSlide }: PuzzleBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const completionTimerRef = useRef<number | null>(null)
  const suppressClickRef = useRef(false)
  const [drag, setDrag] = useState<DragState | null>(null)

  function updateDrag(nextDrag: DragState | null) {
    dragRef.current = nextDrag
    setDrag(nextDrag)
  }

  useEffect(
    () => () => {
      if (completionTimerRef.current !== null) {
        window.clearTimeout(completionTimerRef.current)
      }
    },
    [],
  )

  const emptySlot = getSingleEmptySlot(state.board)

  function getTargetOffset(
    tileElement: HTMLElement,
  ): { x: number; y: number } | null {
    if (emptySlot === null || !boardRef.current) return null
    const emptyElement = boardRef.current.querySelector<HTMLElement>(
      `[data-slot-index="${emptySlot}"]`,
    )
    if (!emptyElement) return null

    const tileRect = tileElement.getBoundingClientRect()
    const emptyRect = emptyElement.getBoundingClientRect()
    return {
      x: emptyRect.left - tileRect.left,
      y: emptyRect.top - tileRect.top,
    }
  }

  function completeSlide(currentDrag: DragState) {
    updateDrag({ ...currentDrag, progress: 1, settling: true })
    completionTimerRef.current = window.setTimeout(
      () => {
        onSlide(currentDrag.tileId)
        updateDrag(null)
        completionTimerRef.current = null
      },
      175,
    )
  }

  function snapBack(currentDrag: DragState) {
    updateDrag({ ...currentDrag, progress: 0, settling: true })
    completionTimerRef.current = window.setTimeout(() => {
      updateDrag(null)
      completionTimerRef.current = null
    }, 150)
  }

  function startTapSlide(tileId: string, tileElement: HTMLElement) {
    if (!canSlide(state, tileId)) return
    const target = getTargetOffset(tileElement)
    if (!target) return

    completeSlide({
      tileId,
      pointerId: -1,
      startX: 0,
      startY: 0,
      targetX: target.x,
      targetY: target.y,
      progress: 0,
      settling: false,
    })
  }

  function handlePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    tileId: string,
  ) {
    if (!canSlide(state, tileId) || dragRef.current) return
    const target = getTargetOffset(event.currentTarget)
    if (!target) return

    event.currentTarget.setPointerCapture(event.pointerId)
    updateDrag({
      tileId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      targetX: target.x,
      targetY: target.y,
      progress: 0,
      settling: false,
    })
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const currentDrag = dragRef.current
    if (
      !currentDrag ||
      currentDrag.pointerId !== event.pointerId ||
      currentDrag.settling
    ) {
      return
    }

    const horizontal = Math.abs(currentDrag.targetX) > 0
    const pointerDistance = horizontal
      ? event.clientX - currentDrag.startX
      : event.clientY - currentDrag.startY
    const targetDistance = horizontal
      ? currentDrag.targetX
      : currentDrag.targetY
    const progress = Math.max(0, Math.min(1, pointerDistance / targetDistance))
    event.preventDefault()
    updateDrag({ ...currentDrag, progress })
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const currentDrag = dragRef.current
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    suppressClickRef.current = true
    const distance = Math.hypot(
      event.clientX - currentDrag.startX,
      event.clientY - currentDrag.startY,
    )

    if (distance < TAP_DISTANCE || currentDrag.progress >= DRAG_THRESHOLD) {
      completeSlide(currentDrag)
    } else {
      snapBack(currentDrag)
    }
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLButtonElement>) {
    const currentDrag = dragRef.current
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return
    snapBack(currentDrag)
  }

  return (
    <section className="panel board-panel" aria-labelledby="board-heading">
      <div className="section-heading">
        <div>
          <p className="section-kicker">4 × 4 sliding board</p>
          <h2 id="board-heading">
            {state.phase === 'placement'
              ? 'Place the selected square tile'
              : state.phase === 'sliding'
                ? 'Slide into the empty slot'
                : 'Final mosaic'}
          </h2>
        </div>
        {state.phase === 'sliding' && (
          <span className="selection-hint">Drag or tap a glowing tile</span>
        )}
      </div>

      <div
        ref={boardRef}
        className="puzzle-board"
        role="grid"
        aria-label="Project Mosaic 4 by 4 board"
      >
        <div className="board-slot-layer">
          {Array.from({ length: BOARD_SLOT_COUNT }, (_, slotIndex) => {
            const coordinates = toBoardCoordinates(slotIndex)
            const openForPlacement =
              state.phase === 'placement' &&
              state.selectedDraftIndex !== null &&
              state.board[slotIndex] === null
            const isEmpty =
              state.phase !== 'placement' && state.board[slotIndex] === null

            return (
              <button
                type="button"
                key={slotIndex}
                data-slot-index={slotIndex}
                className={`board-slot ${openForPlacement ? 'slot-open' : ''} ${isEmpty ? 'slot-empty' : ''}`}
                disabled={!openForPlacement}
                tabIndex={openForPlacement ? 0 : -1}
                aria-hidden={!openForPlacement}
                aria-label={`Place tile in row ${coordinates.row + 1}, column ${coordinates.column + 1}`}
                onClick={() => onPlace(slotIndex)}
              >
                {openForPlacement ? <span>+</span> : null}
              </button>
            )
          })}
        </div>

        <div className="board-tile-layer">
          {state.board.map((tile, slotIndex) => {
            if (!tile) return null
            const coordinates = toBoardCoordinates(slotIndex)
            const legal = canSlide(state, tile.id)
            const tileDrag = drag?.tileId === tile.id ? drag : null
            const transform = tileDrag
              ? `translate(${tileDrag.targetX * tileDrag.progress}px, ${tileDrag.targetY * tileDrag.progress}px)`
              : undefined
            const style: CSSProperties = {
              gridRow: coordinates.row + 1,
              gridColumn: coordinates.column + 1,
              transform,
            }

            return (
              <button
                type="button"
                key={tile.id}
                className={`board-tile ${legal ? 'tile-slidable' : ''} ${tileDrag?.settling ? 'tile-settling' : ''}`}
                style={style}
                disabled={!legal}
                aria-label={`${tile.id}${legal ? ', can slide into the empty slot' : ''}`}
                onPointerDown={(event) => handlePointerDown(event, tile.id)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onClick={(event) => {
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false
                    return
                  }
                  startTapSlide(tile.id, event.currentTarget)
                }}
              >
                <MosaicTile tile={tile} />
              </button>
            )
          })}
        </div>
      </div>

      <p className="message" aria-live="polite">
        {state.message}
      </p>
    </section>
  )
}
