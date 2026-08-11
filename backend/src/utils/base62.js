const CHARSET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function encode(num) {
  if (num === 0) return CHARSET[0];
  let result = '';
  while (num > 0) {
    result = CHARSET[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result;
}

module.exports = { encode };
