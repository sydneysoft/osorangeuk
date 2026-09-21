const {
  ipcRenderer
} = require('electron');


let popup = null;
let requestNumber = 0;


/*
 * GET WORD UNDER MOUSE
 */

function getWordAtPoint(
  x,
  y
) {

  let range = null;


  if (
    document.caretPositionFromPoint
  ) {

    const position =
      document.caretPositionFromPoint(
        x,
        y
      );

    if (!position) {
      return null;
    }


    range =
      document.createRange();

    range.setStart(
      position.offsetNode,
      position.offset
    );

  } else if (
    document.caretRangeFromPoint
  ) {

    range =
      document.caretRangeFromPoint(
        x,
        y
      );

  }


  if (
    !range ||
    range.startContainer.nodeType !==
      Node.TEXT_NODE
  ) {

    return null;

  }


  const text =
    range.startContainer.textContent;

  const offset =
    range.startOffset;


  let start =
    offset;

  let end =
    offset;


  const isWordCharacter =
    character =>
      /[\p{L}\p{M}'’-]/u.test(
        character
      );


  while (
    start > 0 &&
    isWordCharacter(
      text[start - 1]
    )
  ) {

    start--;

  }


  while (
    end < text.length &&
    isWordCharacter(
      text[end]
    )
  ) {

    end++;

  }


  const word =
    text
      .slice(
        start,
        end
      )
      .trim();


  if (
    !word ||
    word.length < 2
  ) {

    return null;

  }


  return word;
}


/*
 * REMOVE OLD POPUP
 */

function removePopup() {

  if (!popup) {
    return;
  }


  popup.remove();

  popup = null;

}


/*
 * SHOW POPUP
 */

function showPopup(
  x,
  y,
  word,
  translation,
  targetLanguage
) {

  removePopup();


  popup =
    document.createElement(
      'div'
    );


  popup.style.position =
    'fixed';

  popup.style.left =
    `${Math.min(
      x,
      window.innerWidth - 280
    )}px`;

  popup.style.top =
    `${Math.min(
      y + 18,
      window.innerHeight - 120
    )}px`;

  popup.style.zIndex =
    '2147483647';

  popup.style.minWidth =
    '180px';

  popup.style.maxWidth =
    '280px';

  popup.style.padding =
    '12px 14px';

  popup.style.background =
    'rgba(30, 30, 32, 0.96)';

  popup.style.color =
    '#ffffff';

  popup.style.borderRadius =
    '12px';

  popup.style.boxShadow =
    '0 10px 30px rgba(0,0,0,.3)';

  popup.style.fontFamily =
    '-apple-system, BlinkMacSystemFont, sans-serif';

  popup.style.fontSize =
    '14px';

  popup.style.lineHeight =
    '1.4';


  const original =
    document.createElement(
      'div'
    );

  original.textContent =
    word;

  original.style.opacity =
    '.65';

  original.style.fontSize =
    '12px';


  const result =
    document.createElement(
      'div'
    );

  result.textContent =
    translation;

  result.style.marginTop =
    '4px';

  result.style.fontSize =
    '18px';

  result.style.fontWeight =
    '600';


  const language =
    document.createElement(
      'div'
    );

  language.textContent =
    targetLanguage === 'fr'
      ? 'French'
      : 'English';

  language.style.marginTop =
    '5px';

  language.style.opacity =
    '.5';

  language.style.fontSize =
    '11px';


  popup.append(
    original,
    result,
    language
  );


  document.body.appendChild(
    popup
  );

}


/*
 * WORD CLICK
 */

document.addEventListener(
  'click',

  async event => {

    /*
     * Don't interfere with forms
     * or editable fields.
     */

    if (
      event.target.closest(
        'input, textarea, select, button, [contenteditable="true"]'
      )
    ) {

      return;

    }


    const word =
      getWordAtPoint(
        event.clientX,
        event.clientY
      );


    if (!word) {

      removePopup();

      return;

    }


    const currentRequest =
      ++requestNumber;


    try {

      const result =
        await ipcRenderer.invoke(
          'translate-word',
          word
        );


      if (
        currentRequest !==
        requestNumber
      ) {

        return;

      }


      if (
        !result ||
        !result.translation
      ) {

        return;

      }


      showPopup(
        event.clientX,
        event.clientY,
        word,
        result.translation,
        result.targetLanguage
      );

    } catch (error) {

      console.error(
        'OrangeSoft translation error:',
        error
      );

    }

  },
  true
);


document.addEventListener(
  'keydown',
  event => {

    if (
      event.key ===
      'Escape'
    ) {

      removePopup();

    }

  }
);