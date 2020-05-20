// @flow

/**
 * Temporarily change the internal behavior of the Date.now method such that it
 * returns a time that is based off of the given value in milliseconds after
 * the epoch. Typically the method Date.UTC(YYYY, MM, DD) can be used to
 * generate this number.
 */
export function setTestTime (time: number) {
  jest.spyOn(Date, 'now').mockImplementation(() => new Date(time).valueOf())
}

/**
 * Sets the default mock test time for a variety of tests such that various
 * calculations and feed version statuses resolve to a certain state.
 */
export function setDefaultTestTime () {
  setTestTime(Date.UTC(2019, 4, 22))
}

/**
 * Restore the standard functionality of Date library. This should be used in
 * the afterEach clause in test suites that require a mocked date.
 */
export function restoreDateNowBehavior () {
  Date.now.mockRestore && Date.now.mockRestore()
}

export function expectArrayToMatchContents (actual: any, expected: Array<any>) {
  expect(actual).toHaveLength(expected.length)
  expect(actual).toEqual(expect.arrayContaining(expected))
}
