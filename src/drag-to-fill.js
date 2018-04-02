import { rebind, appendIfMissing } from '@zambezi/d3-utils'
import { findIndex, last, reduce, indexBy } from 'underscore'
import { select } from 'd3-selection'
import { drag as createDrag } from 'd3-drag'
import { dispatch as createDispatch } from 'd3-dispatch'
import { createHighlightSelectedCells } from './highlight-selected-cells'
import { unwrap } from '@zambezi/grid'
import './drag-to-fill.css'

const fillHandleContainer = appendIfMissing('div.zambezi-grid-fill-handle-container')

const rangeFromUnorderedIndices = (array, i1, i2) =>
  array.slice(Math.min(i1, i2), Math.max(i1, i2) + 1)

export function createDragToFill () {
  let selectedCells = []
  let container

  const dispatch = createDispatch('dragend')
  const fillHighlight = createHighlightSelectedCells()
  const api = rebind().from(dispatch, 'on')

  const drag = createDrag()
    .on('end.deactivate', deactivate)
    .on('end.redispatch', redispatch)
    .on('end.reset', reset)
    .on('end.redraw', redraw)

  function dragToFill (sel) {
    sel
      .call(fillHighlight)
      .each(dragToFillEach)
  }

  dragToFill.selectedCells = function (value) {
    if (!arguments.length) return selectedCells
    selectedCells = value
    return dragToFill
  }

  return api(dragToFill)

  function dragToFillEach({ columns, dispatcher, rows, scroll, rowHeight }) {
    const columnById = indexBy(columns, 'id')
    const findRowIndex = row => findIndex(rows, row)
    const fillHandleDatum = compileFillHandleDatum()
    
    container = select(this)
      .select('.zambezi-grid-body')

    container
      .select(fillHandleContainer)
      .style('transform', `translate(${-scroll.left}px, ${-scroll.top}px)`)
      .call(renderFillHandle)

    function activate () {
      container
        .on('mouseover.drag-to-fill', drawFillHightlight)
    }

    function drawFillHightlight () {
      const d = select(d3.event.target).datum()
      const cellsToFill = mouseSelection(fillHandleDatum[0], d)

      if (fillHighlight.selectedCells().length !== cellsToFill.length) {
        fillHighlight.selectedCells(cellsToFill)
        requestAnimationFrame(redraw)
      }
    }

    function mouseSelection (activeCell, currentCell) {
      if (!activeCell || !currentCell) return []

      const column = currentCell.column
      const row = unwrap(currentCell.row)

      return (
        activeCell.column.id === column.id ||
        findRowIndex(activeCell.row) === findRowIndex(row)
      )
        ? addRangeToSelection(activeCell, { row, column })
        : []
    }

    function renderFillHandle (sel) {
      const update = sel
        .selectAll('.zambezi-grid-fill-handle')
        .data(fillHandleDatum)

      const enter = update
        .enter()
        .append('span')
        .call(
          drag
            .on('start.activate', activate)
        )

      update
        .exit()
        .remove()

      update
        .merge(enter)
        .attr('class', null)
        .classed('zambezi-grid-fill-handle', true)
        .each(configureFillHandleCell)
    }

    function configureFillHandleCell (d) {
      const { column, row } = d
      const rowIndex = findRowIndex(row)

      select(this)
        .style('top', `${(rowIndex + 1) * rowHeight}px`)
        .style('left', `${column.offset + column.width}px`)
    }

    function addRangeToSelection (a, b) {
      const selectedRowsByColumnId = rangeFrom(a, b).reduce(addToSelected, {})
      return compileSelected(selectedRowsByColumnId)
    }

    function rangeFrom (a, b) {
      const columnRange = rangeFromUnorderedIndices(
        columns,
        columns.indexOf(a.column),
        columns.indexOf(b.column)
      )
      const rowRange = rangeFromUnorderedIndices(
        rows,
        findRowIndex(r => unwrap(r) === a.row),
        findRowIndex(r => unwrap(r) === b.row)
      ).map(unwrap)

      const allCellsInColumns = (acc, row) =>
        acc.concat(columnRange.map(column => ({ column, row })))

      return rowRange.reduce(allCellsInColumns, [])
    }

    function compileSelected(selectedRowsByColumnId) {
      return reduce(selectedRowsByColumnId, toCells, [])
    }

    function toCells (acc, set, columnId) {
      const column = columnById[columnId]
      return acc.concat(Array.from(set.values()).map(row => ({ row, column })))
    }

    function addToSelected(acc, { row, column }) {
      const columnId = column.id
      const set = acc[columnId] || new Set()

      set.add(row)
      acc[columnId] = set

      return acc
    }
  }

  function compileFillHandleDatum() {
    const lastSelectedCell = last(selectedCells)

    return lastSelectedCell
      ? [lastSelectedCell]
      : []
  }

  function deactivate() {
    container
      .on('mouseover.drag-to-fill', null)
  }

  function redispatch() {
    dispatch
      .call('dragend', null, [selectedCells, fillHighlight.selectedCells()])
  }

  function redraw() {
    container
      .dispatch('redraw', { bubbles: true })
  }

  function reset() {
    fillHighlight.selectedCells([])
  }
}
