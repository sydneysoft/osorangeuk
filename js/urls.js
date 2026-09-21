export function parseInput(value) {

  value = value.trim();

  if (!value) {
    return null;
  }

  if (value.startsWith('orangesoft://')) {
    return value;
  }

  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('file://')
  ) {
    return value;
  }

  if (
    value.includes('.') &&
    !value.includes(' ')
  ) {
    return 'https://' + value;
  }

  return (
    'https://www.google.com/search?q=' +
    encodeURIComponent(value)
  );
}


export function displayURL(url) {

  if (
    url &&
    url.startsWith('orangesoft://newtab')
  ) {
    return '';
  }

  return url || '';
}