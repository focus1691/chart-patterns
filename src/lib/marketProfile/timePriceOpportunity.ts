export class TimePriceOpportunityService {
  private getTpoPeriodFromLetter(letter?: string): number {
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

  public periodToTime(period: string): Date {
    const hour = this.letterToHour(period)

    const date = new Date()
    date.setUTCHours(Math.floor(hour), hour % 1 > 0 ? 30 : 0, 0, 0)

    return date
  }

  private letterToHour(letter: string): number {
    const period = this.getTpoPeriodFromLetter(letter)

    // Map 'A' to 0, 'B' to 0.5, 'C' to 1, 'D' to 1.5 and so on.
    return (period / 2) % 24
  }
}
