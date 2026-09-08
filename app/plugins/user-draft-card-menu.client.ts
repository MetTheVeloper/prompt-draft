const INTERACTIVE_SELECTOR = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '.crp',
  '[role="button"]',
  '[role="link"]',
  '[contenteditable="true"]',
].join(', ')

function findDraftMenuTrigger(card: Element) {
  const icon = Array.from(card.querySelectorAll('.el-icon__symbol')).find((element) => {
    return element.textContent?.trim() === 'more_vert'
  })

  return icon?.closest('.crp') ?? null
}

function cloneClickAtOriginalPoint(event: MouseEvent) {
  return new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    clientX: event.clientX,
    clientY: event.clientY,
    screenX: event.screenX,
    screenY: event.screenY,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
    button: event.button,
    buttons: event.buttons,
  })
}

export default defineNuxtPlugin(() => {
  document.addEventListener('click', (event) => {
    if (!(event instanceof MouseEvent)) return

    const target = event.target
    if (!(target instanceof Element)) return

    const card = target.closest('.user-profile__draft-card')
    if (!card) return

    // Existing card controls keep their current behavior and must not reopen
    // the menu through the delegated card click.
    if (target.closest(INTERACTIVE_SELECTOR)) return

    // Owner cards already expose the canonical three-dot trigger. Re-dispatch
    // that same action with the original pointer coordinates so useMenu opens
    // at the exact place the card itself was clicked.
    const menuTrigger = findDraftMenuTrigger(card)
    if (!menuTrigger) return

    menuTrigger.dispatchEvent(cloneClickAtOriginalPoint(event))
  })
})
