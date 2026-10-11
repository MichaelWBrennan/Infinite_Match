/* Named, native cells for the SAME Phaser board. No simulation, RNG, spending or automatic speech.
   A visible text view is optional; keyboard focus always reveals its controls. */
(function (root) {
  'use strict';
  const specialNames = Object.freeze({ row: 'Row Beam', column: 'Column Beam', burst: 'Burst', prism: 'Prism' });
  const specialSymbols = Object.freeze({ row: 'Row', column: 'Col', burst: 'Burst', prism: 'Prism' });

  function navigationCell(row, col, key, size, ctrl = false) {
    if (!Number.isInteger(size) || size < 1 || size > 8 || !Number.isInteger(row) || !Number.isInteger(col)) return null;
    row = Math.max(0, Math.min(size - 1, row)); col = Math.max(0, Math.min(size - 1, col));
    if (key === 'Home') return ctrl ? [0, 0] : [row, 0];
    if (key === 'End') return ctrl ? [size - 1, size - 1] : [row, size - 1];
    if (ctrl) return null;
    const direction = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[key];
    return Array.isArray(direction) ? [Math.max(0, Math.min(size - 1, row + direction[0])), Math.max(0, Math.min(size - 1, col + direction[1]))] : null;
  }

  /** Labels are pure observations. Do not put a live region on all 64 changing cells. */
  function describeCell(game, row, col) {
    const type = game.board?.[row]?.[col];
    const styles = root.InfinitePlayerExperience?.visuals;
    const style = styles && Object.hasOwn(styles, type) ? styles[type] : null;
    if (!style) return null;
    const special = game.specials?.[row]?.[col] || null;
    const shield = game.shields?.[row]?.[col] || 0;
    const selected = game.selectedGem?.getData('row') === row && game.selectedGem?.getData('col') === col;
    const hint = game.hintCells;
    const hinted = hint?.[0] === row && hint?.[1] === col ? (hint.length === 2 ? 'Hint activation' : 'Hint start')
      : hint?.[2] === row && hint?.[3] === col ? 'Hint partner' : '';
    return { row, col, type, special, shield, selected, hinted, symbol: style.symbol,
      label: `Row ${row + 1}, column ${col + 1}: ${type} ${style.shape}${special ? `, ${specialNames[special] || special}` : ' gem'}${shield ? `, fixed shield ${shield} ${shield === 1 ? 'hit' : 'hits'} left` : ''}${selected ? ', selected' : ''}${hinted ? `, ${hinted.toLowerCase()}` : ''}` };
  }

  /** The existing guarded methods remain the only action/spend path. */
  function interact(game, row, col, activate = false) {
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= game.boardSize || col >= game.boardSize || !game.canInteractWithBoard()) return false;
    const gem = game.gemSprites?.[row]?.[col];
    if (!gem || gem.getData('row') !== row || gem.getData('col') !== col) return false;
    game.keyboardCursor = [row, col];
    if (activate) {
      if (game.armedPowerUp || !game.usesEarnedSpecials() || !game.specials?.[row]?.[col]) return false;
      return !!game.activateEarnedSpecial(row, col);
    }
    game.selectGem(gem, { selectOnly: true });
    return true;
  }

  function mount(game, surface, announce) {
    if (!surface?.ownerDocument) return null;
    const document = surface.ownerDocument;
    const part = document.createElement('div'); part.className = 'match-assistive-board';
    part.innerHTML = `<p id="match-cell-help" class="match-sr-only">Named gem cells. Arrows move; Home and End go to row edges; Control Home or End goes to board corners. Clicking a cell or Space selects it for a swap, including a special. Enter selects or activates. Select two neighbours to swap or combine. The Activate special button activates the focused special. H gives a free hint; Escape clears selection and armed inventory; M toggles optional sound. Tab leaves the grid. An armed inventory booster applies to the next chosen cell.</p>
      <p id="match-cell-state" class="match-cell-state"></p>
      <div class="match-cell-scroll"><div class="match-cell-grid" role="grid" aria-label="Named gem board" aria-describedby="match-cell-help match-cell-state" aria-multiselectable="false" aria-readonly="false"></div></div>
      <div class="match-cell-tools" role="group" aria-label="Named board actions">
        <button type="button" data-cell-action="activate">Activate special</button>
        <button type="button" data-cell-action="clear">Clear selection</button>
        <button type="button" data-cell-action="status">Read board status</button>
      </div>`;
    surface.append(part);
    const grid = part.querySelector('.match-cell-grid');
    const state = part.querySelector('#match-cell-state');
    const activate = part.querySelector('[data-cell-action="activate"]');
    const clear = part.querySelector('[data-cell-action="clear"]');
    const slots = [];
    let size = 0; let disposed = false; let unlockTimer = null; let pointer = null;
    let coordinate = [0, 0];

    function attribute(element, name, value) {
      const text = String(value);
      if (element.getAttribute(name) !== text) element.setAttribute(name, text);
    }

    function visibleView() {
      if (disposed) return;
      surface.classList.toggle('match-text-board-active', game.settings?.textBoard === true || part.contains(document.activeElement));
    }
    function focusAt(row, col, scroll = true) {
      if (disposed || !size) return;
      coordinate = [Math.max(0, Math.min(size - 1, row)), Math.max(0, Math.min(size - 1, col))];
      game.keyboardCursor = coordinate.slice();
      sync();
      const button = slots[coordinate[0] * size + coordinate[1]]?.button;
      button?.focus({ preventScroll: true });
      if (scroll) button?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    function build(nextSize) {
      const hadFocus = grid.contains(document.activeElement);
      size = nextSize; slots.length = 0; grid.replaceChildren();
      grid.setAttribute('aria-rowcount', String(size)); grid.setAttribute('aria-colcount', String(size));
      grid.style.setProperty('--match-cell-columns', String(size || 1));
      for (let row = 0; row < size; row++) {
        const line = document.createElement('div'); line.setAttribute('role', 'row'); line.setAttribute('aria-rowindex', String(row + 1));
        for (let col = 0; col < size; col++) {
          const cell = document.createElement('div'); cell.setAttribute('role', 'gridcell'); cell.setAttribute('aria-colindex', String(col + 1));
          const button = document.createElement('button'); button.type = 'button'; button.dataset.cellRow = String(row); button.dataset.cellCol = String(col);
          const symbol = document.createElement('span'); symbol.className = 'match-cell-symbol'; symbol.setAttribute('aria-hidden', 'true');
          const badge = document.createElement('span'); badge.className = 'match-cell-badge'; badge.setAttribute('aria-hidden', 'true');
          button.append(symbol, badge); cell.append(button); line.append(cell);
          slots.push({ cell, button, symbol, badge, row, col });
        }
        grid.append(line);
      }
      return hadFocus;
    }
    function sync() {
      if (disposed) return;
      if (unlockTimer !== null) { root.clearTimeout(unlockTimer); unlockTimer = null; }
      const n = Number.isInteger(game.boardSize) && game.boardSize >= 1 && game.boardSize <= 8 && game.board?.length === game.boardSize
        && game.board.every((row) => row.length === game.boardSize) ? game.boardSize : 0;
      const hadFocus = n !== size ? build(n) : false;
      const cursor = game.keyboardCursor || coordinate;
      coordinate = [Math.max(0, Math.min(size - 1, cursor[0])), Math.max(0, Math.min(size - 1, cursor[1]))];
      const canAct = !!size && game.canInteractWithBoard();
      const settling = game.inputLockedUntil > Date.now();
      const resolving = game.matchFeedback?.isActive() === true;
      attribute(grid, 'aria-busy', settling || !!game.levelStarting || !!game.powerUpPending);
      attribute(grid, 'aria-disabled', !canAct);
      attribute(grid, 'aria-readonly', !canAct);
      const explanation = game.levelStarting ? 'Starting a level; actions are unavailable.' : game.powerUpPending ? 'Waiting for inventory confirmation; actions are unavailable.'
        : game.isPaused ? 'Paused. Cells can be read and navigated, but no move or activation is allowed.'
          : !game.isGameRunning ? 'No active level. Start or replay to play.'
          : resolving ? 'Board is resolving. Focus a named cell to finish visual feedback; no extra move is spent.' : settling ? 'Board is settling; wait before acting.'
            : game.armedPowerUp ? `${game.armedPowerUp} inventory booster is armed. Choosing a cell applies it; Clear selection cancels it for free.`
              : 'Choose two adjacent cells for a swap. Choosing a special selects it without firing; Enter or Activate special fires it.';
      if (state.textContent !== explanation) state.textContent = explanation;
      for (const slot of slots) {
        const info = describeCell(game, slot.row, slot.col);
        if (!info) continue;
        attribute(slot.button, 'aria-label', info.label);
        attribute(slot.cell, 'aria-selected', info.selected);
        attribute(slot.button, 'aria-disabled', !canAct); // Keep cells readable/focusable during pause/pending work.
        const tabIndex = slot.row === coordinate[0] && slot.col === coordinate[1] ? 0 : -1;
        if (slot.button.tabIndex !== tabIndex) slot.button.tabIndex = tabIndex;
        attribute(slot.button, 'data-selected', info.selected); attribute(slot.button, 'data-hint', !!info.hinted);
        if (slot.type !== info.type) {
          slot.type = info.type; slot.symbol.textContent = info.symbol; slot.symbol.style.color = root.InfinitePlayerExperience.visuals[info.type].color;
        }
        const badge = `${specialSymbols[info.special] || root.InfinitePlayerExperience.visuals[info.type].shape}${info.shield ? ` · Shield ${info.shield}` : ''}${info.selected ? ' · S' : info.hinted ? ' · H' : ''}`;
        if (slot.badge.textContent !== badge) slot.badge.textContent = badge;
      }
      const active = describeCell(game, coordinate[0], coordinate[1]);
      activate.disabled = !canAct || !!game.armedPowerUp || !active?.special;
      attribute(activate, 'aria-label', active?.special ? `Activate ${specialNames[active.special]} at row ${coordinate[0] + 1}, column ${coordinate[1] + 1}` : 'Activate special (focus a special first)');
      clear.disabled = !size || !!game.powerUpPending || !!game.levelStarting || !(game.selectedGem || game.armedPowerUp || game.hintCells);
      const canvas = surface.querySelector('canvas'); if (canvas) attribute(canvas, 'aria-hidden', true);
      visibleView();
      if (settling) unlockTimer = root.setTimeout(() => { unlockTimer = null; sync(); }, Math.min(1000, game.inputLockedUntil - Date.now()) + 1);
      if (hadFocus && size && !game.playerUI?.shell.querySelector('dialog').open) focusAt(...coordinate);
    }
    function choose(row, col) {
      const previous = game.selectedGem;
      if (!interact(game, row, col)) return;
      sync();
      if (game.isGameRunning && !game.playerUI?.shell.querySelector('dialog').open) focusAt(row, col);
      if (game.selectedGem && game.selectedGem !== previous) announce(`${describeCell(game, row, col).label}. Choose an adjacent cell.`);
      else if (previous === game.gemSprites[row][col] && !game.selectedGem) announce('Selection cleared.');
    }
    function onClick(event) {
      const button = event.target.closest('button');
      if (!button || !part.contains(button) || disposed) return;
      event.stopPropagation();
      if (button.dataset.cellRow !== undefined) {
        const row = Number(button.dataset.cellRow); const col = Number(button.dataset.cellCol);
        // Native pointer clicks require a matching, unmoved gesture on this board epoch.
        // Zero-detail clicks include assistive activation and keyboard events, not drags.
        if (event.detail > 0) {
          if (!pointer || (event.pointerId !== undefined && event.pointerId !== pointer.id)) return;
          if (pointer.cancelled || pointer.epoch !== game.boardEpoch || pointer.row !== row || pointer.col !== col) { pointer = null; return; }
        }
        pointer = null; choose(row, col);
      } else if (button.dataset.cellAction === 'activate') {
        const acted = interact(game, ...coordinate, true); sync();
        if (acted && game.isGameRunning && !game.playerUI?.shell.querySelector('dialog').open) focusAt(...coordinate);
      } else if (button.dataset.cellAction === 'clear') {
        if (game.powerUpPending || game.levelStarting || game.playerUI?.shell.querySelector('dialog').open) return;
        game.setSelectedGem(null); game.disarmPowerUp(); game.hintCells = null; sync();
        if (game.isGameRunning) focusAt(...coordinate);
        announce('Selection, hints and armed inventory cleared. No move or charge spent.');
      } else if (button.dataset.cellAction === 'status') {
        const goal = game.usesLevelObjectives() ? root.InfiniteLevels.objectiveSummary(game.generatedLevel, game.score, game.objectiveProgress, true) : `Goal: ${game.targetScore || 0} points.`;
        announce(`${state.textContent} Score ${game.score || 0}. ${['classic', 'daily'].includes(game.mode) ? `${game.moves} moves left.` : 'Unlimited moves.'} ${game.timeLimit > 0 ? `${game.time} seconds left.` : 'No clock.'} ${goal}`);
      }
    }
    function onFocus(event) {
      if (event.target.dataset.cellRow !== undefined) {
        coordinate = [Number(event.target.dataset.cellRow), Number(event.target.dataset.cellCol)];
        game.keyboardCursor = coordinate.slice(); sync();
      } else visibleView();
    }
    function onBlur() { root.queueMicrotask(() => visibleView()); }
    function onKey(event) {
      event.stopPropagation(); // Native toolbar keys must not also activate a Phaser gem.
      if (disposed || event.isComposing || event.target.dataset.cellRow === undefined) return;
      const [row, col] = [Number(event.target.dataset.cellRow), Number(event.target.dataset.cellCol)];
      const next = !event.altKey && !event.metaKey ? navigationCell(row, col, event.key, size, event.ctrlKey) : null;
      if (next) { event.preventDefault(); focusAt(...next); return; }
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (['Enter', ' ', 'Escape', 'h', 'H', 'm', 'M'].includes(event.key)) {
        event.preventDefault();
        if (event.repeat) return;
        if (event.key === ' ') choose(row, col);
        else { game.keyboardCursor = [row, col]; game.handleBoardKey(event); sync(); }
      }
    }
    function onPointer(event) {
      if (event.type === 'pointerdown') {
        const button = event.target.closest('button[data-cell-row]');
        if (!button || event.isPrimary === false || event.button !== 0 || (pointer && !pointer.released && !pointer.cancelled && pointer.id !== event.pointerId)) return;
        game.gestureStart = null;
        pointer = { id: event.pointerId, row: Number(button.dataset.cellRow), col: Number(button.dataset.cellCol), epoch: game.boardEpoch, x: event.clientX, y: event.clientY, cancelled: false, released: false };
      } else if (pointer?.id === event.pointerId) {
        if (event.type === 'pointerup' || event.type === 'pointercancel') pointer.released = true;
        if (event.type === 'pointercancel' || Math.max(Math.abs(event.clientX - pointer.x), Math.abs(event.clientY - pointer.y)) >= 18) pointer.cancelled = true;
      }
    }
    part.addEventListener('click', onClick); part.addEventListener('keydown', onKey); part.addEventListener('focusin', onFocus);
    surface.addEventListener('focusout', onBlur);
    for (const name of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) part.addEventListener(name, onPointer);
    document.addEventListener('pointerup', onPointer); document.addEventListener('pointercancel', onPointer);
    sync();
    return Object.freeze({ sync,
      focus() { if (game.settings?.textBoard === true) focusAt(...(game.keyboardCursor || coordinate)); else surface.focus({ preventScroll: true }); },
      destroy() {
        if (disposed) return; disposed = true;
        if (unlockTimer !== null) root.clearTimeout(unlockTimer);
        part.removeEventListener('click', onClick); part.removeEventListener('keydown', onKey); part.removeEventListener('focusin', onFocus);
        surface.removeEventListener('focusout', onBlur);
        for (const name of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) part.removeEventListener(name, onPointer);
        document.removeEventListener('pointerup', onPointer); document.removeEventListener('pointercancel', onPointer);
        part.remove(); surface.classList.remove('match-text-board-active');
      },
    });
  }

  root.InfiniteAssistiveBoard = Object.freeze({ navigationCell, describeCell, interact, mount });
})(globalThis);
