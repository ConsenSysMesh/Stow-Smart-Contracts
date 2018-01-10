/**
 * Asserts that the error message is revert
 * @param {Error} err
 */
const assertRevert = (err) => {
  assert.equal(err.message,
    "VM Exception while processing transaction: revert");
}

module.exports = {
  assertRevert,
}
