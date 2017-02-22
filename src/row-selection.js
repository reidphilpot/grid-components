import { rebind, forward } from '@zambezi/d3-utils'
import { select, event } from 'd3-selection'
import { unwrap } from '@zambezi/grid'

import './row-selection.css'

export function createRowSelection() {

  let active

  function rowSelection(s) {
    s.each(rowSelectionEach)
  }

  rowSelection.selected = function(value) {
    if (!arguments.length) return selected
    selected = value
    return rowSelection
  }

  return rowSelection

  function rowSelectionEach({ dispatcher }) {
    dispatcher
        .on('row-enter.row-selection', attachListeners)
        .on('row-update.row-selection', updateRow)
        .on('row-exit.row-selection', removeListeners)
  }

  function updateRow({ row }) {
    const isActive = unwrap(row) === active
    select(this).classed('is-active', isActive)
  }

  function attachListeners() {
    select(this).on('click.row-selection', setActive)
  }

  function removeListeners() {
    select(this).on('click.row-selection', null)
  }

  function setActive({ row }) {
    active = unwrap(row)
    select(this).dispatch('redraw', { bubbles: true })
  }
}