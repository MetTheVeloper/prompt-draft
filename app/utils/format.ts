export const commaSep = (number: number | string | undefined | null) => {
  if (number === undefined || number === null) {
    return ''
  }

  return number
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}