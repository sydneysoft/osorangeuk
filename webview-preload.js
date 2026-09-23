const {
  ipcRenderer
} = require('electron');

let popup = null;
let requestNumber = 0;
let nativeLanguage = 'en';
let signedIn = false;

const languageNames = {
  en: 'English',
  uk: 'Ukrainian',
  ru: 'Russian',
  pl: 'Polish',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  it: 'Italian'
};

function languageName(code) {
  if (languageNames[code]) {
    return languageNames[code];
  }

  try {
    return new Intl.DisplayNames(
      ['en'],
      { type: 'language' }
    ).of(code) || code.toUpperCase();
  } catch {
    return String(code || '').toUpperCase();
  }
}

function selectedWord() {
  const selection =
    window.getSelection?.();

  const value =
    selection
      ?.toString()
      .trim()
      .replace(/\s+/g, ' ') || '';

  if (
    !value ||
    value.length > 100 ||
    value.split(' ').length > 3
  ) {
    return null;
  }

  return value;
}

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

  return word &&
    word.length >= 2
      ? word
      : null;
}

function removePopup() {
  if (!popup) {
    return;
  }

  popup.remove();
  popup = null;
}

function showPopup(
  x,
  y,
  result
) {
  removePopup();

  popup =
    document.createElement(
      'div'
    );

  Object.assign(
    popup.style,
    {
      position: 'fixed',
      left: `${Math.max(
        12,
        Math.min(
          x,
          window.innerWidth - 312
        )
      )}px`,
      top: `${Math.max(
        12,
        Math.min(
          y + 18,
          window.innerHeight - 190
        )
      )}px`,
      zIndex: '2147483647',
      width: 'min(300px, calc(100vw - 24px))',
      padding: '13px 14px',
      background: 'rgba(24, 24, 26, 0.97)',
      color: '#ffffff',
      border: '1px solid rgba(255,255,255,.12)',
      borderRadius: '14px',
      boxShadow: '0 16px 42px rgba(0,0,0,.34)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      lineHeight: '1.4'
    }
  );

  const original =
    document.createElement(
      'div'
    );

  original.textContent =
    result.original;

  Object.assign(
    original.style,
    {
      opacity: '.62',
      fontSize: '12px'
    }
  );

  const translation =
    document.createElement(
      'div'
    );

  translation.textContent =
    result.translation;

  Object.assign(
    translation.style,
    {
      marginTop: '4px',
      fontSize: '19px',
      fontWeight: '650'
    }
  );

  const language =
    document.createElement(
      'div'
    );

  language.textContent =
    `${languageName(
      result.sourceLanguage
    )} → ${languageName(
      result.targetLanguage
    )}`;

  Object.assign(
    language.style,
    {
      marginTop: '5px',
      opacity: '.52',
      fontSize: '11px'
    }
  );

  const save =
    document.createElement(
      'button'
    );

  save.type =
    'button';

  save.textContent =
    signedIn
      ? '☆ SAVE WORD'
      : 'LOG IN TO SAVE';

  Object.assign(
    save.style,
    {
      width: '100%',
      height: '34px',
      marginTop: '11px',
      border: '1px solid rgba(255,145,30,.65)',
      borderRadius: '9px',
      background: signedIn
        ? '#ff8a00'
        : 'transparent',
      color: signedIn
        ? '#17100a'
        : '#ffad4a',
      fontWeight: '800',
      fontSize: '11px',
      letterSpacing: '.04em',
      cursor: 'pointer'
    }
  );

  save.addEventListener(
    'click',
    event => {
      event.preventDefault();
      event.stopPropagation();

      ipcRenderer.sendToHost(
        'storylingo-save-word',
        result
      );
    }
  );

  popup.append(
    original,
    translation,
    language,
    save
  );

  document.body.appendChild(
    popup
  );
}

async function translate(
  event,
  word
) {
  if (!word) {
    return;
  }

  const currentRequest =
    ++requestNumber;

  try {
    const result =
      await ipcRenderer.invoke(
        'translate-word',
        {
          word,
          targetLanguage:
            nativeLanguage
        }
      );

    if (
      currentRequest !==
        requestNumber ||
      !result?.translation
    ) {
      return;
    }

    showPopup(
      event.clientX,
      event.clientY,
      result
    );
  } catch (error) {
    console.error(
      'OrangeSoft translation error:',
      error
    );
  }
}

function isEditableTarget(target) {
  return Boolean(
    target?.closest?.(
      'input, textarea, select, button, [contenteditable="true"]'
    )
  );
}

document.addEventListener(
  'mouseup',
  event => {
    if (
      isEditableTarget(
        event.target
      )
    ) {
      return;
    }

    const word =
      selectedWord();

    if (!word) {
      return;
    }

    translate(
      event,
      word
    );
  },
  true
);

document.addEventListener(
  'click',
  event => {
    if (
      isEditableTarget(
        event.target
      )
    ) {
      return;
    }

    /*
     * A text selection is handled by
     * mouseup above. A normal click
     * translates the word under the
     * pointer.
     */
    if (
      selectedWord()
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

    translate(
      event,
      word
    );
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

ipcRenderer.on(
  'storylingo-preferences',
  (
    event,
    preferences
  ) => {
    const language =
      String(
        preferences
          ?.nativeLanguage ||
        ''
      ).toLowerCase();

    if (
      languageNames[
        language
      ]
    ) {
      nativeLanguage =
        language;
    }

    signedIn =
      preferences
        ?.signedIn === true;
  }
);
