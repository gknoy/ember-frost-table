/**
 * Component definition for the frost-fixed-table component
 */
import Ember from 'ember'
const {$} = Ember
import computed, {readOnly} from 'ember-computed-decorators'
import {Component} from 'ember-frost-core'
import {PropTypes} from 'ember-prop-types'

import {ColumnPropType, ItemsPropType} from 'ember-frost-table/typedefs'
import layout from '../templates/components/frost-fixed-table'

export default Component.extend({
  // == Dependencies ==========================================================

  // == Keyword Properties ====================================================

  layout,

  // == PropTypes =============================================================

  propTypes: {
    // options
    columns: PropTypes.arrayOf(ColumnPropType),
    items: ItemsPropType
  },

  getDefaultProps () {
    return {
      // options
      columns: [],
      items: []
    }
  },

  // == Computed Properties ===================================================

  @readOnly
  @computed('css')
  /**
   * The selector for the left body DOM element (specifically the scroll wrapper)
   * @param {String} css - the base css class name for the component
   * @returns {String} a sutiable jQuery selector for the left section of the table body
   */
  bodyLeftSelector (css) {
    return `.${css}-left .frost-scroll`
  },

  @readOnly
  @computed('css')
  /**
   * The selector for the middle body DOM element (specifically the scroll wrapper)
   * @param {String} css - the base css class name for the component
   * @returns {String} a sutiable jQuery selector for the middle section of the table body
   */
  bodyMiddleSelector (css) {
    return `.${css}-middle .frost-scroll`
  },

  @readOnly
  @computed('css')
  /**
   * The selector for the right body DOM element (specifically the scroll wrapper)
   * @param {String} css - the base css class name for the component
   * @returns {String} a sutiable jQuery selector for the right section of the table body
   */
  bodyRightSelector (css) {
    return `.${css}-right .frost-scroll`
  },

  @readOnly
  @computed('css')
  /**
   * The selector for the middle header DOM element (specifically the scroll wrapper)
   * @param {String} css - the base css class name for the component
   * @returns {String} a sutiable jQuery selector for the middle section of the table header
   */
  headerMiddleSelector (css) {
    return `.${css}-header-middle .frost-scroll`
  },

  @readOnly
  @computed('columns')
  /**
   * Get the set of columns that are supposed to be frozen on the left
   *
   * The set of leftColumns is defined as all the columns with `frozen` === `true`
   * starting with the first column until we reach one w/o `frozen` === `true`
   *
   * @param {Column[]} columns - all the columns
   * @returns {Column[]} just the left-most frozen columns
   */
  leftColumns (columns) {
    const frozenColumns = []
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i]
      if (column.frozen) {
        frozenColumns.push(column)
      } else {
        return frozenColumns
      }
    }

    return frozenColumns
  },

  @readOnly
  @computed('columns')
  /**
   * Get the set of columns that are supposed to be in the middle (between the frozen left and frozen right columns)
   *
   * The set of middleColumns is defined as all the columns with `frozen` === `false`
   * starting with whatever the first column is with `frozen` === `false` until we reach one with `frozen` === `true`
   *
   * @param {Column[]} columns - all the columns
   * @returns {Column[]} just the middle columns
   */
  middleColumns (columns) {
    const unFrozenColumns = []
    let foundUnFrozen = false
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i]
      if (column.frozen) {
        if (foundUnFrozen) {
          return unFrozenColumns
        }
      } else {
        foundUnFrozen = true
        unFrozenColumns.push(column)
      }
    }

    return unFrozenColumns
  },

  @readOnly
  @computed('columns')
  /**
   * Get the set of columns that are supposed to be frozen on the right
   *
   * The set of rightColumns is defined as all the columns with `frozen` === `true`
   * starting with the first `frozen` === `true` column after we've seen at least one `frozen` === `false` column.
   *
   * @param {Column[]} columns - all the columns
   * @returns {Column[]} just the middle columns
   */
  rightColumns (columns) {
    const frozenColumns = []
    for (let i = columns.length - 1; i > 0; i--) {
      const column = columns[i]
      if (column.frozen) {
        frozenColumns.push(column)
      } else {
        return frozenColumns.reverse()
      }
    }

    return frozenColumns.reverse()
  },

  // == Functions =============================================================

  /**
   * Get the width of the middle section by adding up the widths of all the cells
   * @param {String} cellSelector - the selector to use to find the cells
   * @returns {Number} the combined outer width of all cells (in pixels)
   */
  _calculateWidth (cellSelector) {
    let width = 0

    // It appears that there needs to be an additional 3 pixels for each cell in order for it to render correctly now
    // I'm not actually sure why that might be, something to do with margins/border/padding of the cells perhaps?
    const FUDGE_FACTOR = 3

    this.$(cellSelector).toArray().forEach((el) => {
      width += $(el).outerWidth() + FUDGE_FACTOR
    })

    return width
  },

  /**
   * Make the three body sections (left, middle, right) the correct height to stay within the bounds of the
   * table itself
   */
  setupBodyHeights () {
    const headerMiddleSelector = this.get('headerMiddleSelector')
    const headerHeight = this.$(headerMiddleSelector).outerHeight()
    const tableHeight = this.$().outerHeight()
    const bodyHeight = tableHeight - headerHeight

    const bodyLeftSelector = this.get('bodyLeftSelector')
    const bodyMiddleSelector = this.get('bodyMiddleSelector')
    const bodyRightSelector = this.get('bodyRightSelector')

    ;[bodyLeftSelector, bodyMiddleSelector, bodyRightSelector].forEach((selector) => {
      this.$(selector).css({height: `${bodyHeight}px`})
    })
  },

  /**
   * frost-scroll seems to display scroll bars on hover, sooo, we need to proxy hover events to the place where
   * the scrollbar is present, the middle body when the middle of the header is hovered, and the right body when
   * the left or middle body is hovered.
   */
  setupHoverProxy () {
    const hoverClass = 'ps-container-hover'
    const bodyLeftSelector = this.get('bodyLeftSelector')
    const bodyMiddleSelector = this.get('bodyMiddleSelector')
    const bodyRightSelector = this.get('bodyRightSelector')

    ;[bodyLeftSelector, bodyMiddleSelector].forEach((selector) => {
      const $element = this.$(selector)
      $element.on('mouseenter', () => {
        this.$(bodyRightSelector).addClass(hoverClass)
      })
      $element.on('mouseleave', () => {
        this.$(bodyRightSelector).removeClass(hoverClass)
      })
    })

    const headerMiddleSelector = this.get('headerMiddleSelector')
    const $headerMiddle = this.$(headerMiddleSelector)
    $headerMiddle.on('mouseenter', () => {
      this.$(bodyMiddleSelector).addClass(hoverClass)
    })

    $headerMiddle.on('mouseleave', () => {
      this.$(bodyMiddleSelector).removeClass(hoverClass)
    })
  },

  /**
   * Calculate the widths of the left and right side and set the marings of the middle accordingly.
   */
  setupMiddleMargins () {
    const bodyLeftSelector = this.get('bodyLeftSelector')
    const bodyRightSelector = this.get('bodyRightSelector')

    const leftWidth = this.$(bodyLeftSelector).outerWidth()
    const rightWidth = this.$(bodyRightSelector).outerWidth()

    const headerMiddleSelector = this.get('headerMiddleSelector')
    const bodyMiddleSelector = this.get('bodyMiddleSelector')
    ;[headerMiddleSelector, bodyMiddleSelector].forEach((selector) => {
      this.$(selector).css({
        'margin-left': `${leftWidth}px`,
        'margin-right': `${rightWidth}px`
      })
    })
  },

  /**
   * Calculate how wide the middle sections should be by adding the sum of all the inner cells, then set that width
   */
  setupMiddleWidths () {
    const headerMiddleSelector = this.get('headerMiddleSelector')
    const bodyMiddleSelector = this.get('bodyMiddleSelector')

    const width = this._calculateWidth(`${headerMiddleSelector} .frost-table-cell`)
    this.$(`${headerMiddleSelector} .frost-table-header`).css({width: `${width}px`})
    this.$(`${bodyMiddleSelector} .frost-table-row`).css({width: `${width}px`})
  },

  /**
   * Set up the scroll synchronization between the different components within the table that should scroll together
   */
  setupScrollSync () {
    const headerMiddleSelector = this.get('headerMiddleSelector')
    const bodyLeftSelector = this.get('bodyLeftSelector')
    const bodyMiddleSelector = this.get('bodyMiddleSelector')
    const bodyRightSelector = this.get('bodyRightSelector')

    this.syncScrollLeft(headerMiddleSelector, bodyMiddleSelector)
    this.syncScrollLeft(bodyMiddleSelector, headerMiddleSelector)

    this.syncScrollTop(bodyLeftSelector, bodyMiddleSelector, bodyRightSelector)
    this.syncScrollTop(bodyMiddleSelector, bodyLeftSelector, bodyRightSelector)
    this.syncScrollTop(bodyRightSelector, bodyLeftSelector, bodyMiddleSelector)
  },

  /**
   * Sync horizontal scrolling between a source of scroll events and a set of destination selectors
   * @param {String} source - the selector of the source of the scroll events
   * @param {String[]} destinations - the selectors of the destination (the ones being driven by the source)
   */
  syncScrollLeft (source, ...destinations) {
    this.$(source).on('scroll', () => {
      // NOTE: intentionally not putting this in the ember run loop because doing so made it much less responsive
      // there was a noticible lag between scrolling and re-positioning the synced element. Plus it's not updating
      // any DOM content, just setting scroll positions.
      const $source = this.$(source)
      destinations.forEach((destination) => {
        const $destination = this.$(destination)
        $destination.scrollLeft($source.scrollLeft())
      })
    })
  },

  /**
   * Sync vertical scrolling between a source of scroll events and a set of destination selectors
   * @param {String} source - the selector of the source of the scroll events
   * @param {String[]} destinations - the selectors of the destination (the ones being driven by the source)
   */
  syncScrollTop (source, ...destinations) {
    this.$(source).on('scroll', () => {
      // NOTE: intentionally not putting this in the ember run loop because doing so made it much less responsive
      // there was a noticible lag between scrolling and re-positioning the synced element. Plus it's not updating
      // any DOM content, just setting scroll positions.
      const $source = this.$(source)
      destinations.forEach((destination) => {
        const $destination = this.$(destination)
        $destination.scrollTop($source.scrollTop())
      })
    })
  },

  // == DOM Events ============================================================

  // == Lifecycle Hooks =======================================================

  /**
   * Set up synced scrolling as well as calculating padding for middle sections
   */
  didRender () {
    this._super(...arguments)
    this.setupBodyHeights()
    this.setupHoverProxy()
    this.setupMiddleWidths()
    this.setupMiddleMargins()
    this.setupScrollSync()
  },

  // == Actions ===============================================================

  actions: {
  }
})
