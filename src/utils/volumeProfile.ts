export function convertTpoPeriodToLetter(period: number): string {
  if (period >= 0 && period <= 25) {
    // Return the corresponding uppercase letter
    return String.fromCharCode(period + 65)
  } else if (period >= 26 && period <= 51) {
    // Return the corresponding lowercase letter
    return String.fromCharCode(period + 97 - 26)
  } else {
    // Return an empty string if the period is not in the valid range
    return ''
  }
}

export function getTpoPeriodFromLetter(letter?: string): number {
  if (letter?.length !== 1) {
    // Return -1 if the input is not a single character
    return 0
  }

  const code = letter.charCodeAt(0)
  if (code >= 65 && code <= 90) {
    // Return the corresponding number for an uppercase letter
    return code - 65
  } else if (code >= 97 && code <= 122) {
    // Return the corresponding number for a lowercase letter
    return code - 97 + 26
  } else {
    // Return -1 if the input is not a letter
    return 0
  }
}
